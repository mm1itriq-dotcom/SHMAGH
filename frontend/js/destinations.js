document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById('dest-grid');
    const searchInput = document.getElementById('dest-search');
    const filterPills = document.querySelectorAll('.filter-pill[data-filter]');
    const directionLinks = document.querySelectorAll('.dropdown-content a');
    const directionBtnText = document.getElementById('direction-btn');
    document.querySelector('.your-journey-btn').addEventListener('click', () => { 
        if(myJourney.length === 0) {
            showToast("Please add at least one destination first.", "warning");
        } else {
            window.location.href = 'finalize.html'; 
        }
    });
    document.getElementById('close-sidebar-btn').addEventListener('click', () => { journeySidebar.classList.remove('open'); });
    
    let allDestinations = [];
    let currentCategoryFilter = 'All';
    let currentDirectionFilter = 'All';
    
    const savedJourney = sessionStorage.getItem('shmagh_journey');
    let myJourney = savedJourney ? JSON.parse(savedJourney) : [];
    
    document.querySelector('.your-journey-btn').innerHTML += `<span class="journey-badge" id="journey-badge">0</span>`;
    const journeyBadge = document.getElementById('journey-badge');
    const journeySidebar = document.getElementById('journey-sidebar');
    const journeyItemsContainer = document.getElementById('journey-items-container');
    const journeyTotal = document.getElementById('journey-total');
    
    // Initialize badge on load
    updateJourneySidebar();

    // 1. Check URL parameters for initial category filter
    const urlParams = new URLSearchParams(window.location.search);
    const initialCategory = urlParams.get('category');
    if (initialCategory) {
        currentCategoryFilter = initialCategory;
        // Update UI pill
        filterPills.forEach(pill => {
            if (pill.getAttribute('data-filter') === initialCategory) {
                pill.classList.add('active');
            }
        });
    }

    // 2. Fetch Destinations
    fetch('http://localhost:8000/api/destinations')
        .then(res => res.json())
        .then(data => {
            if (data.destinations) {
                allDestinations = data.destinations;
                renderGrid();
            }
        })
        .catch(err => console.error("Error fetching destinations:", err));

    // 3. Render Function
    function renderGrid() {
        grid.innerHTML = '';
        const query = searchInput.value.toLowerCase();
        
        const filtered = allDestinations.filter(dest => {
            const destName = dest.name || dest.title || '';
            const destDirection = dest.direction || dest.region || '';
            const destCategory = dest.category || 'All';
            
            const matchesSearch = destName.toLowerCase().includes(query) || destDirection.toLowerCase().includes(query);
            const matchesCategory = currentCategoryFilter === 'All' || destCategory === currentCategoryFilter;
            const matchesDirection = currentDirectionFilter === 'All' || destDirection === currentDirectionFilter;
            
            return matchesSearch && matchesCategory && matchesDirection;
        });
        
        filtered.forEach(dest => {
            const destName = dest.name || dest.title || 'Unknown';
            const destDesc = dest.desc || dest.description || '';
            const destPrice = dest.price || dest.price_from || '';
            const destImg = dest.img || dest.image_url || 'assets/explore_historical.jpg';
            
            const card = document.createElement('div');
            card.className = 'dest-card';
            card.style.backgroundImage = `url("${destImg}")`;
            
            card.innerHTML = `
                <button class="fav-btn"><i class="ph ph-heart"></i></button>
                <div class="dest-card-bottom">
                    <h3>${destName}</h3>
                    <p>${destDesc}</p>
                    <div class="dest-card-footer">
                        <span class="dest-price">${destPrice}</span>
                        <a href="#" class="dest-map-link"><i class="ph ph-map-pin"></i> View Map</a>
                        <button class="add-btn">+ Add</button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
        
        // Setup fav toggle logic
        grid.querySelectorAll('.fav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const icon = e.currentTarget.querySelector('i');
                if (icon.classList.contains('ph-heart')) {
                    icon.classList.replace('ph-heart', 'ph-fill');
                    e.currentTarget.style.color = '#e74c3c';
                } else {
                    icon.classList.replace('ph-fill', 'ph-heart');
                    e.currentTarget.style.color = '#ccc';
                }
            });
        });
    }

    // 4. Event Listeners
    searchInput.addEventListener('input', renderGrid);
    
    filterPills.forEach(pill => {
        pill.addEventListener('click', (e) => {
            const filterVal = e.target.getAttribute('data-filter');
            
            // Toggle off if already active
            if (e.target.classList.contains('active')) {
                e.target.classList.remove('active');
                currentCategoryFilter = 'All';
            } else {
                filterPills.forEach(p => p.classList.remove('active'));
                e.target.classList.add('active');
                currentCategoryFilter = filterVal;
            }
            renderGrid();
        });
    });
    
    directionLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const directionVal = e.target.getAttribute('data-direction');
            currentDirectionFilter = directionVal;
            
            if (directionVal === 'All') {
                directionBtnText.innerHTML = `Direction <i class="ph ph-caret-down"></i>`;
            } else {
                directionBtnText.innerHTML = `${directionVal} <i class="ph ph-caret-down"></i>`;
            }
            renderGrid();
        });
    });

    

    // ==========================================
    // MAPBOX INTEGRATION & ADD LOGIC
    // ==========================================
    const mapModal = document.getElementById('map-modal');
    const closeMapBtn = document.getElementById('close-map-btn');
    const mapTitleOverlay = document.getElementById('map-title-overlay');
    let mapboxMap = null;
    let currentMarker = null;

    closeMapBtn.addEventListener('click', () => {
        mapModal.style.display = 'none';
        document.body.style.overflow = '';
    });

    document.body.addEventListener('click', (e) => {
        // --- MAP LOGIC ---
        const mapLink = e.target.closest('.dest-map-link');
        if (mapLink) {
            e.preventDefault();
            const cardBottom = mapLink.closest('.dest-card-bottom');
            const destName = cardBottom.querySelector('h3').innerText;
            
            mapTitleOverlay.innerText = destName;
            mapModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';

            if (!mapboxMap) {
                mapboxMap = new mapboxgl.Map({
                    container: 'map',
                    style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
                    center: [36.2384, 31.2407],
                    zoom: 6
                });
                mapboxMap.addControl(new mapboxgl.NavigationControl(), 'top-left');
            }

            fetch('http://localhost:8000/api/geocode?q=' + encodeURIComponent(destName + ' Jordan'))
                .then(res => res.json())
                .then(data => {
                    if (data && data.length > 0) {
                        const coords = [parseFloat(data[0].lon), parseFloat(data[0].lat)];
                        if (currentMarker) currentMarker.remove();
                        currentMarker = new mapboxgl.Marker({ color: '#A69579' }).setLngLat(coords).addTo(mapboxMap);
                        mapboxMap.flyTo({ center: coords, zoom: 12, essential: true });
                    }
                })
                .catch(err => console.error("Geocoding error:", err));
                
            setTimeout(() => mapboxMap.resize(), 100);
        }
        
        // --- ADD BUTTON LOGIC ---
        if (e.target.classList.contains('add-btn')) {
            const btn = e.target;
            const card = btn.closest('.dest-card');
            const destName = card.querySelector('h3').innerText;
            const destPriceStr = card.querySelector('.dest-price').innerText;
            
            let imgUrl = 'assets/explore_historical.jpg';
            const bgMatch = card.style.backgroundImage.match(/url\(['"]?(.*?)['"]?\)/i);
            if(bgMatch && bgMatch[1]) { imgUrl = bgMatch[1]; }
            
            if (!myJourney.find(d => d.name === destName)) {
                myJourney.push({ name: destName, price: destPriceStr, img: imgUrl });
                updateJourneySidebar();
            }
            
            const lang = localStorage.getItem('shmagh_lang');
            btn.innerText = lang === 'ar' ? "تمت الإضافة ✓" : "Added ✓";
            btn.style.backgroundColor = "#fff";
            btn.style.color = "#000";
            setTimeout(() => {
                btn.innerText = lang === 'ar' ? "+ إضافة" : "+ Add";
                btn.style.backgroundColor = "var(--gold)";
                btn.style.color = "#fff";
            }, 2000);
        }
        
        // --- REMOVE ITEM LOGIC ---
        if (e.target.closest('.remove-item')) {
            const destName = e.target.closest('.remove-item').getAttribute('data-name');
            myJourney = myJourney.filter(d => d.name !== destName);
            updateJourneySidebar();
        }
    });

    function updateJourneySidebar() {
        sessionStorage.setItem('shmagh_journey', JSON.stringify(myJourney));
        journeyBadge.innerText = myJourney.length;
        if (myJourney.length > 0) {
            journeyBadge.classList.add('visible');
        } else {
            journeyBadge.classList.remove('visible');
        }
        
        if (myJourney.length === 0) {
            journeyItemsContainer.innerHTML = '<p class="empty-state">Your journey is empty.<br>Add destinations to start planning!</p>';
            journeyTotal.innerText = '0 JD';
            return;
        }
        
        journeyItemsContainer.innerHTML = '';
        let totalCost = 0;
        
        myJourney.forEach(item => {
            const match = item.price.match(/\d+/);
            if (match) { totalCost += parseInt(match[0]); }
            
            journeyItemsContainer.innerHTML += `
                <div class="journey-item">
                    <img src="${item.img}" alt="${item.name}">
                    <div class="journey-item-info">
                        <h4>${item.name}</h4>
                        <p>${item.price}</p>
                    </div>
                    <button class="remove-item" data-name="${item.name}"><i class="ph ph-trash"></i></button>
                </div>
            `;
        });
        
        journeyTotal.innerText = totalCost > 0 ? `~ ${totalCost} JD` : 'Variable';
    }

});


// ==========================================
// TRANSLATION ENGINE
// ==========================================
const en2ar = {
    "Converting...": "جاري التحويل...",
    "Convert": "تحويل",
    "Currency Converter": "محول العملات",
    "Converter": "محول العملات",
    "Home": "الرئيسية",
    "Favorite": "المفضلة",
    "Discover Destinations": "اكتشف الوجهات",
    "Select at least one destination to add to Your Journey to continue.": "حدد وجهة واحدة على الأقل لإضافتها إلى رحلتك للمتابعة.",
    "Search destinations": "ابحث عن الوجهات",
    "Historical": "تاريخية",
    "Nature": "طبيعة",
    "Religious": "دينية",
    "Culture": "ثقافة",
    "Regions": "مناطق",
    "Direction": "الاتجاه",
    "Your Journey": "رحلتك",
    "Est. Starting Cost:": "التكلفة التقديرية:",
    "Generate Itinerary": "إنشاء مسار الرحلة",
    "+ Add": "+ إضافة",
    "Added ✓": "تمت الإضافة ✓",
    "View Map": "عرض الخريطة",
    "North": "شمال",
    "Central": "وسط",
    "South": "جنوب",
    "East": "شرق",
    "Petra": "البتراء",
    "A prehistoric city carved into red desert cliffs, famously known as the Rose City.": "مدينة تعود لعصور ما قبل التاريخ منحوتة في منحدرات صحراوية حمراء، وتعرف باسم المدينة الوردية.",
    "Umm Qais": "أم قيس",
    "Ancient ruins of the Decapolis city of Gadara, offering panoramic views of the Sea of Galilee.": "أطلال مدينة جدارا القديمة، توفر إطلالات بانورامية على بحيرة طبريا.",
    "Wadi Rum": "وادي رم",
    "A stunning red desert landscape with towering sandstone mountains, famous for its Mars-like appearance.": "صحراء حمراء مذهلة مع جبال رملية شاهقة، تشتهر بمظهرها المشابه لكوكب المريخ.",
    "Amman Citadel": "جبل القلعة",
    "A historical site located on a hill in downtown Amman, featuring ruins from Roman, Byzantine, and Umayyad periods.": "موقع تاريخي يقع على تلة في وسط مدينة عمان، يضم آثاراً من العصور الرومانية والبيزنطية والأموية.",
    "Jerash": "جرش",
    "One of the best-preserved ancient Roman provincial cities in the world.": "واحدة من أفضل المدن الرومانية القديمة المحفوظة في العالم.",
    "Dead Sea": "البحر الميت",
    "The lowest point on Earth, known for its hyper-saline water and mineral-rich mud.": "أخفض بقعة على وجه الأرض، يشتهر بمياهه شديدة الملوحة وطينه الغني بالمعادن.",
    "Aqaba": "العقبة",
    "Jordan's only coastal city, famous for its vibrant coral reefs and water sports.": "المدينة الساحلية الوحيدة في الأردن، تشتهر بشعابها المرجانية النابضة بالحياة والرياضات المائية.",
    "Dana Biosphere": "محمية دانا",
    "Jordan's largest nature reserve, featuring diverse landscapes and wildlife.": "أكبر محمية طبيعية في الأردن، تتميز بمناظرها الطبيعية المتنوعة وحياتها البرية.",
    "Mount Nebo": "جبل نيبو",
    "A significant religious site offering views of the Holy Land, believed to be the burial place of Moses.": "موقع ديني مهم يوفر إطلالات على الأراضي المقدسة، ويُعتقد أنه مكان دفن النبي موسى.",
    "Madaba Map": "خريطة مأدبا",
    "A famous 6th-century mosaic map of the Holy Land located in St. George's Church.": "خريطة فسيفساء شهيرة تعود للقرن السادس للأراضي المقدسة تقع في كنيسة القديس جورج.",
    "Karak Castle": "قلعة الكرك",
    "A large Crusader castle located in al-Karak, known for its extensive architecture.": "قلعة صليبية كبيرة تقع في الكرك، تشتهر بعمارتها الواسعة.",
    "Ajloun Castle": "قلعة عجلون",
    "A 12th-century Muslim castle situated in northwestern Jordan.": "قلعة إسلامية تعود للقرن الثاني عشر تقع في شمال غرب الأردن.",
    "Baptism Site": "المغطس",
    "Bethany Beyond the Jordan, revered as the authentic site where Jesus was baptized.": "بيت عنيا عبر الأردن، الموقع المعتمد الذي تم فيه تعميد يسوع.",
    "Qasr Amra": "قصر عمرة",
    "An 8th-century desert castle famous for its early Islamic frescoes.": "قصر صحراوي يعود للقرن الثامن يشتهر بلوحاته الجدارية الإسلامية المبكرة.",
    "Wadi Mujib": "وادي الموجب",
    "A breathtaking gorge known as the Grand Canyon of Jordan, perfect for canyoning.": "وادي مذهل يُعرف باسم جراند كانيون الأردن، مثالي للتجديف.",
    "Amman Downtown": "وسط البلد",
    "The bustling historic heart of Amman, filled with souks, street food, and Roman ruins.": "القلب التاريخي النابض لمدينة عمان، مليء بالأسواق وطعام الشارع والآثار الرومانية.",
    "Pella": "طبقة فحل",
    "An ancient city in the Jordan Valley rich in ruins from the Bronze Age to the Islamic periods.": "مدينة قديمة في غور الأردن غنية بالآثار من العصر البرونزي إلى العصور الإسلامية.",
    "Iraq Al-Amir": "عراق الأمير",
    "A historic town featuring the impressive Hellenistic Qasr al-Abd.": "بلدة تاريخية تتميز بقصر العبد الهلنستي المثير للإعجاب.",
    "Shrine of Prophet Aaron": "مقام النبي هارون",
    "A highly revered tomb located on Mount Hor near Petra.": "ضريح مقدس يقع على جبل هور بالقرب من البتراء.",
    "Cave of the Seven Sleepers": "كهف أهل الكهف",
    "A site believed to be where a group of youths hid in a cave and slept for centuries.": "موقع يُعتقد أن مجموعة من الشباب اختبأوا فيه وناموا لقرون.",
    "Lot's Cave": "كهف لوط",
    "A monastery and cave near the Dead Sea associated with the biblical story of Lot.": "دير وكهف بالقرب من البحر الميت يرتبط بقصة النبي لوط.",
    "Bedouin Camps": "مخيمات البدو",
    "Experience traditional Bedouin hospitality, food, and culture in the heart of the desert.": "استمتع بتجربة الضيافة البدوية التقليدية والطعام والثقافة في قلب الصحراء.",
    "Souk Jara": "سوق جارا",
    "A popular Friday market in Amman offering local crafts, food, and entertainment.": "سوق جمعة شعبي في عمان يقدم الحرف المحلية والطعام والترفيه.",
    "Rainbow Street": "شارع الرينبو",
    "A famous street in Amman known for its cafes, art galleries, and vibrant nightlife.": "شارع شهير في عمان يشتهر بمقاهيه ومعارضه الفنية وحياته الليلية النابضة.",
    "Jordan Museum": "متحف الأردن",
    "A national museum in Amman showcasing Jordan's rich history and cultural heritage.": "متحف وطني في عمان يعرض تاريخ الأردن الغني وتراثه الثقافي.",
    "Royal Automobile Museum": "متحف السيارات الملكي",
    "A museum displaying the classic car collection of the late King Hussein.": "متحف يعرض مجموعة السيارات الكلاسيكية للملك الراحل الحسين.",
    "Jerash Festival": "مهرجان جرش",
    "An annual cultural and arts festival held among the ancient ruins of Jerash.": "مهرجان ثقافي وفني سنوي يقام بين الآثار القديمة في جرش.",
    "Amman": "عمان",
    "The capital city, blending ancient ruins like the Citadel with a modern urban lifestyle.": "العاصمة التي تمزج بين الآثار القديمة مثل جبل القلعة ونمط الحياة الحضري الحديث.",
    "Irbid": "إربد",
    "A lively northern city known for its universities and proximity to ancient Roman sites.": "مدينة شمالية حيوية تشتهر بجامعاتها وقربها من المواقع الرومانية القديمة.",
    "Salt": "السلط",
    "A historic town famous for its distinctive yellow limestone architecture and religious harmony.": "بلدة تاريخية تشتهر بعمارتها المميزة من الحجر الجيري الأصفر ووئامها الديني.",
    "Madaba": "مأدبا",
    "Known as the City of Mosaics, home to ancient Byzantine and Umayyad art.": "تُعرف باسم مدينة الفسيفساء، وموطن للفن البيزنطي والأموي القديم.",
    "Mafraq": "المفرق",
    "A desert gateway city located in northeastern Jordan.": "مدينة بوابة الصحراء تقع في شمال شرق الأردن.",
    "Zarqa": "الزرقاء",
    "Jordan's industrial hub and second-largest city, deeply rooted in modern history.": "المركز الصناعي وثاني أكبر مدينة في الأردن، متجذرة بعمق في التاريخ الحديث.",
    "Ma'an": "معان",
    "A southern cultural center and a historic stop on the Hajj pilgrimage route.": "مركز ثقافي جنوبي ومحطة تاريخية على طريق الحج.",
    "Tafilah": "الطفيلة",
    "Home to breathtaking natural reserves and deep valleys in the southern highlands.": "موطن للمحميات الطبيعية الخلابة والوديان العميقة في المرتفعات الجنوبية.",
    "Ajloun Forest": "غابات عجلون",
    "Lush green nature reserves offering excellent hiking and wildlife spotting.": "محميات طبيعية خضراء مورقة توفر فرصاً ممتازة للتنزه ومراقبة الحياة البرية.",
    "Azraq Wetland": "محمية الأزرق",
    "A unique oasis in the eastern desert serving as a sanctuary for migratory birds.": "واحة فريدة في الصحراء الشرقية تعمل كملاذ للطيور المهاجرة.",
    "Burqu Nature Reserve": "محمية برقع",
    "A remote and serene desert reserve featuring an ancient Roman fort and seasonal lake.": "محمية صحراوية نائية وهادئة تضم حصناً رومانياً قديماً وبحيرة موسمية.",
    "Fifa Nature Reserve": "محمية فيفا",
    "The lowest nature reserve on Earth, protecting a rare salt-marsh ecosystem.": "أخفض محمية طبيعية على وجه الأرض، تحمي نظاماً بيئياً نادراً للمستنقعات الملحية.",
    "Umm ar-Rasas": "أم الرصاص",
    "A UNESCO World Heritage site known for its exquisite Byzantine mosaics and ruins.": "موقع تراث عالمي لليونسكو يشتهر بفسيفسائه البيزنطية الرائعة وآثاره.",
    "Mukawir": "مكاور",
    "The hilltop fortress of Machaerus, famous as the site where John the Baptist was imprisoned.": "قلعة مكاور على قمة التل، تشتهر بأنها الموقع الذي سُجن فيه يوحنا المعمدان.",
    "Shobak Castle": "قلعة الشوبك",
    "An imposing Crusader castle perched dramatically on an isolated hillside.": "قلعة صليبية مهيبة تقع على تل معزول.",
    "Aqaba Reefs": "شعاب العقبة",
    "Pristine underwater ecosystems offering world-class snorkeling and scuba diving.": "أنظمة بيئية تحت مائية بكر توفر غوصاً واستكشافاً عالمي المستوى.",
    "Roman Theater": "المدرج الروماني",
    "A spectacular 2nd-century Roman theater built into the hillside of Amman.": "مدرج روماني مذهل يعود للقرن الثاني مبني في سفح تل عمان."
};



const ar2en = Object.fromEntries(Object.entries(en2ar).map(([k, v]) => [v, k]));

function walkTextNodes(node, dictionary) {
    if (node.nodeType === 3) {
        let text = node.nodeValue.replace(/\s+/g, ' ').trim();
        if (text) {
            // Direct dictionary match
            if (dictionary[text]) {
                node.nodeValue = node.nodeValue.replace(text, dictionary[text]);
            }
            // Dynamic match for "From XX JD" OR "من XX دينار"
            else if (text.match(/^(?:From|من) \d+ (?:JD|دينار)$/i)) {
                const amount = text.match(/\d+/)[0];
                node.nodeValue = localStorage.getItem('shmagh_lang') === 'ar' ? `من ${amount} دينار` : `From ${amount} JD`;
            }
            // Dynamic match for "~ XX JD" OR "~ XX دينار"
            else if (text.match(/^~ \d+ (?:JD|دينار)$/i)) {
                const amount = text.match(/\d+/)[0];
                node.nodeValue = localStorage.getItem('shmagh_lang') === 'ar' ? `~ ${amount} دينار` : `~ ${amount} JD`;
            }
            // Dynamic match for "Variable" / "متغير"
            else if (text === "Variable" || text === "متغير") {
                node.nodeValue = localStorage.getItem('shmagh_lang') === 'ar' ? "متغير" : "Variable";
            }
            // Dynamic match for Empty state
            else if (text === "Your journey is empty." || text === "رحلتك فارغة.") {
                node.nodeValue = localStorage.getItem('shmagh_lang') === 'ar' ? "رحلتك فارغة." : "Your journey is empty.";
            }
            else if (text === "Add destinations to start planning!" || text === "أضف وجهات لبدء التخطيط!") {
                node.nodeValue = localStorage.getItem('shmagh_lang') === 'ar' ? "أضف وجهات لبدء التخطيط!" : "Add destinations to start planning!";
            }
        }
    } else if (node.nodeType === 1) {
        // Translate placeholders
        if (node.placeholder) {
            let pText = node.placeholder.trim();
            if (dictionary[pText]) node.placeholder = dictionary[pText];
        }
        for (let i = 0; i < node.childNodes.length; i++) {
            walkTextNodes(node.childNodes[i], dictionary);
        }
    }
}

function applyTranslation(lang) {
    const dict = lang === 'ar' ? en2ar : ar2en;
    walkTextNodes(document.body, dict);
    
    // Switch direction
    if (lang === 'ar') {
        document.body.style.direction = 'rtl';
        document.body.classList.add('rtl-active');
        document.querySelector('.en-label').classList.remove('active-lang');
        document.querySelector('.ar-label').classList.add('active-lang');
        document.getElementById('lang-toggle').checked = true;
    } else {
        document.body.style.direction = 'ltr';
        document.body.classList.remove('rtl-active');
        document.querySelector('.ar-label').classList.remove('active-lang');
        document.querySelector('.en-label').classList.add('active-lang');
        document.getElementById('lang-toggle').checked = false;
    }
}

// Bind to toggle
const langToggle = document.getElementById('lang-toggle');
if (langToggle) {
    langToggle.addEventListener('change', (e) => {
        const lang = e.target.checked ? 'ar' : 'en';
        localStorage.setItem('shmagh_lang', lang);
        applyTranslation(lang);
    });
}

// Load saved language on start
setTimeout(() => {
    const savedLang = localStorage.getItem('shmagh_lang');
    if (savedLang === 'ar') {
        applyTranslation('ar');
    }
}, 300);

    // Real Full-Stack AI Itinerary Generation
    const generateBtn = document.getElementById('real-generate-btn');
    const aiModal = document.getElementById('ai-modal');
    const closeAiBtn = document.getElementById('close-ai-modal');
    const aiContent = document.getElementById('ai-content');

    if (generateBtn) {
        generateBtn.addEventListener('click', async () => {
            if (myJourney.length === 0) {
                showToast("Please add at least one destination to your journey first.", "warning");
                return;
            }

            const token = sessionStorage.getItem('shmagh_token');
            if (!token) {
                showToast("Please log in to generate an AI itinerary.", "error");
                return;
            }

            // Show Modal with loading state
            aiModal.style.display = 'flex';
            setTimeout(() => aiModal.style.opacity = '1', 10);
            aiContent.innerHTML = `
                <div style="text-align: center; padding: 2rem;">
                    <i class="ph ph-spinner ph-spin" style="font-size: 3rem; color: var(--gold);"></i>
                    <p style="margin-top: 1rem; color: #aaa;">Gemini AI is crafting your perfect journey...</p>
                </div>
            `;

            const destNames = myJourney.map(d => d.name);

            try {
                const response = await fetch('http://localhost:8000/api/generate-journey', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        destinations: destNames,
                        days: Math.max(3, destNames.length), // Smart default
                        budget: "Standard",
                        travel_style: "Explorer"
                    })
                });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.detail || "Failed to generate itinerary");
                }

                const data = await response.json();
                
                // Render the AI response beautifully
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
                html += `</div>`;
                
                aiContent.innerHTML = html;
                showToast("Itinerary generated successfully!", "success");

            } catch (err) {
                console.error(err);
                aiContent.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: #ff4d4d;">
                        <i class="ph ph-warning-circle" style="font-size: 3rem;"></i>
                        <p style="margin-top: 1rem;">Failed to reach AI. Please try again later.</p>
                        <p style="font-size: 0.8rem; color: #888;">${err.message}</p>
                    </div>
                `;
            }
        });
    }

    if (closeAiBtn) {
        closeAiBtn.addEventListener('click', () => {
            aiModal.style.opacity = '0';
            setTimeout(() => aiModal.style.display = 'none', 300);
        });
    }
