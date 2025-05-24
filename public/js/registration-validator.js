// Advanced form validation for registration page
class RegistrationValidator {
  constructor() {
    this.form = document.getElementById('registerForm');
    this.inputs = {
      name: document.getElementById('name'),
      email: document.getElementById('email'),
      password: document.getElementById('password'),
      confirmPassword: document.getElementById('confirmPassword'),
      terms: document.getElementById('terms')
    };
    
    this.init();
  }

  init() {
    if (!this.form) return;
    
    this.setupEventListeners();
    this.initPasswordToggles();
    this.showBackendErrors();
  }

  setupEventListeners() {
    // Form submission
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    
    // Real-time validation
    Object.keys(this.inputs).forEach(field => {
      const input = this.inputs[field];
      if (input) {
        input.addEventListener('input', () => this.handleInput(field));
        input.addEventListener('blur', () => this.handleBlur(field));
      }
    });
  }

  handleSubmit(e) {
    let isValid = true;
    this.hideAllErrors();

    // Validate all fields
    if (!this.validateName()) isValid = false;
    if (!this.validateEmail()) isValid = false;
    if (!this.validatePassword()) isValid = false;
    if (!this.validateConfirmPassword()) isValid = false;
    if (!this.validateTerms()) isValid = false;

    if (!isValid) {
      e.preventDefault();
      this.scrollToFirstError();
    }
  }

  handleInput(field) {
    this.clearServerError();
    
    switch (field) {
      case 'name':
        if (this.inputs.name.value.trim()) this.hideError('name');
        break;
      case 'email':
        this.validateEmail(this.inputs.email);
        break;
      case 'password':
        if (this.inputs.password.value.length >= 6) {
          this.hideError('password');
          if (this.inputs.confirmPassword.value) {
            this.validateConfirmPassword();
          }
        }
        break;
      case 'confirmPassword':
        if (this.inputs.confirmPassword.value === this.inputs.password.value) {
          this.hideError('confirmPassword');
        }
        break;
    }
  }

  handleBlur(field) {
    const input = this.inputs[field];
    input.dataset.touched = 'true';
    
    switch (field) {
      case 'name':
        if (!input.value.trim()) this.showError('name', 'Name is required');
        break;
      case 'email':
        this.validateEmail(input);
        break;
      case 'password':
        if (!input.value) this.showError('password', 'Password is required');
        else if (input.value.length < 6) this.showError('password', 'Password must be at least 6 characters');
        break;
      case 'confirmPassword':
        if (input.value !== this.inputs.password.value) {
          this.showError('confirmPassword', 'Passwords do not match');
        }
        break;
    }
  }

  validateName() {
    const name = this.inputs.name.value.trim();
    if (!name) {
      this.showError('name', 'Name is required');
      return false;
    }
    this.hideError('name');
    return true;
  }

  validateEmail(input = this.inputs.email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const value = input.value.trim();
    
    if (!value && !input.dataset.touched) return false;
    
    if (!value) {
      this.showError('email', 'Email is required');
      return false;
    }
    
    if (!emailRegex.test(value)) {
      this.showError('email', 'Please enter a valid email address');
      return false;
    }
    
    // Domain validation
    const domain = value.split('@')[1]?.toLowerCase();
    const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    const validExtensions = ['.com', '.org', '.net', '.edu', '.gov'];
    
    if (commonDomains.includes(domain) || validExtensions.some(ext => domain.endsWith(ext))) {
      this.hideError('email');
      this.showSuccessFeedback('email');
      return true;
    } else {
      this.showError('email', 'Please use a common domain (.com, .org, .net, etc.)');
      return false;
    }
  }

  validatePassword() {
    const password = this.inputs.password.value;
    if (!password) {
      this.showError('password', 'Password is required');
      return false;
    }
    if (password.length < 6) {
      this.showError('password', 'Password must be at least 6 characters');
      return false;
    }
    this.hideError('password');
    return true;
  }

  validateConfirmPassword() {
    const confirm = this.inputs.confirmPassword.value;
    const password = this.inputs.password.value;
    
    if (confirm !== password) {
      this.showError('confirmPassword', 'Passwords do not match');
      return false;
    }
    this.hideError('confirmPassword');
    return true;
  }

