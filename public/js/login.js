// login.js: Custom functionality for the login page

document.addEventListener('DOMContentLoaded', function () {
  // This code runs only if the form-validator.js hasn't been loaded
  // or if there's any custom functionality needed for login page
  
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return;
  
  // If FormValidator is not loaded, provide basic functionality
  if (typeof FormValidator === 'undefined') {
    console.warn('FormValidator not loaded, using basic form handling');
    
    // Insert error message container if not present
    let errorDiv = document.getElementById('login-error');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.id = 'login-error';
      errorDiv.className = 'text-red-600 text-sm mb-3';
      loginForm.insertBefore(errorDiv, loginForm.firstChild);
    }

    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      errorDiv.textContent = '';
      const formData = new FormData(loginForm);
      const data = Object.fromEntries(formData.entries());

      try {
        const response = await fetch('/auth/login', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        if (response.ok) {
          const res = await response.json();
          if (res.redirectUrl) {
            window.location.href = res.redirectUrl;
          } else {
            window.location.reload();
          }
        } else {
          const res = await response.json();
          errorDiv.textContent = res.error || 'Invalid email or password';
          
          // Handle field-specific errors if available
          if (res.errors) {
            res.errors.forEach(err => {
              const field = document.querySelector(`[name="${err.field}"]`);
              if (field) {
                field.classList.add('is-invalid');
                
                // Add field-specific error message if container exists
                const fieldError = document.querySelector(`[data-error-for="${err.field}"]`);
                if (fieldError) {
                  fieldError.textContent = err.message;
                }
              }
            });
          }
        }
      } catch (err) {
        errorDiv.textContent = 'An error occurred. Please try again.';
      }
    });
  }
  
  // Add password toggle functionality to login form
  const passwordField = document.getElementById('password');
  if (passwordField) {
    // Create toggle button if not exists
    let toggleBtn = loginForm.querySelector('.toggle-password');
    if (!toggleBtn) {
      const passwordParent = passwordField.parentElement;
      toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.className = 'toggle-password absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary transition-colors duration-300';
      toggleBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';
      passwordParent.appendChild(toggleBtn);
    }
    
    // Add event listener for password visibility toggle
    toggleBtn.addEventListener('click', function() {
      const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordField.setAttribute('type', type);
      
      // Toggle icon
      const icon = this.querySelector('i');
      icon.classList.toggle('fa-eye');
      icon.classList.toggle('fa-eye-slash');
    });
  }
});
