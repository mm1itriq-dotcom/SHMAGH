import io
import re

with io.open("frontend/js/destinations.js", "r", encoding="utf-8") as f:
    js = f.read()

old_render = """                // Render the AI response beautifully
                let html = `<div style="color: #fff; line-height: 1.6; font-size: 0.9rem;">`;
                html += `<h3 style="color: var(--gold); margin-bottom: 1rem; font-family: 'Playfair Display', serif; font-size: 1.5rem;">Your ${data.days || destNames.length}-Day Adventure</h3>`;
                
                if (data.itinerary && Array.isArray(data.itinerary)) {
                    data.itinerary.forEach((day, index) => {
                        html += `
                            <div style="margin-bottom: 1.5rem; background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px; border-left: 3px solid var(--gold);">
                                <h4 style="margin: 0 0 0.5rem 0; color: #fff;">Day ${day.day}: ${day.location}</h4>
                                <p style="margin: 0 0 0.5rem 0; color: #ccc;">${day.description}</p>
                                <span style="font-size: 0.8rem; color: var(--gold); background: rgba(212, 175, 55, 0.1); padding: 0.2rem 0.5rem; border-radius: 4px;">${day.activity}</span>
                            </div>
                        `;
                    });
                } else {
                    html += `<p>${JSON.stringify(data)}</p>`;
                }
                html += `</div>`;"""

new_render = """                // Render the AI response beautifully
                let html = `<div style="color: #fff; line-height: 1.6; font-size: 0.9rem;">`;
                
                // Use the nested 'journey' object if it exists
                const journeyData = data.journey || data;
                
                html += `<h3 style="color: var(--gold); margin-bottom: 0.5rem; font-family: 'Playfair Display', serif; font-size: 1.5rem;">Your Optimal Adventure</h3>`;
                
                if (journeyData.recommended_trip) {
                    html += `<p style="color: #ccc; margin-bottom: 1rem;">Optimized Route: <strong>${journeyData.recommended_trip.route.join(' &rarr; ')}</strong></p>`;
                }

                if (journeyData.itinerary && Array.isArray(journeyData.itinerary)) {
                    journeyData.itinerary.forEach((day) => {
                        let locations = Array.isArray(day.locations) ? day.locations.join(', ') : day.locations || 'TBD';
                        let activities = Array.isArray(day.activities) ? day.activities.join(' • ') : day.activities || 'Sightseeing';
                        
                        html += `
                            <div style="margin-bottom: 1rem; background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px; border-left: 3px solid var(--gold);">
                                <h4 style="margin: 0 0 0.5rem 0; color: #fff;">Day ${day.day}: ${locations}</h4>
                                <div style="margin-bottom: 0.5rem;">
                                    <span style="font-size: 0.8rem; color: var(--gold); background: rgba(212, 175, 55, 0.1); padding: 0.2rem 0.5rem; border-radius: 4px; margin-right: 0.5rem;">🚗 ${day.driving_time || 'N/A'}</span>
                                    <span style="font-size: 0.8rem; color: var(--gold); background: rgba(212, 175, 55, 0.1); padding: 0.2rem 0.5rem; border-radius: 4px;">💰 ${day.estimated_cost || 'N/A'}</span>
                                </div>
                                <p style="margin: 0; color: #ccc; font-size: 0.85rem;">${activities}</p>
                            </div>
                        `;
                    });
                }
                
                if (journeyData.cost_analysis) {
                    html += `
                        <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1);">
                            <h4 style="color: var(--gold); margin-bottom: 0.5rem;">Budget Breakdown</h4>
                            <ul style="list-style: none; padding: 0; margin: 0; color: #ccc; font-size: 0.85rem;">
                                <li>Transport: ${journeyData.cost_analysis.transport_cost} JOD</li>
                                <li>Hotels: ${journeyData.cost_analysis.hotel_cost} JOD</li>
                                <li>Food: ${journeyData.cost_analysis.food_cost} JOD</li>
                                <li>Activities: ${journeyData.cost_analysis.activity_cost} JOD</li>
                                <li><strong>Total Estimated: ${journeyData.cost_analysis.total_cost} JOD</strong></li>
                            </ul>
                        </div>
                    `;
                }
                
                html += `</div>`;"""

# I will replace it loosely
# The previous string replacement might fail due to whitespace mismatch. I will use a regex replacing everything from '// Render the AI response beautifully' to 'html += `</div>`;'
match = re.search(r'// Render the AI response beautifully.*?html \+= `</div>`;', js, re.DOTALL)
if match:
    js = js[:match.start()] + new_render + js[match.end():]
    with io.open("frontend/js/destinations.js", "w", encoding="utf-8") as f:
        f.write(js)
    print("Frontend rendering updated successfully!")
else:
    print("Could not find the rendering block.")
