// Network status checker
document.addEventListener('DOMContentLoaded', function() {
  // Create a network status indicator
  const networkStatus = document.createElement('div');
  networkStatus.className = 'network-status';
  networkStatus.style.cssText = `
    position: fixed;
    bottom: 10px;
    left: 10px;
    padding: 8px 15px;
    border-radius: 20px;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    font-size: 0.9rem;
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
    z-index: 1000;
    pointer-events: none;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  `;
  document.body.appendChild(networkStatus);

  // Function to update network status display
  function updateNetworkStatus(online) {
    if (online) {
      networkStatus.textContent = '🟢 Online';
      networkStatus.style.backgroundColor = 'rgba(0, 128, 0, 0.8)';
      
      // Check if any forms were submitted while offline
      if (localStorage.getItem('offlineRequests')) {
        const offlineData = JSON.parse(localStorage.getItem('offlineRequests') || '[]');
        if (offlineData.length > 0) {
          showNotification('Syncing offline data...', 'info');
        }
      }
    } else {
      networkStatus.textContent = '🔴 Offline';
      networkStatus.style.backgroundColor = 'rgba(220, 0, 0, 0.8)';
      
      // Show offline notification
      showNotification('You are offline. Some features may be limited.', 'warning');
    }
    
    // Show the indicator
    networkStatus.style.opacity = '1';
    
    // Hide after 3 seconds
    setTimeout(() => {
      networkStatus.style.opacity = '0';
    }, 3000);
  }

  // Check initial state
  updateNetworkStatus(navigator.onLine);

  // Listen for online/offline events
  window.addEventListener('online', () => {
    updateNetworkStatus(true);
    
    // Try to sync data when coming back online
    if ('serviceWorker' in navigator && 'SyncManager' in window && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(registration => {
        registration.sync.register('sync-forms');
      });
    }
  });
  
  window.addEventListener('offline', () => {
    updateNetworkStatus(false);
  });
  
  // Helper function to show notifications
  function showNotification(message, type) {
    // Create notification if it doesn't exist
    let notification = document.querySelector('.network-notification');
    
    if (!notification) {
      notification = document.createElement('div');
      notification.className = 'network-notification';
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        color: white;
        font-size: 14px;
        z-index: 1001;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        opacity: 0;
        transition: opacity 0.3s ease;
      `;
      document.body.appendChild(notification);
    }
    
    // Set content and style based on type
    notification.textContent = message;
    
    switch(type) {
      case 'info':
        notification.style.backgroundColor = '#2196F3';
        break;
      case 'warning':
        notification.style.backgroundColor = '#FF9800';
        break;
      default:
        notification.style.backgroundColor = '#4CAF50';
    }
    
    // Show notification
    notification.style.opacity = '1';
    
    // Hide after 5 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      
      // Remove from DOM after fade out
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 5000);
  }
});
