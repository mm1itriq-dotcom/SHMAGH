from pydantic import BaseModel, Field
from typing import List, Optional, Dict

class UserRequirements(BaseModel):
    starting_location: str
    preferred_destinations: List[str]
    trip_duration_days: int
    number_of_travelers: int
    budget: float
    currency: str = "JOD"
    travel_style: List[str] = []
    transportation_method: str = "car"
    interests: List[str] = []
    hotel_preference: str = "Standard"
    activity_preferences: List[str] = []

class DestinationInfo(BaseModel):
    name: str
    lat: float
    lon: float
    category: str
    recommended_duration_hours: int
    average_cost_jod: float
    opening_hours: str = "24/7"

class RouteSummary(BaseModel):
    route: List[str]
    total_distance_km: float
    total_driving_hours: float
    estimated_fuel_cost: float

class DailyItinerary(BaseModel):
    day: int
    locations: List[str]
    activities: List[str]
    driving_time: str
    estimated_cost: str

class BudgetBreakdown(BaseModel):
    transport_cost: float
    hotel_cost: float
    food_cost: float
    activity_cost: float
    total_cost: float

class AIResponse(BaseModel):
    trip_summary: str
    recommended_route: str
    days: List[DailyItinerary]
    hotel_recommendations: List[str]
    restaurant_recommendations: List[str]
    budget_breakdown: BudgetBreakdown

class FinalResponse(BaseModel):
    recommended_trip: Dict
    itinerary: List[DailyItinerary]
    cost_analysis: BudgetBreakdown
    recommendations: List[str]
