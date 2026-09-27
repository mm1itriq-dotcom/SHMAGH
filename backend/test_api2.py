import requests
import json

url = "http://localhost:8000/api/generate-journey"
headers = {"Content-Type": "application/json"}
payload = {
    "starting_location": "Amman",
    "preferred_destinations": ["Petra", "Wadi Rum"],
    "trip_duration_days": 3,
    "number_of_travelers": 2,
    "budget": 1500.0,
    "travel_style": ["Explorer", "Cultural"],
    "hotel_preference": "Standard"
}

resp = requests.post(url, json=payload, headers=headers)
print("STATUS:", resp.status_code)
print("RESPONSE:", resp.text)
