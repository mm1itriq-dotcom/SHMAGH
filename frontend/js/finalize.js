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
            price: "$650",
            img: "assets/petra.jpg",
            desc: "5-star luxury at the entrance of Petra. Spacious rooms, fine dining..."
        },
        {
            id: 2,
            name: "Seven Wonders Bedouin Camp",
            location: "Petra, Jordan",
            stars: 5,
            price: "$520",
            img: "assets/Bedouin Camps.jpg",
            desc: "Experience traditional Bedouin hospitality in a luxury desert setting..."
        },
        {
            id: 3,
            name: "Kempinski Hotel Ishtar",
            location: "Dead Sea, Jordan",
            stars: 5,
            price: "$750",
            img: "assets/Dead Sea.jpg",
            desc: "Luxury infinity pools overlooking the Dead Sea with a world-class spa."
        },
        {
            id: 4,
            name: "W Amman Hotel",
            location: "Amman, Jordan",
            stars: 5,
            price: "$400",
            img: "assets/Amman Downtown.jpg",
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
    const generateTicketBtn = document.getElementById('ticket-generate-btn');
    const chatArea = document.getElementById('ticket-chat-area');
    const feedbackInput = document.getElementById('chat-feedback-input');

    // Ticket UI Elements
    const tDates = document.getElementById('ticket-dates');
    const tGuests = document.getElementById('ticket-guests');
    const tBudget = document.getElementById('ticket-budget');
    const tHotel = document.getElementById('ticket-hotel');
    const tPlaces = document.getElementById('ticket-places');

    confirmBtn.addEventListener('click', () => {
        const checkin = document.getElementById('checkin-date').value;
        const checkout = document.getElementById('checkout-date').value;
        const budget = document.getElementById('budget-input').value;

        if (!checkin || !checkout) {
            showToast("Please select Check-in and Check-out dates.", "warning");
            return;
        }

        // Populate Ticket Summary
        tDates.innerText = `${checkin} to ${checkout}`;
        tGuests.innerText = guestsInput.value;
        tBudget.innerText = budget ? budget + ' JOD' : 'Open Budget';
        
        if (selectedHotelId) {
            const hotel = mockHotels.find(h => h.id === selectedHotelId);
            tHotel.innerText = hotel.name;
        } else {
            tHotel.innerText = "Any luxury hotel";
        }
        
        tPlaces.innerText = myJourney.map(d => d.name).join(', ');

        // Show Ticket
        ticketOverlay.classList.add('active');
        ticketPanel.classList.add('active');
    });

    closeTicketBtn.addEventListener('click', () => {
        ticketOverlay.classList.remove('active');
        ticketPanel.classList.remove('active');
    });
    ticketOverlay.addEventListener('click', () => {
        ticketOverlay.classList.remove('active');
        ticketPanel.classList.remove('active');
    });

    // 6. Generate AI Itinerary
    generateTicketBtn.addEventListener('click', async () => {
        const token = sessionStorage.getItem('shmagh_token');
        if (!token) {
            showToast("Please log in to generate an AI itinerary.", "error");
            return;
        }

        const checkin = document.getElementById('checkin-date').value;
        const checkout = document.getElementById('checkout-date').value;
        const budget = document.getElementById('budget-input').value;
        const feedback = feedbackInput.value.trim();

        // Add user feedback message to chat
        if (feedback) {
            chatArea.innerHTML += `
                <div class="chat-message user-message">
                    <strong>You</strong>
                    <p>${feedback}</p>
                </div>
            `;
            feedbackInput.value = '';
            chatArea.scrollTop = chatArea.scrollHeight;
        }

        // Show loading state
        generateTicketBtn.innerHTML = `<i class="ph ph-spinner ph-spin"></i> Generating...`;
        generateTicketBtn.disabled = true;

        const d1 = new Date(checkin);
        const d2 = new Date(checkout);
        let days = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
        if (days <= 0) days = 1;
        
        const destNames = myJourney.map(d => d.name);
        const selectedHotelName = selectedHotelId ? mockHotels.find(h => h.id === selectedHotelId).name : "";

        try {
            const response = await fetch('http://127.0.0.1:8000/api/generate-journey', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    starting_location: "Amman",
                    preferred_destinations: destNames,
                    trip_duration_days: (checkin && checkout) ? Math.max(1, Math.ceil((new Date(checkout) - new Date(checkin)) / (1000 * 60 * 60 * 24))) : 3,
                    number_of_travelers: guestData.adults || 2,
                    budget: budget === "Not Specified" ? 1500.0 : parseFloat(budget.replace(/[^0-9.]/g, '')) || 1500.0,
                    travel_style: [selectedHotelId ? "Luxury Resort Stay" : "Explorer"],
                    hotel_preference: selectedHotelName || "Standard"
                })
            });

            const data = await response.json();

            if (response.ok) {
                const journeyData = data.journey || data;
                let html = '<strong>AI Travel Concierge</strong><p>Here is your highly optimized itinerary:</p>';
                
                if (journeyData.recommended_trip) {
                    html += '<p style="color: #ccc; margin-bottom: 1rem;">Optimized Route: <strong>' + journeyData.recommended_trip.route.join(' &rarr; ') + '</strong></p>';
                }

                if (journeyData.itinerary && Array.isArray(journeyData.itinerary)) {
                    journeyData.itinerary.forEach((day) => {
                        let locations = Array.isArray(day.locations) ? day.locations.join(', ') : day.locations || 'TBD';
                        let activities = Array.isArray(day.activities) ? day.activities.join('<br>&bull; ') : day.activities || 'Sightseeing';
                        
                        html += '<div style="margin-top: 1rem; padding: 1rem; border-left: 2px solid var(--gold); background: rgba(0,0,0,0.3); border-radius: 4px;">';
                        html += '<h4 style="color: var(--gold); margin: 0 0 0.5rem 0;">Day ' + day.day + ': ' + locations + '</h4>';
                        html += '<div style="margin-bottom: 0.5rem;">';
                        html += '<span style="font-size: 0.8rem; color: var(--gold); background: rgba(212, 175, 55, 0.1); padding: 0.2rem 0.5rem; border-radius: 4px; margin-right: 0.5rem;">🚗 ' + (day.driving_time || 'N/A') + '</span>';
                        html += '<span style="font-size: 0.8rem; color: var(--gold); background: rgba(212, 175, 55, 0.1); padding: 0.2rem 0.5rem; border-radius: 4px;">💰 ' + (day.estimated_cost || 'N/A') + '</span>';
                        html += '</div>';
                        html += '<p style="font-size: 0.9rem; margin: 0 0 0.5rem 0;">&bull; ' + activities + '</p>';
                        html += '</div>';
                    });
                }
                
                if (journeyData.cost_analysis) {
                    html += '<div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1);">';
                    html += '<h4 style="color: var(--gold); margin-bottom: 0.5rem;">Budget Breakdown</h4>';
                    html += '<ul style="list-style: none; padding: 0; margin: 0; color: #ccc; font-size: 0.85rem;">';
                    html += '<li>Transport: ' + journeyData.cost_analysis.transport_cost + ' JOD</li>';
                    html += '<li>Hotels: ' + journeyData.cost_analysis.hotel_cost + ' JOD</li>';
                    html += '<li>Food: ' + journeyData.cost_analysis.food_cost + ' JOD</li>';
                    html += '<li>Activities: ' + journeyData.cost_analysis.activity_cost + ' JOD</li>';
                    html += '<li><strong style="color: #fff;">Total Estimated: ' + journeyData.cost_analysis.total_cost + ' JOD</strong></li>';
                    html += '</ul></div>';
                }
                
                // Add Save to Journal Button
                const ticketTitle = `Journey to ${destNames.join(', ')}`;
                html += `
                    <div style="margin-top: 1rem; text-align: center;">
                        <button id="save-journal-btn" style="background: var(--gold); color: #fff; border: none; padding: 0.5rem 1rem; border-radius: 4px; font-family: var(--font-primary); cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.9rem;">
                            <i class="ph ph-book-bookmark"></i> Save to Journal
                        </button>
                    </div>
                `;
                chatArea.innerHTML += '<div class="chat-message ai-message" id="ai-response-container">' + html + '</div>';
                
                // Add listener to the new button
                setTimeout(() => {
                    const saveBtn = document.getElementById('save-journal-btn');
                    if (saveBtn) {
                        saveBtn.addEventListener('click', async () => {
                            saveBtn.disabled = true;
                            saveBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Saving...';
                            try {
                                const res = await fetch('http://127.0.0.1:8000/api/user/journal', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${token}`
                                    },
                                    body: JSON.stringify({
                                        title: ticketTitle,
                                        itinerary_data: journeyData
                                    })
                                });
                                if (res.ok) {
                                    saveBtn.style.background = '#27ae60';
                                    saveBtn.innerHTML = '<i class="ph-fill ph-check-circle"></i> Saved to Journal';
                                    showToast("Itinerary saved to your Journal!", "success");
                                } else {
                                    throw new Error('Failed to save');
                                }
                            } catch (e) {
                                saveBtn.disabled = false;
                                saveBtn.innerHTML = '<i class="ph ph-book-bookmark"></i> Try Again';
                                showToast("Failed to save to journal", "error");
                            }
                        });
                    }
                }, 100);
    
            } else {
                let errMsg = data.detail;
                if (Array.isArray(errMsg)) {
                    errMsg = errMsg.map(e => e.msg + " (" + e.loc.join('.') + ")").join(', ');
                }
                chatArea.innerHTML += '<div class="chat-message ai-message"><div style="background: rgba(255,0,0,0.1); padding: 1rem; border-left: 3px solid red; border-radius: 8px;"><h4 style="color: red; margin-top: 0;">ERROR</h4>' + (errMsg || JSON.stringify(data)) + '</div></div>';
            }
        } catch (error) {
            chatArea.innerHTML += `<div class="chat-message ai-message"><strong style="color:red;">Network Error</strong><p>Could not connect to AI service.</p></div>`;
        } finally {
            generateTicketBtn.innerHTML = `<i class="ph-fill ph-magic-wand"></i> Regenerate`;
            generateTicketBtn.disabled = false;
            chatArea.scrollTop = chatArea.scrollHeight;
        }
    });
});
