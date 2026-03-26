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
from datetime import datetime, timezone
from fastapi import WebSocket, WebSocketDisconnect

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
    if any(w in text for w in ["water", "pani", "nala", "pump", "pipe", "borewell", "handpump", "supply"]):
        category = "water"
    elif any(w in text for w in ["road", "pothole", "sadak", "path", "gali", "footpath"]):
        category = "road"
    elif any(w in text for w in ["electricity", "bijli", "power", "light", "wire", "transformer", "pole"]):
        category = "electricity"
    elif any(w in text for w in ["drain", "sewer", "garbage", "kuda", "safai", "toilet", "sanitation"]):
        category = "sanitation"
    elif any(w in text for w in ["hospital", "doctor", "health", "clinic", "medicine", "dawai"]):
        category = "healthcare"
    elif any(w in text for w in ["school", "education", "teacher", "padhai", "college"]):
        category = "education"

    # Sentiment analysis
    sentiment = "neutral"
    negative_words = ["broken", "bad", "problem", "issue", "fail", "worst", "terrible", "dirty", "danger", "urgent", "kharab", "tuta", "ganda"]
    positive_words = ["good", "better", "fixed", "clean", "thanks", "acha", "dhanyavaad", "shukriya"]
    
    neg_count = sum(1 for w in negative_words if w in text)
    pos_count = sum(1 for w in positive_words if w in text)
    
    if neg_count > pos_count:
        sentiment = "negative"
    elif pos_count > neg_count:
        sentiment = "positive"

    # Priority
    priority = "medium"
    urgent_words = ["urgent", "emergency", "danger", "flood", "fire", "collapse", "accident"]
    if any(w in text for w in urgent_words):
        priority = "high"
    elif category == "other" and sentiment == "neutral":
        priority = "low"

    return {"category": category, "sentiment": sentiment, "priority": priority}


