import io
import re

with io.open("backend/main.py", "r", encoding="utf-8") as f:
    code = f.read()

# Add import at the top
if "from ai_engine.planner import generate_travel_plan" not in code:
    code = code.replace("from pydantic import BaseModel", "from pydantic import BaseModel\nfrom ai_engine.planner import generate_travel_plan")

# Replace JourneyRequest class and the endpoint
old_request = """class JourneyRequest(BaseModel):
    destinations: list[str]
    days: int
    budget: str
    travel_style: str
    hotel: Optional[str] = None"""

# Wait, the endpoint might be using the old fields. I should map the old JourneyRequest fields to the new ones to avoid breaking the frontend immediately, or update the model.
# I'll update JourneyRequest to map to UserRequirements or just pass the raw dict.

new_request = """class JourneyRequest(BaseModel):
    starting_location: str = "Amman"
    preferred_destinations: list[str] = []
    trip_duration_days: int = 3
    number_of_travelers: int = 2
    budget: float = 1000.0
    travel_style: list[str] = ["Luxury"]
    hotel_preference: str = "Standard"

@app.post("/api/generate-journey")
def generate_journey(request: JourneyRequest):
    if not GEMINI_API_KEY:
        return {"error": "Gemini API Key is missing."}
    
    # We use the new AI engine instead of raw prompt
    req_data = request.dict()
    try:
        plan = generate_travel_plan(req_data, model)
        return {"journey": plan}
    except Exception as e:
        return {"error": str(e)}
"""

# We need to aggressively replace the old endpoint.
match = re.search(r'class JourneyRequest\(BaseModel\):.*?def generate_journey\(.*?\):.*?(?=@app\.post|@app\.get|@app\.put|$)', code, re.DOTALL)
if match:
    code = code[:match.start()] + new_request + "\n\n" + code[match.end():]
    with io.open("backend/main.py", "w", encoding="utf-8") as f:
        f.write(code)
    print("Upgraded main.py to use the new AI Travel Engine!")
else:
    print("Could not find endpoint to replace.")
