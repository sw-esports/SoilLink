// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {

  // Fallback for images that fail to load (CSP-safe)
  document.querySelectorAll('img.fallback-image').forEach(function(img) {
    img.addEventListener('error', function() {
      const fallback = img.getAttribute('data-fallback');
      if (fallback && img.src !== fallback) {
        img.src = fallback;
      }
    });
  });
  // Mobile menu toggle
  const mobileToggle = document.querySelector('.mobile-toggle');
  const mainNav = document.querySelector('.main-nav');
  
  if (mobileToggle && mainNav) {
    mobileToggle.addEventListener('click', function() {
      mainNav.classList.toggle('open');
      // Toggle hamburger icon to X
      const spans = this.querySelectorAll('span');
      if (spans.length === 3) {
        if (mainNav.classList.contains('open')) {
          spans[0].style.transform = 'rotate(45deg) translate(7px, 7px)';
          spans[1].style.opacity = '0';
          spans[2].style.transform = 'rotate(-45deg) translate(7px, -7px)';
        } else {
          spans[0].style.transform = 'none';
          spans[1].style.opacity = '1';
          spans[2].style.transform = 'none';
        }
      }
    });
  }
  
  // Close alerts
  const closeAlerts = document.querySelectorAll('.close-alert');
  closeAlerts.forEach(button => {
    button.addEventListener('click', function() {
      const alert = this.parentElement;
      alert.style.opacity = '0';
      setTimeout(() => {
        alert.style.display = 'none';
      }, 300);
    });
  });
  
  // Auto-dismiss alerts after 5 seconds
  const alerts = document.querySelectorAll('.alert');
  alerts.forEach(alert => {
    setTimeout(() => {
      if (alert) {
        alert.style.opacity = '0';
        setTimeout(() => {
          alert.style.display = 'none';
        }, 300);
      }
    }, 5000);
  });
  
  // Animate elements when they scroll into view
  const animateOnScroll = function() {
    const elements = document.querySelectorAll('.feature-card');
    
    elements.forEach(element => {
      const position = element.getBoundingClientRect();
      // Check if element is in viewport
      if(position.top < window.innerHeight && position.bottom > 0) {
        element.classList.add('animate');
      }
    });
  };
  
  // Initial check on page load
  animateOnScroll();
  
  // Check on scroll
  window.addEventListener('scroll', animateOnScroll);
  
  // Dashboard tabs functionality (if on soil-analysis page)
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
  if (tabBtns.length > 0 && tabPanes.length > 0) {
    tabBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        // Remove active class from all buttons and panes
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));
        
        // Add active class to clicked button and corresponding pane
        this.classList.add('active');
        const tabId = this.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
      });
    });
  }
  
  // Password toggle visibility
  const togglePasswordBtns = document.querySelectorAll('.toggle-password');
  
  if (togglePasswordBtns.length > 0) {
    togglePasswordBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const passwordInput = this.previousElementSibling;
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
      });
    });
  }
  
  // File upload preview
  const fileInputs = document.querySelectorAll('input[type="file"]');
  
  fileInputs.forEach(input => {
    if (input && input.id) {
      const filesList = document.getElementById('filesList');
      
      if (filesList) {
        input.addEventListener('change', function() {
          filesList.innerHTML = '';
          
          if (this.files.length > 0) {
            for (let i = 0; i < this.files.length; i++) {
              const file = this.files[i];
              const fileItem = document.createElement('div');
              fileItem.className = 'file-item';
              
              const fileIcon = document.createElement('span');
              fileIcon.className = 'file-icon';
              fileIcon.innerHTML = '<i class="fas fa-file-image"></i>';
              
              const fileName = document.createElement('span');
              fileName.className = 'file-name';
              fileName.textContent = file.name;
              
              const fileSize = document.createElement('span');
              fileSize.className = 'file-size';
              fileSize.textContent = formatFileSize(file.size);
              
              fileItem.appendChild(fileIcon);
              fileItem.appendChild(fileName);
              fileItem.appendChild(fileSize);
              
              filesList.appendChild(fileItem);
            }
          }
        });
      }
    }
  });
  
  // Get current location
  const locationBtn = document.getElementById('getCurrentLocation');
  const locationInput = document.getElementById('location');
  
  if (locationBtn && locationInput) {
    locationBtn.addEventListener('click', function() {
      if (navigator.geolocation) {
        locationBtn.disabled = true;
        locationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        navigator.geolocation.getCurrentPosition(
          function(position) {
            const lat = position.coords.latitude.toFixed(6);
            const lng = position.coords.longitude.toFixed(6);
            locationInput.value = `${lat}, ${lng}`;
            
            locationBtn.disabled = false;
            locationBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i>';
          },
          function(error) {
            alert('Unable to retrieve your location: ' + error.message);
            
            locationBtn.disabled = false;
            locationBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i>';
          }
        );
      } else {
        alert('Geolocation is not supported by your browser');
      }
    });
  }
  
  // Modal handling
  const modalTriggers = document.querySelectorAll('[data-toggle="modal"]');
  const modalCloseButtons = document.querySelectorAll('.close-modal, [data-dismiss="modal"]');
  
  modalTriggers.forEach(trigger => {
    trigger.addEventListener('click', function() {
      const targetId = this.getAttribute('data-target');
      const modal = document.querySelector(targetId);
      
      if (modal) {
        modal.classList.add('show');
        document.body.classList.add('modal-open');
      }
    });
  });
  
  modalCloseButtons.forEach(button => {
    button.addEventListener('click', function() {
      const modal = this.closest('.modal');
      
      if (modal) {
        modal.classList.remove('show');
        document.body.classList.remove('modal-open');
      }
    });
  });
  
  // Account deletion confirmation
  const deleteConfirmInput = document.getElementById('deleteConfirm');
  const confirmDeleteBtn = document.getElementById('confirmDelete');
  
  if (deleteConfirmInput && confirmDeleteBtn) {
    deleteConfirmInput.addEventListener('input', function() {
      confirmDeleteBtn.disabled = this.value !== 'DELETE';
    });
  }
});

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