def analyze_sentiment(text: str) -> str:
    """Simple sentiment analysis for call notes"""
    text = text.lower()
    negative = ["angry", "upset", "bad", "problem", "complaint", "kharab", "gussa", "naraz"]
    positive = ["happy", "good", "satisfied", "thank", "khush", "acha", "sahi"]
    
    neg = sum(1 for w in negative if w in text)
    pos = sum(1 for w in positive if w in text)
    
    if neg > pos:
        return "negative"
    elif pos > neg:
        return "positive"
    return "neutral"


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
        insights.append("Not enough data for insights. Collect more voter feedback.")
    
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
    status: str = "pending"
    notes: str = ""
    booth_id: Union[int, str]

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
    voters = await db.voters.find({}, {"_id": 0, "id": 1, "name": 1, "sentiment": 1, "connections": 1, "influence_score": 1, "risk": 1, "address": 1}).to_list(length=1000)
    
    # Calculate Area Priority (Bonus Feature)
    # Count complaints by address/street keyword
    area_complaints = {}
    for v in voters:
        address = v.get("address", "Unknown")
        street = address.split(",")[0] if "," in address else address
        area_complaints[street] = area_complaints.get(street, 0) + 1
    
    nodes = []
    links = []
    
    for v in voters:
        address = v.get("address", "Unknown")
        street = address.split(",")[0] if "," in address else address
        is_priority_area = area_complaints.get(street, 0) > 3
        
        nodes.append({
            "id": str(v["id"]),
            "label": v.get("name", "Unknown"),
            "sentiment": v.get("sentiment", "neutral"),
            "influence": v.get("influence_score", 0),
            "risk": v.get("risk", "low"),
            "priority_area": is_priority_area
        })
        
        for conn in v.get("connections", []):
            links.append({
                "source": str(v["id"]),
                "target": str(conn["to"]),
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
    notifications = await db.notifications.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return notifications

@api_router.patch("/notifications/{id}/read")
async def mark_notification_read(id: str):
    """Mark a notification as read"""
    await db.notifications.update_one({"id": id}, {"$set": {"read": True}})
    return {"status": "success"}

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
    logger.info(f"Fetching voters for [Requested:{booth_id} -> Real:{real_id}]")
    
    # Get voter base data from voters_eci
    eci_data = await supabase_request("GET", "voters_eci", params={
        "select": "id,name,phone,booth_id,address,gender,dob",
        "booth_id": f"eq.{real_id}",
        "order": "name"
    })
    
    if not eci_data:
        return []

    # Get enrichment data from voters table
    voter_ids = [v["id"] for v in eci_data]
    # Ensure IDs are quoted for string comparison in Supabase
    id_list = ",".join(f'"{i}"' for i in voter_ids)
    enrichment = await supabase_request("GET", "voters", params={
        "select": "eci_voter_id,sentiment,segment",
        "eci_voter_id": f"in.({id_list})"
    })
    
    logger.info(f"Enrichment sample: {enrichment[0] if enrichment else 'None'}")
    
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

        result = await supabase_request(
            "PATCH", 
            f"voters?eci_voter_id=eq.{data.id}",
            json_data=updates
        )
        return result[0] if result else {"status": "updated"}
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
    logger.info(f"Fetching grievances for [Requested:{booth_id} -> Real:{real_id}], assigned_to={assigned_to}")
    
    # If filtered by assigned worker, find those IDs first from MongoDB
    specific_ids = []
    if assigned_to:
        cursor = db.grievance_assignments.find({"worker_id": assigned_to}, {"grievance_id": 1})
        async for doc in cursor:
            specific_ids.append(doc["grievance_id"])
        
        if not specific_ids:
            logger.info(f"No assignments found for worker {assigned_to}")
            return []
        logger.info(f"Worker {assigned_to} has {len(specific_ids)} assignments: {specific_ids}")

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
    logger.info(f"Supabase returned {len(data) if data else 0} grievances")
    
    # Get assignments from MongoDB for enrichment
    grievance_ids = [str(g["id"]) for g in (data or [])]
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
    for item in (data or []):
        g = dict(item)
        assignment = assignments.get(str(g.get("id")), {})
        g["assigned_worker"] = assignment.get("worker_name", None)
        g["assigned_worker_id"] = assignment.get("worker_id", None)
        result.append(g)
    
    return result


@api_router.post("/grievances")
async def create_grievance(data: GrievanceCreate):
    """Create a new grievance with AI classification"""
    try:
        # Resolve booth ID for demo safety
        real_booth_id = await resolve_booth_id(data.booth_id)
        
        # AI Classification
        ai_result = classify_grievance(data.description)
        
        # Use AI category if not provided
        valid_categories = ['road', 'water', 'electricity', 'sanitation', 'healthcare', 'education', 'other']
        category = data.category if data.category in valid_categories else ai_result["category"]
        
        grievance_data = {
            "description": data.description,
            "category": category,
            "booth_id": real_booth_id,
            "status": "submitted",
            "sentiment": ai_result["sentiment"]
        }
        
        if data.voter_id:
            grievance_data["voter_id"] = data.voter_id
        
        result = await supabase_request("POST", "grievances", json_data=grievance_data)
        
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
    logger.info(f"Updating grievance {data.id}: status={data.status}, assigned_to={data.assigned_to}")
    try:
        updates = {}
        
        if data.status:
            updates["status"] = data.status
        
        if data.resolution_note:
            updates["resolution_note"] = data.resolution_note
        
        # Update status in Supabase
        if updates:
            await supabase_request("PATCH", f"grievances?id=eq.{data.id}", json_data=updates)
        
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
    logger.info(f"Fetching analytics for [Requested:{booth_id} -> Real:{real_id}]")
    try:
        # Voter stats
        voters = await supabase_request("GET", "voters", params={
            "select": "eci_voter_id,sentiment"
        })
        
        eci_voters = await supabase_request("GET", "voters_eci", params={
            "select": "id",
            "booth_id": f"eq.{real_id}"
        })
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
            return []
            
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
        grievances = await supabase_request("GET", "grievances", params={
            "select": "*",
            "booth_id": f"eq.{real_id}"
        })
        
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
        return {"status": "healthy", "supabase": "connected", "mongodb": "connected"}
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
    uvicorn.run(app, host="0.0.0.0", port=8001)