  validateTerms() {
    if (!this.inputs.terms.checked) {
      this.showError('terms', 'You must agree to the terms and conditions');
      this.inputs.terms.classList.add('animate-shake');
      setTimeout(() => this.inputs.terms.classList.remove('animate-shake'), 600);
      return false;
    }
    this.hideError('terms');
    return true;
  }

  showError(field, message) {
    const input = this.inputs[field];
    if (input) {
      input.classList.add('border-red-500', 'bg-red-50');
      input.classList.add('shake-animation');
      setTimeout(() => input.classList.remove('shake-animation'), 820);
    }

    const errorContainer = document.querySelector(`.form-error[data-field="${field}"]`);
    if (errorContainer) {
      errorContainer.classList.remove('hidden');
      const errorText = errorContainer.querySelector('.error-text');
      if (errorText) errorText.textContent = message;
      
      const errorMessage = errorContainer.querySelector('.error-message');
      if (errorMessage) {
        errorMessage.classList.remove('opacity-0', '-translate-y-2');
        errorMessage.classList.add('opacity-100', 'translate-y-0');
      }
    }
  }

  hideError(field) {
    const input = this.inputs[field];
    if (input) {
      input.classList.remove('border-red-500', 'bg-red-50');
    }

    const errorContainer = document.querySelector(`.form-error[data-field="${field}"]`);
    if (errorContainer) {
      const errorMessage = errorContainer.querySelector('.error-message');
      if (errorMessage) {
        errorMessage.classList.add('opacity-0', '-translate-y-2');
        errorMessage.classList.remove('opacity-100', 'translate-y-0');
        setTimeout(() => errorContainer.classList.add('hidden'), 300);
      }
    }
  }

  hideAllErrors() {
    document.querySelectorAll('.form-error').forEach(error => {
      error.classList.add('hidden');
    });
    Object.values(this.inputs).forEach(input => {
      if (input) input.classList.remove('border-red-500', 'bg-red-50');
    });
  }

  showSuccessFeedback(field) {
    if (field === 'email') {
      const feedbackEl = document.querySelector('.email-validation-feedback');
      if (feedbackEl) {
        feedbackEl.classList.remove('hidden');
        const span = feedbackEl.querySelector('span');
        if (span) span.textContent = 'Valid email format';
      }
    }
  }

  initPasswordToggles() {
    document.querySelectorAll('.toggle-password').forEach(btn => {
      btn.addEventListener('click', function() {
        const container = btn.closest('.relative');
        if (!container) return;
        
        const pwdInput = container.querySelector('input');
        const icon = btn.querySelector('i');
        if (!pwdInput || !icon) return;
        
        const isPassword = pwdInput.type === 'password';
        pwdInput.type = isPassword ? 'text' : 'password';
        icon.className = isPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
      });
    });
  }

  showBackendErrors() {
    const serverErrorAlert = document.getElementById('serverErrorAlert');
    if (serverErrorAlert) {
      const closeBtn = serverErrorAlert.querySelector('.close-alert');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          serverErrorAlert.classList.add('opacity-0', 'translate-x-2');
          setTimeout(() => serverErrorAlert.classList.add('hidden'), 500);
        });
      }
      
      setTimeout(() => {
        serverErrorAlert.classList.remove('opacity-0', 'translate-x-2');
        serverErrorAlert.classList.add('opacity-100', 'translate-x-0');
        
        setTimeout(() => {
          serverErrorAlert.classList.add('opacity-0', 'translate-x-2');
          setTimeout(() => serverErrorAlert.classList.add('hidden'), 500);
        }, 5000);
      }, 300);
    }
  }

  clearServerError() {
    const serverErrorAlert = document.getElementById('serverErrorAlert');
    if (serverErrorAlert && !serverErrorAlert.classList.contains('hidden')) {
      serverErrorAlert.classList.add('opacity-0', '-translate-y-2');
      setTimeout(() => serverErrorAlert.classList.add('hidden'), 500);
    }
  }

  scrollToFirstError() {
    const firstError = document.querySelector('.border-red-500');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new RegistrationValidator();
});
