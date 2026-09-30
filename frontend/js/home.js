// FULL STORY LOGIC
window.navigateToStory = function() {
    const storyItems = Array.from(document.querySelectorAll('.stories-list li'));
    const activeIndex = storyItems.findIndex(li => li.classList.contains('active'));
    
    if (activeIndex === 0) {
        window.location.href = 'story.html?topic=petra';
    } else if (activeIndex === 1) {
        window.location.href = 'story.html?topic=umm-qais';
    } else if (activeIndex === 2) {
        window.location.href = 'story.html?topic=roman';
    }
};

document.addEventListener("DOMContentLoaded", () => {
    // Story Data Database (Fetched from Backend, with fallback)
    let stories = [
        {
            title: "The city carved into<br>stone.",
            p1: "Petra was shaped by the Nabataeans, who carved temples, tombs, and pathways directly into rose-red sandstone. Entering through the Siq reveals a city where craft, trade, and memory remain embedded in the land.",
            p2: "Beyond its monuments, Petra carries the stories of people who crossed the desert and made this place a meeting point of cultures. Its enduring silence is part of its power."
        },
        {
            title: "Where ancient empires<br>meet the horizon.",
            p1: "Perched on a hilltop in northern Jordan, Umm Qais (ancient Gadara) offers breathtaking panoramic views of the Sea of Galilee, the Yarmouk River gorge, and the Golan Heights.",
            p2: "Once a cultural hub of the Decapolis, its stunning black basalt ruins whisper tales of poets, philosophers, and a rich Greco-Roman heritage that stood the test of time."
        },
        {
            title: "The beating heart of<br>ancient Philadelphia.",
            p1: "Built in the 2nd century AD, the magnificent Roman Theater of Amman was cut directly into the northern side of a hill, designed to hold up to 6,000 spectators in perfect acoustic harmony.",
            p2: "Today, it stands as a striking contrast amidst the bustling modern capital, echoing the vibrant civic life, arts, and grand spectacles of the ancient Roman Empire."
        }
    ];

    // Fetch from backend API
    fetch('https://shmagh.onrender.com/api/stories')
        .then(response => response.json())
        .then(data => {
            if (data.stories && data.stories.length >= 3) {
                // Map the backend data to our frontend format
                // Ensure we get them in order (Petra, Umm Qais, Roman Theater)
                const petra = data.stories.find(s => s.id === 'story_1');
                const umm_qais = data.stories.find(s => s.id === 'story_2');
                const roman_theater = data.stories.find(s => s.id === 'story_3');
                
                if(petra && umm_qais && roman_theater) {
                    stories[0] = { title: petra.title, p1: petra.desc1, p2: petra.desc2 };
                    stories[1] = { title: umm_qais.title, p1: umm_qais.desc1, p2: umm_qais.desc2 };
                    stories[2] = { title: roman_theater.title, p1: roman_theater.desc1, p2: roman_theater.desc2 };
                }
            }
        })
        .catch(err => console.log("Backend offline, using fallback stories.", err));

    const listItems = document.querySelectorAll(".stories-list li");
    const titleElement = document.querySelector(".story-glass-card .story-title");
    const paragraphs = document.querySelectorAll(".story-glass-card p");
    const glassCard = document.querySelector(".story-glass-card");

    listItems.forEach((item, index) => {
        item.addEventListener("click", () => {
            // 1. Check if it's already active to avoid redundant clicks
            if (item.classList.contains("active")) return;

            // 2. Remove active class from all items
            listItems.forEach(li => {
                li.classList.remove("active");
                // Remove the 'active' text label from old active items
                const label = li.querySelector(".active-label");
                if (label) label.remove();
            });

            // 3. Add active class to the newly clicked item
            item.classList.add("active");
            
            // Re-create and append the 'active' text label
            const activeLabel = document.createElement("span");
            activeLabel.className = "active-label";
            activeLabel.textContent = "active";
            activeLabel.setAttribute("data-i18n", "common.active");
            item.appendChild(activeLabel);

            // 4. Update the right panel content with a smooth fade-out / fade-in transition
            glassCard.style.opacity = "0"; // Fade out
            
            
                // Swap the text content while it is invisible
                const keys = ["petra", "umm_qais", "roman_theater"];
                titleElement.setAttribute("data-i18n", `home.stories.cards.${keys[index]}.title`);
                paragraphs[0].setAttribute("data-i18n", `home.stories.cards.${keys[index]}.p1`);
                paragraphs[1].setAttribute("data-i18n", `home.stories.cards.${keys[index]}.p2`);
                if (window.setLanguage) {
                    window.setLanguage(document.documentElement.lang || "en");
                } else {
                    titleElement.innerHTML = stories[index].title;
                    paragraphs[0].textContent = stories[index].p1;
                    paragraphs[1].textContent = stories[index].p2;
                }
                
                // Fade back in
                glassCard.style.opacity = "1"; 
             // Wait 300ms for fade out to complete before swapping
        });
    });

    // ==========================================
    // WEATHER API INTEGRATION (OPEN-METEO)
    // ==========================================
    
    // Coordinates for key Jordanian destinations
    const CITIES = [
        { name: 'Amman', lat: 31.9522, lon: 35.9331 },
        { name: 'Irbid', lat: 32.5556, lon: 35.8500 },
        { name: 'Dead Sea', lat: 31.5590, lon: 35.4732 },
        { name: 'Petra', lat: 30.3285, lon: 35.4444 },
        { name: 'Aqaba', lat: 29.5267, lon: 35.0048 }
    ];

    // Helper to map WMO Weather Codes to text and Phosphor icons
    function getWeatherDesc(code) {
        if (code === 0) return { text: "Clear", icon: "ph-sun" };
        if (code === 1 || code === 2) return { text: "Sunny", icon: "ph-sun" }; 
        if (code === 3) return { text: "Cloudy", icon: "ph-cloud" };
        if (code >= 45 && code <= 48) return { text: "Fog", icon: "ph-cloud-fog" };
        if (code >= 51 && code <= 67) return { text: "Rain", icon: "ph-cloud-rain" };
        if (code >= 71 && code <= 77) return { text: "Snow", icon: "ph-snowflake" };
        if (code >= 80 && code <= 82) return { text: "Showers", icon: "ph-cloud-rain" };
        if (code >= 95) return { text: "Storm", icon: "ph-cloud-lightning" };
        return { text: "Clear", icon: "ph-sun" }; // fallback
    }

    async function fetchWeather() {
        try {
            const lats = CITIES.map(c => c.lat).join(',');
            const lons = CITIES.map(c => c.lon).join(',');
            
            const response = await fetch('https://shmagh.onrender.com/api/weather?lats=' + lats + '&lons=' + lons);
            if (!response.ok) throw new Error("Weather API failed");
            
            const data = await response.json();
            const forecastData = data.forecast;
            const currentData = data.current;
            
            const forecastList = document.getElementById('forecast-list');
            forecastList.innerHTML = '';
            
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            
            for(let i = 0; i < 7; i++) {
                const date = new Date(forecastData.daily.time[i]);
                const dayName = i === 0 ? "Today" : days[date.getDay()];
                const max = Math.round(forecastData.daily.temperature_2m_max[i]);
                const min = Math.round(forecastData.daily.temperature_2m_min[i]);
                const weather = getWeatherDesc(forecastData.daily.weathercode[i]);
                
                const li = document.createElement('li');
                li.innerHTML = '<span class="day-name" data-i18n="home.weather.days.' + dayName + '">' + dayName + '</span>' +
                    '<span class="day-condition"><i class="ph ' + weather.icon + '"></i> <span data-i18n="home.weather.conditions.' + weather.text + '">' + weather.text + '</span></span>' +
                    '<span class="day-temps"><strong>' + max + '&deg;</strong> ' + min + '&deg;</span>';
                forecastList.appendChild(li);
            }
            
            const currentList = document.getElementById('current-list');
            currentList.innerHTML = '';
            
            CITIES.forEach((city, i) => {
                const temp = Math.round(currentData[i].current_weather.temperature);
                const li = document.createElement('li');
                li.innerHTML = '<span class="city-name" data-i18n="home.weather.cities.' + city.name + '">' + city.name + '</span>' +
                    '<span class="city-temp">' + temp + '&deg;C</span>';
                currentList.appendChild(li);
            });
            if (window.setLanguage) window.setLanguage(document.documentElement.lang || 'en');
            
        } catch (error) {
            console.error("Error fetching weather:", error);
            const forecastList = document.getElementById('forecast-list');
            if (forecastList) forecastList.innerHTML = '<li style="color:red" data-i18n="home.weather.failed">Failed to load weather.</li>';
            if (window.setLanguage) window.setLanguage(document.documentElement.lang || 'en');
        }
    }

    fetchWeather();
});

    // ==========================================
    // STICKY NAVBAR (HIDE DOWN, SHOW UP)
    // ==========================================
    let lastScrollY = window.scrollY;
    const navbar = document.querySelector('.home-navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 150) {
            if (window.scrollY < lastScrollY) {
                // Scrolling UP
                navbar.style.top = '0';
                navbar.classList.add('scrolled-up');
            } else {
                // Scrolling DOWN
                navbar.style.top = '-100px'; // hide it
            }
        } else {
            // At the top
            navbar.style.top = '0';
            navbar.classList.remove('scrolled-up');
        }
        lastScrollY = window.scrollY;
    });

    
    // ==========================================
    // Function to safely replace text nodes
    // ==========================================
    const readStoryBtn = document.getElementById('read-story-btn');
    if (readStoryBtn) {
        document.body.addEventListener('click', (e) => {
            if (e.target && (e.target.id === 'read-story-btn' || e.target.closest('#read-story-btn'))) {
                e.preventDefault();
                // Safely determine which story is currently active by its index in the menu
                const storyItems = Array.from(document.querySelectorAll('.stories-list li'));
                const activeIndex = storyItems.findIndex(li => li.classList.contains('active'));
                
                if (activeIndex === 0) {
                    window.location.href = 'story.html?topic=petra';
                } else if (activeIndex === 1) {
                    window.location.href = 'story.html?topic=umm-qais';
                } else if (activeIndex === 2) {
                    window.location.href = 'story.html?topic=roman';
                }
            }
        });
    }

    // Handle Video Play Buttons
        document.querySelectorAll('.story-video-thumb .play-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const container = this.parentElement;
                let videoId = '';
                
                if (container.closest('#full-story-modal')) {
                    videoId = 'iz4aj23KOK0'; // Petra
                } else if (container.closest('#umm-qais-modal')) {
                    videoId = 'LvIla6Vlwvw'; // Umm Qais
                }
                
                if (videoId) {
                    container.innerHTML = `<iframe width="100%" height="100%" style="min-height: 400px; border-radius: 12px; border: none; box-shadow: 0 10px 40px rgba(0,0,0,0.5);" src="https://www.youtube.com/embed/${videoId}?autoplay=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
                }
            });
        });
