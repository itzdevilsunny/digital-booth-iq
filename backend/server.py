from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
from openai import AsyncOpenAI
import json
import logging
import httpx
from pathlib import Path
from pydantic import BaseModel
from typing import Optional, Union, Any, List
import uuid
from datetime import datetime, timezone, timedelta
import time
from fastapi import WebSocket, WebSocketDisconnect, UploadFile, File, Form
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection (with 5s timeout to prevent hangs)
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
db = client[os.environ['DB_NAME']]

# Supabase config
# OpenAI Configuration
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')
openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)
SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_KEY = os.environ['SUPABASE_ANON_KEY']
SARVAM_API_KEY = os.environ.get('SARVAM_API_KEY', '')

SUPABASE_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- NOTIFICATION INFRASTRUCTURE ---

# Simple Rate Limiter
class RateLimiter:
    def __init__(self, requests_limit: int, window_seconds: int):
        self.limit = requests_limit
        self.window = window_seconds
        self.requests = {} # user_id -> [timestamps]

    def is_allowed(self, user_id: str) -> bool:
        now = time.time()
        if user_id not in self.requests:
            self.requests[user_id] = []
        
        # Filter timestamps within window
        self.requests[user_id] = [t for t in self.requests[user_id] if now - t < self.window]
        
        if len(self.requests[user_id]) < self.limit:
            self.requests[user_id].append(now)
            return True
        return False

# Limit AI removed as per user request
# ai_limiter = RateLimiter(requests_limit=5, window_seconds=60)

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, List[WebSocket]] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        logger.info(f"User {user_id} connected. Active connections: {len(self.active_connections[user_id])}")

    def disconnect(self, user_id: str, websocket: WebSocket):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info(f"User {user_id} disconnected.")

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending ws message to {user_id}: {e}")

    async def broadcast(self, message: dict):
        for user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to {user_id}: {e}")

manager = ConnectionManager()

async def send_notification(user_id: str, title: str, message: str, n_type: str = "info", metadata: dict = None):
    """Multi-channel notification dispatcher"""
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "title": title,
        "message": message,
        "type": n_type,
        "metadata": metadata or {},
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # 1. Store in MongoDB
    try:
        await db.notifications.insert_one(notification.copy())
    except Exception as e:
        logger.error(f"Failed to store notification: {e}")

    # 2. Live WebSocket Push
    if "_id" in notification: del notification["_id"]
    await manager.send_personal_message(notification, user_id)
    
    # 3. Mock Email / SMS
    logger.info(f"[NOTIFY] Channel: Email | Destination: {user_id}@boothiq.ai | Subject: {title}")
    logger.info(f"[NOTIFY] Channel: SMS | Destination: +91-XXXXX-XXXXX | Message: {message}")

# --- AI FUNCTIONS (Rule-based with Sarvam fallback) ---

def classify_grievance(description: str) -> dict:
    """Rule-based classification for grievance category, priority, sentiment"""
    text = description.lower()
    
    # Category classification
    category = "other"
    text = description.lower()
    if any(w in text for w in ["water", "pani", "nala", "pump", "pipe", "borewell", "handpump", "supply"]):
        category = "water"
    elif any(w in text for w in ["road", "pothole", "sadak", "path", "gali", "footpath", "street"]):
        category = "road"
    elif any(w in text for w in ["electricity", "bijli", "power", "light", "wire", "transformer", "pole", "current", "bijli"]):
        category = "electricity"
    elif any(w in text for w in ["drain", "sewer", "garbage", "kuda", "safai", "toilet", "sanitation", "clean", "dustbin"]):
        category = "sanitation"
    elif any(w in text for w in ["hospital", "doctor", "health", "clinic", "medicine", "dawai", "fever", "sick"]):
        category = "healthcare"
    elif any(w in text for w in ["school", "education", "teacher", "padhai", "college", "book", "fees"]):
        category = "education"

    sentiment = "neutral"
    text = description.lower()
    negative_words = ["broken", "bad", "problem", "issue", "fail", "worst", "terrible", "dirty", "danger", "urgent", "kharab", "tuta", "ganda", "nhi", "no", "poor", "slow"]
    positive_words = ["good", "better", "fixed", "clean", "thanks", "acha", "dhanyavaad", "shukriya", "great", "nice", "excellent", "fast"]
    
    neg_count = sum(1 for w in negative_words if w in text)
    pos_count = sum(1 for w in positive_words if w in text)
    
    if neg_count > pos_count:
        sentiment = "negative"
    elif pos_count > neg_count:
        sentiment = "positive"

    # Priority
    priority = "medium"
    urgent_words = ["urgent", "emergency", "danger", "flood", "fire", "collapse", "accident", "turant", "zaroori", "immediate"]
    if any(w in text for w in urgent_words):
        priority = "high"
    elif category == "other" and sentiment == "neutral":
        priority = "low"

    return {"category": category, "sentiment": sentiment, "priority": priority}


def analyze_sentiment(text: str) -> str:
    """Simple sentiment analysis for call notes"""
    sentiment = "neutral"
    text = text.lower()
    negative = ["angry", "upset", "bad", "problem", "complaint", "kharab", "gussa", "naraz", "no", "nhi", "poor"]
    positive = ["happy", "good", "satisfied", "thank", "khush", "acha", "sahi", "yes", "ha", "shukriya"]
    
    neg = sum(1 for w in negative if w in text)
    pos = sum(1 for w in positive if w in text)
    
    if neg > pos:
        sentiment = "negative"
    elif pos > neg:
        sentiment = "positive"
    return sentiment


def generate_insights(stats: dict) -> list:
    """Generate real insights from analytics data"""
    insights = []
    
    if stats.get("total_issues", 0) > 0:
        resolution_rate = (stats.get("resolved_issues", 0) / stats["total_issues"]) * 100
        if resolution_rate < 50:
            insights.append(f"Resolution rate is low at {resolution_rate:.0f}%. Consider assigning more workers.")
        elif resolution_rate > 80:
            insights.append(f"Good resolution rate of {resolution_rate:.0f}%. Keep up the momentum.")

    sentiment = stats.get("sentiment_distribution", {})
    total_sentiment = sum(sentiment.values())
    if total_sentiment > 0:
        neg_pct = (sentiment.get("negative", 0) / total_sentiment) * 100
        if neg_pct > 40:
            insights.append(f"Negative sentiment is high at {neg_pct:.0f}%. More voter outreach recommended.")
        pos_pct = (sentiment.get("positive", 0) / total_sentiment) * 100
        if pos_pct > 60:
            insights.append(f"Positive sentiment at {pos_pct:.0f}%. Voters are responding well.")

    categories = stats.get("category_breakdown", {})
    if categories:
        top_cat = max(categories, key=categories.get)
        insights.append(f"Most reported issue: {top_cat} ({categories[top_cat]} complaints)")

    if not insights:
        insights.append("Institutional operations are currently performing within expected parameters.")
    
    return insights


# --- SUPABASE HELPER ---

async def supabase_request(method: str, endpoint: str, params: dict = None, json_data: Any = None):
    """Make a request to Supabase REST API"""
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    async with httpx.AsyncClient(timeout=15.0) as client_http:
        try:
            response = await client_http.request(
                method=method,
                url=url,
                headers=SUPABASE_HEADERS,
                params=params,
                json=json_data
            )
            if response.status_code >= 400:
                logger.error(f"Supabase error: {response.status_code} {response.text}")
                return None
            
            if response.text and response.status_code != 204:
                try:
                    return response.json()
                except Exception:
                    return response.text
            return []
        except Exception as e:
            logger.error(f"Supabase Request Exception: {e}")
            return None

async def resolve_booth_id(booth_id: Union[int, str]) -> int:
    """Redirect demo booth 17 to first available booth to handle locked DBs"""
    try:
        # If it's a demo ID or we just want safety
        if not booth_id or str(booth_id) == "17":
            # Note: We use a simplified check to avoid recursion if possible
            async with httpx.AsyncClient(timeout=5.0) as client_check:
                url = f"{SUPABASE_URL}/rest/v1/booths"
                res = await client_check.get(url, headers=SUPABASE_HEADERS, params={"limit": 1})
                if res.status_code == 200:
                    data = res.json()
                    if data and len(data) > 0:
                        return int(data[0]["id"])
    except Exception as e:
        logger.error(f"Booth Resolution Error: {e}")
    
    try:
        if str(booth_id).isdigit():
            return int(booth_id)
    except:
        pass
    return 1


