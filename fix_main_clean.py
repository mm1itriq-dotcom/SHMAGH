import io

with io.open("backend/main.py", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Add import
if "from ai_engine.planner import generate_travel_plan" not in code:
    code = code.replace("from pydantic import BaseModel", "from pydantic import BaseModel\nfrom ai_engine.planner import generate_travel_plan")

# 2. Re-write the generate_journey endpoint cleanly without destroying JWT
# Let's find exactly the generate_journey block.
start_str = '@app.post("/api/generate-journey")'

idx = code.find(start_str)
if idx != -1:
    # Find the next @app.post or @app.get to know where it ends
    next_idx1 = code.find('@app.post', idx + len(start_str))
    next_idx2 = code.find('@app.get', idx + len(start_str))
    next_idx3 = code.find('class ', idx + len(start_str))
    
    # filter out -1
    options = [i for i in [next_idx1, next_idx2, next_idx3] if i != -1]
    if options:
        end_idx = min(options)
    else:
        end_idx = len(code)
        
    old_endpoint = code[idx:end_idx]
    
    new_endpoint = """class AIJourneyRequest(BaseModel):
    starting_location: str = "Amman"
    preferred_destinations: list[str] = []
    trip_duration_days: int = 3
    number_of_travelers: int = 2
    budget: float = 1000.0
    travel_style: list[str] = ["Luxury"]
    hotel_preference: str = "Standard"

@app.post("/api/generate-journey")
def generate_journey(request: AIJourneyRequest, user_token=Depends(verify_jwt)):
    if not GEMINI_API_KEY:
        return {"error": "Gemini API Key is missing."}
    
    req_data = request.dict()
    try:
        plan = generate_travel_plan(req_data, model)
        return {"journey": plan}
    except Exception as e:
        return {"error": str(e)}

"""
    code = code[:idx] + new_endpoint + code[end_idx:]

with io.open("backend/main.py", "w", encoding="utf-8") as f:
    f.write(code)
    
print("Successfully patched main.py!")
