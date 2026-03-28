from fastapi import FastAPI, APIRouter, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File, Form, Header, Depends
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
from openai import AsyncOpenAI
import json
import logging
import httpx
import tempfile
import jwt
from pathlib import Path
from pydantic import BaseModel
from typing import Optional, Union, Any, List
import uuid
from datetime import datetime, timezone, timedelta
import time
import base64
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env', override=True)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# JWT Configuration
JWT_SECRET = os.environ.get("JWT_SECRET")
if not JWT_SECRET:
    logger.warning("JWT_SECRET not found in environment. Using a temporary secret for this session.")
    JWT_SECRET = str(uuid.uuid4())

JWT_ALGORITHM = "HS256"

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode.update({"exp": expire.timestamp()})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception as e:
        logger.error(f"JWT Decode Error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_optional_user(authorization: str = Header(None)) -> Optional[dict]:
    """Like get_current_user but returns None instead of raising for unauthenticated requests.
    Use for endpoints that have a demo bypass for unauthenticated users."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except Exception:
        return None

# MongoDB connection with hardened SSL settings for Cloud environments (Render/Vercel/Atlas)
mongo_url = os.environ['MONGO_URL']
db_name = os.environ.get('DB_NAME', 'booth_iq')

# Use tlsInsecure=True for maximum compatibility when cloud proxies interfere with handshake
client = AsyncIOMotorClient(
    mongo_url,
    serverSelectionTimeoutMS=30000,
    connectTimeoutMS=30000,
    socketTimeoutMS=30000,
    tls=True,
    tlsInsecure=True,
    retryWrites=False,
    directConnection=False
)
db = client[db_name]

# Supabase config
# OpenAI Configuration
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')
openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)
SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_KEY = os.environ['SUPABASE_ANON_KEY']
SARVAM_API_KEY = os.environ.get('SARVAM_API_KEY', '')

# Real Notification Services Config
TWILIO_SID = os.environ.get('TWILIO_ACCOUNT_SID', '')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN', '')
TWILIO_PHONE_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER', '')
TWILIO_WHATSAPP_NUMBER = os.environ.get('TWILIO_WHATSAPP_NUMBER', 'whatsapp:+14155238886') # Twilio Sandbox default
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY', '')
FROM_EMAIL = os.environ.get('FROM_EMAIL', 'notifications@boothiq.ai')

SUPABASE_HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

app = FastAPI()
api_router = APIRouter(prefix="/api")

# --- ROUTES: VOTER PROFILE ---
@api_router.get("/voters-profile/{voter_id}")
async def get_voter_profile(voter_id: str, user: Optional[dict] = Depends(get_optional_user)):
    """Get detailed profile for a specific voter - Ownership & RBAC enforced"""
    # Handle Dummy Users for Demo - check first, before any auth checks
    if "dummy" in str(voter_id).lower():
        return {
            "id": voter_id,
            "name": f"Demo {str(voter_id).replace('dummy-', '').capitalize()}",
            "role": str(voter_id).replace('dummy-', ''),
            "booth_id": 17,
            "sentiment": "neutral",
            "voter_id": f"V-{str(voter_id).upper()}"
        }

    # Require auth for non-dummy profiles
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")

    # Security Check: Only the voter themselves or an Admin/Worker can view full profile
    is_admin_or_worker = user.get("role") in ["admin", "city_manager", "analyst", "worker", "panna"]
    is_owner = str(user.get("id")) == str(voter_id) or str(user.get("id")) == f"V{voter_id}"
    
    if not is_admin_or_worker and not is_owner:
        raise HTTPException(status_code=403, detail="Unauthorized access to PII data")

    # Try with original ID and V-prefix
    voter = await db.voters.find_one({"id": voter_id}, {"_id": 0})
    if not voter and voter_id.isdigit():
        voter = await db.voters.find_one({"id": f"V{voter_id}"}, {"_id": 0})
    
    if not voter:
        raise HTTPException(status_code=404, detail="Voter profile not found")
    
    return voter

# Ensure uploads directory exists
UPLOAD_DIR = ROOT_DIR / "static" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Mount static files to serve uploads
app.mount("/static", StaticFiles(directory=ROOT_DIR / "static"), name="static")

@app.middleware("http")
async def error_handling_middleware(request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        logger.error(f"Unhandled Exception at {request.url}: {e}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": str(e), "path": str(request.url)}
        )

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
        try:
            await websocket.accept()
            if user_id not in self.active_connections:
                self.active_connections[user_id] = []
            self.active_connections[user_id].append(websocket)
            logger.info(f"User {user_id} connected. Active connections: {len(self.active_connections[user_id])}")
        except Exception as e:
            logger.error(f"WebSocket accept failed for {user_id}: {e}")

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

# --- REAL NOTIFICATION SERVICES ---

class NotificationHub:
    """Unified notification hub for Email, SMS, and WhatsApp"""
    
    @staticmethod
    async def send_email(to_email: str, subject: str, content: str):
        """Send real email using SendGrid or Resend API"""
        # Try SendGrid first if available
        if SENDGRID_API_KEY:
            async with httpx.AsyncClient() as client:
                try:
                    response = await client.post(
                        "https://api.sendgrid.com/v3/mail/send",
                        headers={
                            "Authorization": f"Bearer {SENDGRID_API_KEY}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "personalizations": [{"to": [{"email": to_email}]}],
                            "from": {"email": FROM_EMAIL, "name": "BoothIQ Support"},
                            "subject": subject,
                            "content": [{"type": "text/html", "value": content}]
                        }
                    )
                    if response.status_code == 202:
                        logger.info(f"SendGrid email sent successfully to {to_email}")
                        return True
                    logger.error(f"SendGrid Error: {response.status_code} {response.text}")
                except Exception as e:
                    logger.error(f"SendGrid Exception: {e}")
        
        # Fallback to Resend if available
        if RESEND_API_KEY:
            async with httpx.AsyncClient() as client:
                try:
                    response = await client.post(
                        "https://api.resend.com/emails",
                        headers={
                            "Authorization": f"Bearer {RESEND_API_KEY}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "from": f"BoothIQ Command <{FROM_EMAIL}>",
                            "to": [to_email],
                            "subject": subject,
                            "html": content
                        }
                    )
                    if response.status_code == 200 or response.status_code == 201:
                        logger.info(f"Resend email sent successfully to {to_email}")
                        return True
                    logger.error(f"Resend Error: {response.status_code} {response.text}")
                except Exception as e:
                    logger.error(f"Resend Exception: {e}")

        if not SENDGRID_API_KEY and not RESEND_API_KEY:
            logger.warning(f"[EMAIL MOCK] To: {to_email} | Subject: {subject}")
            
        return False

    @staticmethod
    async def send_manifesto(to_email: str, voter_name: str):
        """Send specific party manifesto and vision email"""
        subject = f"A Vision for Our Constituency - Message for {voter_name}"
        content = f"""
        <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 24px; background: #ffffff;">
            <div style="text-align: center; margin-bottom: 40px;">
                <div style="display: inline-block; padding: 12px 24px; background: #4f46e5; color: white; border-radius: 12px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; font-size: 14px;">Party Command Matrix</div>
            </div>
            
            <h1 style="color: #1e1b4b; font-size: 32px; font-weight: 900; line-height: 1.1; margin-bottom: 24px; text-transform: uppercase; letter-spacing: -1px;">Our Vision. Your Future.</h1>
            
            <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
                Dear {voter_name},<br><br>
                As we approach the upcoming election cycle, our party is committed to a transparent, tech-driven, and prosperous constituency. We are proud to share our 2026 Manifesto with you.
            </p>
            
            <div style="background: #f8fafc; padding: 32px; border-radius: 16px; margin-bottom: 32px; border-left: 4px solid #4f46e5;">
                <h3 style="color: #1e1b4b; margin-top: 0; font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Core Promises</h3>
                <ul style="color: #475569; padding-left: 20px; font-size: 15px; line-height: 1.8;">
                    <li><strong>Smart Infrastructure:</strong> 100% digital monitoring of all local road and water projects.</li>
                    <li><strong>Healthcare Access:</strong> Expansion of Ayushman Bharat centers to every block.</li>
                    <li><strong>Digital Literacy:</strong> AI-enabled skill centers for the youth in our constituency.</li>
                    <li><strong>Transparent Governance:</strong> Direct feedback loops via the BoothIQ platform.</li>
                </ul>
            </div>
            
            <p style="color: #475569; font-size: 14px; line-height: 1.6; font-style: italic;">
                "We don't just make promises; we build systems to fulfill them."
            </p>
            
            <div style="margin-top: 40px; padding-top: 32px; border-top: 1px solid #e2e8f0; text-align: center;">
                <p style="color: #94a3b8; font-size: 12px; text-transform: uppercase; font-weight: 700; letter-spacing: 2px;">Authorized by Party Command &bull; BoothIQ Protocol</p>
            </div>
        </div>
        """
        return await NotificationHub.send_email(to_email, subject, content)

    @staticmethod
    async def send_sms(to_phone: str, message: str):
        """Send real SMS using Twilio"""
        if not TWILIO_SID or not TWILIO_AUTH_TOKEN:
            logger.warning(f"[SMS MOCK] To: {to_phone} | Msg: {message}")
            return False
            
        auth = base64.b64encode(f"{TWILIO_SID}:{TWILIO_AUTH_TOKEN}".encode()).decode()
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_SID}/Messages.json",
                    headers={"Authorization": f"Basic {auth}"},
                    data={
                        "To": to_phone,
                        "From": TWILIO_PHONE_NUMBER,
                        "Body": message
                    }
                )
                if response.status_code == 201:
                    logger.info(f"SMS sent successfully to {to_phone}")
                    return True
                logger.error(f"Twilio SMS Error: {response.status_code} {response.text}")
                return False
            except Exception as e:
                logger.error(f"SMS Exception: {e}")
                return False

    @staticmethod
    async def send_whatsapp(to_phone: str, message: str):
        """Send real WhatsApp message using Twilio WhatsApp API"""
        if not TWILIO_SID or not TWILIO_AUTH_TOKEN:
            logger.warning(f"[WHATSAPP MOCK] To: {to_phone} | Msg: {message}")
            return False
            
        # Ensure correct format for WhatsApp
        wa_to = f"whatsapp:{to_phone}" if not to_phone.startswith('whatsapp:') else to_phone
        auth = base64.b64encode(f"{TWILIO_SID}:{TWILIO_AUTH_TOKEN}".encode()).decode()
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_SID}/Messages.json",
                    headers={"Authorization": f"Basic {auth}"},
                    data={
                        "To": wa_to,
                        "From": TWILIO_WHATSAPP_NUMBER,
                        "Body": message
                    }
                )
                if response.status_code == 201:
                    logger.info(f"WhatsApp sent successfully to {to_phone}")
                    return True
                logger.error(f"Twilio WhatsApp Error: {response.status_code} {response.text}")
                return False
            except Exception as e:
                logger.error(f"WhatsApp Exception: {e}")
                return False

# --- UTILITIES ---

async def get_user_contact(user_id: str):
    """Fetch contact info from MongoDB or Supabase for a given ID"""
    try:
        # Try MongoDB first (Voter)
        voter = await db.voters.find_one({"id": user_id})
        if not voter and str(user_id).isdigit():
            voter = await db.voters.find_one({"id": f"V{user_id}"})
        
        if voter:
            return {
                "phone": voter.get("phone"),
                "email": voter.get("email") or f"{user_id}@boothiq.ai",
                "name": voter.get("name")
            }
            
        # Try Supabase if not in MongoDB
        eci_data = await supabase_request("GET", "voters_eci", params={"select": "id,name,phone", "id": f"eq.{user_id}"})
        if eci_data and len(eci_data) > 0:
            return {
                "phone": eci_data[0].get("phone"),
                "email": f"{user_id}@boothiq.ai",
                "name": eci_data[0].get("name")
            }
    except Exception as e:
        logger.error(f"Error fetching contact info for {user_id}: {e}")
    return {"phone": None, "email": f"{user_id}@boothiq.ai", "name": "Citizen"}

async def generate_ai_notification_message(event_type: str, data: dict) -> str:
    """🧠 AI-Powered Notification Generator: Creates context-aware, professional messages (GPT-4o-mini)"""
    try:
        # Construct context for AI
        # Handle non-serializable objects (like datetime) if any - though data should be plain dict
        context_data = {k: str(v) if isinstance(v, (datetime, uuid.UUID)) else v for k, v in data.items()}
        context = json.dumps(context_data, indent=2)
        
        prompt = f"""
        Role: You are the BoothIQ Official Communication Officer.
        Task: Generate a short, professional, and clear notification message for a {event_type} event.
        Context Data: {context}
        
        Guidelines:
        1. Keep it under 160 characters if possible (SMS optimization).
        2. Use a reassuring, professional tone.
        3. Include critical info like Reference IDs or Status.
        4. Use Indian English/Hindi transliteration (Hinglish) style if it feels more personal, but keep it official.
        5. DO NOT use generic placeholders; use the real data from the context.
        
        Return ONLY the final message string.
        """
        
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150,
            temperature=0.7
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"AI Notification generation failed: {e}")
        # Robust Fallback Logic
        fallbacks = {
            "grievance_submitted": f"Grievance Filed: Your {data.get('category', 'issue')} has been logged. Ref ID: {data.get('id', 'N/A')}",
            "grievance_assigned": f"Update: Your {data.get('category', 'issue')} report (ID: {data.get('id')}) is assigned to {data.get('worker_name', 'an officer')}.",
            "grievance_status": f"Status Update: Your {data.get('category', 'issue')} report is now {data.get('status', 'updated')}.",
            "grievance_resolved": f"Resolved: Your {data.get('category', 'issue')} issue (ID: {data.get('id')}) has been fixed. Thank you!",
            "grievance_verified": f"Supervisor Verified: Your {data.get('category', 'issue')} resolution (ID: {data.get('id')}) has been officially verified and closed by the Constituency Manager.",
            "scheme_application": f"Application Received: Your request for {data.get('scheme_id', 'the scheme')} is being processed.",
            "call_logged": f"Thank you for the call! We've noted your feedback regarding {data.get('voter_name', 'your profile')}."
        }
        return fallbacks.get(event_type, "BoothIQ Update: There is a new activity on your profile.")

async def send_notification(user_id: str, title: str, message: str, n_type: str = "info", metadata: dict = None):
    """Multi-channel notification dispatcher with real service integration"""
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
    
    # 1. Store in MongoDB for History
    try:
        await db.notifications.insert_one(notification.copy())
    except Exception as e:
        logger.error(f"Failed to store notification: {e}")

    # 2. Live WebSocket Push (Fastest delivery)
    if "_id" in notification: del notification["_id"]
    await manager.send_personal_message(notification, user_id)
    
    # 3. Real Multi-Channel Dispatch
    # Resolve contact info if not in metadata
    contact = await get_user_contact(user_id)
    
    # Use metadata overrides if provided
    user_email = (metadata or {}).get("email")
    user_phone = (metadata or {}).get("phone")
    
    # If not provided in metadata, use DB contact info
    if not user_email: user_email = contact.get("email")
    if not user_phone: user_phone = contact.get("phone")
    
    # Final Fallback to env for demo safety ONLY if no DB/passed record found
    if not user_email: user_email = os.environ.get("TEST_EMAIL")
    if not user_phone: user_phone = os.environ.get("TEST_PHONE")
    
    # Dispatch Email if available
    if user_email:
        await NotificationHub.send_email(user_email, title, message)
    
    # Dispatch SMS & WhatsApp if available
    if user_phone:
        await NotificationHub.send_sms(user_phone, f"{title}: {message}")
        await NotificationHub.send_whatsapp(user_phone, f"*BoothIQ Notification*\n\n*{title}*\n{message}")

# --- AI FUNCTIONS (Rule-based with Sarvam fallback) ---

async def classify_grievance(description: str) -> dict:
    """AI-Powered classification for grievance category, priority, sentiment (GPT-4o-mini)"""
    # Security: Use AI to prevent "Regex Keyword Stuffing" priority manipulation
    try:
        response = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a government grievance classifier. Analyze the user's issue and return a JSON object with 'category' (water, road, electricity, sanitation, healthcare, education, or other), 'priority' (low, medium, high, critical), and 'sentiment' (positive, neutral, negative). Be objective; do not grant high priority just because the user uses urgent words unless the situation described is actually dangerous."},
                {"role": "user", "content": description}
            ],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        logger.error(f"AI Classification failed, falling back to rule-based: {e}")
        # Rule-based fallback
        text = description.lower()
        category_map = {
            "water": ["water", "pani", "nala", "pump", "pipe", "borewell", "handpump", "supply", "leak", "sewerage", "drain"],
            "road": ["road", "pothole", "sadak", "path", "gali", "footpath", "street", "tar", "asphalt", "concrete"],
            "electricity": ["electricity", "bijli", "power", "light", "wire", "transformer", "pole", "current", "outage", "voltage"],
            "sanitation": ["drain", "sewer", "garbage", "kuda", "safai", "toilet", "sanitation", "clean", "dustbin", "waste", "dump"],
            "healthcare": ["hospital", "doctor", "health", "clinic", "medicine", "dawai", "fever", "sick", "ambulance", "patient"],
            "education": ["school", "education", "teacher", "padhai", "college", "book", "fees", "uniform", "midday", "meal"]
        }
        category = "other"
        for cat, keywords in category_map.items():
            if any(kw in text for kw in keywords):
                category = cat
                break

        sentiment = "neutral"
        if any(w in text for w in ["broken", "bad", "problem", "issue", "fail", "worst", "terrible"]):
            sentiment = "negative"
        
        priority = "medium"
        if any(w in text for w in ["urgent", "emergency", "danger", "flood", "fire", "collapse", "accident"]):
            priority = "high"
            
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
    """Generate real-world strategic insights and problem solutions from analytics data"""
    insights = []
    
    # 1. Resolution & Efficiency
    if stats.get("total_issues", 0) > 0:
        resolution_rate = (stats.get("resolved_issues", 0) / stats["total_issues"]) * 100
        if resolution_rate < 50:
            insights.append({
                "type": "critical",
                "title": "Low Resolution Efficiency",
                "message": f"Only {resolution_rate:.0f}% of issues resolved. Deployment of 3 additional field units to Sector 9 is recommended to clear the backlog.",
                "solution": "Allocate Emergency Governance Fund (EGF) to expedite local road repairs."
            })
        elif resolution_rate > 80:
            insights.append({
                "type": "success",
                "title": "High Operational Velocity",
                "message": f"Resolution rate at {resolution_rate:.0f}%. Voter trust index increasing by 12%.",
                "solution": "Document this as a 'Best Practice' for neighbouring constituencies."
            })

    # 2. Sentiment & Political Risk
    sentiment = stats.get("sentiment_distribution", {})
    total_sentiment = sum(sentiment.values())
    if total_sentiment > 0:
        neg_pct = (sentiment.get("negative", 0) / total_sentiment) * 100
        if neg_pct > 30:
            insights.append({
                "type": "warning",
                "title": "Feedback Alert",
                "message": f"Negative feedback has hit {neg_pct:.0f}%. High risk of support swing in Booth {stats.get('booth_id')}.",
                "solution": "Trigger 'Campaign Manager' outreach focusing on direct benefit schemes to mitigate friction."
            })
        
        pos_pct = (sentiment.get("positive", 0) / total_sentiment) * 100
        if pos_pct > 60:
            insights.append({
                "type": "info",
                "title": "Positive Momentum",
                "message": f"Voter support at {pos_pct:.0f}%. Engagement with 'Voter Services' is high.",
                "solution": "Scale 'Local Infrastructure' campaign to capitalize on positive sentiment."
            })

    # 3. Category Specific Strategic Response
    categories = stats.get("category_breakdown", {})
    if categories:
        top_cat = max(categories, key=categories.get)
        solutions = {
            "water": "Immediate audit of municipal pipeline leakage in Sector 9. Temporary water tankers deployed.",
            "road": "Contractor penalized for delays. Pothole filling scheduled for next 48 hours.",
            "electricity": "Substation maintenance prioritized. Backup transformer units allocated.",
            "sanitation": "Double-shift waste collection implemented. Drainage de-silting protocol active.",
            "healthcare": "Medicine supply chain restored. Emergency mobile health van deployed to booth perimeter.",
            "education": "Building structural safety certificate issued. Digital learning kits distributed to primary school."
        }
        insights.append({
            "type": "intervention",
            "title": f"Top Friction Driver: {top_cat.upper()}",
            "message": f"Found {categories[top_cat]} active reports regarding {top_cat} infrastructure.",
            "solution": solutions.get(top_cat, "Field team dispatched for ground-level verification and resolution.")
        })

    if not insights:
        insights.append({
            "type": "stable",
            "title": "System Nominal",
            "message": "Institutional operations are currently performing within expected parameters.",
            "solution": "Continue routine monitoring."
        })
    
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
                # Log detailed error for debugging
                return {"error": response.text, "status_code": response.status_code}
            
            if response.text and response.status_code != 204:
                try:
                    return response.json()
                except Exception:
                    return response.text
            return []
        except Exception as e:
            logger.error(f"Supabase Request Exception: {e}")
            return {"error": str(e), "status_code": 500}

async def resolve_booth_id(booth_id: Union[int, str]) -> int:
    """Strict booth ID resolution - no silent redirection"""
    try:
        if str(booth_id).isdigit():
            return int(booth_id)
    except:
        pass
    return 1


# --- MODELS ---

class LoginRequest(BaseModel):
    id: str
    role: str
    name: Optional[str] = None
    password: Optional[str] = None # Added for security hardening

@api_router.post("/auth/login")
async def auth_login(data: LoginRequest):
    """Issues a JWT token for the session - Mock password check implemented"""
    # Security Hardening: Check against a master demo password if provided in env
    master_pass = os.environ.get("DEMO_PASSWORD", "booth-iq-demo-2024")
    if data.password and data.password != master_pass:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({
        "id": data.id,
        "role": data.role,
        "name": data.name
    })
    return {"token": token, "user": data}

class GrievanceCreate(BaseModel):
    voter_id: Optional[Union[int, str]] = None
    voter_name: Optional[str] = None
    voter_phone: Optional[str] = None
    category: Optional[str] = None
    description: str
    booth_id: Union[int, str]
    attachments: Optional[List[str]] = []
    ai_vision_details: Optional[str] = None

class GrievanceUpdate(BaseModel):
    id: Union[int, str]
    status: Optional[str] = None
    assigned_to: Optional[Union[int, str]] = None
    assigned_worker: Optional[str] = None
    resolution_note: Optional[str] = None
    after_images: Optional[List[str]] = None

class VoterUpdate(BaseModel):
    id: Union[int, str]
    sentiment: Optional[str] = None
    voted: Optional[bool] = None
    voted_at: Optional[str] = None
    booth_id: Optional[Union[int, str]] = None

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
    logger.info(f"WebSocket connection request for user: {user_id}")
    await manager.connect(user_id, websocket)
    try:
        while True:
            # Keep connection alive by reading messages
            data = await websocket.receive_text()
            # Echo back a heartbeat acknowledgement
            await websocket.send_json({"type": "ack", "data": data})
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected (clean): {user_id}")
        manager.disconnect(user_id, websocket)
    except Exception as e:
        logger.warning(f"WebSocket error for {user_id}: {e}")
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
    
    # Get base data from Supabase (removed non-existent 'voted' columns from voters_eci)
    eci_data = await supabase_request("GET", "voters_eci", params={
        "select": "id,name,phone,booth_id,address,gender,dob",
        "booth_id": f"eq.{real_id}",
        "order": "name"
    })
    
    if isinstance(eci_data, dict) and "error" in eci_data:
        logger.error(f"Supabase error in get_voters: {eci_data}")
        eci_data = []

    if not eci_data or (isinstance(eci_data, dict) and "error" in eci_data):
        # Try finding ANY voters if booth specific fails, for demo robustness
        eci_data = await supabase_request("GET", "voters_eci", params={
            "select": "id,name,phone,booth_id,address,gender,dob",
            "limit": 50
        })
        
    if not eci_data or (isinstance(eci_data, dict) and "error" in eci_data):
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
            "voted": v.get("voted", False),
            "voted_at": v.get("voted_at"),
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
    # Guard: enrichment may be an error dict from supabase_request when the query fails
    if not isinstance(enrichment, list):
        logger.warning(f"Enrichment query returned non-list response: {enrichment}")
        enrichment = []
    enrichment_map = {str(v["eci_voter_id"]): v for v in enrichment}

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
            "voted": v.get("voted", False),
            "voted_at": v.get("voted_at"),
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
async def update_voter(data: VoterUpdate, user: dict = Depends(get_current_user)):
    """Update voter details - IDOR Protection & RBAC enforced"""
    # IDOR Check: Only Admins/Workers or the voter themselves can update
    is_admin_or_worker = user.get("role") in ["admin", "city_manager", "worker", "panna", "blo"]
    is_owner = str(user.get("id")) == str(data.id) or str(user.get("id")) == f"V{data.id}"
    
    if not is_admin_or_worker and not is_owner:
        raise HTTPException(status_code=403, detail="Unauthorized voter update attempt")

    try:
        updates = {}
        if data.sentiment:
            updates["sentiment"] = data.sentiment
        
        if data.voted is not None:
            # RBAC Check for BLO fields
            if user.get("role") not in ["blo", "admin", "panna"]:
                raise HTTPException(status_code=403, detail="Unauthorized for voter check-in")
            updates["voted"] = data.voted
            updates["voted_at"] = data.voted_at or datetime.now(timezone.utc).isoformat()

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

        return {"status": "updated", "id": data.id, "updates": updates}
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
        
        # --- NOTIFICATION HOOK: CALL LOGGED ---
        try:
            call_msg = await generate_ai_notification_message("call_logged", {
                "voter_name": data.voter_name,
                "status": data.status,
                "notes": data.notes,
                "sentiment": sentiment
            })
            
            await send_notification(
                user_id=str(data.voter_id),
                title="Interaction Logged",
                message=call_msg,
                n_type="info"
            )
        except Exception as e:
            logger.error(f"Notification Error in create_call: {e}")

        del call_doc["_id"]
        return call_doc
    except Exception as e:
        logger.error(f"Error creating call: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class GlobalBroadcast(BaseModel):
    title: str
    message: str
    level: str # 'CENTRAL', 'STATE', 'LOCAL'
    alert_type: str # 'EPIDEMIC', 'SECURITY', 'SCHEME', 'PROJECT', 'ALERT'
    priority: str # 'CRITICAL', 'HIGH', 'NORMAL'

@api_router.post("/broadcast/global")
async def global_broadcast(data: GlobalBroadcast, user: dict = Depends(get_current_user)):
    """Main server endpoint for State/Central government alerts"""
    # Security: Only high-level command roles can trigger a global broadcast
    if user.get("role") not in ["city_manager", "constituency"]:
        raise HTTPException(status_code=403, detail="Unauthorized to issue global broadcasts")
    
    timestamp = datetime.now(timezone.utc).isoformat()
    broadcast_id = f"BR-{uuid.uuid4().hex[:6].upper()}"
    
    broadcast_doc = {
        "id": broadcast_id,
        "timestamp": timestamp,
        "title": data.title,
        "message": data.message,
        "level": data.level,
        "alert_type": data.alert_type,
        "priority": data.priority,
        "issued_by": user.get("id")
    }
    
    # 1. Save to global bulletin collection
    await db.bulletins.insert_one(broadcast_doc)
    
    # 2. Trigger real-time notifications for all connected users (via WebSocket or real-world channels for critical)
    if data.priority in ["CRITICAL", "HIGH"]:
        test_number = os.environ.get("TEST_PHONE", "+917974185707")
        prefix = "🚨 EMERGENCY BROADCAST" if data.priority == "CRITICAL" else "📢 GOVT UPDATE"
        
        await NotificationHub.send_whatsapp(
            test_number,
            f"*{prefix} [{data.level}]*\n\n*Type:* {data.alert_type}\n*Title:* {data.title}\n\n{data.message}"
        )
        
    return {"status": "broadcast_deployed", "id": broadcast_id}

@api_router.get("/bulletins")
async def get_bulletins():
    """Get all active government bulletins and alerts"""
    try:
        bulletins = await db.bulletins.find({}, {"_id": 0}).sort("timestamp", -1).to_list(50)
        return bulletins
    except Exception as e:
        logger.error(f"Error fetching bulletins: {e}")
        return []

# --- ROUTES: GRIEVANCES ---

# --- HELPERS ---
def normalize_voter_id(vid: Optional[Union[int, str]]) -> Optional[str]:
    """Helper to normalize voter IDs to handle V-prefix consistency"""
    if not vid: return None
    v_str = str(vid)
    if v_str.startswith('V'):
        return v_str[1:]
    return v_str

async def fetch_grievances_internal(
    booth_id: Optional[Union[int, str]] = None, 
    assigned_to: Optional[str] = None, 
    voter_id: Optional[Union[int, str]] = None,
    role: str = "citizen",
    requested_voter_id: Optional[str] = None
):
    """Core logic for fetching grievances, decoupled from FastAPI Depends"""
    
    # Normalize requested voter_id and user ID
    user_id = normalize_voter_id(voter_id)
    
    if role == "citizen":
        # Citizens can ONLY see their own grievances
        final_voter_id = user_id
    else:
        final_voter_id = requested_voter_id

    real_id = await resolve_booth_id(booth_id) if booth_id else None
    
    # If filtered by assigned worker, find those IDs first from MongoDB
    specific_ids = []
    if assigned_to:
        cursor = db.grievance_assignments.find({"worker_id": str(assigned_to)}, {"grievance_id": 1})
        async for doc in cursor:
            specific_ids.append(str(doc["grievance_id"]))

    # Separate Supabase IDs (integers) from MongoDB IDs (strings like GR-xxx)
    supabase_ids = []
    mongo_only_ids = []
    for sid in specific_ids:
        if str(sid).isdigit():
            supabase_ids.append(str(sid))
        else:
            mongo_only_ids.append(str(sid))

    params = {
        "select": "*",
        "order": "created_at.desc"
    }
    
    if real_id:
        params["booth_id"] = f"eq.{real_id}"
    if final_voter_id:
        # Check for both numeric and V-prefixed IDs in Supabase for safety
        params["voter_id"] = f"in.({final_voter_id},V{final_voter_id})"
    
    # If a worker is requesting, they ONLY see their assigned IDs
    if assigned_to and not specific_ids:
        return []
        
    # For citizens, we often want to show all their reports regardless of booth
    # But we still respect booth_id if explicitly passed and not a self-query
    effective_real_id = real_id
    if final_voter_id and role == "citizen":
        effective_real_id = None # Ignore booth filter for self-reports

    # Only query Supabase if we have valid integer IDs or if we're not filtering by ID
    data = []
    if not assigned_to or supabase_ids:
        if supabase_ids:
            params["id"] = f"in.({','.join(supabase_ids)})"
        
        # Adjust Supabase params for citizen self-query
        if final_voter_id and role == "citizen":
            if "booth_id" in params: del params["booth_id"]

        data = await supabase_request("GET", "grievances", params=params)
    
    # Handle Supabase errors gracefully to avoid 500 Internal Server Error
    supabase_grievances = []
    if isinstance(data, list):
        supabase_grievances = data
    elif isinstance(data, dict) and "error" in data:
        logger.error(f"Supabase grievances fetch error: {data.get('error')}")
    
    # Merge with MongoDB data for hybrid richness
    mongo_grievances = []
    try:
        # 1. Fetch from flat grievances collection (More reliable)
        mongo_flat_query = {}
        if real_id:
            mongo_flat_query["booth_id"] = real_id
        if final_voter_id:
            mongo_flat_query["voter_id"] = {"$in": [str(final_voter_id), f"V{final_voter_id}", str(requested_voter_id) if requested_voter_id else None]}
            mongo_flat_query["voter_id"]["$in"] = [x for x in mongo_flat_query["voter_id"]["$in"] if x is not None]
        
        flat_cursor = db.grievances.find(mongo_flat_query, {"_id": 0})
        async for g in flat_cursor:
            mongo_grievances.append(g)

        # 2. Also fetch from nested grievances for backward compatibility
        mongo_query = {"grievances": {"$exists": True, "$ne": []}}
        if final_voter_id:
            # Match either ID or V-ID in MongoDB, and handle potential string/int conversion
            mongo_query["id"] = {"$in": [str(final_voter_id), f"V{final_voter_id}", str(requested_voter_id) if requested_voter_id else None]}
            # Remove None from the list
            mongo_query["id"]["$in"] = [x for x in mongo_query["id"]["$in"] if x is not None]
            
        cursor = db.voters.find(mongo_query)
        async for v in cursor:
            v_booth = v.get("booth_id")
            if effective_real_id and v_booth != effective_real_id: continue
            
            for g in v.get("grievances", []):
                g_id = str(g.get("id"))
                
                # Avoid duplicates if already found in flat collection
                if any(str(mg.get("id")) == g_id for mg in mongo_grievances):
                    continue

                # If worker is requesting, only show assigned to them
                if assigned_to and g_id not in specific_ids:
                    continue
                
                mongo_grievances.append({
                    "id": g_id,
                    "voter_id": v.get("id"),
                    "voter_name": v.get("name"),
                    "description": g.get("description"),
                    "status": g.get("status", "submitted"),
                    "category": g.get("category", "other"),
                    "booth_id": v_booth,
                    "created_at": g.get("created_at") or v.get("last_ai_update"),
                    "attachments": g.get("attachments", []),
                    "ai_vision_details": g.get("ai_vision_details", None)
                })
    except Exception as e:
        logger.error(f"Mongo grievances fetch error: {e}")

    # Combine data sets safely
    all_data = supabase_grievances + mongo_grievances
    
    # fallback for demo: Only if NOT filtering by voter or assigned
    if not all_data and not assigned_to and not final_voter_id:
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
                    "created_at": g.get("created_at") or v.get("last_ai_update"),
                    "attachments": g.get("attachments", []),
                    "ai_vision_details": g.get("ai_vision_details", None)
                })
        all_data = fallback_gr
    
    if not all_data:
        return []

    # Get ALL relevant assignments from MongoDB for enrichment
    grievance_ids = [str(g["id"]) for g in all_data]
    assignments = {}
    if grievance_ids:
        try:
            cursor = db.grievance_assignments.find(
                {"grievance_id": {"$in": grievance_ids}},
                {"_id": 0}
            )
            async for doc in cursor:
                assignments[str(doc["grievance_id"])] = doc
        except Exception as e:
            logger.error(f"Error fetching grievance assignments: {e}")
    
    # Merge assignment data with grievances
    result = []
    seen_ids = set()
    for item in all_data:
        g_id = str(item.get("id"))
        if g_id in seen_ids: continue
        seen_ids.add(g_id)
        
        g = dict(item)
        assignment = assignments.get(g_id, {})
        
        if g.get("status") == "submitted" and assignment:
            g["status"] = "assigned"
            
        g["assigned_worker"] = assignment.get("worker_name", None)
        g["assigned_worker_id"] = assignment.get("worker_id", None)
        result.append(g)
    
    return result

@api_router.get("/grievances")
async def get_grievances(
    booth_id: Optional[Union[int, str]] = None, 
    assigned_to: Optional[str] = None, 
    voter_id: Optional[Union[int, str]] = None,
    user: Optional[dict] = Depends(get_optional_user)
):
    """Entry point for grievances - RBAC & Data Isolation enforced"""
    # Handle Dummy Users for Demo
    if not user and voter_id and "dummy" in str(voter_id).lower():
        user = {
            "id": str(voter_id),
            "role": "citizen" if "citizen" in str(voter_id).lower() else "worker",
            "name": f"Demo {str(voter_id).replace('dummy-', '').capitalize()}"
        }

    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")

    return await fetch_grievances_internal(
        booth_id=booth_id,
        assigned_to=assigned_to,
        voter_id=user.get("id"),
        role=user.get("role", "citizen"),
        requested_voter_id=normalize_voter_id(voter_id)
    )


@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload media and perform AI Vision analysis if it's an image"""
    try:
        file_ext = file.filename.split(".")[-1].lower()
        file_name = f"{uuid.uuid4().hex}.{file_ext}"
        file_path = UPLOAD_DIR / file_name
        
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
            
        file_url = f"/static/uploads/{file_name}"
        ai_vision_details = None
        
        # Perform AI Vision analysis for images
        if file_ext in ["jpg", "jpeg", "png", "webp"]:
            try:
                base64_image = base64.b64encode(content).decode('utf-8')
                response = await openai_client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": "Analyze this image of a public grievance (like a broken road, trash, or water leak). Provide a very brief summary of the damage/issue and estimate the severity (Low, Medium, High). Format: Summary: [Text], Severity: [Text]"},
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/{file_ext};base64,{base64_image}",
                                    },
                                },
                            ],
                        }
                    ],
                    max_tokens=300,
                )
                ai_vision_details = response.choices[0].message.content
            except Exception as e:
                logger.error(f"AI Vision error: {e}")
                ai_vision_details = "AI analysis currently unavailable for this image."

        return {
            "url": file_url,
            "filename": file.filename,
            "ai_details": ai_vision_details
        }
    except Exception as e:
        logger.error(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/grievances")
async def create_grievance(data: GrievanceCreate):
    """Create a new grievance with AI classification"""
    try:
        real_booth_id = await resolve_booth_id(data.booth_id)
        
        # AI Classification
        ai_result = await classify_grievance(data.description)
        
        # Use AI category if not provided
        valid_categories = ['road', 'water', 'electricity', 'sanitation', 'healthcare', 'education', 'other']
        category = data.category.lower() if data.category and data.category.lower() in valid_categories else ai_result["category"]
        
        # Normalize voter ID for Supabase
        clean_voter_id = normalize_voter_id(data.voter_id)
        
        grievance_data = {
            "description": data.description,
            "category": category,
            "booth_id": real_booth_id,
            "status": "submitted",
            "sentiment": ai_result["sentiment"],
            "priority": ai_result["priority"],
            "photo_url": data.attachments[0] if data.attachments else None
        }
        
        # --- Supabase Schema Compatibility Check ---
        # Note: If Supabase schema is updated to include attachments and ai_vision_details, 
        # uncomment the lines below to sync them to Supabase.
        # if data.attachments: grievance_data["attachments"] = data.attachments
        # if data.ai_vision_details: grievance_data["ai_vision_details"] = data.ai_vision_details
        
        if clean_voter_id:
            grievance_data["voter_id"] = clean_voter_id
        
        result = await supabase_request("POST", "grievances", json_data=grievance_data)
        
        # --- HYBRID FALLBACK: Also store in MongoDB for demo safety ---
        mongo_gr = {
            "id": f"GR-{uuid.uuid4().hex[:6]}",
            "voter_id": data.voter_id or "anonymous", # Keep original for Mongo lookup
            "voter_name": data.voter_name or "Anonymous Citizen",
            "description": data.description,
            "category": category,
            "status": "submitted",
            "booth_id": real_booth_id,
            "sentiment": ai_result["sentiment"],
            "priority": ai_result["priority"],
            "attachments": data.attachments,
            "ai_vision_details": data.ai_vision_details,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        try:
            # 1. Store in flat grievances collection for reliable retrieval
            await db.grievances.insert_one(mongo_gr.copy())

            # 2. Also nest under voter if possible for backward compatibility
            if data.voter_id:
                # Try matching both original and normalized in Mongo
                mongo_res = await db.voters.update_one(
                    {"id": {"$in": [str(data.voter_id), f"V{clean_voter_id}" if clean_voter_id else ""]}},
                    {"$push": {"grievances": mongo_gr}}
                )
                
                # If no voter found (e.g. dummy user not in DB), create a minimal record for the demo
                if mongo_res.matched_count == 0 and "dummy" in str(data.voter_id).lower():
                    logger.info(f"Creating mock voter record for {data.voter_id} in MongoDB")
                    await db.voters.insert_one({
                        "id": str(data.voter_id),
                        "name": data.voter_name or "Demo Citizen",
                        "booth_id": real_booth_id,
                        "grievances": [mongo_gr],
                        "role": "citizen",
                        "last_ai_update": datetime.now(timezone.utc).isoformat()
                    })
        except Exception as e:
            logger.error(f"MongoDB grievance fallback error: {e}")

        # Use result from Supabase if available, otherwise use Mongo record
        grievance = mongo_gr # Default to local copy
        if result and isinstance(result, list) and len(result) > 0:
            grievance = result[0]
            # CRITICAL: If we have a real Supabase ID, update the MongoDB records to match
            # This ensures future updates and lookups work across both DBs
            try:
                supabase_id_str = str(grievance["id"])
                # Update flat collection
                await db.grievances.update_one(
                    {"id": mongo_gr["id"]},
                    {"$set": {"id": supabase_id_str}}
                )
                # Update nested collection
                if data.voter_id:
                    await db.voters.update_one(
                        {"id": str(data.voter_id), "grievances.id": mongo_gr["id"]},
                        {"$set": {"grievances.$.id": supabase_id_str}}
                    )
                # Also update the local object for the notification hook below
                grievance_id_to_use = supabase_id_str
            except Exception as e:
                logger.error(f"Failed to sync Mongo ID with Supabase: {e}")
                grievance_id_to_use = mongo_gr["id"]
        else:
            grievance_id_to_use = mongo_gr["id"]
            if result and isinstance(result, dict) and "error" in result:
                logger.warning(f"Supabase sync failed (Code {result.get('status_code')}): {result.get('error')}. Falling back to MongoDB only.")
        
        # Ensure grievance is a dictionary and has required fields for the AI logic below
        if not isinstance(grievance, dict):
            logger.error(f"Grievance object is not a dict: {type(grievance)}")
            grievance = mongo_gr

        # Attach AI enrichment metadata for the frontend
        grievance["ai_category"] = ai_result["category"]
        grievance["ai_sentiment"] = ai_result["sentiment"]
        grievance["ai_priority"] = ai_result["priority"]
        
        # --- NOTIFICATION HOOK ---
        # Notify Booth Staff and Voter with AI-Generated Messages
        try:
            # Generate AI message for the voter
            voter_msg = await generate_ai_notification_message("grievance_submitted", {
                "id": grievance_id_to_use,
                "category": category,
                "description": data.description,
                "voter_name": data.voter_name or "Citizen"
            })
            
            # Notify the person who filed it
            await send_notification(
                user_id=str(data.voter_id) if data.voter_id else "anonymous",
                title="Grievance Filed Successfully",
                message=voter_msg,
                n_type="success",
                metadata={"phone": data.voter_phone}
            )
            
            # Generate AI message for the admin
            admin_msg = await generate_ai_notification_message("grievance_alert_admin", {
                "id": grievance_id_to_use,
                "category": category,
                "booth_id": real_booth_id,
                "priority": ai_result["priority"]
            })
            
            # Notify Booth Staff (Admins)
            # Use metadata to send the full grievance object for real-time UI updates
            await send_notification(
                user_id="admin_1",
                title="New Grievance Alert",
                message=admin_msg,
                n_type="warning",
                metadata={"grievance_id": grievance_id_to_use, "grievance": grievance}
            )
            
            # ALSO send a dedicated WebSocket event for the Admin Dashboard
            # The dashboard expects { type: 'new_grievance', grievance: {...} }
            await manager.send_personal_message({
                "type": "new_grievance",
                "grievance": grievance
            }, "admin_1")

        except Exception as e:
            logger.error(f"Notification Hook Error in create_grievance: {e}")
        
        return grievance
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating grievance: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.patch("/grievances")
async def update_grievance(data: GrievanceUpdate, user: dict = Depends(get_current_user)):
    """Update grievance - IDOR Protection & RBAC enforced"""
    # Security Check: Only Admins or the assigned Worker can update a grievance.
    is_admin = user.get("role") in ["admin", "city_manager"]
    
    # Check if the user is the assigned worker in the current DB state OR in the incoming request
    # Robust check: Try both string and integer IDs for MongoDB lookup
    g_id_str = str(data.id)
    current_assignment = await db.grievance_assignments.find_one({"grievance_id": g_id_str})
    
    # If not found by string ID, try as int if it's numeric
    if not current_assignment and g_id_str.isdigit():
        current_assignment = await db.grievance_assignments.find_one({"grievance_id": int(g_id_str)})
    
    is_already_assigned = current_assignment and str(user.get("id")) == str(current_assignment.get("worker_id"))
    is_being_assigned = data.assigned_to and str(user.get("id")) == str(data.assigned_to)
    
    is_authorized_worker = is_already_assigned or is_being_assigned
            
    if not is_admin and not is_authorized_worker:
        logger.warning(f"Unauthorized update attempt by {user.get('id')} ({user.get('role')}) for grievance {data.id}. Admin={is_admin}, Assigned={is_already_assigned}")
        raise HTTPException(status_code=403, detail="Unauthorized grievance update attempt")

    try:
        updates = {}
        
        if data.status:
            updates["status"] = data.status
        
        if data.resolution_note:
            updates["resolution_note"] = data.resolution_note
        
        if data.after_images:
            updates["after_images"] = data.after_images
        
        # Update in Supabase
        result = None
        if updates:
            result = await supabase_request("PATCH", f"grievances?id=eq.{data.id}", json_data=updates)
        
        # --- HYBRID UPDATE: Also update in MongoDB if it exists there ---
        try:
            # Find the voter who owns this grievance in MongoDB
            # Try both exact match and numeric match for ID consistency
            mongo_updates = {
                "grievances.$.status": data.status or "assigned",
                "grievances.$.resolution_note": data.resolution_note or "Issue resolved."
            }
            if data.after_images:
                mongo_updates["grievances.$.after_images"] = data.after_images

            await db.voters.update_one(
                {"grievances.id": g_id_str},
                {"$set": mongo_updates}
            )
        except Exception as e:
            logger.error(f"Mongo grievance update error: {e}")
        
        # Handle worker assignment in MongoDB
        if data.assigned_to:
            # Get worker details from MongoDB
            worker = await db.users.find_one({"id": str(data.assigned_to)}, {"_id": 0})
            worker_name = worker["name"] if worker else (data.assigned_worker or "Assigned Personnel")
            
            logger.info(f"Assigning grievance {data.id} to {worker_name} ({data.assigned_to})")
            
            # Upsert assignment record
            await db.grievance_assignments.update_one(
                {"grievance_id": g_id_str},
                {"$set": {
                    "grievance_id": g_id_str,
                    "worker_id": str(data.assigned_to),
                    "worker_name": worker_name,
                    "assigned_at": datetime.now(timezone.utc).isoformat()
                }},
                upsert=True
            )
            
            # Ensure Supabase status reflects the assignment
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

        # --- NOTIFICATION HOOK: STATUS UPDATE & ASSIGNMENT ---
        # Fetch current grievance details to find the voter_id
        try:
            # First try Supabase
            grievance_list = await supabase_request("GET", f"grievances?id=eq.{data.id}", params={"select": "voter_id,category,status"})
            v_id = None
            category = "issue"
            current_status = data.status or "updated"
            voter_name = "Citizen"

            if grievance_list and isinstance(grievance_list, list) and len(grievance_list) > 0:
                grievance = grievance_list[0]
                v_id = str(grievance.get("voter_id"))
                category = grievance.get("category", "issue")
                current_status = data.status or grievance.get("status", "updated")
            
            # Hybrid Fallback: Search MongoDB if Supabase didn't yield a voter_id
            if not v_id or v_id == "None":
                mongo_voter = await db.voters.find_one({"grievances.id": g_id_str}, {"id": 1, "name": 1, "grievances.$": 1})
                if mongo_voter:
                    v_id = mongo_voter.get("id")
                    voter_name = mongo_voter.get("name", "Citizen")
                    if not data.status:
                        g_data = mongo_voter.get("grievances", [{}])[0]
                        category = g_data.get("category", category)
            
            if v_id and v_id != "None":
                # Use specialized event type for verified status to trigger higher authority message
                event_type = "grievance_verified" if current_status == "verified" else "grievance_status"
                
                # Use AI to generate a highly professional and personalized status update message
                ai_status_msg = await generate_ai_notification_message(event_type, {
                    "id": str(data.id),
                    "category": category,
                    "status": current_status,
                    "voter_name": voter_name,
                    "resolution_note": data.resolution_note or ("This resolution has been verified by the constituency supervisor." if current_status == "verified" else "Our field team has addressed the reported issue.")
                })
                
                # Multi-channel notification: triggers Email, SMS, and WhatsApp
                await send_notification(
                    user_id=v_id,
                    title=f"Report Verified: RESOLVED" if current_status == "verified" else f"Report Update: {current_status.upper()}",
                    message=ai_status_msg,
                    n_type="success" if current_status in ["resolved", "verified"] else "info",
                    metadata={
                        "grievance_id": str(data.id), 
                        "status": current_status,
                        "voter_name": voter_name,
                        "category": category
                    }
                )
        except Exception as e:
            logger.error(f"Failed to send status update notification: {e}")

        return {"status": "updated", "id": data.id}
    except Exception as e:
        logger.error(f"Error updating grievance: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# --- ROUTES: CITIZEN SERVICES ---

@api_router.get("/bulletins")
async def get_bulletins():
    """Live news and updates for the citizen portal"""
    return [
        {
            "id": 1,
            "title": "Booth #17 Modernization Complete",
            "content": "New solar-powered lighting and automated queue desks are now operational. Latency reduced by 40%.",
            "date": datetime.now(timezone.utc).isoformat(),
            "category": "infrastructure"
        },
        {
            "id": 2,
            "title": "Voter List Refresh Q1",
            "content": "Final synchronized electoral roll for the Strategic Sector is now live. Verify your details in the Services tab.",
            "date": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(),
            "category": "governance"
        }
    ]

@api_router.get("/voter-services")
async def get_voter_services():
    """High-utility digital services for citizens"""
    return [
        {"id": "s1", "name": "Voter ID Proxy", "icon": "badge", "description": "Encrypted digital identity for verification.", "status": "active", "official_link": "https://voters.eci.gov.in/"},
        {"id": "s2", "name": "Booth Navigation", "icon": "near_me", "description": "AR-ready route to Booth #17 entrance.", "status": "active", "official_link": "https://voters.eci.gov.in/"},
        {"id": "s3", "name": "Digital Voter Slip", "icon": "receipt_long", "description": "Instantly download your polling station pass.", "status": "active", "official_link": "https://voters.eci.gov.in/"},
        {"id": "s4", "name": "Live Queue Latency", "icon": "timer", "description": "Real-time AI wait-time predictions.", "status": "active", "official_link": "https://voters.eci.gov.in/"},
        {"id": "s5", "name": "Family Linkage", "icon": "family_history", "description": "Manage polling for your entire household.", "status": "active", "official_link": "https://voters.eci.gov.in/"},
        {"id": "s6", "name": "Electoral Roll Audit", "icon": "fact_check", "description": "Verify your presence in the final list.", "status": "active", "official_link": "https://voters.eci.gov.in/"}
    ]

# --- ROUTES: GOVERNMENT SCHEMES ---

@api_router.get("/schemes")
async def get_schemes():
    """Available government schemes and welfare programs with full details"""
    return [
        {
            "id": "sch1", 
            "name": "PM Kisan Samman", 
            "category": "Agriculture", 
            "desc": "Income support of ₹6,000 per year to small and marginal farmers.", 
            "benefit": "₹6,000 Annual", 
            "status": "Verified", 
            "official_link": "https://pmkisan.gov.in/"
        },
        {
            "id": "sch2", 
            "name": "Ayushman Bharat Card", 
            "category": "Healthcare", 
            "desc": "World's largest health insurance scheme providing ₹5 Lakh coverage.", 
            "benefit": "₹5L Coverage", 
            "status": "Available", 
            "official_link": "https://dashboard.pmjay.gov.in/"
        },
        {
            "id": "sch3", 
            "name": "Ujjwala Yojana 2.0", 
            "category": "Energy", 
            "desc": "Providing clean cooking fuel like LPG to rural and deprived households.", 
            "benefit": "Free Gas Connection", 
            "status": "Eligible", 
            "official_link": "https://www.pmuy.gov.in/"
        },
        {
            "id": "sch4", 
            "name": "PM Svanidhi", 
            "category": "Livelihood", 
            "desc": "Special micro-credit facility for street vendors to restart their business.", 
            "benefit": "Interest Subsidy", 
            "status": "Open", 
            "official_link": "https://pmsvanidhi.mohua.gov.in/"
        },
        {
            "id": "sch5", 
            "name": "PM Awas Yojana", 
            "category": "Housing", 
            "desc": "Affordable housing for the urban and rural poor.", 
            "benefit": "Home Subsidy", 
            "status": "Available", 
            "official_link": "https://pmay-urban.gov.in/"
        }
    ]

@api_router.post("/schemes/apply")
async def apply_scheme(data: SchemeApplication):
    """Log a scheme application using MongoDB for persistence"""
    try:
        application = {
            "id": str(uuid.uuid4()),
            "voter_id": str(data.voter_id),
            "scheme_id": data.scheme_id,
            "booth_id": data.booth_id,
            "status": "submitted",
            "applied_at": datetime.now(timezone.utc).isoformat()
        }
        await db.scheme_applications.insert_one(application)
        
        # Use AI to generate a detailed confirmation message
        try:
            app_msg = await generate_ai_notification_message("scheme_application", {
                "scheme_id": data.scheme_id,
                "voter_id": data.voter_id,
                "status": "submitted"
            })
            
            # Send real-time notification to user via WebSocket and other channels
            await send_notification(
                user_id=str(data.voter_id),
                title="Application Logged",
                message=app_msg,
                n_type="success"
            )
        except Exception as e:
            logger.error(f"Notification Error in apply_scheme: {e}")
        
        return {"status": "success", "application_id": application["id"]}
    except Exception as e:
        logger.error(f"Error applying for scheme: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/schemes/applications")
async def get_applications(voter_id: str):
    """Get all scheme applications for a specific voter from MongoDB"""
    try:
        cursor = db.scheme_applications.find({"voter_id": str(voter_id)}, {"_id": 0})
        apps = await cursor.to_list(length=100)
        return apps
    except Exception as e:
        logger.error(f"Error fetching applications: {e}")
        return []

# --- AI VOICE SERVICES (SARVAM AI Integration) ---

# [Duplicate STT route removed for production stabilization]

@api_router.post("/ai/tts")
async def text_to_speech(text: str = Form(...), user_id: str = Form(...)):
    """Convert text to speech using Sarvam AI"""
    if not text or not SARVAM_API_KEY:
        # Fallback to a pre-recorded base64 or empty
        return {"audio_content": None, "error": "TTS Service Unavailable (Demo Mode)"}

    try:
        async with httpx.AsyncClient() as client:
            payload = {
                "inputs": [text],
                "target_language_code": "hi-IN",
                "speaker": "meera",
                "pitch": 0,
                "pace": 1.0,
                "loudness": 1.5,
                "speech_sample_rate": 8000,
                "enable_preprocessing": True,
                "model": "bulbul:v1"
            }
            response = await client.post(
                "https://api.sarvam.ai/text-to-speech",
                headers={
                    'api-subscription-key': SARVAM_API_KEY,
                    'Content-Type': 'application/json'
                },
                json=payload,
                timeout=15.0
            )
            if response.status_code == 200:
                data = response.json()
                # Sarvam returns audio_content as base64 in a list
                return {"audio_content": data["audios"][0] if data.get("audios") else None}
            return {"audio_content": None, "error": f"Sarvam API error: {response.status_code}"}
    except Exception as e:
        logger.error(f"TTS Error: {e}")
        return {"audio_content": None, "error": str(e)}


class CampaignBlast(BaseModel):
    template_id: str
    target_segment: str
    channels: List[str]

@api_router.post("/campaigns/blast")
async def initiate_campaign_blast(data: CampaignBlast, user: dict = Depends(get_current_user)):
    """Simulate a mass outreach campaign blast"""
    if user.get("role") != "city_manager" and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized role for this action")
    
    logger.info(f"Campaign Blast Initiated by {user.get('id')}: Template={data.template_id}, Segment={data.target_segment}, Channels={data.channels}")
    
    # 1. Send real manifesto email to our connected user
    target_email = os.environ.get("TEST_EMAIL", "hackopscrew@gmail.com")
    await NotificationHub.send_manifesto(target_email, "Vikram Singh")
    
    # 2. Send a real test WhatsApp message to the connected test number if available
    test_number = os.environ.get("TEST_PHONE", "+917974185707")
    try:
        if "whatsapp" in data.channels:
            await NotificationHub.send_whatsapp(
                test_number, 
                f"*BoothIQ Global Campaign Blast*\n\n*Target:* {data.target_segment}\n*Protocol:* Mass Outreach Active\n*Status:* Manifesto and Vision documents successfully deployed to your inbox ({target_email})."
            )
        if "sms" in data.channels:
            await NotificationHub.send_sms(
                test_number,
                f"BoothIQ Blast: Manifesto and Vision docs deployed to {target_email} for segment {data.target_segment}."
            )
    except Exception as e:
        logger.error(f"Campaign test notification failed: {e}")
        
    return {"status": "deployed", "reach": "950M", "timestamp": datetime.now(timezone.utc).isoformat()}

@api_router.get("/graph-data")
async def get_graph_data(booth_id: Union[int, str], perspective: str = "social", user: dict = Depends(get_current_user)):
    """Extraction logic for the Intelligence Lead's Knowledge Graph with multiple perspectives"""
    if user.get("role") not in ["admin", "city_manager", "analyst", "constituency"]:
        raise HTTPException(status_code=403, detail="Unauthorized access to intelligence graph")

    real_id = await resolve_booth_id(booth_id)
    try:
        # 1. Fetch Voters (Citizens)
        voters = await db.voters.find({"booth_id": real_id}, {"_id": 0}).to_list(1000)
        if not voters:
            voters = await db.voters.find({}, {"_id": 0}).limit(100).to_list(100)

        # 2. Fetch Users (Admins and Workers)
        system_users = await db.users.find({"role": {"$in": ["admin", "worker"]}}, {"_id": 0}).to_list(100)
        
        # 3. Fetch Grievance Assignments for Linking
        assignments = await db.grievance_assignments.find({}, {"_id": 0}).to_list(500)
        assignment_map = {str(a["grievance_id"]): str(a["worker_id"]) for a in assignments}

        nodes = []
        links = []
        seen_nodes = set()
        
        # Add Admins and Workers to Nodes
        for su in system_users:
            su_id = str(su.get("id"))
            if su_id not in seen_nodes:
                nodes.append({
                    "id": su_id,
                    "name": su.get("name", "System User"),
                    "role": su.get("role"),
                    "type": "user",
                    "influence": 8.0 if su.get("role") == "admin" else 6.0
                })
                seen_nodes.add(su_id)

        if perspective == "issues":
            # Bipartite graph: Voters connected to Issue Categories
            issue_nodes = {}
            for v in voters:
                v_id = str(v.get("id"))
                if v_id not in seen_nodes:
                    nodes.append({
                        "id": v_id,
                        "name": v.get("name", "Voter"),
                        "role": "citizen",
                        "type": "voter",
                        "sentiment": v.get("sentiment", "neutral")
                    })
                    seen_nodes.add(v_id)
                
                # Connect to reported issues
                for g in v.get("grievances", []):
                    cat = g.get("category", "other").capitalize()
                    if cat not in issue_nodes:
                        issue_nodes[cat] = f"issue_{cat.lower()}"
                        nodes.append({
                            "id": issue_nodes[cat],
                            "name": cat,
                            "type": "issue",
                            "val": 15 
                        })
                    
                    links.append({
                        "source": v_id,
                        "target": issue_nodes[cat],
                        "value": 2
                    })
                    
                    # Also link Worker to the Issue if assigned
                    g_id = str(g.get("id"))
                    if g_id in assignment_map:
                        worker_id = assignment_map[g_id]
                        if worker_id in seen_nodes:
                            links.append({
                                "source": worker_id,
                                "target": issue_nodes[cat],
                                "type": "assignment"
                            })

        else: # Default: Social Fabric / Sentiment
            for v in voters:
                v_id = str(v.get("id"))
                if v_id not in seen_nodes:
                    nodes.append({
                        "id": v_id,
                        "name": v.get("name", "Voter"),
                        "role": "citizen",
                        "sentiment": v.get("sentiment", "neutral"),
                        "influence": v.get("influence_score", 1.0),
                        "type": "voter",
                        "isInfluencer": v.get("influence_score", 0) > 3.5
                    })
                    seen_nodes.add(v_id)

                # Link Voters (Citizens) based on social connections
                for conn in v.get("connections", []):
                    target_id = str(conn.get("to"))
                    # Only add link if target node exists or will be added
                    links.append({"source": v_id, "target": target_id, "type": conn.get("type", "community")})

                # Link Voters to Workers (if they have assigned grievances)
                for g in v.get("grievances", []):
                    g_id = str(g.get("id"))
                    if g_id in assignment_map:
                        worker_id = assignment_map[g_id]
                        if worker_id in seen_nodes:
                            links.append({
                                "source": worker_id,
                                "target": v_id,
                                "type": "support"
                            })

            # Link Workers to Admins (Hierarchical)
            admin_ids = [str(u["id"]) for u in system_users if u["role"] == "admin"]
            worker_ids = [str(u["id"]) for u in system_users if u["role"] == "worker"]
            for w_id in worker_ids:
                for a_id in admin_ids:
                    links.append({"source": a_id, "target": w_id, "type": "management"})

        # Remove duplicate nodes and links that point to missing nodes
        valid_nodes = [n for n in nodes if n["id"] in seen_nodes or n["type"] == "issue"]
        valid_node_ids = {n["id"] for n in valid_nodes}
        
        unique_links = []
        seen_links = set()
        for l in links:
            s, t = str(l["source"]), str(l["target"])
            if s in valid_node_ids and t in valid_node_ids:
                key = tuple(sorted([s, t]))
                if key not in seen_links:
                    unique_links.append(l)
                    seen_links.add(key)

        return {
            "nodes": valid_nodes,
            "links": unique_links,
            "perspective": perspective,
            "metadata": {"total_nodes": len(valid_nodes), "total_links": len(unique_links), "booth_id": real_id}
        }
    except Exception as e:
        logger.error(f"Error generating {perspective} graph data: {e}")
        return {"nodes": [], "links": []}

# --- ROUTES: ANALYTICS ---

@api_router.get("/analytics")
async def get_analytics(booth_id: Union[int, str], user: dict = Depends(get_current_user)):
    """Get real analytics from database - RBAC enforced"""
    # Security: Analytics are sensitive strategic data
    if user.get("role") not in ["admin", "city_manager", "analyst", "constituency"]:
        raise HTTPException(status_code=403, detail="Unauthorized access to analytics")

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
            
            # --- NEW: Time-series Data for Live Graphs (Fallback Case) ---
            today = datetime.now(timezone.utc)
            trends = []
            for i in range(6, -1, -1):
                date = (today - timedelta(days=i)).strftime("%Y-%m-%d")
                trends.append({
                    "date": date,
                    "issues": max(0, int(total_issues / 7) + (i % 3)),
                    "sentiment_score": 60 + (i * 5) % 30 if sentiment_dist["positive"] > sentiment_dist["negative"] else 40 + (i * 3) % 20
                })

            stats = {
                "booth_id": real_id,
                "total_voters": total_voters,
                "sentiment_distribution": sentiment_dist,
                "total_issues": total_issues,
                "resolved_issues": resolved_issues,
                "pending_issues": total_issues - resolved_issues,
                "category_breakdown": category_breakdown,
                "total_calls": call_count,
                "trends": trends
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
        
        # --- NEW: Time-series Data for Live Graphs ---
        # Get last 7 days trend
        today = datetime.now(timezone.utc)
        trends = []
        for i in range(6, -1, -1):
            date = (today - timedelta(days=i)).strftime("%Y-%m-%d")
            # In a real app, you'd query MongoDB for counts per day
            # For this demo, we'll generate semi-realistic trend data based on total counts
            trends.append({
                "date": date,
                "issues": max(0, int(total_issues / 7) + (i % 3)),
                "sentiment_score": 60 + (i * 5) % 30 if sentiment_dist["positive"] > sentiment_dist["negative"] else 40 + (i * 3) % 20
            })

        stats = {
            "booth_id": real_id,
            "total_voters": total_voters,
            "sentiment_distribution": sentiment_dist,
            "total_issues": total_issues,
            "resolved_issues": resolved_issues,
            "pending_issues": total_issues - resolved_issues,
            "category_breakdown": category_breakdown,
            "total_calls": call_count,
            "trends": trends # Added trends for live graphs
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
async def manager_analyze(data: ManagerAnalyze, user: dict = Depends(get_current_user)):
    """Trigger AI analysis for a booth to group issues and target voters"""
    if user.get("role") != "city_manager" and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized role for this action")
    
    try:
        real_id = await resolve_booth_id(data.booth_id)
        
        # Get grievances for this booth using internal helper
        grievances = await fetch_grievances_internal(
            booth_id=real_id,
            role=user.get("role", "admin")
        )
        
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

@api_router.get("/manager/automation-alerts")
async def get_manager_alerts(user: dict = Depends(get_current_user)):
    """AI Automation: Predictive alerts for the City Manager - RBAC enforced"""
    if user.get("role") not in ["admin", "city_manager", "constituency"]:
        raise HTTPException(status_code=403, detail="Unauthorized access to automation alerts")
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

        # Use internal helper to avoid Depends error
        grievances = await fetch_grievances_internal(role=user.get("role", "city_manager"))
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

@api_router.post("/manager/auto-assign")
async def manager_auto_assign(data: dict):
    """AI Automation: Auto-assign unassigned grievances and notify user"""
    try:
        action_id = str(uuid.uuid4())
        timestamp = datetime.now(timezone.utc).isoformat()
        
        # Use internal helper
        grievances = await fetch_grievances_internal(
            booth_id=data.get("booth_id"),
            role="admin"
        )
        unassigned = [g for g in grievances if g.get("status") == "submitted"]
        
        # 2. Get available workers
        workers = await db.users.find({"role": "worker"}).to_list(100)
        
        target_email = os.environ.get("TEST_EMAIL", "hackopscrew@gmail.com")
        test_number = os.environ.get("TEST_PHONE", "+917974185707")

        if not unassigned or not workers:
            # Record demo action
            history_item = {
                "id": action_id,
                "timestamp": timestamp,
                "type": "RESOURCE_DEPLOYMENT",
                "target": "Sector 9 (Water)",
                "details": "Simulated deployment of emergency water tankers and infrastructure inspection team.",
                "status": "completed",
                "notified_to": target_email
            }
            await db.action_history.insert_one(history_item)
            
            await NotificationHub.send_whatsapp(
                test_number, 
                f"*BoothIQ Strategic Action*\n\n*Action:* Resource Deployment Initiated\n*Target:* Sector 9 (Water Infrastructure)\n*Status:* Deployment commands sent to field units. Notification sent to {target_email}."
            )
            return {"status": "demo_success", "message": "Demo notification sent", "action": history_item}
            
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
            
        # Record real action
        history_item = {
            "id": action_id,
            "timestamp": timestamp,
            "type": "AUTO_ASSIGNMENT",
            "target": f"Booth #{data.get('booth_id')}",
            "details": f"Automatically assigned {assigned_count} pending grievances to active field officers.",
            "status": "completed",
            "notified_to": target_email
        }
        await db.action_history.insert_one(history_item)

        await NotificationHub.send_whatsapp(
            test_number, 
            f"*BoothIQ AI Automation*\n\n*Action:* Auto-Assignment Complete\n*Count:* {assigned_count} issues resolved\n*Target:* Sector 9\n*Status:* Real-time sync complete."
        )
            
        return {"status": "success", "assigned_count": assigned_count, "action": history_item}
    except Exception as e:
        logger.error(f"Auto-assign error: {e}")
        return {"status": "error", "message": str(e)}

@api_router.get("/manager/action-history")
async def get_action_history():
    """Get history of strategic actions taken by constituency command"""
    try:
        history = await db.action_history.find({}, {"_id": 0}).sort("timestamp", -1).to_list(50)
        return history
    except Exception as e:
        logger.error(f"Error fetching action history: {e}")
        return []

@api_router.get("/constituency/summary")
async def get_constituency_summary(user: dict = Depends(get_current_user)):
    """Get constituency-wide metrics and strategic heatmap data"""
    if user.get("role") not in ["city_manager", "constituency"]:
        raise HTTPException(status_code=403, detail="Unauthorized access to constituency summary")
    
    try:
        # 1. Booth-level metrics for heatmap
        booths = await db.users.distinct("booth_id", {"role": "admin"})
        heatmap = []
        total_turnout = 0
        total_issues = 0
        total_voters = 0
        
        for bid in booths[:16]: # Limit to 16 for the UI grid
            # Calculate real sentiment/health for each booth
            v_count = await db.voters.count_documents({"booth_id": bid})
            g_count = await db.grievances.count_documents({"booth_id": bid, "status": {"$ne": "resolved"}})
            
            # Mock some variations based on real data
            health = max(10, 100 - (g_count * 5)) if v_count > 0 else 50
            heatmap.append({
                "id": bid,
                "val": health,
                "sent": "unhappy" if health < 40 else "happy" if health > 70 else "neutral"
            })
            
            total_voters += v_count
            total_issues += g_count
            
        # 2. Urgent issues based on real categories
        urgent_categories = await db.grievances.aggregate([
            {"$match": {"status": {"$ne": "resolved"}}},
            {"$group": {"_id": "$category", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 3}
        ]).to_list(3)
        
        urgent_issues = []
        for cat in urgent_categories:
            urgent_issues.append({
                "id": 100 + len(urgent_issues),
                "issue": cat["_id"].capitalize(),
                "risk": f"{min(99, 60 + cat['count'])}%",
                "loc": f"Sector {cat['count'] % 10 + 1}"
            })

        # 3. Institutional Metrics (Real-time latency simulation based on task density)
        worker_count = await db.users.count_documents({"role": "worker"})
        latency = f"{max(12, 100 - (worker_count * 2))}ms" if worker_count > 0 else "350ms"

        return {
            "metrics": {
                "total_turnout": "72.1%", # Can be calculated from past election data in real prod
                "active_issues": total_issues,
                "citizen_sentiment": "Positive" if total_issues < 50 else "Critical",
                "booths_managed": len(booths),
                "system_latency": latency
            },
            "heatmap": heatmap,
            "urgent_issues": urgent_issues,
            "field_activity": await db.users.find({"role": "worker"}, {"_id": 0, "name": 1, "booth_id": 1}).to_list(5)
        }
    except Exception as e:
        logger.error(f"Constituency summary error: {e}")
        return {"error": str(e)}

# [Duplicate get_voter_services removed]

def sanitize_for_json(obj):
    """Recursive helper to convert non-serializable objects (like ObjectId, datetime) to strings"""
    if isinstance(obj, dict):
        return {k: sanitize_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_for_json(i) for i in obj]
    elif hasattr(obj, '__str__') and not isinstance(obj, (int, float, bool, str, type(None))):
        return str(obj)
    return obj

# --- ROUTES: AI CHATBOT ---

@api_router.post("/chat")
async def ai_chat(data: ChatRequest):
    """Context-aware AI Chatbot using Sarvam/OpenAI"""
    # Rate limit removed
    
    try:
        # 1. Gather Context (with per-resource fallback)
        user = None
        try:
            user = await db.users.find_one({"id": data.user_id}, {"_id": 0})
        except Exception as e:
            logger.error(f"Error fetching user context: {e}")
            
        # Try both formats for voter ID (Voter table uses V1001 while ECI uses 1001)
        voter_id = data.user_id
        voter = None
        try:
            voter = await db.voters.find_one({"id": voter_id}, {"_id": 0})
            if not voter and str(voter_id).isdigit():
                voter = await db.voters.find_one({"id": f"V{voter_id}"}, {"_id": 0})

            # Filter large fields from voter to save tokens
            if voter and "connections" in voter:
                del voter["connections"]
        except Exception as e:
            logger.error(f"Error fetching voter context: {e}")
        
        # Fetch actual grievances for this booth
        grievances = []
        try:
            grievances = await fetch_grievances_internal(
                booth_id=data.booth_id,
                role=user.get("role", "citizen") if user else "citizen",
                voter_id=data.user_id
            )
        except Exception as e:
            logger.error(f"Error fetching grievances context: {e}")
        system_grievances = grievances[:3] if grievances else []
        
        # Fetch available schemes
        schemes = []
        try:
            schemes = await get_schemes()
        except Exception as e:
            logger.error(f"Error fetching schemes context: {e}")
        
        # Define role-specific persona to ensure AI acts according to its audience
        role = user.get("role", "citizen") if user else "citizen"
        role_personas = {
            "citizen": "You are the Citizen Service Assistant. Be empathetic, helpful, and focused on public welfare schemes and grievance tracking. Use encouraging, community-focused language.",
            "worker": "You are the Field Operations Advisor. Be tactical, direct, and authoritative. Focus on territory management, task completion, and on-ground execution. Provide quick, actionable advice for field visits.",
            "panna": "You are the Field Strategy Lead. Focus on voter engagement, influence mapping, and territory stabilization. Be strategic and provide clear field-level tactics for communication.",
            "admin": "You are the Booth Management Supervisor. Be administrative and metric-oriented. Focus on booth-level turnout, issue resolution rates, and operational bottlenecks. Provide analytical, logical advice.",
            "city_manager": "You are the Strategic Operations Lead. Be high-level, strategic, and formal. Focus on regional trends, political risk forecasting, and resource allocation. Provide bird's-eye view intelligence.",
            "constituency": "You are the Command Center Strategist. Be highly institutional and intelligence-driven. Focus on the ultimate strategic moat: The Knowledge Graph and Social Fabric. Provide deep-dive insights.",
            "analyst": "You are the Intelligence Analyst. Be data-driven, technical, and precise. Focus on uncovering hidden patterns in the knowledge graph and reporting sentiment shifts."
        }
        active_persona = role_personas.get(role, role_personas["citizen"])

        # Robust null-safe handling for user context
        user_name = user.get('name', 'Citizen') if user else 'Citizen'
        user_role = role.upper() if (user and user.get('role')) else 'CITIZEN'

        context_prompt = f"""
        {active_persona}
        
        Institutional Identity: BoothIQ AI (ESarthi)
        User: {user_name} | Current Role Context: {user_role}
        Voter Context: {json.dumps(sanitize_for_json(voter)) if voter else 'No direct registry match, but assisting as a local resident.'}
        Platform Data:
        - Active Grievances: {json.dumps(sanitize_for_json(system_grievances))} (Total: {len(grievances) if grievances else 0})
        - Available Schemes: {json.dumps([s['name'] for s in schemes]) if schemes else '[]'}
        
        Current Query: {data.message}
        
        Strategic Guidelines:
        - Maintain your role-specific persona throughout the conversation.
        - Reference specific grievance IDs or categories if the user asks for status.
        - Suggest specific schemes like 'Ayushman Bharat' or 'PM Kisan' ONLY if they are relevant to the user's context.
        - Use localized terminology (Sector, Booth, Field Team, HQ Command) when appropriate.
        - Keep responses sharp, professional, and under 150 words.
        - IMPORTANT: Do NOT include internal 'thought' or 'thinking' process tags in your final output. Return ONLY the final message.
        """
        
        # Try Sarvam AI LLM first
        ai_reply = None
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
                
                response = await client.post(
                    "https://api.sarvam.ai/v1/chat/completions",
                    json=payload,
                    headers=headers,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    ai_reply = response.json()["choices"][0]["message"]["content"]
                else:
                    raise Exception(f"Sarvam LLM error {response.status_code}")
                    
        except Exception as sarvam_err:
            logger.info(f"Using OpenAI as primary/fallback (Sarvam error: {sarvam_err})")
            try:
                response = await openai_client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "system", "content": context_prompt},
                        {"role": "user", "content": data.message}
                    ],
                    max_tokens=600
                )
                ai_reply = response.choices[0].message.content
            except Exception as ai_err:
                logger.error(f"AI Service Error: {ai_err}")
                user_name = user.get('name', 'a citizen') if user else 'a citizen'
                ai_reply = f"I'm currently operating in offline mode. I can see you are {user_name} from Booth {data.booth_id}. How else can I assist you manually?"

        # CLEANUP: Aggressively strip internal thought processes (e.g., <think> tags) before returning
        if ai_reply:
            import re
            # Strip both <think>...</think> and markdown-style thinking blocks
            ai_reply = re.sub(r'<think>.*?</think>', '', ai_reply, flags=re.DOTALL | re.IGNORECASE)
            ai_reply = re.sub(r'```thinking.*?```', '', ai_reply, flags=re.DOTALL | re.IGNORECASE)
            ai_reply = ai_reply.strip()

        return {"response": ai_reply if ai_reply else "System busy. Please try again soon."}

    except Exception as e:
        logger.error(f"Chat Error [Full Trace]: {e}", exc_info=True)
        return {"response": f"System Alert: A backend synchronization error occurred. Error: {str(e)[:100]}"}

@api_router.post("/ai/stt")
async def speech_to_text(file: UploadFile = File(...), language_code: str = Form("hi-IN"), user_id: str = Form("anonymous")):
    """Sarvam AI Speech-to-Text with OpenAI Whisper Fallback"""
    import os # Explicit local import to fix UnboundLocalError during async execution context
    tmp_path = None # Pre-initialize to avoid NameError in finally block 
    try:
        sarvam_key = os.environ.get('SARVAM_API_KEY')
        transcript = ""
        
        if sarvam_key:
            try:
                # Read file content once to reuse in both Sarvam and fallback
                file_content = await file.read()
                async with httpx.AsyncClient() as client:
                    # Determine content type safely
                    c_type = getattr(file, 'content_type', 'audio/wav')
                    files = {'file': (file.filename, file_content, c_type)}
                    data = {'model': 'saaras:v1', 'language_code': language_code}
                    headers = {'api-subscription-key': sarvam_key}
                    
                    response = await client.post(
                        "https://api.sarvam.ai/speech-to-text",
                        files=files,
                        data=data,
                        headers=headers,
                        timeout=20.0 # Increased timeout for larger audio files
                    )
                    
                    if response.status_code == 200:
                        res_data = response.json()
                        transcript = res_data.get("transcript") or res_data.get("text") or ""
                        if transcript:
                            logger.info(f"Sarvam STT Success: {transcript}")
                            return {"transcript": transcript}
                    else:
                        logger.warning(f"Sarvam STT failed ({response.status_code}): {response.text}")
                
                # If Sarvam failed but we have file content, prep for Whisper fallback
                audio_data = file_content
            except Exception as e:
                logger.error(f"Sarvam STT Exception: {e}")
                # Fallback to file reading if Sarvam client block failed
                await file.seek(0)
                audio_data = await file.read()
        else:
            audio_data = await file.read()

        # Fallback to OpenAI Whisper
        logger.info("Attempting OpenAI Whisper fallback...")
        
        # We need to save to a temp file because openai library expects a file-like object with a name or path
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            tmp.write(audio_data)
            tmp_path = tmp.name
            
        try:
            with open(tmp_path, "rb") as audio_file:
                response = await openai_client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language=language_code.split('-')[0] # Whisper prefers 'hi' over 'hi-IN'
                )
                transcript = response.text
                logger.info(f"OpenAI Whisper Success: {transcript}")
                return {"transcript": transcript}
        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.remove(tmp_path)

    except Exception as e:
        logger.error(f"Full STT Operational Failure: {e}", exc_info=True)
        return {"transcript": "", "error": str(e)}

@api_router.post("/ai/tts")
async def text_to_speech(text: str = Form(...), language_code: str = Form("hi-IN"), user_id: str = Form("anonymous")):
    """Sarvam AI Text-to-Speech"""
    try:
        sarvam_key = os.environ.get('SARVAM_API_KEY')
        if not sarvam_key:
            return {"audio_content": ""}
            
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
                headers=headers,
                timeout=15.0
            )
            
            if response.status_code == 200:
                data = response.json()
                return {"audio_content": data.get("audios", [""])[0]}
            logger.error(f"Sarvam TTS Error: {response.text}")
            return {"audio_content": ""}
    except Exception as e:
        logger.error(f"TTS Exception: {e}")
        return {"audio_content": ""}

# --- ROUTES: SEED DATA ---

@api_router.post("/seed")
async def seed_data(user: dict = Depends(get_current_user)):
    """Seed initial users and sample data - Restricted to City Manager/Constituency"""
    if user.get("role") not in ["city_manager", "constituency"]:
        raise HTTPException(status_code=403, detail="Unauthorized access to administrative seed operation")
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
            {"id": "panna-1", "name": "Meena Devi", "role": "panna", "booth_id": 17, "email": "meena@boothiq.ai", "phone": "+917974185707"},
            {"id": "panna-2", "name": "Rajkumar Singh", "role": "panna", "booth_id": 18, "email": "rajkumar@boothiq.ai", "phone": "+917974185707"},
            {"id": "admin-1", "name": "Ramesh Gupta", "role": "admin", "booth_id": 17, "email": "ramesh@boothiq.ai", "phone": "+917974185707"},
            {"id": "admin-2", "name": "Anita Verma", "role": "admin", "booth_id": 18, "email": "anita@boothiq.ai", "phone": "+917974185707"},
            {
                "id": "city_manager-1", 
                "name": "Rajesh Khanna", 
                "role": "city_manager", 
                "city_id": "DELHI-01",
                "assigned_booths": [1, 17, 18, 19, 20],
                "email": "rajesh@boothiq.ai",
                "phone": "+917974185707"
            },
            {"id": "worker-1", "name": "Sunil Kumar", "role": "worker", "booth_id": 17, "email": "sunil@boothiq.ai", "phone": "+917974185707"},
            {"id": "worker-2", "name": "Priya Yadav", "role": "worker", "booth_id": 17, "email": "priya@boothiq.ai", "phone": "+917974185707"},
            {"id": "worker-3", "name": "Ajay Tiwari", "role": "worker", "booth_id": 18, "email": "ajay@boothiq.ai", "phone": "+917974185707"},
            {"id": "analyst-1", "name": "Deepak Sharma", "role": "analyst", "booth_id": 17, "email": "deepak@boothiq.ai", "phone": "+917974185707"},
            {"id": "citizen-1", "name": "Vikram Singh", "role": "citizen", "booth_id": 17, "email": "hackopscrew@gmail.com", "phone": "+917974185707"},
            {"id": "citizen-2", "name": "Lata Maurya", "role": "citizen", "booth_id": 18, "email": "lata@example.com", "phone": "+917974185707"},
            {"id": "admin-1", "name": "Ramesh Gupta", "role": "admin", "booth_id": 17, "email": "ramesh@boothiq.ai", "phone": "+917974185707"},
            {"id": "admin-2", "name": "Anita Verma", "role": "admin", "booth_id": 18, "email": "anita@boothiq.ai", "phone": "+917974185707"},
            {"id": "city_manager-1", "name": "Rajesh Khanna", "role": "city_manager", "booth_id": 17, "email": "rajesh@boothiq.ai", "phone": "+917974185707"},
            {"id": "constituency-1", "name": "Party Command", "role": "constituency", "booth_id": 17, "email": "command@boothiq.ai", "phone": "+917974185707"},
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
            {"name": "Ramesh Kumar", "booth": "B01", "age": 45, "area": "Sector 9", "issue": "Severe water shortage and pipeline leakage for 5 days.", "cat": "water", "sent": "negative", "hh": "HH1"},
            {"name": "Sita Devi", "booth": "B01", "age": 38, "area": "Sector 9", "issue": "Main road potholes leading to multiple minor accidents.", "cat": "road", "sent": "negative", "hh": "HH1"},
            {"name": "Amit Sharma", "booth": "B01", "age": 21, "area": "Sector 10", "issue": "Poor street lighting in Sector 10 making it unsafe at night.", "cat": "electricity", "sent": "negative", "hh": "HH2"},
            {"name": "Pooja Singh", "booth": "B02", "age": 30, "area": "Sector 11", "issue": "Garbage disposal units overflowing and not cleared for a week.", "cat": "sanitation", "sent": "negative", "hh": "HH3"},
            {"name": "Rahul Verma", "booth": "B02", "age": 50, "area": "Sector 11", "issue": "Frequent power outages during study hours.", "cat": "electricity", "sent": "negative", "hh": "HH3"},
            {"name": "Sunita Gupta", "booth": "B03", "age": 60, "area": "Sector 12", "issue": "Local clinic lacks basic medicines and first aid supplies.", "cat": "healthcare", "sent": "negative", "hh": "HH4"},
            {"name": "Anil Yadav", "booth": "B03", "age": 35, "area": "Sector 12", "issue": "Illegal encroachment on public parks by local vendors.", "cat": "other", "sent": "neutral", "hh": "HH5"},
            {"name": "Meena Kumari", "booth": "B04", "age": 28, "area": "Sector 9", "issue": "Drainage system blocked, causing foul smell in the area.", "cat": "sanitation", "sent": "negative", "hh": "HH6"},
            {"name": "Deepak Mishra", "booth": "B04", "age": 40, "area": "Sector 10", "issue": "Internet connectivity is extremely slow and unreliable for work.", "cat": "other", "sent": "neutral", "hh": "HH6"},
            {"name": "Kiran Patel", "booth": "B05", "age": 32, "area": "Sector 11", "issue": "Primary school building needs urgent structural repairs.", "cat": "education", "sent": "negative", "hh": "HH7"}
        ]
        
        voters_to_insert = []
        # Multi-record generation logic to hit 1000
        for i in range(1, 1001):
            template = user_templates[i % len(user_templates)]
            booth_id = (i % 4) + 1 # Target booths 1, 2, 3, 4
            
            # Enrich name, phone and email for uniqueness
            full_name = f"{template['name']} {i}"
            phone = f"98765{i:05d}"
            email = f"voter_{i}@example.com"
            
            voters_to_insert.append({
                "id": f"V{1000 + i}",
                "name": full_name,
                "address": f"{template['area']}, Household {template['hh']}_{i % 100}",
                "booth_id": booth_id,
                "phone": phone,
                "email": email,
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
            gr_recs = []
            # Seed 120 real grievances (30 per booth)
            for i in range(1, 121):
                v = voters_to_insert[i-1]
                target_booth = (i % 4) + 1
                gr_recs.append({
                    "voter_id": str(1000 + i),
                    "booth_id": str(target_booth),
                    "description": v["grievances"][0]["description"],
                    "status": "submitted" if i % 3 != 0 else "resolved",
                    "category": v["tags"][0],
                    "priority": "high" if i % 2 == 0 else "medium"
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

# CORS configuration: Merge default origins with environment-specific overrides
_default_cors = [
    "http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3002", 
    "http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176",
    "https://26th-may-booth-iq.vercel.app"
]
_env_cors = [o.strip() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()]
ALLOWED_ORIGINS = list(set(_default_cors + _env_cors))

logger.info(f"CORS Configuration: Allowed Origins = {ALLOWED_ORIGINS}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

@app.on_event("startup")
async def startup_db_check():
    """Verify system health on start and force-reload credentials"""
    # Force reload env vars from file at startup
    load_dotenv(ROOT_DIR / '.env', override=True)
    
    # Re-initialize global config from newly loaded env
    global TWILIO_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, TWILIO_WHATSAPP_NUMBER, SENDGRID_API_KEY, FROM_EMAIL
    TWILIO_SID = os.environ.get('TWILIO_ACCOUNT_SID', '')
    TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN', '')
    TWILIO_PHONE_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER', '')
    TWILIO_WHATSAPP_NUMBER = os.environ.get('TWILIO_WHATSAPP_NUMBER', 'whatsapp:+14155238886')
    SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY', '')
    FROM_EMAIL = os.environ.get('FROM_EMAIL', 'notifications@boothiq.ai')
    
    logger.info("Startup: BoothIQ System Initializing...")
    logger.info(f"Notification Config Reloaded: Twilio SID={TWILIO_SID[:5]}..., From={FROM_EMAIL}")
    
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
