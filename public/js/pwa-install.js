// PWA Installation Prompt
let deferredPrompt;
let installBanner;

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Create install banner element
  installBanner = document.createElement('div');
  installBanner.className = 'install-banner';
  installBanner.innerHTML = `
    <div>Add SoilLink to your home screen for quick access!</div>
    <div>
      <button class="install-button">Install</button>
      <button class="install-close">✕</button>
    </div>
  `;
  document.body.appendChild(installBanner);
  
  // Add event listeners to buttons
  const installButton = document.querySelector('.install-button');
  const closeButton = document.querySelector('.install-close');
  
  if (installButton) {
    installButton.addEventListener('click', handleInstallClick);
  }
  
  if (closeButton) {
    closeButton.addEventListener('click', handleCloseClick);
  }
});

// Store the event for later use
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('📱 beforeinstallprompt event fired!');
  e.preventDefault();
  deferredPrompt = e;
  
  // Show the install banner if we haven't dismissed it before and not in standalone mode
  if (!window.matchMedia('(display-mode: standalone)').matches) {
    const hasBeenShown = localStorage.getItem('pwaInstallPromptShown');
    const wasDismissedRecently = sessionStorage.getItem('pwaInstallPromptDismissed');
    
    if (!hasBeenShown && !wasDismissedRecently && installBanner) {
      console.log('📱 Showing install banner');
      setTimeout(() => {
        installBanner.classList.add('show');
        console.log('📱 Install banner should now be visible');
      }, 2000);
    }
  }
});

// Handle install button click
async function handleInstallClick() {
  if (!deferredPrompt) {
    console.log('No deferred prompt available');
    return;
  }
  
  // Show the browser install prompt
  deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
  if (deferredPrompt) {
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // Clear the deferred prompt variable
    deferredPrompt = null;
    
    // Hide the install banner
    if (installBanner) {
      installBanner.classList.remove('show');
    }
    
    // Remember that we've shown the prompt
    localStorage.setItem('pwaInstallPromptShown', 'true');
  }
}

// Handle close button click
function handleCloseClick() {
  if (installBanner) {
    installBanner.classList.remove('show');
    
    // Set a session flag so we don't show it again right away
    sessionStorage.setItem('pwaInstallPromptDismissed', 'true');
  }
}

// Check PWA criteria and manifest on page load
window.addEventListener('load', function() {
  console.log('📱 Checking PWA installability criteria:');
  
  // Check if running in standalone mode (already installed)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('📱 App is already installed (running in standalone mode)');
    return;
  }
  
  // Check manifest
  const manifestLink = document.querySelector('link[rel="manifest"]');
  if (manifestLink) {
    console.log('📱 Manifest found:', manifestLink.href);
    
    // Fetch and check manifest
    fetch(manifestLink.href)
      .then(response => response.json())
      .then(data => {
        console.log('📱 Manifest loaded successfully:', data);
        
        // Check icons
        if (data.icons && data.icons.length) {
          console.log('📱 Icons found in manifest:', data.icons.length);
          
          // Check icon URLs
          data.icons.forEach(icon => {            console.log(`📱 Checking icon: ${icon.src}`);
            fetch(icon.src)
              .then(response => {
                if (response.ok) {
                  console.log(`📱 Icon is accessible: ${icon.src}`);
                } else {
                  console.error(`📱 Icon is NOT accessible: ${icon.src}`, response.status);
                }
              })
              .catch(error => console.error(`📱 Failed to fetch icon: ${icon.src}`, error));
          });
        } else {
          console.error('📱 No icons found in manifest');
        }
      })
      .catch(error => console.error('📱 Failed to fetch manifest:', error));
  } else {
    console.error('📱 No manifest link found');
  }
  
  // Check service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations()
      .then(registrations => {
        console.log('📱 Service worker registrations:', registrations.length);
      })
      .catch(err => console.error('📱 Error checking service worker:', err));
  } else {
    console.error('📱 Service workers not supported');
  }
  
  // Display PWA status indicator
  const pwaStatus = document.createElement('div');
  pwaStatus.className = 'pwa-status';
  pwaStatus.textContent = window.matchMedia('(display-mode: standalone)').matches ? 
    '📱 App Installed' : '🌐 Browser Mode';
  document.body.appendChild(pwaStatus);
  
  pwaStatus.classList.add('show');
  setTimeout(() => {
    pwaStatus.classList.remove('show');
  }, 3000);
});

// Show install button when app is installable and not yet installed
window.addEventListener('appinstalled', function(evt) {
  // Hide install banner if app is already installed
  if (installBanner) {
    installBanner.classList.remove('show');
  }
  localStorage.setItem('pwaInstalled', 'true');
  console.log('App was installed', evt);
  
  // Show a confirmation message
  const appInstalledToast = document.createElement('div');
  appInstalledToast.className = 'pwa-status show';
  appInstalledToast.textContent = '✅ App successfully installed!';
  appInstalledToast.style.backgroundColor = '#4CAF50';
  document.body.appendChild(appInstalledToast);
  
  setTimeout(() => {
    appInstalledToast.classList.remove('show');
    setTimeout(() => {
      appInstalledToast.remove();
    }, 300);
  }, 3000);
});
