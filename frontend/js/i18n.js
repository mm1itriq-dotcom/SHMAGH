// i18n.js — Lightweight internationalization module for SHMAGH
// Translates elements with data-i18n, data-i18n-placeholder, data-i18n-aria attributes.
// Switches language dynamically WITHOUT page reload.

const SHMAGHi18n = (() => {
    const cache = {};       // { 'en': {...}, 'ar': {...} }
    let currentLang = 'en';

    // Resolve dot-notation key: "navigation.home" → obj.navigation.home
    function resolve(obj, key) {
        return key.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), obj);
    }

    // Check if a string contains HTML tags
    function containsHTML(str) {
        return /<[a-z][\s\S]*>/i.test(str);
    }

    // Fetch and cache a locale file
    async function loadLocale(lang) {
        if (cache[lang]) return cache[lang];
        try {
            const res = await fetch(`locales/${lang}.json`);
            if (!res.ok) throw new Error(`Failed to load locales/${lang}.json`);
            cache[lang] = await res.json();
            return cache[lang];
        } catch (e) {
            console.error('[i18n]', e.message);
            return null;
        }
    }

    // Apply translations to all tagged elements in the DOM
    function applyTranslations(dict) {
        if (!dict) return;

        // Text content
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const val = resolve(dict, key);
            if (val !== null) {
                // If value contains HTML (like <br>), use innerHTML
                if (containsHTML(val)) {
                    // Preserve child elements (like <i> icons) by saving and restoring them
                    const icons = el.querySelectorAll('i, svg');
                    if (icons.length > 0) {
                        const savedIcons = Array.from(icons).map(ic => ic.cloneNode(true));
                        el.innerHTML = val + ' ';
                        savedIcons.forEach(ic => el.appendChild(ic));
                    } else {
                        el.innerHTML = val;
                    }
                } else {
                    // Preserve child elements (like <i> icons inside buttons)
                    const icons = el.querySelectorAll('i, span.ph, svg');
                    if (icons.length > 0 && el.childNodes.length > 1) {
                        // Find the text node and replace only it
                        for (const node of el.childNodes) {
                            if (node.nodeType === 3 && node.textContent.trim()) {
                                node.textContent = val + ' ';
                                break;
                            }
                        }
                    } else {
                        el.textContent = val;
                    }
                }
            }
        });

        // Placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            const val = resolve(dict, key);
            if (val !== null) el.placeholder = val;
        });

        // Aria labels
        document.querySelectorAll('[data-i18n-aria]').forEach(el => {
            const key = el.getAttribute('data-i18n-aria');
            const val = resolve(dict, key);
            if (val !== null) el.setAttribute('aria-label', val);
        });
    }

    // Set document direction and lang attribute
    function setDirection(lang) {
        document.documentElement.lang = lang;
        if (lang === 'ar') {
            document.documentElement.dir = 'rtl';
            document.body.classList.add('rtl-active');
        } else {
            document.documentElement.dir = 'ltr';
            document.body.classList.remove('rtl-active');
        }
    }

    // Sync the lang-toggle checkbox state (if it exists on the page)
    function syncToggle(lang) {
        const toggles = document.querySelectorAll('#lang-toggle');
        toggles.forEach(t => { t.checked = (lang === 'ar'); });

        document.querySelectorAll('.en-label').forEach(el => {
            el.classList.toggle('active-lang', lang === 'en');
        });
        document.querySelectorAll('.ar-label').forEach(el => {
            el.classList.toggle('active-lang', lang === 'ar');
        });
    }

    // Public: switch language dynamically (no reload)
    async function setLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('shmagh_lang', lang);
        const dict = await loadLocale(lang);
        setDirection(lang);
        applyTranslations(dict);
        syncToggle(lang);
        // Dispatch event so other scripts can react (e.g., re-translate dynamic cards)
        document.dispatchEvent(new CustomEvent('langChanged', { detail: { lang } }));
    }

    // Public: get current language
    function getLanguage() {
        return currentLang;
    }

    // Public: re-apply translations to the current page (call after dynamic content is added)
    async function translatePage() {
        const dict = await loadLocale(currentLang);
        applyTranslations(dict);
    }

    // Public: translate a single key, returns the translated string or fallback
    async function translate(key, fallback) {
        const dict = await loadLocale(currentLang);
        if (!dict) return fallback || key;
        const val = resolve(dict, key);
        return val !== null ? val : (fallback || key);
    }

    // Initialize on DOM ready
    async function init() {
        currentLang = localStorage.getItem('shmagh_lang') || 'en';
        const dict = await loadLocale(currentLang);
        setDirection(currentLang);
        applyTranslations(dict);
        syncToggle(currentLang);

        // Wire up any lang-toggle checkboxes on the page
        document.querySelectorAll('#lang-toggle').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const newLang = e.target.checked ? 'ar' : 'en';
                setLanguage(newLang);
            });
        });
    }

    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose public API
    return { setLanguage, getLanguage, translatePage, translate, init };
})();

