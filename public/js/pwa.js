// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
       
        
        // Check for updates to service worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
        
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Show notification about update
              const updateNotification = document.createElement('div');
              updateNotification.className = 'pwa-update-notification';
              updateNotification.innerHTML = `
                <div style="padding: 15px 20px; background-color: #2196F3; color: white; position: fixed; 
                            bottom: 20px; right: 20px; z-index: 9999; border-radius: 6px; box-shadow: 0 2px 10px rgba(0,0,0,0.2);">
                  <p>New version available! <button onclick="window.location.reload()" 
                     style="background: white; color: #2196F3; border: none; padding: 5px 10px; margin-left: 10px; border-radius: 4px; cursor: pointer;">
                     Update</button></p>
                </div>
              `;
              document.body.appendChild(updateNotification);
            }
          });
        });
      })
      .catch(err => {
        console.error('ServiceWorker registration failed: ', err);
      });
      
    // If we have pending requests when page loads, try to sync them
    if (localStorage.getItem('offlineRequests')) {
      const offlineData = JSON.parse(localStorage.getItem('offlineRequests') || '[]');
      if (offlineData.length > 0 && navigator.onLine) {
        navigator.serviceWorker.ready.then(registration => {
          registration.sync.register('sync-forms');
        });
      }
    }
  });
}
