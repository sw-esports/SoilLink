// Offline Form Handling
document.addEventListener('DOMContentLoaded', function() {
  // Find all forms in the document
  const forms = document.querySelectorAll('form');
  
  forms.forEach(form => {
    form.addEventListener('submit', function(event) {
      // Skip if the form has a specific attribute to bypass offline handling
      if (form.getAttribute('data-bypass-offline') === 'true') {
        return;
      }
      
      // If offline, intercept the form submission
      if (!navigator.onLine) {
        event.preventDefault();
        
        // Collect form data
        const formData = new FormData(form);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
          data[key] = value;
        }
        
        // Create a request object to store
        const request = {
          url: form.action,
          method: form.method.toUpperCase(),
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data),
          timestamp: new Date().toISOString()
        };
        
        // Save the request for later sending
        storeOfflineRequest(request);
        
        // Show feedback to the user
        showOfflineNotification('Form saved for submission when back online.');
        
        // Optional: redirect to a confirmation page or show a success message
        if (form.dataset.offlineRedirect) {
          window.location.href = form.dataset.offlineRedirect;
        }
      }
    });
  });
  
  // Function to store offline request via the service worker
  function storeOfflineRequest(request) {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'STORE_FORM',
        payload: request
      });
    } else {
      // Fallback: store in localStorage if service worker not available
      const offlineRequests = JSON.parse(localStorage.getItem('offlineRequests') || '[]');
      offlineRequests.push(request);
      localStorage.setItem('offlineRequests', JSON.stringify(offlineRequests));
    }
  }
  
  // Function to show a notification when form is saved offline
  function showOfflineNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'offline-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: #4CAF50;
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 1000;
      animation: slideIn 0.3s ease-out forwards;
    `;
    
    // Create notification content
    const icon = document.createElement('span');
    icon.innerHTML = '🔄';
    icon.style.marginRight = '10px';
    
    const text = document.createElement('span');
    text.textContent = message;
    
    notification.appendChild(icon);
    notification.appendChild(text);
    
    // Add to document
    document.body.appendChild(notification);
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    
    // Remove after 5 seconds
    setTimeout(() => {
      notification.style.animation = 'fadeOut 0.5s forwards';
      setTimeout(() => {
        notification.remove();
      }, 500);
    }, 5000);
  }
  
  // When coming back online, try to sync stored forms
  window.addEventListener('online', function() {
    // If service worker is supported, it will handle the sync
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then(registration => {
        registration.sync.register('sync-forms');
      });
    } else {
      // Fallback: process forms stored in localStorage
      processLocalStorageForms();
    }
  });
  
  // Process forms stored in localStorage (fallback method)
  function processLocalStorageForms() {
    const offlineRequests = JSON.parse(localStorage.getItem('offlineRequests') || '[]');
    
    if (offlineRequests.length === 0) {
      return;
    }
    
    // Process each request
    const processedRequests = [];
    
    offlineRequests.forEach((request, index) => {
      fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body,
        credentials: 'include'
      })
      .then(() => {
        processedRequests.push(index);
        
        // Remove processed requests
        if (processedRequests.length === offlineRequests.length) {
          localStorage.removeItem('offlineRequests');
        }
      })
      .catch(error => {
        console.error('Failed to process offline form:', error);
      });
    });
  }
});
