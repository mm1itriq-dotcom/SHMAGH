import io

with io.open("backend/main.py", "r", encoding="utf-8") as f:
    code = f.read()

code = code.replace(
    "plan = generate_travel_plan(req_data, model)", 
    "import google.generativeai as genai\n        model = genai.GenerativeModel('gemini-1.5-flash')\n        plan = generate_travel_plan(req_data, model)"
)

with io.open("backend/main.py", "w", encoding="utf-8") as f:
    f.write(code)
print("Model initialized in endpoint.")
