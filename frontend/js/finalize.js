import { auth, db, doc, getDoc, updateDoc } from './firebase-init.js';
document.addEventListener('DOMContentLoaded', () => {
    // 1. Load Selected Destinations
    const savedJourney = sessionStorage.getItem('shmagh_journey');
    const myJourney = savedJourney ? JSON.parse(savedJourney) : [];
    
    if (myJourney.length === 0) {
        // Redirect back if nothing selected
        window.location.href = 'destinations.html';
        return;
    }

    const container = document.getElementById('selected-destinations-container');
    
    function renderDestinations() {
        container.innerHTML = '';
        myJourney.forEach((dest, index) => {
            const pill = document.createElement('div');
            pill.className = 'dest-pill';
            pill.innerHTML = `
                ${dest.name}
                <button type="button" data-index="${index}"><i class="ph ph-x"></i></button>
            `;
            container.appendChild(pill);
        });

        // Add event listeners for remove
        document.querySelectorAll('.dest-pill button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.currentTarget.getAttribute('data-index');
                myJourney.splice(idx, 1);
                sessionStorage.setItem('shmagh_journey', JSON.stringify(myJourney));
                if (myJourney.length === 0) {
                    window.location.href = 'destinations.html';
                } else {
                    renderDestinations();
                }
            });
        });
    }
    
    renderDestinations();

    // 2. Initialize Flatpickr for Dates
    flatpickr("#checkin-date", {
        altInput: true,
        altFormat: "M j, Y",
        dateFormat: "Y-m-d",
        minDate: "today"
    });
    
    flatpickr("#checkout-date", {
        altInput: true,
        altFormat: "M j, Y",
        dateFormat: "Y-m-d",
        minDate: new Date().fp_incr(1) // tomorrow
    });

    // 3. Guest Popover Logic
    const guestsInput = document.getElementById('guests-input');
    const guestPopover = document.getElementById('guest-popover');
    
    guestsInput.addEventListener('click', (e) => {
        e.stopPropagation();
        guestPopover.classList.toggle('active');
    });
    
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.guest-control-container')) {
            guestPopover.classList.remove('active');
        }
    });

    const guestData = { adults: 2, children: 0, rooms: 1 };
    
    function updateGuestInput() {
        let text = `${guestData.adults} Adult${guestData.adults !== 1 ? 's' : ''}`;
        if (guestData.children > 0) {
            text += `, ${guestData.children} Child${guestData.children !== 1 ? 'ren' : ''}`;
        }
        guestsInput.value = text;
    }

    function setupCounter(id, key, min, max) {
        const countSpan = document.getElementById(`${id}-count`);
        document.getElementById(`${id}-minus`).addEventListener('click', () => {
            if (guestData[key] > min) {
                guestData[key]--;
                countSpan.innerText = guestData[key];
                updateGuestInput();
            }
        });
        document.getElementById(`${id}-plus`).addEventListener('click', () => {
            if (guestData[key] < max) {
                guestData[key]++;
                countSpan.innerText = guestData[key];
                updateGuestInput();
            }
        });
    }

    setupCounter('adults', 'adults', 1, 10);
    setupCounter('children', 'children', 0, 10);
    setupCounter('rooms', 'rooms', 1, 5);

    // 4. Hotel Search & Filter
    const mockHotels = [
        {
            id: 1,
            name: "The Mövenpick Resort Petra",
            location: "Petra, Jordan",
            stars: 5,
            price: "225JD",
            img: "assets/The Mövenpick Resort Petra.png",
            desc: "5-star luxury at the entrance of Petra. Spacious rooms, fine dining..."
        },
        {
            id: 2,
            name: "Seven Wonders Bedouin Camp",
            location: "Petra, Jordan",
            stars: 5,
            price: "170JD",
            img: "assets/Seven Wonders Bedouin Camp.jpg",
            desc: "Experience traditional Bedouin hospitality in a luxury desert setting..."
        },
        {
            id: 3,
            name: "Kempinski Hotel Ishtar",
            location: "Dead Sea, Jordan",
            stars: 5,
            price: "270JD",
            img: "assets/Kempinski Hotel Ishtar.jpg",
            desc: "Luxury infinity pools overlooking the Dead Sea with a world-class spa."
        },
        {
            id: 4,
            name: "W Amman Hotel",
            location: "Amman, Jordan",
            stars: 5,
            price: "210JD",
            img: "assets/W Amman Hotel.jpg",
            desc: "A bold, contemporary architectural statement in the heart of modern Amman."
        }
    ];

    const hotelGrid = document.getElementById('hotel-grid');
    const hotelSearchInput = document.getElementById('hotel-search-input');
    let selectedHotelId = null;

    function renderHotels(hotels) {
        hotelGrid.innerHTML = '';
        if (hotels.length === 0) {
            hotelGrid.innerHTML = '<p style="color:#aaa; text-align:center; width:100%; grid-column: 1/-1;">No luxury hotels match your search.</p>';
            return;
        }

        hotels.forEach(hotel => {
            const card = document.createElement('div');
            card.className = 'hotel-card';
            
            // Build stars string
            const starsHtml = Array(hotel.stars).fill('<i class="ph-fill ph-star"></i>').join('');

            card.innerHTML = `
                <img src="${hotel.img}" alt="${hotel.name}">
                <div class="hotel-info">
                    <div>
                        <div class="stars">${starsHtml}</div>
                        <h3>${hotel.name}</h3>
                        <div class="location"><i class="ph ph-map-pin"></i> ${hotel.location}</div>
                        <p class="desc">${hotel.desc}</p>
                    </div>
                    <div class="hotel-bottom">
                        <div class="hotel-price">${hotel.price} <span>/ night</span></div>
                        <button class="select-hotel-btn ${selectedHotelId === hotel.id ? 'selected' : ''}" data-id="${hotel.id}">
                            ${selectedHotelId === hotel.id ? 'Selected' : 'Select'}
                        </button>
                    </div>
                </div>
            `;
            hotelGrid.appendChild(card);
        });

        // Add selection logic
        document.querySelectorAll('.select-hotel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                selectedHotelId = (selectedHotelId === id) ? null : id; // Toggle
                renderHotels(hotels); // re-render to update buttons
            });
        });
    }

    // Initial render
    renderHotels(mockHotels);

    // Auto-filter while typing
    hotelSearchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = mockHotels.filter(h => 
            h.name.toLowerCase().includes(query) || 
            h.location.toLowerCase().includes(query)
        );
        renderHotels(filtered);
    });


    // 5. Confirm Action -> Show Ticket Panel
    const confirmBtn = document.getElementById('confirm-journey-btn');
    const ticketOverlay = document.getElementById('ticket-overlay');
    const ticketPanel = document.getElementById('ticket-panel');
    const closeTicketBtn = document.getElementById('close-ticket-btn');
    if (closeTicketBtn) {
        closeTicketBtn.addEventListener('click', () => {
            ticketOverlay.classList.remove('active');
            ticketPanel.classList.remove('active');
        });
    }
    if (ticketOverlay) {
        ticketOverlay.addEventListener('click', () => {
            ticketOverlay.classList.remove('active');
            ticketPanel.classList.remove('active');
        });
    }
    const generateTicketBtn = document.getElementById('ticket-generate-btn');
    const chatArea = document.getElementById('ticket-chat-area');
    const feedbackInput = document.getElementById('chat-feedback-input');

    // Ticket UI Elements
    const tDates = document.getElementById('ticket-dates');
    const tGuests = document.getElementById('ticket-guests');
    const tBudget = document.getElementById('ticket-budget');
    const tHotel = document.getElementById('ticket-hotel');
    const tPlaces = document.getElementById('ticket-places');

    
    
    // --- Update Summary Live ---
    function updateSummary() {
        const checkinEl = document.getElementById('checkin-date');
        const checkoutEl = document.getElementById('checkout-date');
        const budgetEl = document.getElementById('budget-input');
        
        const checkin = checkinEl ? checkinEl.value : '';
        const checkout = checkoutEl ? checkoutEl.value : '';
        const budget = budgetEl ? parseFloat(budgetEl.value) || 0 : 0;
        
        let guests = 2;
        const guestsInput = document.getElementById('guests-input');
        if (guestsInput && guestsInput.value) {
            guests = parseInt(guestsInput.value) || 2;
        } else {
            const ac = document.getElementById('adults-count');
            const cc = document.getElementById('children-count');
            if (ac && cc) guests = parseInt(ac.innerText) + parseInt(cc.innerText);
        }
        
        let d1 = checkin ? new Date(checkin) : new Date();
        let d2 = checkout ? new Date(checkout) : new Date(d1.getTime() + 86400000 * 2);
        let nights = Math.max(1, Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)));
        
        let hotelName = "Standard/Local";
        let estHotelCost = 70 * nights;
        if (typeof selectedHotelId !== 'undefined' && selectedHotelId) {
            const h = mockHotels.find(x => x.id === selectedHotelId);
            if (h) {
                hotelName = h.name;
                let ppn = 150;
                if(h.name.toLowerCase().includes('kempinski') || h.name.toLowerCase().includes('st. regis')) ppn = 250;
                else if(h.name.toLowerCase().includes('marriott')) ppn = 180;
                estHotelCost = ppn * nights;
            }
        }
        
        // Safely update the TICKET panel summary (which shows when chatbot opens)
        const td = document.getElementById('ticket-dates');
        if (td) td.innerText = `${d1.toDateString()} - ${d2.toDateString()}`;
        
        const tg = document.getElementById('ticket-guests');
        if (tg) tg.innerText = `${guests} Travelers`;
        
        const tb = document.getElementById('ticket-budget');
        if (tb) tb.innerText = budget > 0 ? `${budget} JOD` : 'No Limit';
        
        const th = document.getElementById('ticket-hotel');
        if (th) th.innerText = hotelName;
        
        const tp = document.getElementById('ticket-places');
        if (tp && typeof myJourney !== 'undefined') {
            tp.innerText = myJourney.map(d => d.name_en || d.name).join(', ');
        }
        
        return {
            checkin, checkout, budget, guests, hotelName, estHotelCost, nights
        };
    }

    // Generate My Journey (Formerly Confirm)
    const btnContinue = document.getElementById('btn-continue-anyway');
    const btnChangeHotel = document.getElementById('btn-change-hotel');
    const btnAdjustBudget = document.getElementById('btn-adjust-budget');

    if(confirmBtn) {
        // Overwrite the listener by replacing the clone
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        newConfirmBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            try {
                const s = updateSummary();
                const destNames = typeof myJourney !== 'undefined' ? myJourney.map(d => d.name_en || d.name) : [];
                
                let estTransport = destNames.length * 20;
                let estFood = s.nights * s.guests * 40;
                let estActivities = destNames.length * 15;
                let totalEst = s.estHotelCost + estTransport + estFood + estActivities;
                
                if (s.budget > 0 && totalEst > s.budget) {
                    const bwText = document.getElementById('budget-warning-text');
                    if(bwText) bwText.innerText = `Your selected plan exceeds your budget by roughly ${totalEst - s.budget} JOD.`;
                    
                    const bwModal = document.getElementById('budget-warning-modal');
                    if(bwModal) bwModal.style.display = 'flex';
                } else {
                    startGeneration();
                }
            } catch (err) {
                console.error("Error in generate button:", err);
                startGeneration(); // Fallback to generate anyway
            }
        });
    }

    if(btnContinue) {
        btnContinue.addEventListener('click', () => {
            document.getElementById('budget-warning-modal').style.display = 'none';
            startGeneration();
        });
    }
    
    if(btnChangeHotel) {
        btnChangeHotel.addEventListener('click', () => {
            document.getElementById('budget-warning-modal').style.display = 'none';
            const hSearch = document.getElementById('hotel-search-input');
            if(hSearch) hSearch.focus();
        });
    }
    
    if(btnAdjustBudget) {
        btnAdjustBudget.addEventListener('click', () => {
            document.getElementById('budget-warning-modal').style.display = 'none';
            const bInput = document.getElementById('budget-input');
            if(bInput) bInput.focus();
        });
    }

    async function startGeneration(feedbackText = null) {
        const s = updateSummary();
        const destNames = myJourney.map(d => d.name_en || d.name);
        
        const overlay = document.getElementById('generation-loading-overlay');
        overlay.style.display = 'flex';
        
        const steps = ['step-1', 'step-2', 'step-3', 'step-4', 'step-5'];
        
        for (let i = 0; i < steps.length; i++) {
            setTimeout(() => {
                const el = document.getElementById(steps[i]);
                if(el) {
                    el.innerHTML = `<i class="ph-fill ph-check-circle" style="color: var(--gold);"></i> ` + el.innerText.replace('✓ ', '').trim();
                    el.style.color = '#fff';
                }
            }, i * 1500);
        }

        const token = sessionStorage.getItem('shmagh_token');
        
        const payload = {
            dates: {
                start: s.checkin || new Date().toISOString().split('T')[0],
                end: s.checkout || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
            },
            travelers: s.guests,
            budget: s.budget > 0 ? s.budget : 9999,
            hotel: {
                name: s.hotelName
            },
            destinations: destNames
        };
        
        if (feedbackText) {
            payload.feedback = feedbackText;
        }

        try {
            const response = await fetch('http://127.0.0.1:8000/api/generate-journey', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            
            overlay.style.display = 'none';
            ticketPanel.classList.add('active'); // Open Chatbot Ticket Panel
            
            if (response.ok) {
                if (data.error || (data.journey && data.journey.error)) {
                    chatArea.innerHTML += `<div class="chat-message ai-message"><strong style="color:red;">API Error</strong><p>${data.error || data.journey.error}</p></div>`;
                } else {
                    const journeyData = data.journey || data;
                    
                    // --- Validation Layer ---
                    let isValid = true;
                    const routeArr = journeyData.recommended_trip?.route || [];
                    const routeStr = routeArr.join(' ').toLowerCase();
                    for (const dest of destNames) {
                        if (!routeStr.includes(dest.toLowerCase())) {
                            isValid = false; break;
                        }
                    }
                    if (isValid && journeyData.itinerary) {
                        for (const day of journeyData.itinerary) {
                            if (day.driving_segments) {
                                for (const seg of day.driving_segments) {
                                    if (seg.includes('Distance: 0 ') || seg.includes('Duration: 0 ')) {
                                        isValid = false; break;
                                    }
                                }
                            }
                        }
                    }
                    if (isValid && journeyData.cost_analysis) {
                        const ca = journeyData.cost_analysis;
                        if (!ca.hotel_cost && !ca.hotel && !ca.Hotel) isValid = false;
                        if (!ca.transport_cost && !ca.transportation && !ca.Transportation) isValid = false;
                    } else { isValid = false; }
                    
                    if (isValid && journeyData.map_data) {
                        const md = journeyData.map_data;
                        if (!md.restaurants || md.restaurants.length === 0 || typeof md.restaurants[0] !== 'object') isValid = false;
                        if (!md.hidden_gems || md.hidden_gems.length === 0 || typeof md.hidden_gems[0] !== 'object') isValid = false;
                        
                        // Check if unrelated locations are added
                        if (md.restaurants && md.restaurants.length > 0) {
                            for (const r of md.restaurants) {
                                let match = false;
                                for (const d of routeArr) {
                                    if (r.location && r.location.toLowerCase().includes(d.toLowerCase())) match = true;
                                }
                                if (!match) isValid = false;
                            }
                        }
                    } else { isValid = false; }
                    
                    if (!isValid) {
                        if ((window._generationRetries || 0) < 2) {
                            window._generationRetries = (window._generationRetries || 0) + 1;
                            console.warn("Validation failed. Regenerating... Attempt: " + window._generationRetries);
                            startGeneration();
                            return;
                        } else {
                            chatArea.innerHTML += `<div class="chat-message ai-message"><strong style="color:red;">Validation Error</strong><p>Missing API data or invalid route segments after multiple attempts.</p></div>`;
                            window._generationRetries = 0;
                            return;
                        }
                    }
                    window._generationRetries = 0;
                    // --- End Validation ---
                    
                    renderJourneyToChat(journeyData);
                }
            } else {
                chatArea.innerHTML += `<div class="chat-message ai-message"><strong style="color:red;">Error</strong><p>${JSON.stringify(data)}</p></div>`;
            }
        } catch(e) {
            overlay.style.display = 'none';
            ticketPanel.classList.add('active');
            chatArea.innerHTML += `<div class="chat-message ai-message"><strong style="color:red;">Network Error</strong><p>Could not connect to AI service.</p></div>`;
        }
    }

    
    function renderJourneyToChat(journeyData) {
        const uniqueId = 'itinerary-' + Date.now();
        const uniqueSaveId = 'save-btn-' + Date.now();
        let html = `<div id="${uniqueId}" style="animation: fadeIn 0.5s ease;">`;
        html += '<strong style="font-size: 1.2rem; color: var(--gold); display: block; margin-bottom: 1.5rem;"><i class="ph-fill ph-magic-wand"></i> AI Travel Concierge</strong>';
        
        if (journeyData.trip_summary) {
            html += '<div class="itinerary-card">';
            html += '<h4><i class="ph-fill ph-clipboard-text"></i> Trip Summary</h4>';
            html += '<ul style="list-style: none; padding: 0; margin: 0;">';
            html += `<li style="margin-bottom: 0.5rem;"><strong>Dates:</strong> ${journeyData.trip_summary.Dates}</li>`;
            html += `<li style="margin-bottom: 0.5rem;"><strong>Travelers:</strong> ${journeyData.trip_summary.Travelers}</li>`;
            html += `<li style="margin-bottom: 0.5rem;"><strong>Hotel:</strong> ${journeyData.trip_summary.Hotel}</li>`;
            html += `<li style="margin-bottom: 0.5rem;"><strong>Budget:</strong> ${journeyData.trip_summary.Budget}</li>`;
            html += '</ul></div>';
        }
        
        if (journeyData.recommended_trip && journeyData.recommended_trip.route) {
            html += '<div class="itinerary-card">';
            html += '<h4><i class="ph-fill ph-map-pin-line"></i> Optimized Route</h4>';
            html += `<p style="font-size: 1.1rem; color: #fff; font-weight: bold;">${journeyData.recommended_trip.route.join(' &rarr; ')}</p>`;
            html += '</div>';
        }

        if (journeyData.itinerary && Array.isArray(journeyData.itinerary)) {
            journeyData.itinerary.forEach((day) => {
                html += '<div class="itinerary-card">';
                html += `<h4>${day.day_title || ''} - ${day.date || ''}</h4>`;
                if (day.theme) html += `<p style="font-style: italic; color: var(--gold);">${day.theme}</p>`;
                
                if (day.morning_activities && day.morning_activities.length) {
                    html += `<h5>Morning</h5><p>&bull; ${day.morning_activities.join('<br>&bull; ')}</p>`;
                }
                if (day.afternoon_activities && day.afternoon_activities.length) {
                    html += `<h5>Afternoon</h5><p>&bull; ${day.afternoon_activities.join('<br>&bull; ')}</p>`;
                }
                if (day.evening_activities && day.evening_activities.length) {
                    html += `<h5>Evening</h5><p>&bull; ${day.evening_activities.join('<br>&bull; ')}</p>`;
                }
                if (day.driving_segments && day.driving_segments.length) {
                    html += `<h5><i class="ph ph-car"></i> Driving</h5><p style="color: #aaa;">${day.driving_segments.join('<br>')}</p>`;
                }
                html += '</div>';
            });
        }
        
        if (journeyData.cost_analysis) {
            const ca = journeyData.cost_analysis;
            const hCost = ca.hotel_cost || ca.hotel || ca.Hotel || '-';
            const tCost = ca.transport_cost || ca.transportation || ca.Transportation || '-';
            const fCost = ca.food_cost || ca.food || ca.Food || '-';
            const aCost = ca.activity_cost || ca.activities || ca.Activities || '-';
            const totCost = ca.total_cost || ca.total || ca.Total || '-';
            
            html += '<details class="budget-details">';
            html += `<summary><i class="ph-fill ph-wallet"></i> Budget Summary &nbsp; <span style="color: #fff; font-weight: normal;">${totCost}</span></summary>`;
            html += '<div class="budget-content">';
            html += '<ul style="list-style: none; padding: 0; margin: 0;">';
            html += `<li style="margin-bottom: 0.5rem; display: flex; justify-content: space-between;"><span>Hotel:</span> <span>${hCost}</span></li>`;
            html += `<li style="margin-bottom: 0.5rem; display: flex; justify-content: space-between;"><span>Transportation:</span> <span>${tCost}</span></li>`;
            html += `<li style="margin-bottom: 0.5rem; display: flex; justify-content: space-between;"><span>Food:</span> <span>${fCost}</span></li>`;
            html += `<li style="margin-bottom: 0.5rem; display: flex; justify-content: space-between;"><span>Activities:</span> <span>${aCost}</span></li>`;
            html += `<li style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; font-weight: bold; color: #fff;"><span>Total:</span> <span>${totCost}</span></li>`;
            html += '</ul></div></details>';
        }

        // --- Recommended Restaurants ---
        html += '<div class="itinerary-card" style="margin-top: 1.5rem;">';
        html += '<h4><i class="ph-fill ph-fork-knife"></i> Recommended Restaurants</h4>';
        if (journeyData.map_data && journeyData.map_data.restaurants && journeyData.map_data.restaurants.length > 0 && typeof journeyData.map_data.restaurants[0] === 'object') {
            journeyData.map_data.restaurants.forEach(r => {
                html += `<div style="margin-bottom: 0.8rem;">
                    <strong>${r.name || 'Unknown'}</strong><br>
                    <span style="color:#aaa;">Location: ${r.location || 'Unknown'}</span><br>
                    <span style="color:var(--gold);">Rating: ${r.rating || 'N/A'}</span> | <span>Price: ${r.price_level || r.price_range || 'N/A'}</span><br>
                    <span style="color:#ccc;">Cuisine: ${r.cuisine_type || 'N/A'}</span><br>
                    <span style="color:#eee;">Recommended dish: ${r.recommended_dish || 'N/A'}</span><br>
                    <em style="font-size:0.9rem; color:#aaa;">Why visit: ${r.reason || r.why_visit || 'N/A'}</em>
                </div>`;
            });
        } else {
            html += '<p>No restaurant recommendations available</p>';
        }
        html += '</div>';

        // --- Hidden Gems ---
        html += '<div class="itinerary-card">';
        html += '<h4><i class="ph-fill ph-diamond"></i> Hidden Gems</h4>';
        if (journeyData.map_data && journeyData.map_data.hidden_gems && journeyData.map_data.hidden_gems.length > 0 && typeof journeyData.map_data.hidden_gems[0] === 'object') {
            journeyData.map_data.hidden_gems.forEach(g => {
                html += `<div style="margin-bottom: 0.8rem;">
                    <strong>${g.name || 'Unknown'}</strong><br>
                    <span style="color:#aaa;">Location: ${g.location || 'Unknown'}</span><br>
                    <em style="font-size:0.9rem; color:#ccc;">${g.description || ''}</em><br>
                    <span style="font-size:0.9rem; color:#eee;">Why visit: ${g.why_visit || 'N/A'}</span><br>
                    <span style="font-size:0.9rem; color:var(--gold);">Best time: ${g.best_time || 'N/A'}</span>
                </div>`;
            });
        } else {
            html += '<p>No hidden gems available</p>';
        }
        html += '</div>';

        // Action Buttons inside the chat
        html += '<div class="ai-actions-row">';
        html += '<button class="ai-action-btn primary" onclick="document.getElementById(\'regen-re-generate\').click()"><i class="ph-fill ph-magic-wand"></i> Regenerate</button>';
        html += `<button class="ai-action-btn" id="${uniqueSaveId}" style="background: #27ae60; border-color: #27ae60; color: #fff;"><i class="ph-fill ph-floppy-disk"></i> Save Journey</button>`;
        html += '<button class="ai-action-btn" onclick="document.getElementById(\'regen-change-budget\').click()"><i class="ph ph-wallet"></i> Change Budget</button>';
        html += '<button class="ai-action-btn" onclick="document.getElementById(\'regen-change-hotel\').click()"><i class="ph ph-bed"></i> Change Hotel</button>';
        html += '<button class="ai-action-btn" onclick="document.getElementById(\'regen-add-dest\').click()"><i class="ph ph-plus"></i> Add Destination</button>';
        html += '<button class="ai-action-btn" onclick="document.getElementById(\'ticket-overlay\').click()"><i class="ph ph-pencil-simple"></i> Modify Trip</button>';
        html += '</div>';

        html += '</div>'; // End unique container

        const wrapper = document.createElement('div');
        wrapper.className = 'chat-message ai-message';
        wrapper.innerHTML = html;
        chatArea.appendChild(wrapper);
        
        // Scroll specifically to this newly created itinerary!
        setTimeout(() => {
            const el = document.getElementById(uniqueId);
            if (el) {
                // We use scrollIntoView so the user sees "Trip Summary" clearly.
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);

        // Make the Save to Journal button available in footer (optional, still nice)
        setTimeout(() => {
            const saveBtn = document.getElementById(uniqueSaveId);
            if (saveBtn) {
                saveBtn.addEventListener('click', async () => {
                    try {
                        saveBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Saving...';
                        saveBtn.disabled = true;
                        const destNames = typeof myJourney !== 'undefined' ? myJourney.map(d => d.name_en || d.name) : [];
                        const ticketTitle = `Journey: ${destNames.join(', ')}`;
                        const user = auth.currentUser;
                        if (!user) throw new Error("Not logged in");
                        
                        const userRef = doc(db, "users", user.uid);
                        const userSnap = await getDoc(userRef);
                        let currentJournal = [];
                        if (userSnap.exists() && userSnap.data().journal) {
                            currentJournal = userSnap.data().journal;
                        }
                        
                        const newEntry = {
                            id: Date.now().toString(),
                            title: ticketTitle,
                            date: new Date().toISOString().split('T')[0],
                            itinerary_data: journeyData
                        };
                        currentJournal.push(newEntry);
                        
                        await updateDoc(userRef, { journal: currentJournal });
                        if (true) {
                            saveBtn.style.background = '#219653';
                            saveBtn.innerHTML = '<i class="ph-fill ph-check-circle"></i> Saved!';
                            if(typeof showToast !== 'undefined') showToast("Itinerary saved to your Journal!", "success");
                        } else {
                            throw new Error('Failed to save');
                        }
                    } catch (e) {
                        saveBtn.disabled = false;
                        saveBtn.innerHTML = '<i class="ph-fill ph-floppy-disk"></i> Try Again';
                        if(typeof showToast !== 'undefined') showToast("Failed to save to journal", "error");
                    }
                });
            }
        }, 100);
    }

    // Regeneration Controls
    document.getElementById('regen-change-hotel')?.addEventListener('click', () => {
        ticketPanel.classList.remove('active');
        document.getElementById('hotel-search-input').focus();
    });
    document.getElementById('regen-change-budget')?.addEventListener('click', () => {
        ticketPanel.classList.remove('active');
        document.getElementById('budget-input').focus();
    });
    document.getElementById('regen-add-dest')?.addEventListener('click', () => {
        window.location.href = 'destinations.html';
    });
    document.getElementById('regen-remove-dest')?.addEventListener('click', () => {
        ticketPanel.classList.remove('active');
        document.getElementById('selected-destinations-container').scrollIntoView();
    });
    document.getElementById('regen-re-generate')?.addEventListener('click', () => {
        chatArea.innerHTML = `<div class="chat-message ai-message"><p>Regenerating journey...</p></div>`;
        ticketPanel.classList.remove('active');
        startGeneration();
    });

    // Chatbot send functionality
    const chatSendBtn = document.getElementById('chat-send-btn');
    const handleFeedbackSend = () => {
        const text = feedbackInput.value.trim();
        if (!text) return;
        
        // Render user message
        const userMsg = document.createElement('div');
        userMsg.className = 'chat-message user-message';
        userMsg.innerHTML = `<p>${text}</p>`;
        chatArea.appendChild(userMsg);
        
        // Clear input
        feedbackInput.value = '';
        
        // Render AI regenerating message
        const aiMsg = document.createElement('div');
        aiMsg.className = 'chat-message ai-message';
        aiMsg.innerHTML = `<p>Regenerating based on your feedback...</p>`;
        chatArea.appendChild(aiMsg);
        
        // Scroll to bottom
        chatArea.scrollTop = chatArea.scrollHeight;
        
        // Trigger regeneration
        startGeneration(text);
    };

    if (chatSendBtn) {
        chatSendBtn.addEventListener('click', handleFeedbackSend);
    }
    if (feedbackInput) {
        feedbackInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleFeedbackSend();
            }
        });
    }
});

