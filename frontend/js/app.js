import { auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, doc, setDoc, updateProfile, signOut } from './firebase-init.js';
// ==========================================
// SHMAGH | LOGIN & SIGNUP TOGGLE LOGIC
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    
    const pageWrapper = document.getElementById("pageWrapper");
    const loginPanel = document.getElementById("loginPanel");
    const signupPanel = document.getElementById("signupPanel");
    
    const showSignupBtn = document.getElementById("showSignup");
    const showLoginBtn = document.getElementById("showLogin");
    
    // --- Toggle to Sign Up Mode ---
    showSignupBtn.addEventListener("click", () => {
        // Change Background (adds class that switches to Wadi Rum)
        pageWrapper.classList.add("signup-mode");
        
        // Hide Login, Show Signup
        loginPanel.classList.add("hidden");
        setTimeout(() => {
            signupPanel.classList.remove("hidden");
        }, 100); // Small delay for smooth visual transition
    });
    
    // --- Toggle back to Login Mode ---
    showLoginBtn.addEventListener("click", () => {
        // Change Background (removes class to switch back to Petra)
        pageWrapper.classList.remove("signup-mode");
        
        // Hide Signup, Show Login
        signupPanel.classList.add("hidden");
        setTimeout(() => {
            loginPanel.classList.remove("hidden");
        }, 100);
    });

    // --- REAL SUBMIT HANDLERS (Connected to FastAPI & Firebase) ---
    
        document.getElementById("loginForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;
        if (!email || !password) {
            showToast("Please enter both email and password.", "error");
            return;
        }
        const btn = e.target.querySelector('button');
        const originalText = btn.innerHTML;
        btn.innerHTML = 'Logging in... <i class="ph ph-spinner ph-spin"></i>';
        btn.disabled = true;
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            sessionStorage.setItem('shmagh_token', userCredential.user.uid);
            btn.innerHTML = originalText;
            btn.disabled = false;
            if (typeof showToast !== 'undefined') showToast("Login successful!", "success");
            setTimeout(() => window.location.href = 'home.html', 1000);
        } catch(error) {
            btn.innerHTML = originalText;
            btn.disabled = false;
            let errMsg = "Invalid email or password.";
            if (error.code === 'auth/too-many-requests') errMsg = "Too many failed attempts. Please try again later.";
            if (typeof showToast !== 'undefined') showToast(errMsg, "error");
        }
    });

    document.getElementById("signupForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("signupName").value;
        const email = document.getElementById("signupEmail").value;
        const password = document.getElementById("signupPassword").value;
        if (!name || !email || !password) {
            showToast("Please fill all fields.", "error");
            return;
        }
        const btn = e.target.querySelector('button');
        const originalText = btn.innerHTML;
        btn.innerHTML = 'Signing up... <i class="ph ph-spinner ph-spin"></i>';
        btn.disabled = true;
        try {
            sessionStorage.setItem('is_signing_up', 'true');
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // 1. Update the Auth profile itself so the name is always attached to the user!
            if (typeof updateProfile !== 'undefined') {
                await updateProfile(userCredential.user, { displayName: name }).catch(e=>console.log(e));
            }
            
            // 2. Try to save to Firestore
            try {
                await setDoc(doc(db, "users", userCredential.user.uid), {
                    email: email,
                    full_name: name,
                    created_at: new Date().toISOString()
                });
            } catch(dbErr) {
                console.error("Firestore save failed (likely rules), but user registered:", dbErr);
            }
            
            // 3. Immediately sign out the user so they must manually log in
            await signOut(auth);
            sessionStorage.removeItem('is_signing_up');
            
            btn.innerHTML = originalText;
            btn.disabled = false;
            if (typeof showToast !== 'undefined') showToast("Registration successful! Please login.", "success");
            document.getElementById('showLogin').click();
            // Optional: reset form fields
            document.getElementById('signupName').value = '';
            document.getElementById('signupEmail').value = '';
            document.getElementById('signupPassword').value = '';
        } catch(error) {
            sessionStorage.removeItem('is_signing_up');
            btn.innerHTML = originalText;
            btn.disabled = false;
            let errMsg = "Registration failed.";
            if (error.code === 'auth/email-already-in-use') errMsg = "This email is already registered.";
            else if (error.code === 'auth/weak-password') errMsg = "Password should be at least 6 characters.";
            else if (error.code === 'auth/invalid-email') errMsg = "Please enter a valid email address.";
            if (typeof showToast !== 'undefined') showToast(errMsg, "error");
        }
    });
});