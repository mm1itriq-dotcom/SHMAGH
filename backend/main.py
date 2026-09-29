from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ai_engine.planner import generate_travel_plan
from ai_engine.models import UserRequirements
import google.generativeai as genai
import os
import httpx
import asyncio
import time


from dotenv import load_dotenv

# Load Environment Variables (.env)
load_dotenv()

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI()

# Allow CORS so the frontend can talk to the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/generate-journey")
def generate_journey(request: UserRequirements):
    if not GEMINI_API_KEY:
        return {"error": "Gemini API Key is missing."}
    
    req_data = request.dict()
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        plan = generate_travel_plan(req_data, model)
        return {"journey": plan}
    except Exception as e:
        print("Error inside generation:", e)
        # Trigger the fallback
        plan = generate_travel_plan(req_data, None)
        return {"journey": plan}

_api_cache = {}
def get_cached(key, ttl):
    if key in _api_cache:
        val, ts = _api_cache[key]
        if time.time() - ts < ttl:
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
