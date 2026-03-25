from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import httpx
from pathlib import Path
from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection (for users and calls)
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Supabase config
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

async def supabase_request(method: str, endpoint: str, params: dict = None, json_data: dict = None):
    """Make a request to Supabase REST API"""
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    async with httpx.AsyncClient(timeout=15.0) as client_http:
        response = await client_http.request(
            method=method,
            url=url,
            headers=SUPABASE_HEADERS,
            params=params,
            json=json_data
        )
        if response.status_code >= 400:
            logger.error(f"Supabase error: {response.status_code} {response.text}")
            raise HTTPException(status_code=response.status_code, detail=response.text)
        
        if response.text:
            return response.json()
        return None


# --- MODELS ---

class GrievanceCreate(BaseModel):
    voter_id: Optional[int] = None
    voter_name: Optional[str] = None
    voter_phone: Optional[str] = None
    category: Optional[str] = None
    description: str
    booth_id: int

class GrievanceUpdate(BaseModel):
    id: str
    status: Optional[str] = None
    assigned_worker: Optional[str] = None
    resolution_note: Optional[str] = None

class VoterUpdate(BaseModel):
    id: str
    sentiment: Optional[str] = None

class CallCreate(BaseModel):
    voter_id: int
    voter_name: str
    status: str = "pending"
    notes: str = ""
    booth_id: int


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
async def get_voters(booth_id: int):
    """Get voters by booth_id - combines voters_eci (name/phone) with voters (sentiment)"""
    # Get voter base data from voters_eci
    eci_data = await supabase_request("GET", "voters_eci", params={
        "select": "id,name,phone,booth_id,address,gender,dob",
        "booth_id": f"eq.{booth_id}",
        "order": "name"
    })
    
    if not eci_data:
        return []

    # Get enrichment data from voters table
    voter_ids = [v["id"] for v in eci_data]
    enrichment = await supabase_request("GET", "voters", params={
        "select": "eci_voter_id,sentiment,segment",
        "eci_voter_id": f"in.({','.join(str(i) for i in voter_ids)})"
    })
    
    enrichment_map = {v["eci_voter_id"]: v for v in (enrichment or [])}

    # Combine data
    result = []
    for v in eci_data:
        enrich = enrichment_map.get(v["id"], {})
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
async def get_calls(booth_id: int):
    """Get call history for a booth"""
    calls = await db.calls.find(
        {"booth_id": booth_id}, 
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return calls


@api_router.post("/calls")
async def create_call(data: CallCreate):
    """Log a call"""
    try:
        sentiment = analyze_sentiment(data.notes) if data.notes else "neutral"
        
        call_doc = {
            "id": str(uuid.uuid4()),
            "voter_id": data.voter_id,
            "voter_name": data.voter_name,
            "status": data.status,
            "notes": data.notes,
            "sentiment": sentiment,
            "booth_id": data.booth_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.calls.insert_one(call_doc)
        
        # Update voter sentiment in Supabase
        if sentiment != "neutral":
            try:
                await supabase_request(
                    "PATCH",
                    f"voters?eci_voter_id=eq.{data.voter_id}",
                    json_data={"sentiment": sentiment}
                )
            except Exception:
                pass
        
        del call_doc["_id"]
        return call_doc
    except Exception as e:
        logger.error(f"Error creating call: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- ROUTES: GRIEVANCES ---

@api_router.get("/grievances")
async def get_grievances(booth_id: Optional[int] = None, assigned_to: Optional[str] = None, voter_id: Optional[int] = None):
    """Get grievances with optional filters"""
    params = {
        "select": "*",
        "order": "created_at.desc"
    }
    
    if booth_id:
        params["booth_id"] = f"eq.{booth_id}"
    if voter_id:
        params["voter_id"] = f"eq.{voter_id}"
    
    data = await supabase_request("GET", "grievances", params=params)
    
    # Get assignments from MongoDB
    grievance_ids = [g["id"] for g in (data or [])]
    assignments = {}
    if grievance_ids:
        cursor = db.grievance_assignments.find(
            {"grievance_id": {"$in": grievance_ids}},
            {"_id": 0}
        )
        async for doc in cursor:
            assignments[doc["grievance_id"]] = doc
    
    # Merge assignment data with grievances
    result = []
    for item in (data or []):
        g = dict(item)  # Ensure it is a fresh mutable dict
        assignment = assignments.get(g.get("id"), {})
        g["assigned_worker"] = assignment.get("worker_name", None)
        g["assigned_worker_id"] = assignment.get("worker_id", None)
        result.append(g)
    
    # Filter by assigned worker if requested
    if assigned_to:
        result = [g for g in result if g.get("assigned_worker_id") == assigned_to]
    
    return result


@api_router.post("/grievances")
async def create_grievance(data: GrievanceCreate):
    """Create a new grievance with AI classification"""
    try:
        # AI Classification
        ai_result = classify_grievance(data.description)
        
        # Use AI category if not provided
        valid_categories = ['road', 'water', 'electricity', 'sanitation', 'healthcare', 'education', 'other']
        category = data.category if data.category in valid_categories else ai_result["category"]
        
        grievance_data = {
            "description": data.description,
            "category": category,
            "booth_id": data.booth_id,
            "status": "submitted",
            "sentiment": ai_result["sentiment"]
        }
        
        if data.voter_id:
            grievance_data["voter_id"] = data.voter_id
        if data.voter_name:
            grievance_data["title"] = f"Issue by {data.voter_name}"
        
        result = await supabase_request("POST", "grievances", json_data=grievance_data)
        
        if result:
            grievance = result[0]
            grievance["ai_category"] = ai_result["category"]
            grievance["ai_sentiment"] = ai_result["sentiment"]
            grievance["ai_priority"] = ai_result["priority"]
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
    try:
        updates = {}
        
        if data.status:
            updates["status"] = data.status
            if data.status == "resolved":
                updates["resolved_at"] = datetime.now(timezone.utc).isoformat()
        
        if data.resolution_note:
            updates["resolution_note"] = data.resolution_note
        
        # Update status in Supabase
        if updates:
            updates["updated_at"] = datetime.now(timezone.utc).isoformat()
            await supabase_request("PATCH", f"grievances?id=eq.{data.id}", json_data=updates)
        
        # Handle worker assignment in MongoDB
        if data.assigned_worker:
            # Get worker details from MongoDB
            worker = await db.users.find_one({"id": data.assigned_worker}, {"_id": 0})
            worker_name = worker["name"] if worker else data.assigned_worker
            
            await db.grievance_assignments.update_one(
                {"grievance_id": data.id},
                {"$set": {
                    "grievance_id": data.id,
                    "worker_id": data.assigned_worker,
                    "worker_name": worker_name,
                    "assigned_at": datetime.now(timezone.utc).isoformat()
                }},
                upsert=True
            )
            
            # Update status to assigned if not already
            if not data.status:
                await supabase_request("PATCH", f"grievances?id=eq.{data.id}", json_data={
                    "status": "assigned",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                })
        
        return {"status": "updated", "id": data.id}
    except Exception as e:
        logger.error(f"Error updating grievance: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- ROUTES: ANALYTICS ---

@api_router.get("/analytics")
async def get_analytics(booth_id: int):
    """Get real analytics from database"""
    try:
        # Voter stats
        voters = await supabase_request("GET", "voters", params={
            "select": "eci_voter_id,sentiment"
        })
        
        eci_voters = await supabase_request("GET", "voters_eci", params={
            "select": "id",
            "booth_id": f"eq.{booth_id}"
        })
        booth_voter_ids = {v["id"] for v in (eci_voters or [])}
        
        total_voters = len(booth_voter_ids)
        sentiment_dist = {"positive": 0, "neutral": 0, "negative": 0}
        for v in (voters or []):
            if v["eci_voter_id"] in booth_voter_ids:
                s = v.get("sentiment", "neutral") or "neutral"
                sentiment_dist[s] = sentiment_dist.get(s, 0) + 1
        
        # Grievance stats
        grievances = await supabase_request("GET", "grievances", params={
            "select": "id,status,category,booth_id",
            "booth_id": f"eq.{booth_id}"
        })
        
        total_issues = len(grievances or [])
        resolved_issues = sum(1 for g in (grievances or []) if g["status"] == "resolved")
        
        # Category breakdown
        category_breakdown = {}
        for g in (grievances or []):
            cat = g.get("category", "other")
            category_breakdown[cat] = category_breakdown.get(cat, 0) + 1
        
        # Call stats from MongoDB
        call_count = await db.calls.count_documents({"booth_id": booth_id})
        
        stats = {
            "booth_id": booth_id,
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


# --- ROUTES: SEED DATA ---

@api_router.post("/seed")
async def seed_data():
    """Seed initial users and sample data"""
    try:
        # Clear old data
        await db.users.delete_many({})
        await db.calls.delete_many({})
        await db.grievance_assignments.delete_many({})
        
        # Seed users for each role
        users = [
            {"id": "panna-1", "name": "Meena Devi", "role": "panna", "booth_id": 17},
            {"id": "panna-2", "name": "Rajkumar Singh", "role": "panna", "booth_id": 18},
            {"id": "admin-1", "name": "Ramesh Gupta", "role": "admin", "booth_id": 17},
            {"id": "admin-2", "name": "Anita Verma", "role": "admin", "booth_id": 18},
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
        
        return {"status": "success", "users_created": len(users), "calls_created": len(sample_calls)}
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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
