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

import json

@app.post("/api/generate-journey")
def generate_journey(request: UserRequirements):
    if not GEMINI_API_KEY:
        return {"error": "Gemini API Key is missing."}
    
    req_data = request.dict()
    model = genai.GenerativeModel('gemini-3.8-flash')
    
    # --- MODIFICATION LAYER ---
    if req_data.get("feedback"):
        try:
            feedback = req_data["feedback"]
            prompt = f"""Convert this travel feedback into a structured JSON preference object.
Feedback: "{feedback}"
Example Output:
{{
  "pace": "relaxed",
  "driving_preference": "minimize_driving",
  "exploration_time": "extended",
  "food_preference": "local_jordanian",
  "interest_priority": "historical"
}}
Return ONLY valid JSON without markdown blocks."""
            resp = model.generate_content(prompt)
            prefs_text = resp.text.replace('```json', '').replace('```', '').strip()
            prefs = json.loads(prefs_text)
            
            # 1. Merge preferences with existing trip data.
            # 2. Modify `req_data` to apply changes.
            if prefs.get("pace") == "relaxed" or prefs.get("exploration_time") == "extended":
                if len(req_data["destinations"]) > 2:
                    # Keep fewer destinations to slow down pace and allow more exploration
                    req_data["destinations"] = req_data["destinations"][:max(1, len(req_data["destinations"])-1)]
            if prefs.get("driving_preference") == "minimize_driving":
                if len(req_data["destinations"]) > 2:
                    req_data["destinations"] = req_data["destinations"][:2]
            
            if "travel_style" not in req_data:
                req_data["travel_style"] = []
            req_data["travel_style"].append(json.dumps(prefs))
        except Exception as e:
            print("Feedback extraction failed:", e)

    # --- GENERATION ---
    try:
        plan = generate_travel_plan(req_data, model)
    except Exception as e:
        print("Error inside generation:", e)
        plan = generate_travel_plan(req_data, None)

    if "error" in plan or not plan:
        return {"journey": plan}

    # --- ENRICHMENT LAYER (Restaurants & Hidden Gems) ---
    try:
        destinations = req_data.get("destinations", [])
        if not destinations:
            destinations = ["Amman"]
            
        enrich_prompt = f"""You are an expert Jordanian local guide.
For these destinations: {', '.join(destinations)}, suggest 1-2 Recommended Restaurants and 1-2 Hidden Gems for EACH.
Recommendations MUST match these exact locations. Do not suggest random restaurants from unrelated cities.
Use AI knowledge to suggest well-known local Jordanian restaurants or food experiences related to that specific area.
Return ONLY valid JSON matching this schema exactly without markdown blocks:
{{
  "restaurants": [
    {{
      "name": "Restaurant Name",
      "location": "Destination name",
      "rating": "4.5/5",
      "price_level": "$$",
      "cuisine_type": "Jordanian",
      "recommended_dish": "Mansaf",
      "reason": "Why it matches"
    }}
  ],
  "hidden_gems": [
    {{
      "name": "Gem Name",
      "location": "Destination name",
      "description": "Short description",
      "best_time": "Morning",
      "why_visit": "Why it's a hidden gem"
    }}
  ]
}}
"""
        enrich_resp = model.generate_content(enrich_prompt)
        enrich_data = json.loads(enrich_resp.text.replace('```json', '').replace('```', '').strip())
        
        # Ensure they are not empty
        if not enrich_data.get("restaurants"):
            enrich_data["restaurants"] = [{"name": "Local Favorite", "location": destinations[0], "cuisine_type": "Jordanian", "reason": "Authentic taste"}]
        if not enrich_data.get("hidden_gems"):
            enrich_data["hidden_gems"] = [{"name": "Secret Spot", "location": destinations[0], "description": "Beautiful view", "why_visit": "Unique local spot", "best_time": "Sunset"}]
            
        if "map_data" not in plan:
            plan["map_data"] = {}
        plan["map_data"]["restaurants"] = enrich_data["restaurants"]
        plan["map_data"]["hidden_gems"] = enrich_data["hidden_gems"]
    except Exception as e:
        print("Enrichment failed:", e)

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