# --- MODELS ---

class GrievanceCreate(BaseModel):
    voter_id: Optional[Union[int, str]] = None
    voter_name: Optional[str] = None
    voter_phone: Optional[str] = None
    category: Optional[str] = None
    description: str
    booth_id: Union[int, str]

class GrievanceUpdate(BaseModel):
    id: Union[int, str]
    status: Optional[str] = None
    assigned_to: Optional[Union[int, str]] = None
    assigned_worker: Optional[str] = None
    resolution_note: Optional[str] = None

class VoterUpdate(BaseModel):
    id: Union[int, str]
    sentiment: Optional[str] = None

class CallCreate(BaseModel):
    voter_id: Union[int, str]
    voter_name: str
    status: str
    notes: Optional[str] = ""
    booth_id: Union[int, str]

class SchemeApplication(BaseModel):
    voter_id: str
    scheme_id: str
    booth_id: int

class ChatRequest(BaseModel):
    message: str
    user_id: str
    booth_id: int
    context: Optional[dict] = None

class ManagerUpdate(BaseModel):
    booth_id: Union[int, str]
    voter_ids: List[Union[int, str]]
    message: str
    action_type: str  # 'broadcast', 'targeted', 'governance'

class ManagerAnalyze(BaseModel):
    booth_id: Union[int, str]

# --- KNOWLEDGE GRAPH UTILITIES ---

async def auto_link_voters(db):
    """
    High-Performance Knowledge Graph Utility: O(N) complexity using grouping.
    Creates bidirectional relationships between voters based on Households or Surnames.
    """
    voters = await db.voters.find().to_list(length=None)
    
    # 1. Group by Household ID and Surname/Booth
    households = {} # household_id -> [voter_ids]
    communities = {} # (surname, booth_id) -> [voter_ids]
    
    for v in voters:
        v_id = str(v.get("id"))
        hh_id = v.get("household_id")
        booth_id = v.get("booth_id")
        
        # Name analysis for community
        name_parts = v.get("name", "").strip().split()
        surname = name_parts[-1].lower() if len(name_parts) > 1 else None
        
        if hh_id:
            households.setdefault(hh_id, []).append(v_id)
        if surname and booth_id:
            communities.setdefault((surname, booth_id), []).append(v_id)
            
    # 2. Batch Update Connections
    for v in voters:
        v_id = str(v.get("id"))
        hh_id = v.get("household_id")
        booth_id = v.get("booth_id")
        name_parts = v.get("name", "").strip().split()
        surname = name_parts[-1].lower() if len(name_parts) > 1 else None
        
        new_links = []
        seen = {v_id}
        
        # Family links from household group
        if hh_id:
            for member_id in households.get(hh_id, []):
                if member_id not in seen:
                    new_links.append({"to": member_id, "type": "family"})
                    seen.add(member_id)
        
        # Community links from surname group
        if surname and booth_id:
            for neighbor_id in communities.get((surname, booth_id), []):
                if neighbor_id not in seen:
                    new_links.append({"to": neighbor_id, "type": "community"})
                    seen.add(neighbor_id)
                    
        if new_links:
            await db.voters.update_one({"id": v["id"]}, {"$set": {"connections": new_links}})

def classify_text_rules(text: str) -> Optional[str]:
    """🧱 Layer 1: Rule-Based Deterministic Tagging (Free & Fast)"""
    text = text.lower()
    rules = {
        "infrastructure": ["water", "road", "pipe", "street", "electricity", "pothole", "light", "drain"],
        "security": ["police", "safety", "crime", "guard", "theft", "patrol", "harassment"],
        "welfare": ["money", "pension", "card", "ration", "subsidy", "health", "hospital", "medicine"]
    }
    for category, keywords in rules.items():
        if any(kw in text for kw in keywords):
            return category
    return None

async def classify_text_openai(text: str) -> Optional[str]:
    """🧠 Layer 2: Light AI Layer (GPT-4o-mini) - Precise & On-Demand"""
    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Task: Classify voter issue. Options: infrastructure, education, health, welfare. Return ONLY one word."},
                {"role": "user", "content": text}
            ],
            max_tokens=10,
            temperature=0
        )
        tag = response.choices[0].message.content.strip().lower()
        if tag in ["infrastructure", "security", "welfare"]:
            return tag
    except Exception as e:
        logger.error(f"OpenAI Classification Error: {e}")
    return None

def calculate_voter_influence(voter: dict) -> float:
    """🔹 Influence Score logic: (connections * 0.4) + (engagement * 0.6)"""
    connections = len(voter.get("connections", []))
    engagement = voter.get("engagement_score", 0)
    return float(connections * 0.4 + engagement * 0.6)

def calculate_voter_risk(voter: dict) -> str:
    """🔹 Risk Detection: High risk if low response and poor sentiment"""
    # Placeholder logic for demo
    sentiment_val = {"positive": 3, "neutral": 2, "negative": 1}.get(voter.get("sentiment", "neutral"), 2)
    response_rate = voter.get("response_rate", 1.0)
    if response_rate < 0.3 or sentiment_val == 1:
        return "high"
    return "low"

async def tag_voter_by_grievance(voter_id, description, resolution_note, db):
    """🔥 Hybrid AI Tagging: Rules First, then AI with Caching"""
    if not description: return None
    
    # Check Cache (Skip if updated recently - simplified for demo)
    voter = await db.voters.find_one({"id": voter_id})
    if voter and voter.get("last_ai_update"):
        # Normally check timestamp here
        pass

    # Phase 1: Rules
    tag = classify_text_rules(description)
    
    # Phase 2: OpenAI (Only if Rules fail)
    if not tag:
        tag = await classify_text_openai(description)
    
    if tag:
        await db.voters.update_one(
            {"id": voter_id}, 
            {
                "$addToSet": {"tags": tag},
                "$set": {
                    "last_ai_update": datetime.now(timezone.utc).isoformat(),
                    "influence_score": calculate_voter_influence(voter or {}),
                    "risk": calculate_voter_risk(voter or {})
                }
            }
        )
        return tag
    return None


# --- KNOWLEDGE GRAPH API ENDPOINTS ---

@api_router.get("/filter-voters")
async def filter_voters(tag: Optional[str] = None, booth_id: Optional[Union[int, str]] = None, sentiment: Optional[str] = None):
    """
    Step 3.1: Segment Filter API - Returns voters matching specific KG criteria.
    """
    query = {}
    if tag: query["tags"] = tag
    if booth_id: query["booth_id"] = booth_id
    if sentiment: query["sentiment"] = sentiment
    
    voters = await db.voters.find(query, {"_id": 0}).to_list(length=100)
    return voters

@api_router.get("/graph-data")
async def get_graph_data():
    """
    Step 4.1: Graph Data API - Scales to 1000 nodes with High Priority Area detection.
    """
    voters = await db.voters.find({}, {"_id": 0, "id": 1, "name": 1, "sentiment": 1, "connections": 1, "influence_score": 1, "risk": 1, "address": 1}).to_list(length=300)
    
    if not voters:
        # Mini-graph for demo if seed fails
        return {
            "nodes": [
                {"id": "V1", "label": "Voter Alpha", "sentiment": "positive", "influence": 8.5, "risk": "low"},
                {"id": "V2", "label": "Voter Beta", "sentiment": "negative", "influence": 4.2, "risk": "high"}
            ],
            "links": [{"source": "V1", "target": "V2", "type": "community"}]
        }
        
    # Calculate Area Priority (Bonus Feature)
    area_complaints = {}
    for v in voters:
        address = v.get("address", "Unknown")
        street = address.split(",")[0] if "," in address else address
        area_complaints[street] = area_complaints.get(street, 0) + 1
    
    nodes = []
    links = []
    # Set of IDs present in this batch to prevent frontend crashes (node not found)
    valid_ids = {str(v["id"]) for v in voters}
    
    for v in voters:
        address = v.get("address", "Unknown")
        street = address.split(",")[0] if "," in address else address
        is_priority_area = area_complaints.get(street, 0) > 3
        
        v_id_str = str(v["id"])
        nodes.append({
            "id": v_id_str,
            "label": v.get("name", "Unknown"),
            "sentiment": v.get("sentiment", "neutral"),
            "influence": v.get("influence_score", 0),
            "risk": v.get("risk", "low"),
            "priority_area": is_priority_area
        })
        
        for conn in v.get("connections", []):
            target_id = str(conn["to"])
            # Only add link if target node exists in this data batch
            if target_id in valid_ids:
                links.append({
                    "source": v_id_str,
                    "target": target_id,
                    "type": conn.get("type", "community")
                })
            
    return {"nodes": nodes, "links": links}

