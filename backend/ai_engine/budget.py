from typing import Dict, List
from .tools import get_location_details

def calculate_budget(destinations: List[str], trip_duration_days: int, travelers: int, hotel_preference: str, fuel_cost: float) -> Dict:
    # 1. Activities cost
    activity_cost = 0
    for dest in destinations:
        details = get_location_details(dest)
        activity_cost += details["cost"] * travelers
        
    # 2. Hotel cost
    hotel_rate = 50 # standard
    if hotel_preference.lower() == "budget":
        hotel_rate = 25
    elif hotel_preference.lower() == "luxury":
        hotel_rate = 150
        
    nights = max(0, trip_duration_days - 1)
    # Assuming 2 people per room
    rooms_needed = max(1, (travelers + 1) // 2)
    hotel_total = hotel_rate * rooms_needed * nights
    
    # 3. Food cost
    food_per_person_per_day = 15 # standard
    if hotel_preference.lower() == "luxury":
        food_per_person_per_day = 40
    food_total = food_per_person_per_day * travelers * trip_duration_days
    
    total = fuel_cost + hotel_total + food_total + activity_cost
    
    return {
        "transport_cost": round(fuel_cost, 2),
        "hotel_cost": round(hotel_total, 2),
        "food_cost": round(food_total, 2),
        "activity_cost": round(activity_cost, 2),
        "total_cost": round(total, 2)
    }
