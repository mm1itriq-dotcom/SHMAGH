import os
import google.generativeai as genai
from ai_engine.planner import generate_travel_plan

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("NO API KEY!")

model = genai.GenerativeModel('gemini-1.5-flash')
req_data = {
    "starting_location": "Amman",
    "preferred_destinations": ["Petra", "Wadi Rum"],
    "trip_duration_days": 3,
    "number_of_travelers": 2,
    "budget": 1500.0,
    "travel_style": ["Explorer", "Cultural"],
    "hotel_preference": "Standard"
}

try:
    plan = generate_travel_plan(req_data, model)
    print("SUCCESS")
    print(plan)
except Exception as e:
    print("FAIL:", e)
