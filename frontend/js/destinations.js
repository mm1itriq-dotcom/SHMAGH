import { auth, db, doc, updateDoc, setDoc, arrayUnion, arrayRemove, collection, getDocs } from './firebase-init.js';
document.addEventListener("DOMContentLoaded", async () => {
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
    let myJourney = [];
    try {
        if (savedJourney) {
            myJourney = JSON.parse(savedJourney);
        }
    } catch (e) {
        console.error("Error parsing saved journey:", e);
        sessionStorage.removeItem('shmagh_journey');
    }
    
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
    // Fetch from Firebase Firestore
    try {
        const destCol = collection(db, 'destinations');
        const destSnapshot = await getDocs(destCol);
        if (destSnapshot.empty) {
            console.log("Firestore empty, fetching from fallback JSON...");
            const res = await fetch('json/destinations.json');
            allDestinations = await res.json();
        } else {
            allDestinations = destSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        renderGrid();
    } catch (err) {
        console.error("Error fetching destinations from Firebase:", err);
    }

    // 3. Render Function
    function renderGrid() {
        grid.innerHTML = '';
        const query = searchInput.value.toLowerCase();
        const lang = (typeof SHMAGHi18n !== 'undefined') ? SHMAGHi18n.getLanguage() : 'en';
        
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
            
            // Translate if Arabic
            const displayName = (lang === 'ar' && en2ar[destName]) ? en2ar[destName] : destName;
            const displayDesc = (lang === 'ar' && en2ar[destDesc]) ? en2ar[destDesc] : destDesc;
            const viewMapText = (lang === 'ar') ? 'عرض الخريطة' : 'View Map';
            const addText = (lang === 'ar') ? '+ إضافة' : '+ Add';
            
            // Translate price
            let displayPrice = destPrice;
            if (lang === 'ar' && destPrice) {
                const priceMatch = destPrice.match(/From (\d+) JD/);
                if (priceMatch) {
                    displayPrice = `من ${priceMatch[1]} دينار`;
                } else if (destPrice === 'Variable') {
                    displayPrice = 'متغير';
                } else {
                    const tildaMatch = destPrice.match(/~ (\d+) JD/);
                    if (tildaMatch) displayPrice = `~ ${tildaMatch[1]} دينار`;
                }
            }
            
            // Check if already in journey
            const isAdded = myJourney.some(j => j.name === destName);
            const btnClass = isAdded ? 'add-btn added' : 'add-btn';
            const btnText = isAdded ? ((lang === 'ar') ? 'تمت الإضافة ✓' : 'Added ✓') : addText;
            
            const card = document.createElement('div');
            card.className = 'dest-card';
            card.style.backgroundImage = `url("${destImg}")`;
            card.setAttribute('data-dest-name', destName); // store original English name
            
            card.innerHTML = `
                <button class="fav-btn"><i class="ph ph-heart"></i></button>
                <div class="dest-card-bottom">
                    <h3>${displayName}</h3>
                    <p>${displayDesc}</p>
                    <div class="dest-card-footer">
                        <span class="dest-price">${displayPrice}</span>
                        <a href="#" class="dest-map-link"><i class="ph ph-map-pin"></i> ${viewMapText}</a>
                        <button class="${btnClass}">${btnText}</button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
        
        // Setup fav toggle logic with Backend Sync
        grid.querySelectorAll('.fav-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const btnEl = e.currentTarget;
                const icon = btnEl.querySelector('i');
                const destName = btnEl.closest('.dest-card').querySelector('h3').innerText;
                const token = sessionStorage.getItem('shmagh_token');
                
                if (!token) {
                    showToast("Please log in to save favorites", "error");
                    return;
                }

                // Toggle UI instantly for responsiveness
                const isAdding = icon.classList.contains('ph');
                if (isAdding) {
                    icon.className = 'ph-fill ph-heart';
                    btnEl.style.color = 'var(--gold)';
                } else {
                    icon.className = 'ph ph-heart';
                    btnEl.style.color = '#ccc';
                }

                // Sync with Backend
                try {
                    
                    const user = auth.currentUser;
                    if (!user) throw new Error("Not logged in");
                    const userRef = doc(db, "users", user.uid);
                    if (isAdding) {
                        await setDoc(userRef, { favorites: arrayUnion(destName) }, { merge: true });
                    } else {
                        await setDoc(userRef, { favorites: arrayRemove(destName) }, { merge: true });
                    }

                    const data = await res.json();
                    if (data.message === "Added to favorites") {
                        showToast(destName + " added to Saved!", "success");
                    }
                } catch (err) {
                    // Revert UI on failure
                    if (isAdding) {
                        icon.className = 'ph ph-heart';
                        btnEl.style.color = '#ccc';
                    } else {
                        icon.className = 'ph-fill ph-heart';
                        btnEl.style.color = 'var(--gold)';
                    }
                    showToast("Error saving favorite.", "error");
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

            fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(destName + ' Jordan'))
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
            
            const existingIdx = myJourney.findIndex(d => d.name === destName);
            

            if (existingIdx !== -1) {
                // REMOVE IT
                myJourney.splice(existingIdx, 1);
                updateJourneySidebar();
                
                btn.innerText = "+ Add";
                btn.style.backgroundColor = ""; // Reset to default CSS
                btn.style.color = ""; // Reset to default CSS
            } else {
                // ADD IT
                myJourney.push({ name: destName, price: destPriceStr, img: imgUrl });
                updateJourneySidebar();
                
                btn.innerText = "Added ✓";
                btn.style.backgroundColor = "#fff";
                btn.style.color = "#000";
            }
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
        const lang = (typeof SHMAGHi18n !== 'undefined') ? SHMAGHi18n.getLanguage() : 'en';
        
        if (myJourney.length > 0) {
            journeyBadge.classList.add('visible');
        } else {
            journeyBadge.classList.remove('visible');
        }
        
        if (myJourney.length === 0) {
            const emptyText = (lang === 'ar') ? 'رحلتك فارغة.<br>أضف وجهات لبدء التخطيط!' : 'Your journey is empty.<br>Add destinations to start planning!';
            journeyItemsContainer.innerHTML = '<p class="empty-state">' + emptyText + '</p>';
            journeyTotal.innerText = '0 JD';
            return;
        }
        
        journeyItemsContainer.innerHTML = '';
        let totalCost = 0;
        
        myJourney.forEach(item => {
            const match = item.price.match(/\d+/);
            if (match) { totalCost += parseInt(match[0]); }
            
            const displayName = (lang === 'ar' && en2ar[item.name]) ? en2ar[item.name] : item.name;
            
            journeyItemsContainer.innerHTML += `
                <div class="journey-item">
                    <img src="${item.img}" alt="${item.name}">
                    <div class="journey-item-info">
                        <h4>${displayName}</h4>
                        <p>${item.price}</p>
                    </div>
                    <button class="remove-item" data-name="${item.name}"><i class="ph ph-trash"></i></button>
                </div>
            `;
        });
        
        const costText = totalCost > 0 ? `~ ${totalCost} JD` : ((lang === 'ar') ? 'متغير' : 'Variable');
        journeyTotal.innerText = costText;
    }

    // Listen for language changes and re-render dynamic content
    document.addEventListener('langChanged', () => {
        renderGrid();
        updateJourneySidebar();
    });

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
                node.nodeValue = `From ${amount} JD`;
            }
            // Dynamic match for "~ XX JD" OR "~ XX دينار"
            else if (text.match(/^~ \d+ (?:JD|دينار)$/i)) {
                const amount = text.match(/\d+/)[0];
                node.nodeValue = `~ ${amount} JD`;
            }
            // Dynamic match for "Variable" / "متغير"
            else if (text === "Variable" || text === "متغير") {
                node.nodeValue = 'Variable';
            }
            // Dynamic match for Empty state
            else if (text === "Your journey is empty." || text === "رحلتك فارغة.") {
                node.nodeValue = 'Your journey is empty.';
            }
            else if (text === "Add destinations to start planning!" || text === "أضف وجهات لبدء التخطيط!") {
                node.nodeValue = 'Add destinations to start planning!';
            }
        }
    } else if (node.nodeType === 1) {
        for (let i = 0; i < node.childNodes.length; i++) {
            walkTextNodes(node.childNodes[i], dictionary);
        }
    }
}

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
                const response = await fetch('http://127.0.0.1:8000/api/generate-journey', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        starting_location: "Amman",
                        preferred_destinations: destNames,
                        trip_duration_days: Math.max(3, destNames.length),
                        number_of_travelers: 2,
                        budget: 1500.0,
                        travel_style: ["Explorer", "Cultural"],
                        hotel_preference: "Standard"
                    })
                });

                if (!response.ok) {
                    const err = await response.json();
                    let errMsg = err.detail;
                    if (Array.isArray(errMsg)) {
                        errMsg = errMsg.map(e => e.msg + " (" + e.loc.join('.') + ")").join(', ');
                    }
                    throw new Error(errMsg || "Failed to generate itinerary");
                }

                const data = await response.json();
                
                                // Render the AI response beautifully
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
