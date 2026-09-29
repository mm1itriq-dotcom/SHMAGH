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
    fetch('http://localhost:8000/api/stories')
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
            item.appendChild(activeLabel);

            // 4. Update the right panel content with a smooth fade-out / fade-in transition
            glassCard.style.opacity = "0"; // Fade out
            
            
                // Swap the text content while it is invisible
                titleElement.innerHTML = stories[index].title;
                paragraphs[0].textContent = stories[index].p1;
                paragraphs[1].textContent = stories[index].p2;
                
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
            
            const response = await fetch('http://localhost:8000/api/weather?lats=' + lats + '&lons=' + lons);
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
                li.innerHTML = '<span class="day-name">' + dayName + '</span>' +
                    '<span class="day-condition"><i class="ph ' + weather.icon + '"></i> ' + weather.text + '</span>' +
                    '<span class="day-temps"><strong>' + max + '&deg;</strong> ' + min + '&deg;</span>';
                forecastList.appendChild(li);
            }
            
            const currentList = document.getElementById('current-list');
            currentList.innerHTML = '';
            
            CITIES.forEach((city, i) => {
                const temp = Math.round(currentData[i].current_weather.temperature);
                const li = document.createElement('li');
                li.innerHTML = '<span class="city-name">' + city.name + '</span>' +
                    '<span class="city-temp">' + temp + '&deg;C</span>';
                currentList.appendChild(li);
            });
            
        } catch (error) {
            console.error("Error fetching weather:", error);
            const forecastList = document.getElementById('forecast-list');
            if (forecastList) forecastList.innerHTML = '<li style="color:red">Failed to load weather.</li>';
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
    

    const ar2en = {};
    for (const [en, ar] of Object.entries(globalEn2Ar)) {
        ar2en[ar] = en;
    }

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

    

// ==========================================
// TRANSLATION ENGINE
// ==========================================
const globalEn2Ar = {
    "1. Petra": "1. البتراء",
    "2. Umm Qais": "2. أم قيس",
    "3. Romanian Theater": "3. المدرج الروماني",
    "Umm Qais": "أم قيس",
    "Romanian Theater": "المدرج الروماني",
    "Umm Qais: Where History Meets Nature": "أم قيس: حيث يلتقي التاريخ بالطبيعة",
    "Tale of the Place": "حكاية المكان",
    "Umm Qais is distinguished by its charming view of the Sea of Galilee and the Golan Heights. Where the remains of the ancient city embrace green plains extending to the horizon. Known in the Greek era as \"Gadara\", it was one of the ten Decapolis cities and a thriving center for thought, poetry, and trade.": "تتميز أم قيس بإطلالتها الساحرة على بحيرة طبريا وهضبة الجولان. حيث تعانق أطلال المدينة القديمة السهول الخضراء الممتدة إلى الأفق. عُرفت في العصر اليوناني باسم \"جدارا\"، وكانت إحدى مدن حلف الديكابولس العشر، ومركزاً مزدهراً للفكر والشعر والتجارة.",
    "Its paved streets and black basalt columns reveal successive layers of Greek, Roman, and Byzantine civilizations. The Western Theater, carved into volcanic stone, stands as a witness to a rich cultural life that gathered the city's people and its visitors many centuries ago.": "تكشف شوارعها المرصوفة وأعمدتها البازلتية السوداء عن طبقات متعاقبة من الحضارات اليونانية والرومانية والبيزنطية. ويقف المسرح الغربي المنحوت في الحجر البركاني شاهداً على حياة ثقافية غنية جمعت أهل المدينة وزوارها قبل قرون عديدة.",
    "In Umm Qais, history is inseparable from nature; between Ottoman houses, baths, and temples, scenes open up to valleys and olive orchards, and at sunset, golden light covers the ancient stones, making the city seem like a living memory telling the story of the place and the human.": "في أم قيس، لا ينفصل التاريخ عن الطبيعة؛ فبين البيوت العثمانية والحمامات والمعابد، تنفتح المشاهد على الوديان وبساتين الزيتون، وعند غروب الشمس، يغطي الضوء الذهبي الحجارة القديمة، لتبدو المدينة وكأنها ذاكرة حية تروي قصة المكان والإنسان.",
    "Watch Umm Qais Documentary": "شاهد فيلم وثائقي عن أم قيس",
    "active": "نشط",
    "A country with<br>more than one story.": "بلد بأكثر من<br>قصة.",
    "Explore places, stories, culture, and heritage through one connected journey.": "اكتشف الأماكن، القصص، الثقافة، والتراث من خلال رحلة واحدة متصلة.",
    "Weather ☀️☁️": "الطقس ☀️☁️",
    "Plan your journey across Jordan with perfect timing.": "خطط لرحلتك في جميع أنحاء الأردن في الوقت المثالي.",
    "Share Your Journey": "شارك رحلتك",
    "Explore Jordan": "استكشف الأردن",
    "Start Your Journey": "ابدأ رحلتك",
    "Est. Starting Cost:": "التكلفة التقديرية:",
    "2. ": "2. ",
    "3. ": "3. ",
    " Umm Qais": " أم قيس",
    " Romanian Theater": " المدرج الروماني",
    "A view over three<br>countries.": "إطلالة على ثلاث<br>دول.",
    "Perched on a hilltop, Umm Qais offers a sweeping view of the Sea of Galilee and the Golan Heights. Once known as Gadara, it was a center of philosophy and art in the ancient Decapolis.": "تتربع أم قيس على قمة تل، وتقدم إطلالة بانورامية على بحيرة طبريا وهضبة الجولان. عُرفت قديماً باسم جدارا، وكانت مركزاً للفلسفة والفن في حلف الديكابولس القديم.",
    "Walking through its black basalt ruins, you can still feel the intellectual vibrancy that once attracted poets, writers, and thinkers from across the ancient world.": "عند السير عبر أطلالها البازلتية السوداء، لا يزال بإمكانك الشعور بالحيوية الفكرية التي جذبت ذات يوم الشعراء والكتاب والمفكرين من جميع أنحاء العالم القديم.",
    "Echoes of the ancient<br>amphitheater.": "أصداء<br>المدرج القديم.",
    "Built into the hillside of Amman, this spectacular 6,000-seat 2nd-century Roman theater remains a testament to Roman architectural brilliance and urban planning.": "بُني هذا المدرج الروماني المذهل الذي يتسع لـ 6000 مقعد في القرن الثاني الميلادي في سفح جبل في عمان، ولا يزال شاهداً على براعة العمارة الرومانية والتخطيط الحضري.",
    "Even today, it serves as a gathering place for locals and travelers, hosting cultural events where the ancient acoustics still carry voices perfectly across the stone tiers.": "حتى اليوم، لا يزال يمثل مكاناً لتجمع السكان المحليين والمسافرين، حيث يستضيف الفعاليات الثقافية التي لا تزال فيها الصوتيات القديمة تحمل الأصوات بشكل مثالي عبر المدرجات الحجرية.",
    "A view over three countries.": "إطلالة على ثلاث دول.",
    "Echoes of the ancient amphitheater.": "أصداء المدرج القديم.",
    "HISTORICAL": "تاريخي",
    "NATURE": "طبيعة",
    "RELIGIOUS HERITAGE": "تراث ديني",
    "CULTURE & ENTERTAINMENT": "ثقافة وترفيه",
    "REGIONS": "مناطق",
    "EXPLORE": "استكشف",
    "Home": "الرئيسية",
    "Destinations": "الوجهات",
    "Gallery": "المعرض",
    "Converting...": "جاري التحويل...",
    "Convert": "تحويل",
    "Currency Converter": "محول العملات",
    "Converter": "محول العملات"
};

const globalAr2En = Object.fromEntries(Object.entries(globalEn2Ar).map(([k, v]) => [v, k]));

function walkTextNodes(node, dictionary) {
    if (node.nodeType === 3) {
        let originalText = node.nodeValue;
        let normalizedText = originalText.trim();
        if (normalizedText && dictionary[normalizedText]) {
            node.nodeValue = originalText.replace(normalizedText, dictionary[normalizedText]);
        }
    } else if (node.nodeType === 1 && node.nodeName !== "SCRIPT" && node.nodeName !== "STYLE") {
        for (let i = 0; i < node.childNodes.length; i++) {
            walkTextNodes(node.childNodes[i], dictionary);
        }
    }
}

function applyTranslation(lang) {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    const dict = lang === 'ar' ? globalEn2Ar : globalAr2En;
    walkTextNodes(document.body, dict);
}

document.addEventListener("DOMContentLoaded", () => {
    const savedLang = localStorage.getItem('shmagh_lang') || 'en';
    const langToggle = document.getElementById('lang-toggle');
    const enLabel = document.querySelector('.en-label');
    const arLabel = document.querySelector('.ar-label');
    
    if (langToggle) {
        // Init toggle state
        if (savedLang === 'ar') {
            langToggle.checked = true;
            if(enLabel) enLabel.classList.remove('active-lang');
            if(arLabel) arLabel.classList.add('active-lang');
        } else {
            langToggle.checked = false;
            if(enLabel) enLabel.classList.add('active-lang');
            if(arLabel) arLabel.classList.remove('active-lang');
        }
        
        langToggle.addEventListener('change', (e) => {
            const newLang = e.target.checked ? 'ar' : 'en';
            localStorage.setItem('shmagh_lang', newLang);
            
            if (newLang === 'ar') {
                if(enLabel) enLabel.classList.remove('active-lang');
                if(arLabel) arLabel.classList.add('active-lang');
            } else {
                if(enLabel) enLabel.classList.add('active-lang');
                if(arLabel) arLabel.classList.remove('active-lang');
            }
            applyTranslation(newLang);
        });
    }
    if (savedLang === 'ar') {
        setTimeout(() => applyTranslation('ar'), 100);
    }
});

