import { auth, db, doc, getDoc, setDoc, updateDoc, arrayRemove, collection, query, where, getDocs, deleteDoc } from './firebase-init.js';
import { updatePassword, signOut, reauthenticateWithCredential, EmailAuthProvider } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {

    // Fetch User Data for Saved and Journal
    async function loadUserData() {
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const docRef = doc(db, "users", user.uid);
                    const docSnap = await getDoc(docRef);
                    
                    // Set email from auth
                    const iEmail = document.getElementById('input-email');
                    if (iEmail) iEmail.value = user.email || '';
                    
                    const displayName = user.displayName || 'Traveler';
                    
                    if (docSnap.exists()) {
                        const userData = docSnap.data();
                        renderSaved(userData.favorites || []);
                        renderJournal(userData.journal || []);
                        
                        // Set dynamic name from database or auth
                        const fullName = userData.full_name || userData.name || displayName;
                        const dName = document.getElementById('display-name');
                        const iName = document.getElementById('input-name');
                        if (dName) dName.innerText = fullName;
                        if (iName) iName.value = fullName;
                    } else {
                        // User exists in Auth but not in Firestore! Create it now.
                        const dName = document.getElementById('display-name');
                        const iName = document.getElementById('input-name');
                        if (dName) dName.innerText = displayName;
                        if (iName) iName.value = displayName;

                        renderSaved([]);
                        renderJournal([]);
                        
                        try {
                            await setDoc(docRef, {
                                email: user.email,
                                full_name: displayName,
                                created_at: new Date().toISOString(),
                                favorites: [],
                                journal: []
                            }, { merge: true });
                        } catch(e) {
                            console.error("Could not auto-create user document in Firestore:", e);
                        }
                    }
                } catch (e) {
                    console.error("Failed to load user data:", e);
                }
            }
        });
    }

    function renderSaved(favorites) {
        const savedContainer = document.getElementById('saved');
        if (!favorites || !favorites.length) {
            savedContainer.innerHTML = '<div class="empty-state"><p>You haven\'t saved any destinations yet.</p></div>';
            return;
        }
        
        let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem; padding: 1rem;">';
        favorites.forEach(fav => {
            html += `
                <div class="saved-item-card" style="position: relative; display: flex; flex-direction: column; justify-content: space-between;">
                    <button class="remove-fav-btn" data-dest="${fav}" style="position: absolute; top: 1.2rem; right: 1.2rem; background: none; border: none; color: #e74c3c; cursor: pointer; font-size: 1.2rem;"><i class="ph-fill ph-trash"></i></button>
                    <h4 style="padding-right: 2rem;"><i class="ph-fill ph-map-pin"></i> ${fav}</h4>
                    <div style="margin-top: 1.5rem;">
                        <button class="gold-btn" onclick="window.location.href='destinations.html'" style="width: 100%; padding: 0.6rem; font-size: 0.9rem; text-align: center;">VIEW</button>
                    </div>
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
                const user = auth.currentUser;
                if (!user) return;

                const card = e.currentTarget.closest('.saved-item-card');
                card.style.opacity = '0.5';
                
                try {
                    await setDoc(doc(db, "users", user.uid), {
                        favorites: arrayRemove(destName)
                    }, { merge: true });
                    card.remove();
                    if (!savedContainer.querySelector('.saved-item-card')) {
                        savedContainer.innerHTML = '<div class="empty-state"><p>You haven\'t saved any destinations yet.</p></div>';
                    }
                    if(window.showToast) window.showToast("Removed from saved", "success");
                } catch(err) {
                    card.style.opacity = '1';
                    if(window.showToast) window.showToast("Failed to remove", "error");
                }
            });
        });
    }

    function renderJournal(journalEntries) {
        const journalContainer = document.getElementById('journal');
        if (!journalEntries || !journalEntries.length) {
            journalContainer.innerHTML = '<div class="empty-state"><p>Your journal is empty. Generate some journeys!</p></div>';
            return;
        }

        let html = '<div class="journal-list">';
        journalEntries.forEach((entry, index) => {
            
            // Build the details HTML
            let detailsHtml = '<div class="journal-details" id="journal-details-' + index + '" style="display: none; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.1);">';
            const data = entry.itinerary_data;
            if (data) {
                if (data.trip_summary) {
                    detailsHtml += `<div style="margin-bottom: 1rem;"><strong>Trip Summary</strong><br>Dates: ${data.trip_summary.Dates}<br>Travelers: ${data.trip_summary.Travelers}<br>Hotel: ${data.trip_summary.Hotel}<br>Budget: ${data.trip_summary.Budget}</div>`;
                }
                if (data.itinerary && Array.isArray(data.itinerary)) {
                    data.itinerary.forEach(day => {
                        detailsHtml += `<div style="margin-bottom: 1rem; background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px;">`;
                        detailsHtml += `<strong style="color: var(--gold);">${day.day_title || ''} - ${day.date || ''}</strong><br>`;
                        if (day.theme) detailsHtml += `<em style="color: #aaa; font-size: 0.9rem;">${day.theme}</em><br><br>`;
                        if (day.morning_activities) detailsHtml += `<strong>Morning:</strong> ${day.morning_activities.join(', ')}<br>`;
                        if (day.afternoon_activities) detailsHtml += `<strong>Afternoon:</strong> ${day.afternoon_activities.join(', ')}<br>`;
                        if (day.evening_activities) detailsHtml += `<strong>Evening:</strong> ${day.evening_activities.join(', ')}<br>`;
                        if (day.driving_segments) detailsHtml += `<strong>Driving:</strong> ${day.driving_segments.join(', ')}<br>`;
                        detailsHtml += `</div>`;
                    });
                }
                if (data.cost_analysis) {
                    detailsHtml += `<div style="margin-top: 1rem;"><strong>Budget Summary</strong><br>Total: ${data.cost_analysis.total_cost}</div>`;
                }
            } else {
                detailsHtml += '<p>No details available.</p>';
            }
            detailsHtml += '</div>';

            html += `
                <div class="journal-card">
                    <div class="journal-header">
                        <h4>${entry.title || 'My Journey'}</h4>
                        <span>${entry.date || ''}</span>
                    </div>
                    <div class="journal-body">
                        <p style="margin-bottom: 1rem;"><strong>Route:</strong> ${entry.itinerary_data?.recommended_trip?.route?.join(' &rarr; ') || 'N/A'}</p>
                        <button class="gold-btn view-journal-btn" data-index="${index}" style="padding: 0.5rem 1.5rem; font-size: 0.9rem;">View Details</button>
                        ${detailsHtml}
                    </div>
                </div>
            `;
        });
        html += '</div>';
        journalContainer.innerHTML = html;

        // Attach event listeners for View Details
        const viewBtns = journalContainer.querySelectorAll('.view-journal-btn');
        viewBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.currentTarget.getAttribute('data-index');
                const detailsDiv = document.getElementById('journal-details-' + idx);
                if (detailsDiv.style.display === 'none') {
                    detailsDiv.style.display = 'block';
                    e.currentTarget.innerText = 'Hide Details';
                } else {
                    detailsDiv.style.display = 'none';
                    e.currentTarget.innerText = 'View Details';
                }
            });
        });
    }

    loadUserData();

    // Fetch user uploaded photos
    async function renderMyPhotos() {
        const photosContainer = document.getElementById('my-photos');
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const q = query(collection(db, "gallery"), where("uid", "==", user.uid));
                    const querySnapshot = await getDocs(q);
                    
                    let html = '';
                    if (querySnapshot.empty) {
                        html = '<div class="empty-state"><p>You haven\'t uploaded any photos yet.</p></div>';
                    } else {
                        querySnapshot.forEach(docSnap => {
                            const photo = docSnap.data();
                            html += `
                                <div class="photo-item-card" style="background-image: url('${photo.image_url}')">
                                    <button class="remove-photo-btn" data-id="${docSnap.id}"><i class="ph ph-trash"></i></button>
                                    <div class="photo-overlay">
                                        <span><i class="ph-fill ph-heart"></i> ${photo.likes || 0}</span>
                                    </div>
                                </div>
                            `;
                        });
                    }
                    photosContainer.innerHTML = html;

                    // Attach listeners
                    const removeBtns = photosContainer.querySelectorAll('.remove-photo-btn');
                    removeBtns.forEach(btn => {
                        btn.addEventListener('click', async (e) => {
                            const photoId = e.currentTarget.getAttribute('data-id');
                            const card = e.currentTarget.closest('.photo-item-card');
                            card.style.opacity = '0.5';
                            
                            try {
                                await deleteDoc(doc(db, "gallery", photoId));
                                card.remove();
                                if (!photosContainer.querySelector('.photo-item-card')) {
                                    photosContainer.innerHTML = '<div class="empty-state"><p>You haven\'t uploaded any photos yet.</p></div>';
                                }
                                if(window.showToast) window.showToast("Photo deleted", "success");
                            } catch(err) {
                                card.style.opacity = '1';
                                if(window.showToast) window.showToast("Failed to delete photo", "error");
                            }
                        });
                    });
                } catch (e) {
                    console.error("Failed to load user photos:", e);
                }
            }
        });
    }

    renderMyPhotos();


    
// Load dynamic user info handled directly from Firebase now.

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
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await signOut(auth);
            } catch(e) {}
            sessionStorage.removeItem('shmagh_token');
            sessionStorage.removeItem('shmagh_name');
            sessionStorage.removeItem('shmagh_email');
            window.location.href = 'index.html';
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
            if(window.showToast) showToast('Please fill in both current and new passwords.', 'error');
            return;
        }
        
        updatePwBtn.innerText = 'UPDATING...';
        updatePwBtn.disabled = true;
        
        try {
            const user = auth.currentUser;
            if(!user) throw new Error("Not logged in");
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            if(window.showToast) showToast('Password successfully updated!', 'success');
            pwInputs.forEach(input => input.value = '');
        } catch (err) {
            console.error(err);
            if(window.showToast) showToast('Failed to update password. Check current password.', 'error');
        } finally {
            updatePwBtn.innerText = 'UPDATE PASSWORD';
            updatePwBtn.disabled = false;
        }
    });
}
