import json
import google.generativeai as genai
from .models import UserRequirements, FinalResponse
from .optimizer import optimize_route
from .budget import calculate_budget

def generate_travel_plan(req_data: dict, model_instance) -> dict:
    req = UserRequirements(**req_data)
    
    # 1. Route Optimization
    waypoints = req.preferred_destinations
    start_loc = req.starting_location or "Amman"
    
    # Remove start from waypoints if it's there
    if start_loc in waypoints:
        waypoints.remove(start_loc)
        
    optimal = optimize_route(start_loc, start_loc, waypoints)
    
    # 2. Budget Calculation
    budget = calculate_budget(
        destinations=optimal["route"],
        trip_duration_days=req.trip_duration_days,
        travelers=req.number_of_travelers,
        hotel_preference=req.hotel_preference,
        fuel_cost=optimal["estimated_fuel_cost"]
    )
    
    # 3. AI Planning Layer
    prompt = f"""
    You are a senior AI travel planner for Jordan.
    Generate a detailed daily itinerary for a trip.
    
    Parameters:
    - Travelers: {req.number_of_travelers}
    - Duration: {req.trip_duration_days} days
    - Budget limit: {req.budget} JOD
    - Travel Style: {', '.join(req.travel_style)}
    - Optimized Route: {' -> '.join(optimal['route'])}
    
    You MUST respond with valid JSON matching exactly this schema:
    {{
        "recommended_trip": {{
            "start": "{start_loc}",
            "end": "{start_loc}",
            "route": {json.dumps(optimal['route'])},
            "confidence_score": 0.95
        }},
        "itinerary": [
            {{
                "day": 1,
                "locations": ["Amman", "Jerash"],
                "activities": ["Visit Citadel", "Eat Mansaf"],
                "driving_time": "1 hour",
                "estimated_cost": "50 JOD"
            }}
        ],
        "cost_analysis": {json.dumps(budget)},
        "recommendations": ["Pack water", "Wear comfortable shoes"]
    }}
    
    Fill in the itinerary with {req.trip_duration_days} days of realistic travel using the provided route.
    Return ONLY JSON. Do not include markdown code blocks.
    """
    
    try:
        response = model_instance.generate_content(prompt)
        text = response.text.replace('```json', '').replace('```', '').strip()
        result = json.loads(text)
        return result
    except Exception as e:
        print("AI generation failed:", e)
        # Fallback response
        return {
            "recommended_trip": {
                "start": start_loc,
                "end": start_loc,
                "route": optimal['route'],
                "confidence_score": 0.5
            },
            "itinerary": [
                {"day": 1, "locations": optimal['route'], "activities": ["Sightseeing"], "driving_time": str(optimal['total_driving_hours'])+" hrs", "estimated_cost": str(budget['total_cost'])+" JOD"}
            ],
            "cost_analysis": budget,
            "recommendations": ["AI generation failed, this is a fallback."]
        }
