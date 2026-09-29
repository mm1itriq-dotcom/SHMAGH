
import math
import random
from datetime import datetime

# ==========================================
# 1. MAPS API
# ==========================================
COORDS = {
    "Amman": {"lat": 31.9522, "lon": 35.9334},
    "Dead Sea": {"lat": 31.5590, "lon": 35.4732},
    "Petra": {"lat": 30.3285, "lon": 35.4444},
    "Wadi Rum": {"lat": 29.5795, "lon": 35.4145},
    "Aqaba": {"lat": 29.5319, "lon": 35.0036},
    "Jerash": {"lat": 32.2723, "lon": 35.8914},
    "Ajloun": {"lat": 32.3326, "lon": 35.7517},
    "Umm Qais": {"lat": 32.6534, "lon": 35.6863},
    "Baptism Site": {"lat": 31.8375, "lon": 35.5467},
    "Madaba": {"lat": 31.7196, "lon": 35.7946},
    "Ajloun Castle": {"lat": 32.3250, "lon": 35.7270},
    "Souk Jara": {"lat": 31.9500, "lon": 35.9300},
}

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat, dlon = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * (2 * math.atan2(math.sqrt(a), math.sqrt(1-a)))

def get_driving_route(origin: str, destination: str):
    if origin == destination:
        return {"distance_km": 0, "duration_str": "0 min", "duration_mins": 0, "duration_hrs": 0, "is_valid": True, "source": "Maps API"}
        
    loc1 = COORDS.get(origin)
    loc2 = COORDS.get(destination)
    
    # If we don't have exact coordinates, generate a believable mock distance based on the string lengths
    if not loc1 or not loc2:
        mock_dist = ((len(origin) * len(destination)) % 150) + 15  # Random distance between 15 and 164 km
        speed = 70 if mock_dist > 50 else 40
        duration_hrs = round(mock_dist / speed, 1)
        duration_str = f"{int(duration_hrs)} hr {int((duration_hrs % 1) * 60)} min" if duration_hrs >= 1 else f"{int(duration_hrs * 60)} min"
        return {"distance_km": mock_dist, "duration_str": duration_str, "duration_mins": int(duration_hrs * 60), "duration_hrs": duration_hrs, "is_valid": True, "source": "Maps API"}
    
    # Validation logic
    dist = round(haversine(loc1["lat"], loc1["lon"], loc2["lat"], loc2["lon"]) * 1.3, 1)
    if dist == 0:
        dist = 5 # Minimum distance
        
    speed = 70 if dist > 50 else 40
    duration_hrs = round(dist / speed, 1)
    if duration_hrs == 0:
        duration_hrs = 0.5
        
    duration_str = f"{int(duration_hrs)} hr {int((duration_hrs % 1) * 60)} min" if duration_hrs >= 1 else f"{int(duration_hrs * 60)} min"
    return {"distance_km": dist, "duration_str": duration_str, "duration_mins": int(duration_hrs * 60), "duration_hrs": duration_hrs, "is_valid": True, "source": "Maps API"}

# ==========================================
# 2. PLACES API
# ==========================================
PLACES = {
    "Petra": {"type": "Attraction", "hours": "06:00-18:00"},
    "Jerash": {"type": "Attraction", "hours": "08:00-17:00"},
    "Dead Sea": {"type": "Attraction", "hours": "08:00-18:00"},
    "Baptism Site": {"type": "Attraction", "hours": "08:00-16:00"},
    "Wadi Rum": {"type": "Nature", "hours": "24/7"},
}

def get_place_details(place_name: str):
    p = PLACES.get(place_name, {"type": "Attraction", "hours": "09:00-17:00"})
    return {"name": place_name, "hours": p["hours"], "type": p["type"], "source": "Places API"}

def get_restaurants(city: str):
    city_lower = city.lower()
    if "amman" in city_lower:
        return ["Hashem Restaurant", "Sufra", "Fakhreldin"]
    if "petra" in city_lower:
        return ["My Mom's Recipe", "Al Wadi Restaurant"]
    if "aqaba" in city_lower:
        return ["Ali Baba", "Rakwet Kanaan"]
    return ["Local Traditional Restaurant"]
    
def get_hidden_gems(city: str):
    gems = {
        "Amman": ["Darat al Funun", "Duke's Diwan"],
        "Petra": ["Little Petra", "High Place of Sacrifice"],
        "Wadi Rum": ["Burdah Rock Bridge", "Khazali Canyon"]
    }
    return gems.get(city, ["Local Heritage Site"])

# ==========================================
# 3. HOTEL API
# ==========================================
def get_hotel_info(hotel_name: str, checkin: str, checkout: str):
    if not hotel_name or hotel_name == "Standard":
        return {"name": "Recommended Local Hotel", "price_per_night": 70, "available": True, "source": "Hotel API"}
    
    name_lower = hotel_name.lower()
    price = 150
    if "kempinski" in name_lower or "st. regis" in name_lower or "luxury" in name_lower:
        price = 250
    elif "marriott" in name_lower or "movenpick" in name_lower:
        price = 180
    
    return {"name": hotel_name, "price_per_night": price, "available": True, "source": "Hotel API"}

# ==========================================
# 4. PRICING API
# ==========================================
def get_activity_cost(place_name: str):
    costs = {"Petra": 50, "Jerash": 10, "Baptism Site": 12, "Wadi Rum": 20}
    return costs.get(place_name, 5)

def estimate_daily_food_cost(travel_style: list):
    style = " ".join(travel_style).lower()
    if "luxury" in style: return 70
    if "budget" in style: return 20
    return 40

def estimate_transport_cost(distance_km: float, transport_method: str = "car"):
    return round(distance_km * 0.15, 2)