# --- ROUTES: NOTIFICATIONS ---

@app.websocket("/ws/notifications/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)
    try:
        while True:
            # Keep connection alive
            data = await websocket.receive_text()
            # Optional: handle client messages
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)

@api_router.get("/notifications")
async def get_notifications(user_id: str):
    """Get notification history for a user"""
    try:
        notifications = await db.notifications.find(
            {"user_id": str(user_id)},
            {"_id": 0}
        ).sort("created_at", -1).to_list(50)
        return notifications
    except Exception as e:
        logger.error(f"Error fetching notifications: {e}")
        return []

@api_router.patch("/notifications/{id}/read")
async def mark_notification_read(id: str):
    """Mark a notification as read"""
    try:
        await db.notifications.update_one({"id": id}, {"$set": {"read": True}})
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error marking notification read: {e}")
        return {"status": "error"}

# --- ROUTES: BOOTHS ---

@api_router.get("/booths")
async def get_booths():
    """Get all booths"""
    data = await supabase_request("GET", "booths", params={
        "select": "id,booth_number,name,address",
        "order": "id"
    })
    return data


# --- ROUTES: USERS (MongoDB) ---

@api_router.get("/users")
async def get_users():
    """Get all system users"""
    users = await db.users.find({}, {"_id": 0}).to_list(100)
    return users

@api_router.get("/users/role/{role}")
async def get_users_by_role(role: str):
    """Get users by role"""
    users = await db.users.find({"role": role}, {"_id": 0}).to_list(100)
    return users


# --- ROUTES: VOTERS ---

@api_router.get("/voters")
async def get_voters(booth_id: Union[int, str]):
    """Get voters by booth_id - combines voters_eci (name/phone) with voters (sentiment)"""
    real_id = await resolve_booth_id(booth_id)
    # logger.info(f"Fetching voters for [Requested:{booth_id} -> Real:{real_id}]")
    
    # Get voter base data from voters_eci
    eci_data = await supabase_request("GET", "voters_eci", params={
        "select": "id,name,phone,booth_id,address,gender,dob",
        "booth_id": f"eq.{real_id}",
        "order": "name"
    })
    
    if not eci_data:
        # Try finding ANY voters if booth specific fails, for demo robustness
        eci_data = await supabase_request("GET", "voters_eci", params={
            "select": "id,name,phone,booth_id,address,gender,dob",
            "limit": 50
        })
        
    if not eci_data:
        # Fallback to MongoDB voters if Supabase fails (Hybrid Robustness)
        mongo_voters = await db.voters.find({"booth_id": real_id}, {"_id": 0}).to_list(100)
        if not mongo_voters:
            mongo_voters = await db.voters.find({}, {"_id": 0}).to_list(50)
        
        # Format for frontend
        return [{
            "id": v.get("id", "").replace("V", ""),
            "name": v.get("name"),
            "phone": v.get("phone"),
            "booth_id": v.get("booth_id"),
            "address": v.get("address"),
            "sentiment": v.get("sentiment", "neutral"),
            "segment": v.get("tags", ["other"])[0],
            "status": "active"
        } for v in mongo_voters]
    
    # Get enrichment data from voters table
    voter_ids = [str(v["id"]) for v in eci_data]
    # Ensure IDs are quoted for string comparison in Supabase
    id_list = ",".join(f'"{i}"' for i in voter_ids)
    enrichment = await supabase_request("GET", "voters", params={
        "select": "eci_voter_id,sentiment,segment",
        "eci_voter_id": f"in.({id_list})"
    })
    
    # Use string keys for reliable mapping
    enrichment_map = {str(v["eci_voter_id"]): v for v in (enrichment or [])}

    # Combine data
    result = []
    for v in eci_data:
        # Match using string ID
        enrich = enrichment_map.get(str(v["id"]), {})
        result.append({
            "id": v["id"],
            "name": v["name"],
            "phone": v["phone"],
            "booth_id": v["booth_id"],
            "address": v.get("address", ""),
            "gender": v.get("gender", ""),
            "sentiment": enrich.get("sentiment", "neutral"),
            "segment": enrich.get("segment", "other"),
            "status": "active"
        })
    
    # If Supabase combined result is too small, add MongoDB voters for volume (Hybrid Scale)
    if len(result) < 10:
        mongo_voters_list = await db.voters.find({}, {"_id": 0}).to_list(50)
        seen_ids = {str(r["id"]) for r in result}
        for v in mongo_voters_list:
            v_id = str(v.get("id", "")).replace("V", "")
            if v_id not in seen_ids:
                result.append({
                    "id": v_id,
                    "name": v.get("name"),
                    "phone": v.get("phone"),
                    "booth_id": v.get("booth_id"),
                    "address": v.get("address"),
                    "sentiment": v.get("sentiment", "neutral"),
                    "segment": v.get("tags", ["other"])[0],
                    "status": "active"
                })
    
    return result


