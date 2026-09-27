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
        tBudget.innerText = budget;
        
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
            const response = await fetch('http://localhost:8000/api/generate-journey', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    destinations: destNames,
                    days: days,
                    budget: budget !== "Not Specified" ? budget : "Standard",
                    travel_style: selectedHotelId ? "Luxury Resort Stay" : "Explorer",
                    feedback: feedback,
                    hotel: selectedHotelName
                })
            });

            const data = await response.json();

            if (response.ok) {
                let html = `<strong>AI Travel Concierge</strong><p>${data.greeting || 'Here is your custom itinerary:'}</p>`;
                
                if (data.itinerary && Array.isArray(data.itinerary)) {
                    data.itinerary.forEach(day => {
                        html += `
                            <div style="margin-top: 1rem; border-top: 1px dashed rgba(255,255,255,0.2); padding-top: 1rem;">
                                <h4 style="color: #fff; margin-bottom: 0.25rem;">Day ${day.day}: ${day.location}</h4>
                                <ul style="list-style-type: disc; margin-left: 1rem; color: #ccc; font-size: 0.85rem;">
                                    ${day.activities.map(act => `<li>${act}</li>`).join('')}
                                </ul>
                                <p style="margin-top: 0.25rem; color: var(--gold); font-size: 0.85rem;">
                                    <i class="ph ph-bed"></i> ${day.hotel_suggestion}
                                </p>
                            </div>
                        `;
                    });
                }
                
                html += `
                    <div style="margin-top: 1rem; border-top: 1px solid var(--gold); padding-top: 0.5rem;">
                        <strong style="color: #fff;">Est. Cost: <span style="color: var(--gold);">${data.total_estimated_cost || 'Variable'}</span></strong>
                        <p style="color: #aaa; margin-top: 0.25rem; font-size: 0.8rem;">${data.closing || ''}</p>
                    </div>
                `;
                
                chatArea.innerHTML += `<div class="chat-message ai-message">${html}</div>`;
            } else {
                chatArea.innerHTML += `<div class="chat-message ai-message"><strong style="color:red;">Error</strong><p>${data.detail || data.error || 'Failed to generate'}</p></div>`;
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
