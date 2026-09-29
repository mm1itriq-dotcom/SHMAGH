
from pydantic import BaseModel
from typing import List, Dict


class DatesConfig(BaseModel):
    start: str
    end: str

class HotelConfig(BaseModel):
    name: str

class UserRequirements(BaseModel):
    dates: DatesConfig
    travelers: int
    budget: float
    hotel: HotelConfig
    destinations: List[str]
    # Keep legacy for compatibility or optional
    starting_location: str = "Amman"
    currency: str = "JOD"
    travel_style: List[str] = []
    transportation_method: str = "car"

class DailyCostBreakdown(BaseModel):
    hotel: str
    transportation: str
    food: str
    activities: str
    daily_total: str

class DailyItinerary(BaseModel):
    day_title: str
    date: str
    theme: str
    morning_activities: List[str]
    afternoon_activities: List[str]
    evening_activities: List[str]
    driving_segments: List[str]
    restaurants: List[str]
    hotel: str
    cost_breakdown: DailyCostBreakdown

class Marker(BaseModel):
    name: str
    latitude: str
    longitude: str
    type: str

class MapData(BaseModel):
    route_polyline: str
    markers: List[Marker]
    restaurants: List[str]
    hidden_gems: List[str]

class BudgetBreakdown(BaseModel):
    transport_cost: str
    hotel_cost: str
    food_cost: str
    activity_cost: str
    total_cost: str

class FinalResponse(BaseModel):
    trip_summary: Dict[str, str]
    recommended_trip: Dict
    itinerary: List[DailyItinerary]
    cost_analysis: BudgetBreakdown
    budget_status: str
    budget_options: List[str]
    map_data: MapData
    recommendations: List[str]