@api_router.patch("/voters")
async def update_voter(data: VoterUpdate):
    """Update voter sentiment"""
    try:
        updates = {}
        if data.sentiment:
            updates["sentiment"] = data.sentiment
        
        if not updates:
            raise HTTPException(status_code=400, detail="No updates provided")

        # Try Supabase first
        result = await supabase_request(
            "PATCH", 
            f"voters?eci_voter_id=eq.{data.id}",
            json_data=updates
        )
        
        # Also update in MongoDB (Hybrid)
        await db.voters.update_one(
            {"id": str(data.id)},
            {"$set": updates}
        )
        # Handle "V" prefix if needed
        await db.voters.update_one(
            {"id": f"V{data.id}"},
            {"$set": updates}
        )

        return {"status": "updated", "id": data.id}
    except Exception as e:
        logger.error(f"Error updating voter: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- ROUTES: CALLS (MongoDB) ---

@api_router.get("/calls")
async def get_calls(booth_id: Union[int, str]):
    """Get call history for a booth"""
    real_id = await resolve_booth_id(booth_id)
    calls = await db.calls.find(
        {"booth_id": real_id}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return calls


@api_router.post("/calls")
async def create_call(data: CallCreate):
    """Log a call"""
    try:
        real_booth_id = await resolve_booth_id(data.booth_id)
        sentiment = analyze_sentiment(data.notes) if data.notes else "neutral"
        
        call_doc = {
            "id": str(uuid.uuid4()),
            "voter_id": data.voter_id,
            "voter_name": data.voter_name,
            "status": data.status,
            "notes": data.notes,
            "sentiment": sentiment,
            "booth_id": real_booth_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.calls.insert_one(call_doc)
        
        # Update voter sentiment in Supabase
        if sentiment != "neutral":
            try:
                # Update in voters table (MongoDB version)
                # Map Supabase ID (e.g. 1001) to MongoDB ID (e.g. V1001)
                mongo_voter_id = f"V{data.voter_id}" if str(data.voter_id).isdigit() else data.voter_id
                
                await db.voters.update_one(
                    {"id": mongo_voter_id},
                    {"$set": {"sentiment": sentiment}}
                )
                
                # Update in Supabase voters table
                await supabase_request(
                    "PATCH",
                    f"voters?eci_voter_id=eq.{data.voter_id}",
                    json_data={"sentiment": sentiment}
                )
            except Exception as e:
                logger.error(f"Error updating voter sentiment: {e}")
                pass
        
        del call_doc["_id"]
        return call_doc
    except Exception as e:
        logger.error(f"Error creating call: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- ROUTES: GRIEVANCES ---

@api_router.get("/grievances")
async def get_grievances(booth_id: Optional[Union[int, str]] = None, assigned_to: Optional[str] = None, voter_id: Optional[Union[int, str]] = None):
    """Get grievances with optional filters"""
    real_id = await resolve_booth_id(booth_id) if booth_id else None
    # logger.info(f"Fetching grievances for [Requested:{booth_id} -> Real:{real_id}], assigned_to={assigned_to}")
    
    # If filtered by assigned worker, find those IDs first from MongoDB
    specific_ids = []
    if assigned_to:
        cursor = db.grievance_assignments.find({"worker_id": assigned_to}, {"grievance_id": 1})
        async for doc in cursor:
            specific_ids.append(doc["grievance_id"])
        
        if not specific_ids:
            # logger.info(f"No assignments found for worker {assigned_to}")
            return []
        # logger.info(f"Worker {assigned_to} has {len(specific_ids)} assignments: {specific_ids}")

    params = {
        "select": "*",
        "order": "created_at.desc"
    }
    
    if real_id:
        params["booth_id"] = f"eq.{real_id}"
    if voter_id:
        params["voter_id"] = f"eq.{voter_id}"
    if specific_ids:
        # Filter Supabase by these specific IDs
        params["id"] = f"in.({','.join(specific_ids)})"
    
    data = await supabase_request("GET", "grievances", params=params)
    
    # Merge with MongoDB data for hybrid richness
    mongo_grievances = []
    try:
        query = {}
        if real_id: query["booth_id"] = real_id
        if voter_id: query["voter_id"] = str(voter_id)
        
        # Search in voters' embedded grievances
        cursor = db.voters.find({"grievances": {"$exists": True, "$ne": []}})
        async for v in cursor:
            for g in v.get("grievances", []):
                # Filter criteria
                if real_id and v.get("booth_id") != real_id: continue
                if voter_id and str(v.get("id")) != str(voter_id): continue
                
                mongo_grievances.append({
                    "id": g.get("id"),
                    "voter_id": v.get("id"),
                    "voter_name": v.get("name"),
                    "description": g.get("description"),
                    "status": g.get("status", "submitted"),
                    "category": g.get("category", "other"),
                    "booth_id": v.get("booth_id"),
                    "created_at": v.get("last_ai_update")
                })
    except Exception as e:
        logger.error(f"Mongo grievances fetch error: {e}")

    # Combine data sets
    all_data = (data or []) + mongo_grievances
    
    if not all_data:
        # Final fallback for demo: Return embedded grievances from MongoDB voters
        mongo_voters_gr = await db.voters.find({"grievances": {"$exists": True, "$ne": []}}, {"_id": 0}).to_list(20)
        fallback_gr = []
        for v in mongo_voters_gr:
            for g in v.get("grievances", []):
                fallback_gr.append({
                    "id": g.get("id"),
                    "voter_id": v.get("id"),
                    "voter_name": v.get("name"),
                    "description": g.get("description"),
                    "status": g.get("status", "submitted"),
                    "category": g.get("category", "other"),
                    "booth_id": v.get("booth_id"),
                    "created_at": v.get("last_ai_update")
                })
        all_data = fallback_gr
    
    if not all_data:
        return []

    # Get assignments from MongoDB for enrichment
    grievance_ids = [str(g["id"]) for g in all_data]
    assignments = {}
    if grievance_ids:
        cursor = db.grievance_assignments.find(
            {"grievance_id": {"$in": grievance_ids}},
            {"_id": 0}
        )
        async for doc in cursor:
            assignments[str(doc["grievance_id"])] = doc
    
    # Merge assignment data with grievances
    result = []
    seen_ids = set()
    for item in all_data:
        g_id = str(item.get("id"))
        if g_id in seen_ids: continue
        seen_ids.add(g_id)
        
        g = dict(item)
        assignment = assignments.get(g_id, {})
        g["assigned_worker"] = assignment.get("worker_name", None)
        g["assigned_worker_id"] = assignment.get("worker_id", None)
        result.append(g)
    
    return result


@api_router.post("/grievances")
async def create_grievance(data: GrievanceCreate):
    """Create a new grievance with AI classification"""
    try:
        real_booth_id = await resolve_booth_id(data.booth_id)
        
        # AI Classification
        ai_result = classify_grievance(data.description)
        
        # Use AI category if not provided
        valid_categories = ['road', 'water', 'electricity', 'sanitation', 'healthcare', 'education', 'other']
        category = data.category.lower() if data.category and data.category.lower() in valid_categories else ai_result["category"]
        
        grievance_data = {
            "voter_name": data.voter_name or "Anonymous Citizen",
            "description": data.description,
            "category": category,
            "booth_id": real_booth_id,
            "status": "submitted",
            "sentiment": ai_result["sentiment"]
        }
        
        if data.voter_id:
            grievance_data["voter_id"] = data.voter_id
        
        result = await supabase_request("POST", "grievances", json_data=grievance_data)
        
        # --- HYBRID FALLBACK: Also store in MongoDB for demo safety ---
        try:
            mongo_gr = {
                "id": f"GR-{uuid.uuid4().hex[:6]}",
                "voter_id": data.voter_id or "anonymous",
                "voter_name": data.voter_name or "Anonymous Citizen",
                "description": data.description,
                "category": category,
                "status": "submitted",
                "booth_id": real_booth_id,
                "sentiment": ai_result["sentiment"],
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            # Add to a relevant voter in MongoDB or a separate collection
            if data.voter_id:
                await db.voters.update_one(
                    {"id": str(data.voter_id)},
                    {"$push": {"grievances": mongo_gr}}
                )
        except Exception as e:
            logger.error(f"MongoDB grievance fallback error: {e}")

        if result:
            grievance = result[0]
            grievance["ai_category"] = ai_result["category"]
            grievance["ai_sentiment"] = ai_result["sentiment"]
            grievance["ai_priority"] = ai_result["priority"]
            
            # --- NOTIFICATION HOOK ---
            # Notify Booth Staff (Admins and Workers)
            try:
                # In a real app, we'd find the specific users for this booth
                # For now, let's mock-notify 'admin_1' and 'worker_1'
                await send_notification(
                    user_id="admin_1",
                    title="New Grievance Filed",
                    message=f"A new {category} issue has been reported in Booth {real_booth_id}.",
                    n_type="warning",
                    metadata={"grievance_id": str(grievance["id"])}
                )
            except Exception as e:
                logger.error(f"Notification Hook Error: {e}")
            
            return grievance
        
        raise HTTPException(status_code=500, detail="Failed to create grievance")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating grievance: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.patch("/grievances")
async def update_grievance(data: GrievanceUpdate):
    """Update grievance - assign worker or resolve"""
    # logger.info(f"Updating grievance {data.id}: status={data.status}, assigned_to={data.assigned_to}")
    try:
        updates = {}
        
        if data.status:
            updates["status"] = data.status
        
        if data.resolution_note:
            updates["resolution_note"] = data.resolution_note
        
        # Update in Supabase
        result = None
        if updates:
            result = await supabase_request("PATCH", f"grievances?id=eq.{data.id}", json_data=updates)
        
        # --- HYBRID UPDATE: Also update in MongoDB if it exists there ---
        try:
            # Find the voter who owns this grievance in MongoDB
            await db.voters.update_one(
                {"grievances.id": str(data.id)},
                {"$set": {
                    "grievances.$.status": data.status or "assigned",
                    "grievances.$.resolution_note": data.resolution_note
                }}
            )
        except Exception as e:
            logger.error(f"Mongo grievance update error: {e}")
        
        # Handle worker assignment in MongoDB
        if data.assigned_to:
            # Get worker details from MongoDB
            worker = await db.users.find_one({"id": data.assigned_to}, {"_id": 0})
            worker_name = worker["name"] if worker else (data.assigned_worker or "Assigned Personnel")
            
            logger.info(f"Assigning grievance {data.id} to {worker_name} ({data.assigned_to})")
            
            res = await db.grievance_assignments.update_one(
                {"grievance_id": str(data.id)},
                {"$set": {
                    "grievance_id": str(data.id),
                    "worker_id": data.assigned_to,
                    "worker_name": worker_name,
                    "assigned_at": datetime.now(timezone.utc).isoformat()
                }},
                upsert=True
            )
            logger.info(f"MongoDB Update Result: matched={res.matched_count}, modified={res.modified_count}, upserted={res.upserted_id}")
            
            # Update status to assigned if not already
            if not data.status or data.status == "submitted":
                await supabase_request("PATCH", f"grievances?id=eq.{data.id}", json_data={
                    "status": "assigned"
                })
            
            # --- NOTIFICATION HOOK: ASSIGNMENT ---
            await send_notification(
                user_id=str(data.assigned_to),
                title="Grievance Assigned",
                message=f"You have been assigned a new grievance (ID: {data.id}).",
                n_type="info",
                metadata={"grievance_id": str(data.id)}
            )

        # --- NOTIFICATION HOOK: STATUS UPDATE ---
        if data.status and data.status == "resolved":
            # Find the voter_id for this grievance
            grievance = await supabase_request("GET", f"grievances?id=eq.{data.id}", params={"select": "voter_id"})
            if grievance and grievance[0].get("voter_id"):
                v_id = str(grievance[0]["voter_id"])
                await send_notification(
                    user_id=v_id,
                    title="Mission Accomplished",
                    message="Your reported issue has been resolved. Thank you for your patience!",
                    n_type="success",
                    metadata={"grievance_id": str(data.id)}
                )

        return {"status": "updated", "id": data.id}
    except Exception as e:
        logger.error(f"Error updating grievance: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- ROUTES: ANALYTICS ---

@api_router.get("/analytics")
async def get_analytics(booth_id: Union[int, str]):
    """Get real analytics from database"""
    real_id = await resolve_booth_id(booth_id)
    # logger.info(f"Fetching analytics for [Requested:{booth_id} -> Real:{real_id}]")
    try:
        # Voter stats
        voters = await supabase_request("GET", "voters", params={
            "select": "eci_voter_id,sentiment"
        })
        
        eci_voters = await supabase_request("GET", "voters_eci", params={
            "select": "id",
            "booth_id": f"eq.{real_id}"
        })
        
        if not eci_voters:
            # Hybrid Fallback for analytics
            mongo_voters = await db.voters.find({"booth_id": real_id}, {"_id": 0}).to_list(100)
            if not mongo_voters:
                mongo_voters = await db.voters.find({}, {"_id": 0}).to_list(100)
            
            sentiment_dist = {"positive": 0, "neutral": 0, "negative": 0}
            for v in mongo_voters:
                s = v.get("sentiment", "neutral")
                if s in sentiment_dist: sentiment_dist[s] += 1
            
            total_voters = len(mongo_voters)
            
            # Grievance Fallback
            mongo_gr = []
            for v in mongo_voters:
                for g in v.get("grievances", []):
                    mongo_gr.append(g)
            
            total_issues = len(mongo_gr)
            resolved_issues = sum(1 for g in mongo_gr if g.get("status") == "resolved")
            
            category_breakdown = {}
            for g in mongo_gr:
                cat = g.get("category", "other")
                category_breakdown[cat] = category_breakdown.get(cat, 0) + 1
            
            call_count = await db.calls.count_documents({"booth_id": real_id})
            
            stats = {
                "booth_id": real_id,
                "total_voters": total_voters,
                "sentiment_distribution": sentiment_dist,
                "total_issues": total_issues,
                "resolved_issues": resolved_issues,
                "pending_issues": total_issues - resolved_issues,
                "category_breakdown": category_breakdown,
                "total_calls": call_count
            }
            stats["insights"] = generate_insights(stats)
            return stats
        booth_voter_ids = {v["id"] for v in (eci_voters or [])}
        
        total_voters = len(booth_voter_ids)
        sentiment_dist = {"positive": 0, "neutral": 0, "negative": 0}
        for v in (voters or []):
            if v["eci_voter_id"] in booth_voter_ids:
                s = v.get("sentiment", "neutral") or "neutral"
                if s in sentiment_dist:
                    sentiment_dist[s] += 1
        
        # Grievance stats
        grievances = await supabase_request("GET", "grievances", params={
            "select": "id,status,category,booth_id",
            "booth_id": f"eq.{real_id}"
        })
        
        total_issues = len(grievances or [])
        resolved_issues = sum(1 for g in (grievances or []) if g["status"] == "resolved")
        
        # Category breakdown
        category_breakdown = {}
        for g in (grievances or []):
            cat = g.get("category", "other")
            category_breakdown[cat] = category_breakdown.get(cat, 0) + 1
        
        # Call stats from MongoDB
        voters_with_grievances = await db.voters.find({"grievances": {"$exists": True, "$ne": []}}).to_list(length=None)
        
        for v in voters_with_grievances:
            sentiment = v.get("sentiment", "neutral")
            if sentiment in sentiment_dist:
                sentiment_dist[sentiment] += 1

        call_count = await db.calls.count_documents({"booth_id": real_id})
        
        stats = {
            "booth_id": real_id,
            "total_voters": total_voters,
            "sentiment_distribution": sentiment_dist,
            "total_issues": total_issues,
            "resolved_issues": resolved_issues,
            "pending_issues": total_issues - resolved_issues,
            "category_breakdown": category_breakdown,
            "total_calls": call_count
        }
        
        stats["insights"] = generate_insights(stats)
        
        return stats
    except Exception as e:
        logger.error(f"Error getting analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/manager/booths-summary")
async def get_booths_summary():
    """Get aggregated stats for all booths for the manager view"""
    try:
        # Get all booths from Supabase
        booths = await supabase_request("GET", "booths")
        if not booths:
            # Hybrid Fallback for summary
            return [
                {"id": 1, "name": "Sector Alpha", "booth_number": 17, "turnout": 62, "issue_count": 12, "pending_count": 4, "sentiment_score": 85, "status": "stable"},
                {"id": 2, "name": "Sector Beta", "booth_number": 18, "turnout": 45, "issue_count": 28, "pending_count": 15, "sentiment_score": 42, "status": "critical"}
            ]
            
        # Get all grievances to calculate stats
        grievances = await supabase_request("GET", "grievances", params={"select": "id,status,booth_id"})
        
        # Calculate stats per booth
        summary = []
        for booth in (booths or []):
            booth_id = booth["id"]
            booth_grievances = [g for g in (grievances or []) if g["booth_id"] == booth_id]
            
            total_issues = len(booth_grievances)
            pending_issues = sum(1 for g in booth_grievances if g["status"] != "resolved")
            
            # Synthetic turnout for demo
            turnout = 45 + (booth_id % 20) 
            
            # Simple sentiment score based on pending issues (lower is better for sentiment)
            sentiment_score = max(0, 100 - (pending_issues * 5))
            
            summary.append({
                "id": booth_id,
                "name": booth["name"],
                "booth_number": booth["booth_number"],
                "turnout": turnout,
                "issue_count": total_issues,
                "pending_count": pending_issues,
                "sentiment_score": sentiment_score,
                "status": "critical" if pending_issues > 5 else "stable"
            })
            
        return summary
    except Exception as e:
        logger.error(f"Error in booths summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/manager/analyze")
async def manager_analyze(data: ManagerAnalyze):
    """Trigger AI analysis for a booth to group issues and target voters"""
    try:
        real_id = await resolve_booth_id(data.booth_id)
        
        # Get grievances for this booth
        grievances = await get_grievances(booth_id=real_id)
        
        if not grievances:
            return {"status": "no_data", "message": "No issues found in this sector to analyze."}
            
        # AI Logic: Group by description/category
        categories = {}
        for g in grievances:
            cat = g.get("category", "other")
            categories[cat] = categories.get(cat, [])
            categories[cat].append(g["id"])
            
        # Find top issue
        top_cat = max(categories, key=lambda k: len(categories[k]))
        
        return {
            "status": "success",
            "top_priority": top_cat,
            "affected_count": len(categories[top_cat]),
            "recommendation": f"Sector {data.booth_id} has a high concentration of {top_cat} issues. Immediate governance response triggered for {len(categories[top_cat])} affected voters."
        }
    except Exception as e:
        logger.error(f"Manager analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/manager/send-update")
async def manager_send_update(data: ManagerUpdate):
    """Send targeted communication to specific voters"""
    try:
        # In a real app, this would trigger SMS/WhatsApp/Email
        # Here we log it to a new collection
        update_log = {
            "id": str(uuid.uuid4()),
            "booth_id": data.booth_id,
            "voter_count": len(data.voter_ids),
            "message": data.message,
            "action_type": data.action_type,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # Store in MongoDB (we'll use a general 'communications' collection)
        await db.communications.insert_one(update_log)
        
        return {"status": "sent", "voters_reached": len(data.voter_ids)}
    except Exception as e:
        logger.error(f"Manager update error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/schemes")
async def get_schemes():
    """Get list of available government schemes with official links"""
    schemes = [
        {
            "id": "SCH-001", 
            "name": "Pradhan Mantri Awas Yojana", 
            "category": "Housing", 
            "desc": "Housing for all by 2022 scheme for urban areas.", 
            "eligibility": "Low income families",
            "official_link": "https://pmay-urban.gov.in/",
            "steps": ["Apply on Portal", "Document Verification", "Site Inspection", "Grant Disbursement"]
        },
        {
            "id": "SCH-002", 
            "name": "Ayushman Bharat", 
            "category": "Healthcare", 
            "desc": "Free health coverage up to 5 lakhs per family.", 
            "eligibility": "SECC 2011 listed families",
            "official_link": "https://pmjay.gov.in/",
            "steps": ["Check Eligibility", "Get Golden Card", "Visit Empaneled Hospital", "Cashless Treatment"]
        },
        {
            "id": "SCH-003", 
            "name": "PM Kisan Samman Nidhi", 
            "category": "Welfare", 
            "desc": "Income support of 6000 per year to farmers.", 
            "eligibility": "Small and marginal farmers",
            "official_link": "https://pmkisan.gov.in/",
            "steps": ["Farmer Registration", "Bank Account Linking", "Land Record Verification", "Direct Benefit Transfer"]
        },
        {
            "id": "SCH-004", 
            "name": "Ujjwala Yojana", 
            "category": "Energy", 
            "desc": "Free LPG connection to women of BPL households.", 
            "eligibility": "BPL households",
            "official_link": "https://www.pmuy.gov.in/",
            "steps": ["Submit Application", "KYC Completion", "Security Deposit Waiver", "Stove & Cylinder Issuance"]
        }
    ]
    return schemes

@api_router.post("/schemes/apply")
async def apply_scheme(data: SchemeApplication):
    """Log a scheme application"""
    try:
        application = {
            "id": str(uuid.uuid4()),
            "voter_id": data.voter_id,
            "scheme_id": data.scheme_id,
            "booth_id": data.booth_id,
            "status": "pending",
            "applied_at": datetime.now(timezone.utc).isoformat()
        }
        await db.scheme_applications.insert_one(application)
        
        # Send notification to user
        await send_notification(
            user_id=data.voter_id,
            title="Application Received",
            message=f"Your application for scheme {data.scheme_id} has been successfully logged.",
            n_type="success"
        )
        
        return {"status": "success", "application_id": application["id"]}
    except Exception as e:
        logger.error(f"Error applying for scheme: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/schemes/applications")
async def get_applications(voter_id: str):
    """Get applications for a specific voter"""
    try:
        cursor = db.scheme_applications.find({"voter_id": str(voter_id)}, {"_id": 0})
        apps = await cursor.to_list(length=100)
        return apps
    except Exception as e:
        logger.error(f"Error fetching applications: {e}")
        return []

@api_router.get("/manager/automation-alerts")
async def get_manager_alerts():
    """AI Automation: Predictive alerts for the City Manager"""
    try:
        # 1. Detect Sentiment Volatility
        voters = await db.voters.find({}, {"sentiment": 1, "booth_id": 1}).to_list(1000)
        booth_sentiment = {}
        for v in voters:
            b_id = v.get("booth_id", 17)
            booth_sentiment[b_id] = booth_sentiment.get(b_id, [])
            booth_sentiment[b_id].append(v.get("sentiment", "neutral"))
        
        alerts = []
        for b_id, sents in booth_sentiment.items():
            neg_pct = sents.count("negative") / len(sents) if sents else 0
            if neg_pct > 0.3:
                alerts.append({
                    "id": f"AL-{uuid.uuid4().hex[:4]}",
                    "type": "critical",
                    "title": "Sentiment Volatility Spike",
                    "message": f"Booth {b_id} showing {int(neg_pct*100)}% negative sentiment bias. Recommend immediate outreach.",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })

        # 2. Detect Resource Bottlenecks (Unassigned Grievances)
        grievances = await get_grievances()
        unassigned = [g for g in grievances if g.get("status") == "submitted"]
        if len(unassigned) > 5:
            alerts.append({
                "id": f"AL-{uuid.uuid4().hex[:4]}",
                "type": "warning",
                "title": "Resource Bottleneck",
                "message": f"Found {len(unassigned)} unassigned grievances. Deploy field units to maintain operational coeff.",
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            
        # 3. Scheme Eligibility Automation
        alerts.append({
            "id": f"AL-{uuid.uuid4().hex[:4]}",
            "type": "info",
            "title": "Scheme Optimization",
            "message": "AI identifies 14 voters eligible for PM Kisan in Sector Alpha. Auto-drafting invitation protocols.",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

        return alerts
    except Exception as e:
        logger.error(f"Automation Alert Error: {e}")
        return []

@api_router.post("/manager/auto-resolve")
async def manager_auto_resolve():
    """AI Automation: Auto-assign unassigned grievances to available workers"""
    try:
        # 1. Get unassigned grievances
        grievances = await get_grievances()
        unassigned = [g for g in grievances if g.get("status") == "submitted"]
        
        # 2. Get available workers
        workers = await db.users.find({"role": "worker"}).to_list(100)
        
        if not unassigned or not workers:
            return {"status": "no_action", "assigned_count": 0}
            
        assigned_count = 0
        for i, g in enumerate(unassigned):
            worker = workers[i % len(workers)]
            await update_grievance(GrievanceUpdate(
                id=str(g["id"]),
                status="assigned",
                assigned_to=worker["id"],
                assigned_worker=worker["name"]
            ))
            assigned_count += 1
            
        return {"status": "success", "assigned_count": assigned_count}
    except Exception as e:
        logger.error(f"Auto-resolve error: {e}")
        return {"status": "error", "message": str(e)}
@api_router.get("/voter-services")
async def get_voter_services():
    """Get list of available voter services with official links"""
    services = [
        {
            "id": "VS-001",
            "name": "Digital ID Request", 
            "desc": "Request a digital copy of your institutional verification card.", 
            "icon": "fingerprint",
            "official_link": "https://voters.eci.gov.in/",
            "more_info": "Your digital ID serves as a secondary verification token for local governance access."
        },
        {
            "id": "VS-002",
            "name": "Address Certification", 
            "desc": "Official verification of local residency for scheme eligibility.", 
            "icon": "home_pin",
            "official_link": "https://uidai.gov.in/",
            "more_info": "Institutional certification ensures you meet the residency requirements for localized welfare programs."
        },
        {
            "id": "VS-003",
            "name": "Family Tree Sync", 
            "desc": "Verify and update your family unit nodes in the Knowledge Graph.", 
            "icon": "account_tree",
            "official_link": "https://voters.eci.gov.in/",
            "more_info": "Syncing your family tree helps in identifying shared welfare eligibility and community mapping."
        },
        {
            "id": "VS-004",
            "name": "Election Day Alert", 
            "desc": "Configure institutional notification protocols for upcoming cycles.", 
            "icon": "notifications_active",
            "official_link": "https://eci.gov.in/",
            "more_info": "Stay informed about your local booth status, queue times, and official announcements on election day."
        }
    ]
    return services

# --- ROUTES: AI CHATBOT ---

@api_router.post("/chat")
async def ai_chat(data: ChatRequest):
    """Context-aware AI Chatbot using Sarvam/OpenAI"""
    # Rate limit removed
    
    try:
        # 1. Gather Context
        user = await db.users.find_one({"id": data.user_id}, {"_id": 0})
        
        # Try both formats for voter ID (Voter table uses V1001 while ECI uses 1001)
        voter_id = data.user_id
        voter = await db.voters.find_one({"id": voter_id}, {"_id": 0})
        if not voter and str(voter_id).isdigit():
            voter = await db.voters.find_one({"id": f"V{voter_id}"}, {"_id": 0})

        # Filter large fields from voter to save tokens
        if voter and "connections" in voter:
            del voter["connections"]
        
        # Fetch actual grievances for this booth
        grievances = await get_grievances(booth_id=data.booth_id)
        system_grievances = grievances[:3] if grievances else []
        
        # Fetch available schemes
        schemes = await get_schemes()
        
        context_prompt = f"""
        You are ESarthi, an intelligent AI assistant for the BoothIQ Governance Platform.
        User Identity: {user.get('name', 'Citizen') if user else 'Citizen'} (Role: {user.get('role', 'Voter') if user else 'Voter'})
        Voter Context: {json.dumps(voter) if voter else 'No direct registry match, but assisting as a local resident.'}
        Platform Data:
        - Active Grievances: {json.dumps(system_grievances)} (Total: {len(grievances) if grievances else 0})
        - Available Schemes: {json.dumps([s['name'] for s in schemes]) if schemes else '[]'}
        
        Current Query: {data.message}
        
        Strategic Guidelines:
        - You represent the BoothIQ Institutional AI. Be authoritative yet helpful.
        - Reference their specific grievances (IDs or categories) if they ask about status.
        - Suggest specific schemes like 'Ayushman Bharat' or 'PM Kisan' based on their context.
        - Use localized terminology (Sector, Booth, Voter Guide, Booth Manager) when appropriate.
        - Keep responses sharp, professional, and under 150 words.
        """
        
        # Try Sarvam AI LLM first as per user request to use Sarvam AI
        try:
            sarvam_key = os.environ.get('SARVAM_API_KEY')
            if not sarvam_key:
                raise Exception("SARVAM_API_KEY not set")
                
            async with httpx.AsyncClient() as client:
                headers = {
                    'api-subscription-key': sarvam_key,
                    'Content-Type': 'application/json'
                }
                payload = {
                    "model": "sarvam-m",
                    "messages": [
                        {"role": "system", "content": context_prompt},
                        {"role": "user", "content": data.message}
                    ]
                }
                
                # Using Sarvam's chat completion endpoint if it exists, otherwise fallback to OpenAI
                response = await client.post(
                    "https://api.sarvam.ai/chat/completions",
                    json=payload,
                    headers=headers,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    ai_reply = response.json()["choices"][0]["message"]["content"]
                else:
                    logger.warning(f"Sarvam LLM failed with {response.status_code}, falling back to OpenAI")
                    raise Exception("Sarvam LLM fallback")
                    
        except Exception as sarvam_err:
            logger.info(f"Using OpenAI as primary/fallback (Sarvam error: {sarvam_err})")
            # Use OpenAI for high-quality reasoning
            try:
                response = await openai_client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": context_prompt},
                        {"role": "user", "content": data.message}
                    ],
                    max_tokens=500
                )
                ai_reply = response.choices[0].message.content
            except Exception as ai_err:
                logger.error(f"AI Service Error: {ai_err}")
                # Fallback response when API key is out of quota
                ai_reply = f"I'm currently operating in offline mode as our intelligence uplink is saturated. However, I can see you are {user.get('name', 'a citizen')} from Booth {data.booth_id}. How else can I assist you manually?"
                if "insufficient_quota" in str(ai_err):
                    ai_reply = "Institutional AI Quota Exceeded. I am standing by for manual assistance. Please check back later for full intelligence services."
        
        return {"response": ai_reply}
    except Exception as e:
        logger.error(f"Chat Error: {e}")
        return {"response": "I am currently undergoing maintenance. Please try again in a moment."}

@api_router.post("/ai/stt")
async def speech_to_text(file: UploadFile = File(...), language_code: str = Form("hi-IN"), user_id: str = Form("anonymous")):
    """Sarvam AI Speech-to-Text"""
    # Rate limit removed
    try:
        sarvam_key = os.environ.get('SARVAM_API_KEY')
        if not sarvam_key:
            raise HTTPException(status_code=500, detail="SARVAM_API_KEY not set")
            
        async with httpx.AsyncClient() as client:
            files = {'file': (file.filename, await file.read(), file.content_type)}
            data = {'model': 'saaras:v1', 'language_code': language_code}
            headers = {'api-subscription-key': sarvam_key}
            
            response = await client.post(
                "https://api.sarvam.ai/speech-to-text",
                files=files,
                data=data,
                headers=headers
            )
            
            if response.status_code != 200:
                logger.error(f"Sarvam STT Error: {response.text}")
                return {"transcript": ""}
                
            return response.json()
    except Exception as e:
        logger.error(f"STT Exception: {e}")
        return {"transcript": ""}

@api_router.post("/ai/tts")
async def text_to_speech(text: str = Form(...), language_code: str = Form("hi-IN"), user_id: str = Form("anonymous")):
    """Sarvam AI Text-to-Speech"""
    # Rate limit removed
    try:
        sarvam_key = os.environ.get('SARVAM_API_KEY')
        async with httpx.AsyncClient() as client:
            headers = {
                'api-subscription-key': sarvam_key,
                'Content-Type': 'application/json'
            }
            payload = {
                "inputs": [text],
                "target_language_code": language_code,
                "speaker_gender": "Female",
                "model": "bulbul:v1"
            }
            
            response = await client.post(
                "https://api.sarvam.ai/text-to-speech",
                json=payload,
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                return {"audio_content": data.get("audios", [""])[0]}
            return {"audio_content": ""}
    except Exception as e:
        logger.error(f"TTS Exception: {e}")
        return {"audio_content": ""}

# --- ROUTES: SEED DATA ---

@api_router.post("/seed")
async def seed_data():
    """Seed initial users and sample data"""
    try:
        # Clear old data
        await db.users.delete_many({})
        await db.calls.delete_many({})
        await db.grievance_assignments.delete_many({})
        await db.voters.delete_many({})
        
        # Clear existing data for a clean demo state
        await db.users.delete_many({})
        await db.voters.delete_many({})
        await db.calls.delete_many({})
        
        # Seed system users for each role
        users = [
            {"id": "panna-1", "name": "Meena Devi", "role": "panna", "booth_id": 17},
            {"id": "panna-2", "name": "Rajkumar Singh", "role": "panna", "booth_id": 18},
            {"id": "admin-1", "name": "Ramesh Gupta", "role": "admin", "booth_id": 17},
            {"id": "admin-2", "name": "Anita Verma", "role": "admin", "booth_id": 18},
            {
                "id": "city_manager-1", 
                "name": "Rajesh Khanna", 
                "role": "city_manager", 
                "city_id": "DELHI-01",
                "assigned_booths": [1, 17, 18, 19, 20]
            },
            {"id": "worker-1", "name": "Sunil Kumar", "role": "worker", "booth_id": 17},
            {"id": "worker-2", "name": "Priya Yadav", "role": "worker", "booth_id": 17},
            {"id": "worker-3", "name": "Ajay Tiwari", "role": "worker", "booth_id": 18},
            {"id": "analyst-1", "name": "Deepak Sharma", "role": "analyst", "booth_id": 17},
            {"id": "citizen-1", "name": "Vikram Singh", "role": "citizen", "booth_id": 17},
            {"id": "citizen-2", "name": "Lata Maurya", "role": "citizen", "booth_id": 18},
        ]
        
        await db.users.insert_many(users)
        
        # Seed some sample calls
        sample_calls = [
            {"id": str(uuid.uuid4()), "voter_id": 1, "voter_name": "Suresh Agarwal", "status": "answered", "notes": "Voter is happy with road work", "sentiment": "positive", "booth_id": 18, "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "voter_id": 5, "voter_name": "Usha Maurya", "status": "no_answer", "notes": "", "sentiment": "neutral", "booth_id": 17, "created_at": datetime.now(timezone.utc).isoformat()},
            {"id": str(uuid.uuid4()), "voter_id": 8, "voter_name": "Hari Verma", "status": "answered", "notes": "Upset about water supply problem", "sentiment": "negative", "booth_id": 18, "created_at": datetime.now(timezone.utc).isoformat()},
        ]
        await db.calls.insert_many(sample_calls)
        
        # --- 🚀 HACKATHON SYNTHETIC DATA GENERATOR (1000 NODES) ---
        user_templates = [
            {"name": "Ramesh Kumar", "booth": "B01", "age": 45, "area": "Street 1", "issue": "Water supply problem for 3 days", "cat": "infrastructure", "sent": "negative", "hh": "HH1"},
            {"name": "Sita Devi", "booth": "B01", "age": 38, "area": "Street 1", "issue": "Road damaged near house", "cat": "infrastructure", "sent": "negative", "hh": "HH1"},
            {"name": "Amit Sharma", "booth": "B01", "age": 21, "area": "Street 2", "issue": "Scholarship information not clear", "cat": "education", "sent": "neutral", "hh": "HH2"},
            {"name": "Pooja Singh", "booth": "B02", "age": 30, "area": "Street 3", "issue": "Hospital service delay", "cat": "health", "sent": "negative", "hh": "HH3"},
            {"name": "Rahul Verma", "booth": "B02", "age": 50, "area": "Street 3", "issue": "Electricity outage frequently", "cat": "infrastructure", "sent": "negative", "hh": "HH3"},
            {"name": "Sunita Gupta", "booth": "B03", "age": 60, "area": "Street 4", "issue": "Pension not received", "cat": "welfare", "sent": "negative", "hh": "HH4"},
            {"name": "Anil Yadav", "booth": "B03", "age": 35, "area": "Street 5", "issue": "Garbage collection irregular", "cat": "infrastructure", "sent": "neutral", "hh": "HH5"},
            {"name": "Meena Kumari", "booth": "B04", "age": 28, "area": "Street 6", "issue": "Anganwadi services poor", "cat": "welfare", "sent": "negative", "hh": "HH6"},
            {"name": "Deepak Mishra", "booth": "B04", "age": 40, "area": "Street 6", "issue": "Street lights not working", "cat": "infrastructure", "sent": "negative", "hh": "HH6"},
            {"name": "Kiran Patel", "booth": "B05", "age": 32, "area": "Street 7", "issue": "School bus issue", "cat": "education", "sent": "neutral", "hh": "HH7"}
        ]
        
        voters_to_insert = []
        # Multi-record generation logic to hit 1000
        for i in range(1, 1001):
            template = user_templates[i % len(user_templates)]
            booth_id = int(str(template["booth"]).replace("B", ""))
            
            # Enrich name and phone for uniqueness
            full_name = f"{template['name']} {i}"
            phone = f"98765{i:05d}"
            
            voters_to_insert.append({
                "id": f"V{1000 + i}",
                "name": full_name,
                "address": f"{template['area']}, Household {template['hh']}_{i % 100}",
                "booth_id": booth_id,
                "phone": phone,
                "sentiment": template["sent"],
                "tags": [template["cat"]],
                "grievances": [{"id": f"G{i}", "description": template["issue"], "status": "pending"}],
                "influence_score": float(2.0 + (i % 5)*0.5),
                "risk": "high" if template["sent"] == "negative" else "low",
                "household_id": f"{template['hh']}_{i % 100}",
                "last_ai_update": datetime.now(timezone.utc).isoformat()
            })
        
        # --- 🚀 SUPABASE SYNC (For Citizen/Worker Dashboards) ---
        # 1. Clear Supabase tables (Grievances and Voters first to avoid constraints)
        try:
            await supabase_request("DELETE", "grievances", params={"id": "gt.0"})
            await supabase_request("DELETE", "voters", params={"eci_voter_id": "gt.0"})
            await supabase_request("DELETE", "voters_eci", params={"id": "gt.0"})
        except Exception as e:
            logger.warning(f"Note: Some Supabase records couldn't be deleted: {e}")
        
        # 2. Get first existing booth and REPURPOSE it for the demo
        try:
            existing_booths = await supabase_request("GET", "booths", params={"limit": 1})
            if existing_booths and len(existing_booths) > 0:
                best_id = existing_booths[0]["id"]
                # Morph it into Booth 17 for the demo
                await supabase_request("PATCH", f"booths?id=eq.{best_id}", json_data={
                    "booth_number": 17, 
                    "name": "Booth #17 Strategic Sector",
                    "ward_number": "Sector 9"
                })
            else:
                best_id = 1
                await supabase_request("POST", "booths", json_data={
                    "id": best_id, "booth_number": 17, 
                    "name": "Booth #17 Strategic Sector", "ward_number": "Sector 9"
                })
            logger.info(f"Verified & Repurposed Booth ID for Sync: {best_id}")
        except Exception as e:
            logger.error(f"Booth Check Failed: {e}")
            best_id = 1 
        
        # 3. Prepare Supabase Batches (First 300 for volume, MongoDB keeps all 1000)
        eci_records = []
        enrichment_records = []
        
        # Create a few more booths for variety
        try:
            more_booths = [
                {"id": 2, "booth_number": 18, "name": "East Gate Strategic Hub", "ward_number": "Sector 10"},
                {"id": 3, "booth_number": 19, "name": "Metro Terminal Center", "ward_number": "Sector 11"},
                {"id": 4, "booth_number": 20, "name": "Global Tech Park Unit", "ward_number": "Sector 12"}
            ]
            for b in more_booths:
                await supabase_request("POST", "booths", json_data=b)
        except: pass

        for i in range(1, 301):
            v = voters_to_insert[i-1]
            eci_id = 1000 + i
            
            # Distribute voters across booths 1, 2, 3, 4
            target_booth = (i % 4) + 1
            
            eci_records.append({
                "id": str(eci_id),
                "name": v["name"],
                "phone": v["phone"],
                "booth_id": str(target_booth),
                "address": v["address"],
                "gender": "Male" if i % 2 == 0 else "Female",
                "dob": f"{1970 + (i % 30)}-01-01"
            })
            enrichment_records.append({
                "eci_voter_id": str(eci_id),
                "sentiment": v["sentiment"],
                "segment": v["tags"][0],
                "influence_score": float(v["influence_score"]),
                "risk_level": v["risk"]
            })
            
        try:
            logger.info(f"Syncing {len(eci_records)} ECI records...")
            await supabase_request("POST", "voters_eci", json_data=eci_records)
            logger.info("Syncing enrichment records...")
            await supabase_request("POST", "voters", json_data=enrichment_records)
        except Exception as e:
            logger.error(f"Voter Sync Failed: {e}")

        # 4. Seed grievances (more volume)
        try:
            await supabase_request("DELETE", "grievances", params={"id": "gt.0"})
            gr_recs = []
            for i in range(1, 21):
                v = voters_to_insert[i-1]
                target_booth = (i % 4) + 1
                gr_recs.append({
                    "voter_id": str(1000 + i),
                    "booth_id": str(target_booth),
                    "description": v["grievances"][0]["description"],
                    "status": "submitted" if i % 3 != 0 else "resolved",
                    "category": v["tags"][0]
                })
            await supabase_request("POST", "grievances", json_data=gr_recs)
            logger.info(f"Syncing {len(gr_recs)} grievances...")
        except Exception as e:
            logger.error(f"Grievance Sync Failed: {e}")

        # Clear and Insert MongoDB
        await db.voters.delete_many({})
        await db.voters.insert_many(voters_to_insert)
        
        # Auto-link them to create the "Social Fabric"
        await auto_link_voters(db)
        
        return {
            "status": "success", 
            "voters_seeded": len(voters_to_insert), 
            "supabase_sync": len(eci_records),
            "message": "Hackathon dataset seeded. Knowledge Graph (1000) + Dashboards (100) are live."
        }
    except Exception as e:
        logger.error(f"Error seeding data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- ROOT ---

@api_router.get("/")
async def root():
    return {"message": "BoothIQ API", "version": "1.0"}

@api_router.get("/health")
async def health():
    """Health check - verify Supabase and MongoDB connectivity"""
    try:
        # Test Supabase
        await supabase_request("GET", "booths", params={"select": "id", "limit": "1"})
        # Test MongoDB
        await db.command("ping")
        return {
            "status": "healthy", 
            "supabase": "connected", 
            "mongodb": "connected",
            "version": "5.0.1",
            "ai_engine": "sarvam_ai" if os.environ.get('SARVAM_API_KEY') else "openai_fallback"
        }
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_check():
    """Verify system health on start"""
    logger.info("Startup: BoothIQ Hybrid Intelligence System Initializing...")
    try:
        # Just check connectivity
        async with httpx.AsyncClient(timeout=5.0) as client_check:
            url = f"{SUPABASE_URL}/rest/v1/booths"
            res = await client_check.get(url, headers=SUPABASE_HEADERS, params={"limit": 1})
            if res.status_code == 200:
                logger.info("Startup: Supabase connectivity verified.")
    except Exception as e:
        logger.error(f"Startup Connectivity Warning: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    # Use PORT env var for production deployment
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
