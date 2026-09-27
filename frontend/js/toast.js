window.showToast = function(message, type = 'success') {
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    const toast = document.createElement('div');
    toast.className = `custom-toast toast-${type}`;
    
    const icon = type === 'success' ? '<i class="ph ph-check-circle"></i>' : '<i class="ph ph-warning-circle"></i>';
    
    toast.innerHTML = `
        ${icon}
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
};

// Password Visibility Toggle Logic
document.addEventListener('click', function(e) {
    if (e.target && e.target.classList.contains('toggle-password')) {
        // Find the input field relative to the icon
        // Usually it's the previous element sibling
        let input = e.target.previousElementSibling;
        if (!input || input.tagName !== 'INPUT') {
            // fallback for different DOM structures
            const container = e.target.parentElement;
            input = container.querySelector('input');
        }
        
        if (input) {
            if (input.type === 'password') {
                input.type = 'text';
                e.target.classList.remove('ph-eye');
                e.target.classList.add('ph-eye-slash');
            } else {
                input.type = 'password';
                e.target.classList.remove('ph-eye-slash');
                e.target.classList.add('ph-eye');
            }
        }
    }
});
