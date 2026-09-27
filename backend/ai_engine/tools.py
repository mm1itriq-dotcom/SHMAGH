import math
from typing import Dict, Tuple

# Mock Database for Jordan Destinations
JORDAN_DESTINATIONS = {
    "Amman": {"lat": 31.9522, "lon": 35.9334, "category": "Culture/City", "hours": 4, "cost": 20},
    "Dead Sea": {"lat": 31.5590, "lon": 35.4732, "category": "Nature/Relaxation", "hours": 5, "cost": 30},
    "Petra": {"lat": 30.3285, "lon": 35.4444, "category": "Historical", "hours": 8, "cost": 50},
    "Wadi Rum": {"lat": 29.5795, "lon": 35.4145, "category": "Nature/Adventure", "hours": 6, "cost": 40},
    "Aqaba": {"lat": 29.5319, "lon": 35.0036, "category": "Beach/City", "hours": 6, "cost": 25},
    "Jerash": {"lat": 32.2723, "lon": 35.8914, "category": "Historical", "hours": 4, "cost": 15},
    "Ajloun": {"lat": 32.3326, "lon": 35.7517, "category": "Nature/Historical", "hours": 3, "cost": 10},
    "Umm Qais": {"lat": 32.6534, "lon": 35.6863, "category": "Historical", "hours": 3, "cost": 10}
}

def get_location_details(name: str) -> Dict:
    return JORDAN_DESTINATIONS.get(name, {"lat": 0, "lon": 0, "category": "Unknown", "hours": 2, "cost": 15})

def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2) * math.sin(dlat/2) + math.cos(math.radians(lat1)) \
        * math.cos(math.radians(lat2)) * math.sin(dlon/2) * math.sin(dlon/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

def get_route_distance(loc1: str, loc2: str) -> float:
    d1 = get_location_details(loc1)
    d2 = get_location_details(loc2)
    
    # 1.3 multiplier to roughly convert straight-line distance to road distance in Jordan
    straight_line = haversine(d1["lat"], d1["lon"], d2["lat"], d2["lon"])
    return round(straight_line * 1.3, 2)

def calculate_travel_time(distance_km: float) -> float:
    # Average speed in Jordan is around 75 km/h for inter-city travel
    return round(distance_km / 75.0, 2)

def calculate_trip_cost(distance_km: float, vehicle_efficiency_km_per_l=12, fuel_price_per_l=1.1) -> float:
    liters_needed = distance_km / vehicle_efficiency_km_per_l
    return round(liters_needed * fuel_price_per_l, 2)
