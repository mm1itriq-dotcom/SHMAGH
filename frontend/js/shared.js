// shared.js

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth Check
    const token = sessionStorage.getItem('shmagh_token');
    const isIndex = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
    
    if (token && !isIndex) {
        try {
            const response = await fetch('http://127.0.0.1:8000/api/auth/verify', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (!response.ok) {
                sessionStorage.clear();
                window.location.href = 'index.html';
            }
        } catch (e) {
            console.error("Auth verify failed", e);
        }
    } else if (!token && !isIndex) {
        window.location.href = 'index.html';
    }

    // 2. Inactive Links Fix
    document.querySelectorAll('a[href="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const text = link.innerText.trim() || "This feature";
            if (text === "Favorite" || text === "المفضلة") {
                window.location.href = "profile.html";
            } else if (text === "Historical Sites" || text === "مواقع تاريخية") {
                window.location.href = "destinations.html?category=Historical";
            } else if (text === "Nature & Desert" || text === "الطبيعة والصحراء") {
                window.location.href = "destinations.html?category=Nature";
            } else if (text === "Bedouin Culture" || text === "الثقافة البدوية") {
                window.location.href = "destinations.html?category=Culture";
            } else if (text === "Cities & Regions" || text === "مدن ومناطق") {
                window.location.href = "destinations.html?category=Regions";
            } else if (text === "Traveler's Toolkit" || text === "أدوات المسافر") {
                window.location.href = "home.html#toolkit";
            } else if (text === "Community Journal" || text === "يوميات المجتمع") {
                window.location.href = "gallery.html";
            } else if (link.querySelector('.ph-instagram-logo')) {
                window.open('https://instagram.com/visitjordan', '_blank');
            } else if (link.querySelector('.ph-twitter-logo')) {
                window.open('https://twitter.com/visitjordan', '_blank');
            } else if (link.querySelector('.ph-facebook-logo')) {
                window.open('https://facebook.com/visitjordan', '_blank');
            } else if (link.querySelector('.ph-youtube-logo')) {
                window.open('https://youtube.com/visitjordan', '_blank');
            } else if (text === "Converter" || text === "محول العملات") {
                 if (typeof showToast !== 'undefined') showToast("Please use the converter section on the home page.", "info");
            } else {
                if (typeof showToast !== 'undefined') showToast(text + " is coming soon! Stay tuned.", "info");
            }
        });
    });

    // 3. Global Translation Logic
    const dictionaryEn2Ar = {
        "Home": "الرئيسية",
        "Explore": "استكشف",
        "Stories": "قصص",
        "Culture": "ثقافة",
        "Weather": "الطقس",
        "Toolkit": "الأدوات",
        "Gallary": "المعرض",
        "Gallery": "المعرض",
        "Converter": "محول العملات",
        "Favorite": "المفضلة",
        "LOG OUT": "تسجيل الخروج",
        "Privacy Policy": "سياسة الخصوصية",
        "Terms of Service": "شروط الخدمة",
        "Contact Us": "اتصل بنا",
        "FAQ & Support": "الدعم والأسئلة الشائعة",
        "Discover Destinations": "اكتشف الوجهات",
        "Your Journey": "رحلتك",
        "Share Your Journey": "شارك رحلتك",
        "Community Journal": "يوميات المجتمع",
        "Upload Photo": "رفع صورة",
        "My Photos": "صوري",
        "All Photos": "كل الصور",
        "Historical Sites": "مواقع تاريخية",
        "Nature & Desert": "الطبيعة والصحراء",
        "Bedouin Culture": "الثقافة البدوية",
        "Cities & Regions": "مدن ومناطق",
        "Traveler's Toolkit": "أدوات المسافر"
    };
    
    const dictionaryAr2En = {};
    for (let en in dictionaryEn2Ar) { dictionaryAr2En[dictionaryEn2Ar[en]] = en; }

    function walkTextNodes(node, dict) {
        if (node.nodeType === 3) {
            let text = node.nodeValue.replace(/\s+/g, ' ').trim();
            if (text && dict[text]) {
                node.nodeValue = node.nodeValue.replace(text, dict[text]);
            }
        } else if (node.nodeType === 1 && node.nodeName !== 'SCRIPT' && node.nodeName !== 'STYLE') {
            if (node.placeholder && dict[node.placeholder.trim()]) {
                node.placeholder = dict[node.placeholder.trim()];
            }
            for (let i = 0; i < node.childNodes.length; i++) {
                walkTextNodes(node.childNodes[i], dict);
            }
        }
    }

    function applyGlobalTranslation(lang) {
        const dict = lang === 'ar' ? dictionaryEn2Ar : dictionaryAr2En;
        walkTextNodes(document.body, dict);
        
        if (lang === 'ar') {
            document.body.style.direction = 'rtl';
            document.body.classList.add('rtl-active');
            document.querySelectorAll('.en-label').forEach(el => el.classList.remove('active-lang'));
            document.querySelectorAll('.ar-label').forEach(el => el.classList.add('active-lang'));
            document.querySelectorAll('#lang-toggle').forEach(t => t.checked = true);
        } else {
            document.body.style.direction = 'ltr';
            document.body.classList.remove('rtl-active');
            document.querySelectorAll('.en-label').forEach(el => el.classList.add('active-lang'));
            document.querySelectorAll('.ar-label').forEach(el => el.classList.remove('active-lang'));
            document.querySelectorAll('#lang-toggle').forEach(t => t.checked = false);
        }
    }

    const savedLang = localStorage.getItem('shmagh_lang') || 'en';
    applyGlobalTranslation(savedLang);
    
    document.querySelectorAll('#lang-toggle').forEach(toggle => {
        toggle.addEventListener('change', (e) => {
            const lang = e.target.checked ? 'ar' : 'en';
            localStorage.setItem('shmagh_lang', lang);
            window.location.reload();
        });
    });
});
