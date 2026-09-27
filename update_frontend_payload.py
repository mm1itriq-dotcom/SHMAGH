import io
import re

with io.open("frontend/js/destinations.js", "r", encoding="utf-8") as f:
    js = f.read()

old_body = """body: JSON.stringify({
                        destinations: destNames,
                        days: Math.max(3, destNames.length), // Smart default
                        budget: "Standard",
                        travel_style: "Explorer"
                    })"""

new_body = """body: JSON.stringify({
                        starting_location: "Amman",
                        preferred_destinations: destNames,
                        trip_duration_days: Math.max(3, destNames.length),
                        number_of_travelers: 2,
                        budget: 1500.0,
                        travel_style: ["Explorer", "Cultural"],
                        hotel_preference: "Standard"
                    })"""

if old_body in js:
    js = js.replace(old_body, new_body)
    with io.open("frontend/js/destinations.js", "w", encoding="utf-8") as f:
        f.write(js)
    print("Frontend payload updated to match new AI Engine.")
else:
    print("Could not find frontend payload.")
