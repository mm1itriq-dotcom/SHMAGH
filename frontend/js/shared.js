import { auth, onAuthStateChanged, signOut } from './firebase-init.js';
// shared.js

// 1. Auth Check (Firebase)
    const isIndex = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.includes('index.html');
    onAuthStateChanged(auth, (user) => {
        if (user) {
            sessionStorage.setItem('shmagh_token', user.uid);
            // If they are on index.html (login page) and already logged in, send them to home
            if (isIndex) {
                window.location.replace('home.html');
            }
        } else {
            sessionStorage.removeItem('shmagh_token');
            if (!isIndex) {
                window.location.replace('index.html');
            }
        }
    });

document.addEventListener('DOMContentLoaded', async () => {


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

    // 3. Translation is now handled by js/i18n.js (data-i18n system)

    // 4. Smart Sticky Navbar (Hide on scroll down, show on scroll up)
    let lastScrollTop = 0;
    const navbar = document.querySelector('nav');
    if (navbar) {
        navbar.style.transition = 'top 0.3s ease-in-out';
        navbar.style.position = 'fixed';
        navbar.style.width = '100%';
        navbar.style.zIndex = '9999';
        
        // Ensure body has padding so content isn't hidden under fixed navbar initially
        if (!document.body.classList.contains('index-body') && !document.body.classList.contains('auth-body') && !document.body.classList.contains('home-body')) {
            document.body.style.paddingTop = navbar.offsetHeight + 'px';
        }

        // Don't fight with home.js's native scroll logic
        if (!document.body.classList.contains('home-body')) {
            window.addEventListener('scroll', function() {
                let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                if (scrollTop > lastScrollTop && scrollTop > 80) {
                    // Scrolling Down
                    navbar.style.top = '-' + (navbar.offsetHeight + 10) + 'px';
                } else {
                    // Scrolling Up
                    navbar.style.top = '0';
                }
                lastScrollTop = scrollTop;
            });
        }
    }
});


// Expose logout to global scope for onclick handlers
window.logout = function() {
    signOut(auth).then(() => {
        sessionStorage.removeItem('shmagh_token');
        window.location.href = 'index.html';
    }).catch(e => {
        console.error("Logout error", e);
    });
};
