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
            const response = await fetch("http://127.0.0.1:8000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            btn.innerHTML = originalText;
            btn.disabled = false;

            if (response.ok) {
                // Save JWT Token to sessionStorage
                sessionStorage.setItem("shmagh_token", data.token);
                sessionStorage.setItem("shmagh_name", data.user.name);
                sessionStorage.setItem("shmagh_email", email);
                window.location.href = "home.html";
            } else {
                showToast(data.detail || "Login failed.", "error");
            }
        } catch (error) {
            btn.innerHTML = originalText;
            btn.disabled = false;
            showToast("Error connecting to server.", "error");
        }
    });

    document.getElementById("signupForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const name = document.getElementById("signupName").value;
        const email = document.getElementById("signupEmail").value;
        const password = document.getElementById("signupPassword").value;
        const confirmPassword = document.getElementById("signupConfirmPassword").value;
        
        if (password !== confirmPassword) {
            showToast("Passwords do not match!", "error");
            return;
        }

        const btn = e.target.querySelector('button');
        const originalText = btn.innerHTML;
        btn.innerHTML = 'Creating Account... <i class="ph ph-spinner ph-spin"></i>';
        btn.disabled = true;
        
        try {
            const response = await fetch("http://127.0.0.1:8000/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password })
            });
            
            const data = await response.json();
            
            btn.innerHTML = originalText;
            btn.disabled = false;

            if (response.ok) {
                showToast("Account created successfully! Please login.", "success");
                document.getElementById("signupForm").reset();
                // trigger click on the "showLoginBtn" to slide back to login panel
                const showLoginBtn = document.getElementById("showLogin");
                if(showLoginBtn) showLoginBtn.click();
            } else {
                showToast(data.detail || "Registration failed.", "error");
            }
        } catch (error) {
            btn.innerHTML = originalText;
            btn.disabled = false;
            showToast("Error connecting to server.", "error");
        }
    });
});
