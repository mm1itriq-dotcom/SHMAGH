import json
import math
from datetime import datetime, timedelta
import google.generativeai as genai
from .models import UserRequirements
from .external_apis import get_driving_route, get_place_details, get_restaurants, get_hotel_info, get_activity_cost, estimate_transport_cost, estimate_daily_food_cost, get_hidden_gems, COORDS

def generate_travel_plan(req_data: dict, model_instance) -> dict:
    req = UserRequirements(**req_data)
    
    # 1. Parse Dates and calculate duration
    try:
        s_date = datetime.strptime(req.dates.start, "%Y-%m-%d")
        e_date = datetime.strptime(req.dates.end, "%Y-%m-%d")
        num_days = max(1, (e_date - s_date).days + 1)
    except:
        return {"error": "Data unavailable: Invalid dates"}
        
    dates_list = [(s_date + timedelta(days=i)).strftime("%d %B %Y") for i in range(num_days)]
    
    # 2. Destinations Validation
    destinations = req.destinations
    hotel_name = req.hotel.name
    
    if not destinations:
        return {"error": "Data unavailable: No destinations selected"}
    if not hotel_name:
        return {"error": "Data unavailable: No hotel selected"}
        
    # 3. Validation & Scheduling Engine (Hub and Spoke)
    # Assign destinations evenly to days
    daily_schedules = [[] for _ in range(num_days)]
    for i, dest in enumerate(destinations):
        daily_schedules[i % num_days].append(dest)
        
    hotel_info = get_hotel_info(hotel_name, req.dates.start, req.dates.end)
    if "price_per_night" not in hotel_info or hotel_info["price_per_night"] == 0:
        return {"error": "Data unavailable: Hotel pricing failed"}
        
    daily_hotel_cost = hotel_info["price_per_night"]
    total_hotel_cost = daily_hotel_cost * num_days
    
    days_data = []
    total_transport = 0
    total_activities = 0
    total_food = 0
    
    markers = []
    added_markers = set()
    all_restaurants = []
    all_hidden_gems = []
    
    # Track used destinations to validate all are included
    used_destinations = set()

    for day_i in range(num_days):
        day_dests = daily_schedules[day_i]
        day_drive_str = []
        day_transport_cost = 0
        day_activity_cost = 0
        
        # Build Route: Hotel -> dest1 -> dest2 -> ... -> Hotel
        route_points = [hotel_name] + day_dests + [hotel_name]
        
        for i in range(len(route_points)-1):
            origin = route_points[i]
            dest = route_points[i+1]
            if origin == dest:
                continue
                
            drive_data = get_driving_route(origin, dest)
            if not drive_data["is_valid"] or drive_data["distance_km"] <= 0 or drive_data["duration_mins"] <= 0:
                return {"error": f"Data unavailable: Invalid route between {origin} and {dest}"}
                
            day_drive_str.append(f"{origin} -> {dest} (Distance: {drive_data['distance_km']} km, Duration: {drive_data['duration_str']} - Source: Maps API)")
            day_transport_cost += estimate_transport_cost(drive_data['distance_km'], req.transportation_method)
            
            if dest != hotel_name:
                used_destinations.add(dest)
                day_activity_cost += get_activity_cost(dest)
                
                if dest not in added_markers and dest in COORDS:
                    places_info = get_place_details(dest)
                    markers.append({
                        "name": dest,
                        "latitude": str(COORDS[dest]["lat"]),
                        "longitude": str(COORDS[dest]["lon"]),
                        "type": places_info["type"]
                    })
                    added_markers.add(dest)
                    all_restaurants.extend(get_restaurants(dest))
                    all_hidden_gems.extend(get_hidden_gems(dest))
                    
        daily_food = estimate_daily_food_cost(req.travel_style) * req.travelers
        day_total = daily_hotel_cost + day_transport_cost + day_activity_cost + daily_food
        
        total_transport += day_transport_cost
        total_activities += day_activity_cost
        total_food += daily_food
        
        days_data.append({
            "day_title": f"Day {day_i + 1}",
            "date": dates_list[day_i],
            "destinations": day_dests,
            "driving_segments": day_drive_str,
            "cost_breakdown": {
                "hotel": f"{daily_hotel_cost} JOD (Source: Hotel API)",
                "transportation": f"{day_transport_cost} JOD (Source: Pricing API)",
                "food": f"{daily_food} JOD (Source: Pricing API)",
                "activities": f"{day_activity_cost} JOD (Source: Pricing API)",
                "daily_total": f"{day_total} JOD"
            }
        })
        
    # Validation Check: All destinations included
    missing_dests = set(destinations) - used_destinations
    if missing_dests:
        return {"error": f"Data unavailable: Failed to schedule destinations {missing_dests}"}
        
    # Budget Optimization Engine
    total_trip_cost = total_hotel_cost + total_transport + total_activities + total_food
    
    budget_status = "Within budget"
    budget_options = []
    if total_trip_cost > req.budget:
        diff = round(total_trip_cost - req.budget, 2)
        budget_status = f"Requires adjustment. The current plan exceeds your budget by {diff} JOD."
        budget_options = [
            f"Option 1: Keep {hotel_name} and increase budget by {diff} JOD.",
            "Option 2: Change to a more affordable hotel tier.",
            "Option 3: Reduce paid activities or select budget dining."
        ]
        
    map_data = {
        "route_polyline": "encoded_mock_polyline_for_jordan_route",
        "markers": markers,
        "restaurants": list(set(all_restaurants))[:5],
        "hidden_gems": list(set(all_hidden_gems))[:5]
    }
    
    # 4. AI Explanation & Generation Layer
    prompt = f"""
You are the AI Travel Concierge.
The travel planning engine has ALREADY calculated the mathematically verified itinerary. 
You must ONLY:
1. Understand the user preferences.
2. Explain the route choices by writing a Theme for each day based strictly on the scheduled destinations.
3. Write human-readable strings for morning, afternoon, and evening activities. CRITICAL RULE: YOU MUST FEATURE THE USER-SELECTED DESTINATIONS ({', '.join(destinations)}). DO NOT generate generic filler like 'breakfast', 'walking tour', or 'relaxation' instead of the actual scheduled destinations.
4. Format the final output to match the JSON schema perfectly.

Never calculate distance or prices. Never invent opening hours.
The selected hotel ({hotel_name}) is the base for every route.
Use the EXACT strings and numbers provided in the Context below.

CONTEXT DATA:
User Budget: {req.budget} JOD
Total Cost: {total_trip_cost} JOD
Hotel Selected: {hotel_name}
Nights: {num_days}

DAYS STRUCTURE TO FOLLOW EXACTLY:
{json.dumps(days_data, indent=2)}

You MUST respond with valid JSON matching EXACTLY this schema. DO NOT wrap in markdown blocks, just raw JSON:
{{
    "trip_summary": {{
        "Dates": "{dates_list[0]} to {dates_list[-1]}",
        "Travelers": "{req.travelers}",
        "Hotel": "{hotel_name}",
        "Budget": "{req.budget} JOD"
    }},
    "recommended_trip": {{
        "start": "{hotel_name}",
        "end": "{hotel_name}",
        "route": {json.dumps(destinations)},
        "confidence_score": 0.99
    }},
    "itinerary": [
        {{
            "day_title": "Day 1",
            "date": "Exact date from context",
            "theme": "A creative theme summarizing the scheduled destinations",
            "morning_activities": ["Describe visiting the scheduled destinations. Do not invent generic filler."],
            "afternoon_activities": ["Describe visiting the scheduled destinations or enjoying local culture."],
            "evening_activities": ["Return to {hotel_name}."],
            "driving_segments": ["EXACT array from driving_segments in context"],
            "restaurants": ["Select 1-2 relevant restaurants from context map_data"],
            "hotel": "{hotel_name}",
            "cost_breakdown": {{
                "hotel": "Exact string from context",
                "transportation": "Exact string from context",
                "food": "Exact string from context",
                "activities": "Exact string from context",
                "daily_total": "Exact string from context"
            }}
        }}
    ],
    "cost_analysis": {{
        "transport_cost": "{total_transport} JOD (Source: Pricing API)",
        "hotel_cost": "{num_days} nights @ {daily_hotel_cost} JOD/night = {total_hotel_cost} JOD (Source: Hotel API)",
        "food_cost": "{total_food} JOD (Source: Pricing API)",
        "activity_cost": "{total_activities} JOD (Source: Pricing API)",
        "total_cost": "{total_trip_cost} JOD"
    }},
    "budget_status": "{budget_status}",
    "budget_options": {json.dumps(budget_options)},
    "map_data": {json.dumps(map_data)},
    "recommendations": ["A personalized tip about the trip based on travel style"]
}}
"""
    
    try:
        response = model_instance.generate_content(prompt)
        text = response.text.replace('```json', '').replace('```', '').strip()
        result = json.loads(text)
        return result
    except Exception as e:
        print("AI generation failed:", e)
        # Fallback to a mock itinerary so development can continue despite API Quota limits!
        mock_itinerary = []
        for day in days_data:
            mock_itinerary.append({
                "day_title": day["day_title"],
                "date": day["date"],
                "theme": f"Exploring {', '.join(day['destinations'])}",
                "morning_activities": [f"Visit {d}" for d in day["destinations"]],
                "afternoon_activities": ["Enjoy local culture and cuisine"],
                "evening_activities": [f"Return to {hotel_name}"],
                "driving_segments": day["driving_segments"],
                "restaurants": ["Local Restaurant"],
                "hotel": hotel_name,
                "cost_breakdown": day["cost_breakdown"]
            })
            
        return {
            "trip_summary": {
                "Dates": f"{dates_list[0]} to {dates_list[-1]}",
                "Travelers": f"{req.travelers} Guests",
                "Hotel": hotel_name,
                "Budget": f"{req.budget} JOD"
            },
            "recommended_trip": {
                "route": destinations
            },
            "itinerary": mock_itinerary,
            "cost_analysis": {
                "transport_cost": f"{total_transport} JOD (Source: Pricing API)",
                "hotel_cost": f"{num_days} nights @ {daily_hotel_cost} JOD/night = {total_hotel_cost} JOD (Source: Hotel API)",
                "food_cost": f"{total_food} JOD (Source: Pricing API)",
                "activity_cost": f"{total_activities} JOD (Source: Pricing API)",
                "total_cost": f"{total_trip_cost} JOD"
            },
            "budget_status": budget_status,
            "budget_options": budget_options,
            "map_data": map_data,
            "recommendations": ["Drink plenty of water", "Wear comfortable walking shoes"]
        }
