document.addEventListener('DOMContentLoaded', () => {
    
    // Load dynamic user info
    const savedName = sessionStorage.getItem('shmagh_name');
    const savedEmail = sessionStorage.getItem('shmagh_email');
    
    if (savedName) {
        const dName = document.getElementById('display-name');
        const iName = document.getElementById('input-name');
        if (dName) dName.innerText = savedName;
        if (iName) iName.value = savedName;
    }
    
    if (savedEmail) {
        const iEmail = document.getElementById('input-email');
        if (iEmail) iEmail.value = savedEmail;
    }

    // Tabs logic

    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(tab.getAttribute('data-tab')).classList.add('active');
        });
    });

    // Logout
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('shmagh_token');
            sessionStorage.removeItem('shmagh_name');
            sessionStorage.removeItem('shmagh_email');
            window.location.href = 'index.html';
        });
    }

    // Translation logic
    const en2ar_profile = {
        "Home": "الرئيسية",
        "Favorite": "المفضلة",
        "Converter": "محول العملات",
        "LOG OUT": "تسجيل الخروج",
        "JOURNAL": "يوميات",
        "SAVED": "المحفوظات",
        "SETTINGS": "الإعدادات",
        "PERSONAL INFO": "المعلومات الشخصية",
        "SECURITY": "الأمان",
        "Full Name": "الاسم الكامل",
        "Email Address": "البريد الإلكتروني",
        "Current Password": "كلمة المرور الحالية",
        "New Password": "كلمة المرور الجديدة",
        "UPDATE PASSWORD": "تحديث كلمة المرور",
        "Your journal is empty.": "يومياتك فارغة.",
        "You haven't saved any destinations yet.": "لم تقم بحفظ أي وجهات بعد."
    };

    const ar2en_profile = Object.fromEntries(Object.entries(en2ar_profile).map(([k, v]) => [v, k]));

    function walkTextNodes(node, dictionary) {
        if (node.nodeType === 3) {
            let text = node.nodeValue.replace(/\s+/g, ' ').trim();
            if (text && dictionary[text]) {
                node.nodeValue = node.nodeValue.replace(text, dictionary[text]);
            }
        } else if (node.nodeType === 1 && node.nodeName !== 'SCRIPT' && node.nodeName !== 'STYLE') {
            for (let i = 0; i < node.childNodes.length; i++) {
                walkTextNodes(node.childNodes[i], dictionary);
            }
        }
    }

    const langToggle = document.getElementById('lang-toggle');
    const savedLang = localStorage.getItem('shmagh_lang') || 'en';
    
    if (savedLang === 'ar') {
        if (langToggle) langToggle.checked = true;
        document.body.style.direction = 'rtl';
        document.body.classList.add('rtl-active');
        walkTextNodes(document.body, en2ar_profile);
    }

    if (langToggle) {
        langToggle.addEventListener('change', (e) => {
            const lang = e.target.checked ? 'ar' : 'en';
            localStorage.setItem('shmagh_lang', lang);
            
            if (lang === 'ar') {
                document.body.style.direction = 'rtl';
                document.body.classList.add('rtl-active');
                walkTextNodes(document.body, en2ar_profile);
            } else {
                document.body.style.direction = 'ltr';
                document.body.classList.remove('rtl-active');
                walkTextNodes(document.body, ar2en_profile);
            }
        });
    }
});

    // Update Password logic
    const updatePwBtn = document.getElementById('update-password-btn');
    if (updatePwBtn) {
        updatePwBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const pwInputs = document.querySelectorAll('.profile-card:nth-child(2) input[type="password"], .profile-card:nth-child(2) input[type="text"]');
            const currentPassword = pwInputs[0].value;
            const newPassword = pwInputs[1].value;
            
            if (!currentPassword || !newPassword) {
                showToast('Please fill in both current and new passwords.', 'error');
                return;
            }
            
            updatePwBtn.innerText = 'UPDATING...';
            updatePwBtn.disabled = true;
            
            try {
                const token = sessionStorage.getItem('shmagh_token');
                const response = await fetch('http://localhost:8000/api/auth/update-password', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        current_password: currentPassword,
                        new_password: newPassword
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showToast('Password successfully updated!', 'success');
                    pwInputs.forEach(input => input.value = '');
                } else {
                    showToast(data.detail || 'Failed to update password.', 'error');
                }
            } catch (err) {
                console.error(err);
                showToast('An error occurred while connecting to the server.', 'error');
            } finally {
                updatePwBtn.innerText = 'UPDATE PASSWORD';
                updatePwBtn.disabled = false;
            }
        });
    }
