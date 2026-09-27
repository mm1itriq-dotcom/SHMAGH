document.addEventListener('DOMContentLoaded', () => {

    // Fetch User Data for Saved and Journal
    async function loadUserData() {
        const token = sessionStorage.getItem('shmagh_token');
        if (!token) return;
        
        try {
            const res = await fetch('http://127.0.0.1:8000/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const userData = await res.json();
                renderSaved(userData.favorites || []);
                renderJournal(userData.journal || []);
            }
        } catch (e) {
            console.error("Failed to load user data:", e);
        }
    }

    function renderSaved(favorites) {
        const savedContainer = document.getElementById('saved');
        if (!favorites.length) {
            savedContainer.innerHTML = '<div class="empty-state"><p>You haven\'t saved any destinations yet.</p></div>';
            return;
        }
        
        let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem; padding: 1rem;">';
        favorites.forEach(fav => {
            html += `
                <div class="saved-item-card" style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px; border: 1px solid rgba(212, 175, 55, 0.3); position: relative;">
                    <h3 style="color: var(--gold); margin: 0 0 0.5rem 0;">${fav}</h3>
                    <p style="margin:0; font-size: 0.85rem; color: #ccc;">Saved Destination</p>
                    <button class="remove-fav-btn" data-dest="${fav}" style="position: absolute; top: 1rem; right: 1rem; background: rgba(255,0,0,0.2); color: #ff4d4d; border: none; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;" title="Remove"><i class="ph ph-trash"></i></button>
                </div>
            `;
        });
        html += '</div>';
        savedContainer.innerHTML = html;

        // Attach listeners
        const removeBtns = savedContainer.querySelectorAll('.remove-fav-btn');
        removeBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const destName = e.currentTarget.getAttribute('data-dest');
                const token = sessionStorage.getItem('shmagh_token');
                if (!token) return;

                // Optimistic UI removal
                const card = e.currentTarget.closest('.saved-item-card');
                card.style.opacity = '0.5';
                
                try {
                    const res = await fetch('http://127.0.0.1:8000/api/user/favorite', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ destination_name: destName })
                    });
                    
                    if (res.ok) {
                        card.remove();
                        // check if empty
                        if (!savedContainer.querySelector('.saved-item-card')) {
                            savedContainer.innerHTML = '<div class="empty-state"><p>You haven\'t saved any destinations yet.</p></div>';
                        }
                        showToast(destName + " removed from Saved.", "success");
                    } else {
                        card.style.opacity = '1';
                        showToast("Failed to remove.", "error");
                    }
                } catch (err) {
                    card.style.opacity = '1';
                    showToast("Error connecting to server.", "error");
                }
            });
        });
    }

    function renderJournal(journalEntries) {
        const journalContainer = document.getElementById('journal');
        if (!journalEntries.length) {
            journalContainer.innerHTML = '<div class="empty-state"><p>Your journal is empty.</p></div>';
            return;
        }
        
        let html = '<div style="padding: 1rem; display: flex; flex-direction: column; gap: 1rem;">';
        journalEntries.forEach(entry => {
            const date = new Date(entry.date_saved).toLocaleDateString();
            const cost = entry.itinerary_data.cost_analysis ? entry.itinerary_data.cost_analysis.total_cost + ' JOD' : 'N/A';
            const route = entry.itinerary_data.recommended_trip ? entry.itinerary_data.recommended_trip.route.join(' &rarr; ') : 'Custom Itinerary';
            
            html += `
                <div style="background: rgba(255,255,255,0.05); padding: 1.5rem; border-radius: 8px; border-left: 4px solid var(--gold);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                        <div>
                            <h3 style="color: #fff; margin: 0 0 0.25rem 0;">${entry.title}</h3>
                            <p style="color: #888; font-size: 0.8rem; margin: 0;">Saved on ${date}</p>
                        </div>
                        <span style="background: rgba(212,175,55,0.1); color: var(--gold); padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem;">${cost}</span>
                    </div>
                    <p style="color: #ccc; font-size: 0.9rem; margin: 0;"><strong>Route:</strong> ${route}</p>
                </div>
            `;
        });
        html += '</div>';
        journalContainer.innerHTML = html;
    }

    loadUserData();

    async function renderMyPhotos() {
        const photosContainer = document.getElementById('my-photos');
        const token = sessionStorage.getItem('shmagh_token');
        if (!token) return;

        try {
            const res = await fetch('http://127.0.0.1:8000/api/user/photos', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const myPhotos = data.photos || [];
                
                if (!myPhotos.length) {
                    photosContainer.innerHTML = '<div class="empty-state"><p>You haven\'t uploaded any photos yet.</p></div>';
                    return;
                }
                
                let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; padding: 1rem;">';
                myPhotos.forEach(photo => {
                    html += `
                        <div class="photo-item-card" style="position: relative; border-radius: 8px; overflow: hidden; aspect-ratio: 1; border: 1px solid rgba(255,255,255,0.1);">
                            <img src="${photo.image_url}" style="width: 100%; height: 100%; object-fit: cover; display: block;">
                            <button class="remove-photo-btn" data-id="${photo.id}" style="position: absolute; top: 0.5rem; right: 0.5rem; background: rgba(0,0,0,0.7); color: #ff4d4d; border: 1px solid rgba(255,0,0,0.3); width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; transition: background 0.2s;" title="Delete Photo"><i class="ph ph-trash"></i></button>
                        </div>
                    `;
                });
                html += '</div>';
                photosContainer.innerHTML = html;

                // Attach listeners
                const removeBtns = photosContainer.querySelectorAll('.remove-photo-btn');
                removeBtns.forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const photoId = e.currentTarget.getAttribute('data-id');
                        const card = e.currentTarget.closest('.photo-item-card');
                        card.style.opacity = '0.5';
                        
                        try {
                            const delRes = await fetch(`http://127.0.0.1:8000/api/gallery/${photoId}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (delRes.ok) {
                                card.remove();
                                if (!photosContainer.querySelector('.photo-item-card')) {
                                    photosContainer.innerHTML = '<div class="empty-state"><p>You haven\'t uploaded any photos yet.</p></div>';
                                }
                                showToast("Photo deleted ", "success");
                            } else {
                                card.style.opacity = '1';
                                showToast("Failed to delete photo.", "error");
                            }
                        } catch(err) {
                            card.style.opacity = '1';
                            showToast("Error connecting to server.", "error");
                        }
                    });
                });
            }
        } catch (e) {
            console.error("Failed to load user photos:", e);
        }
    }

    renderMyPhotos();


    
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
                const response = await fetch('http://127.0.0.1:8000/api/auth/update-password', {
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
