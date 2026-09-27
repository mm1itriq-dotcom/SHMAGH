from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ai_engine.planner import generate_travel_plan
import google.generativeai as genai
import os
import json
import uuid
from dotenv import load_dotenv
from firebase_admin import auth, firestore
from firebase_config import db

# Load Environment Variables (.env)
load_dotenv()

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI(title="SHMAGH API")

# Setup CORS so the frontend can talk to the backend safely
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5500", "http://127.0.0.1:5500", "*"], 
    allow_credentials=False,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

class JourneyRequest(BaseModel):
    destinations: list[str]
    days: int
    budget: str
    travel_style: str
    feedback: str = ""
    hotel: str = ""

import jwt
import datetime

# --- JWT Security Configuration ---
SECRET_KEY = os.urandom(32).hex()
ALGORITHM = "HS256"

def create_jwt_token(data: dict):
    """Generates a JWT token valid for 24 hours."""
    to_encode = data.copy()
    expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_jwt(authorization: str = Header(None)):
    """
    Validates the JSON Web Token (JWT) provided by the frontend.
    Protects the API routes from unauthorized access.
    """
    if not authorization or not authorization.startswith("Bearer "):
        return None
        
    token = authorization.split("Bearer ")[1]
    try:
        decoded_token = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid JWT Token: {str(e)}")

# --- Authentication Models ---
class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class UpdatePasswordRequest(BaseModel):
    current_password: str
    new_password: str

# --- API Routes ---
@app.post("/api/auth/register")
def register_user(req: RegisterRequest):
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
        
    # Check if user already exists
    users_ref = db.collection('users').where('email', '==', req.email).stream()
    for doc in users_ref:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    # Generate a unique UUID for the new user (Hackathon Requirement)
    user_uuid = str(uuid.uuid4())
    
    new_user = {
        "uid": user_uuid,
        "name": req.name,
        "email": req.email,
        # IN PRODUCTION: Passwords MUST be hashed (e.g. using passlib bcrypt). 
        # For this hackathon MVP, we are doing a direct match.
        "password": req.password, 
        "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    
    # Save to Firestore
    db.collection('users').document(user_uuid).set(new_user)
    
    # Generate JWT Token
    token = create_jwt_token({"uid": user_uuid, "email": req.email})
    
    return {"message": "User created successfully", "token": token, "user": {"uid": user_uuid, "name": req.name}}

@app.post("/api/auth/login")
def login_user(req: LoginRequest):
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
        
    users_ref = db.collection('users').where('email', '==', req.email).where('password', '==', req.password).stream()
    
    user_data = None
    for doc in users_ref:
        user_data = doc.to_dict()
        break
        
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    # Generate JWT Token
    token = create_jwt_token({"uid": user_data["uid"], "email": user_data["email"]})
    
    return {"message": "Login successful", "token": token, "user": {"uid": user_data["uid"], "name": user_data["name"]}}
@app.get("/")
def read_root():
    return {"message": "Welcome to the SHMAGH FastAPI Backend!"}

@app.get("/api/destinations")
def get_destinations():
    if db is None:
        return {"error": "Firebase is not connected."}
    dest_ref = db.collection('destinations')
    return {"destinations": [doc.to_dict() for doc in dest_ref.stream()]}

@app.get("/api/hotels")
def get_hotels():
    if db is None:
        return {"error": "Firebase is not connected."}
    hotel_ref = db.collection('hotels')
    return {"hotels": [doc.to_dict() for doc in hotel_ref.stream()]}

class AIJourneyRequest(BaseModel):
    starting_location: str = "Amman"
    preferred_destinations: list[str] = []
    trip_duration_days: int = 3
    number_of_travelers: int = 2
    budget: float = 1000.0
    travel_style: list[str] = ["Luxury"]
    hotel_preference: str = "Standard"

@app.post("/api/generate-journey")
def generate_journey(request: AIJourneyRequest, user_token=Depends(verify_jwt)):
    if not GEMINI_API_KEY:
        return {"error": "Gemini API Key is missing."}
    
    req_data = request.dict()
    try:
        import google.generativeai as genai
        model = genai.GenerativeModel('gemini-1.5-flash')
        plan = generate_travel_plan(req_data, model)
        return {"journey": plan}
    except Exception as e:
        return {"error": str(e)}

class GalleryPostRequest(BaseModel):
    image_url: str
    location: str
    author: str

@app.get("/api/auth/me")
def get_current_user(user_token=Depends(verify_jwt)):
    if not user_token:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    uid = user_token.get("uid")
    user_ref = db.collection('users').document(uid).get()
    
    if not user_ref.exists:
        raise HTTPException(status_code=404, detail="User not found")
        
    user_data = user_ref.to_dict()
    # Don't return the password
    user_data.pop("password", None)
    return user_data


@app.post("/api/gallery")
def create_gallery_post(req: GalleryPostRequest, user_token=Depends(verify_jwt)):
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
        
    uid = user_token.get("uid")
    if not uid:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    post_id = str(uuid.uuid4())
    
    # Compress or truncate if too large? 
    # Actually, Firestore limits to 1MB. Let's check size!
    if len(req.image_url) > 900000:
        raise HTTPException(status_code=413, detail="Image is too large. Please select an image under 600KB.")
        
    new_post = {
        "id": post_id,
        "user_id": uid,
        "author": req.author,
        "location": req.location,
        "image_url": req.image_url,
        "likes": 0,
        "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }
    
    try:
        db.collection('gallery_posts').document(post_id).set(new_post)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Firestore error: {str(e)}")
        
    return {"message": "Post created successfully", "post": new_post}

@app.get("/api/user/photos")
def get_user_photos(user_token=Depends(verify_jwt)):
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    uid = user_token.get("uid")
    posts = []
    # Note: Using stream directly for small sets. Proper indexing may be needed for large sets.
    docs = db.collection("gallery_posts").where("user_id", "==", uid).stream()
    for doc in docs:
        p = doc.to_dict()
        p["id"] = doc.id
        posts.append(p)
    # Sort by created_at descending in python since we might lack a compound index
    posts.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return {"photos": posts}

@app.delete("/api/gallery/{post_id}")
def delete_gallery_post(post_id: str, user_token=Depends(verify_jwt)):
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    uid = user_token.get("uid")
    post_ref = db.collection("gallery_posts").document(post_id)
    doc = post_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Post not found")
        
    if doc.to_dict().get("user_id") != uid:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    post_ref.delete()
    return {"message": "Post deleted successfully"}

@app.post("/api/gallery/{post_id}/like")
def like_gallery_post(post_id: str):
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
        
    post_ref = db.collection('gallery_posts').document(post_id)
    post = post_ref.get()
    
    if not post.exists:
        raise HTTPException(status_code=404, detail="Post not found")
        
    current_likes = post.to_dict().get("likes", 0)
    post_ref.update({"likes": current_likes + 1})
    
    return {"message": "Liked successfully", "likes": current_likes + 1}

@app.post("/api/gallery/{post_id}/unlike")
def unlike_gallery_post(post_id: str):
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
        
    post_ref = db.collection('gallery_posts').document(post_id)
    post = post_ref.get()
    
    if not post.exists:
        raise HTTPException(status_code=404, detail="Post not found")
        
    current_likes = post.to_dict().get("likes", 0)
    new_likes = max(0, current_likes - 1)
    post_ref.update({"likes": new_likes})
    
    return {"message": "Unliked successfully", "likes": new_likes}



class LikeRequest(BaseModel):
    photo_id: str
    like: bool # True for like, False for unlike

@app.post("/api/gallery/like")
def toggle_like(req: LikeRequest):
    if db is None:
        return {"error": "Firebase is not connected."}
    
    photo_ref = db.collection('gallery').document(req.photo_id)
    doc = photo_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Photo not found")
        
    current_likes = doc.to_dict().get('likes', 0)
    new_likes = current_likes + 1 if req.like else max(0, current_likes - 1)
    
    photo_ref.update({'likes': new_likes})
    return {"message": "Success", "likes": new_likes}

@app.get("/api/stories")
def get_stories():
    if db is None:
        return {"error": "Firebase is not connected."}
    return {"stories": [doc.to_dict() for doc in db.collection('stories').stream()]}

@app.get("/api/culture")
def get_culture():
    if db is None:
        return {"error": "Firebase is not connected."}
    return {"culture": [doc.to_dict() for doc in db.collection('culture').stream()]}




class UpdatePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@app.put("/api/auth/update-password")
def update_password(req: UpdatePasswordRequest, user_token=Depends(verify_jwt)):
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    uid = user_token.get("uid")
    if not uid:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    if req.current_password == req.new_password:
        raise HTTPException(status_code=400, detail="New password must be different from current password")
    user_ref = db.collection("users").document(uid)
    doc = user_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
    user_doc = doc.to_dict()
    if user_doc.get("password") != req.current_password:
        raise HTTPException(status_code=400, detail="Incorrect current password")
    user_ref.update({"password": req.new_password})
    return {"message": "Password updated successfully"}
class FavoriteRequest(BaseModel):
    destination_name: str

@app.post("/api/user/favorite")
def toggle_favorite(req: FavoriteRequest, user_token=Depends(verify_jwt)):
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    uid = user_token.get("uid")
    if not uid:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    user_ref = db.collection("users").document(uid)
    doc = user_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
    user_data = doc.to_dict()
    favorites = user_data.get("favorites", [])
    if req.destination_name in favorites:
        favorites.remove(req.destination_name)
        msg = "Removed from favorites"
    else:
        favorites.append(req.destination_name)
        msg = "Added to favorites"
    user_ref.update({"favorites": favorites})
    return {"message": msg, "favorites": favorites}
class JournalRequest(BaseModel):
    title: str
    itinerary_data: dict

@app.post("/api/user/journal")
def save_to_journal(req: JournalRequest, user_token=Depends(verify_jwt)):
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    uid = user_token.get("uid")
    if not uid:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    user_ref = db.collection("users").document(uid)
    doc = user_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
        
    user_data = doc.to_dict()
    journal = user_data.get("journal", [])
    
    import datetime
    new_entry = {
        "title": req.title,
        "date_saved": datetime.datetime.now().isoformat(),
        "itinerary_data": req.itinerary_data
    }
    
    journal.append(new_entry)
    user_ref.update({"journal": journal})
    return {"message": "Saved to journal successfully!", "journal": journal}


@app.get('/api/auth/verify')
def auth_verify(user_data = Depends(verify_jwt)):
    if not user_data:
        raise HTTPException(status_code=401, detail='Not authenticated')
    return {'status': 'ok'}


@app.get("/api/gallery")
def get_gallery():
    if db is None:
        raise HTTPException(status_code=500, detail="Database not connected")
    posts_ref = db.collection("gallery_posts").order_by("likes", direction=firestore.Query.DESCENDING).limit(50)
    posts = []
    for doc in posts_ref.stream():
        post = doc.to_dict()
        post["id"] = doc.id
        posts.append(post)
    return {"posts": posts}

import httpx
import time
import urllib.parse
import asyncio

# --- Simple TTL Cache for External APIs ---
_api_cache = {}
def get_cached(key, ttl_seconds):
    if key in _api_cache:
        val, ts = _api_cache[key]
        if time.time() - ts < ttl_seconds:
            return val
    return None

def set_cache(key, val):
    _api_cache[key] = (val, time.time())

@app.get("/api/weather")
async def get_weather(lats: str, lons: str):
    cache_key = f"weather_{lats}_{lons}"
    cached = get_cached(cache_key, 600) # 10 min TTL
    if cached: return cached
    
    try:
        forecast_url = "https://api.open-meteo.com/v1/forecast?latitude=31.9522&longitude=35.9331&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto"
        current_url = f"https://api.open-meteo.com/v1/forecast?latitude={lats}&longitude={lons}&current_weather=true"
        
        async with httpx.AsyncClient(headers={'User-Agent': 'Mozilla/5.0'}) as client:
            forecast_resp, current_resp = await asyncio.gather(
                client.get(forecast_url),
                client.get(current_url)
            )
            
            forecast_resp.raise_for_status()
            current_resp.raise_for_status()
            
            result = {"forecast": forecast_resp.json(), "current": current_resp.json()}
            set_cache(cache_key, result)
            return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/exchange-rates")
async def get_exchange_rates(base: str = "JOD"):
    cache_key = f"rates_{base}"
    cached = get_cached(cache_key, 3600) # 1 hour TTL
    if cached: return cached
    
    try:
        url = f"https://api.exchangerate-api.com/v4/latest/{base}"
        async with httpx.AsyncClient(headers={'User-Agent': 'Mozilla/5.0'}) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()
            set_cache(cache_key, data)
            return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/geocode")
async def get_geocode(q: str):
    cache_key = f"geo_{q}"
    cached = get_cached(cache_key, 86400) # 24 hours TTL
    if cached: return cached
    
    try:
        url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(q)}&format=json&limit=1"
        async with httpx.AsyncClient(headers={'User-Agent': 'SHMAGH_App (Contact: info@shmagh.com)'}) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()
            set_cache(cache_key, data)
            return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
