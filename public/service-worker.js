// Service Worker for SoilLink PWA
const CACHE_NAME = 'soillink-v1.1'; // Updated version number
const urlsToCache = [
  '/',
  '/css/style.css',
  '/css/toast.css',
  '/css/pwa.css',
  '/js/script.js',
  '/js/pwa.js',
  '/js/pwa-install.js',
  '/js/network-status.js',
  '/js/offline-forms.js',
  '/js/header.js',
  '/js/home.js',
  '/offline.html',
  '/src/images/hero-visual.svg',
  '/src/images/icons/icon-48x48.png',
  '/src/images/icons/icon-72x72.png',
  '/src/images/icons/icon-96x96.png',
  '/src/images/icons/icon-128x128.png',
  '/src/images/icons/icon-144x144.png',
  '/src/images/icons/icon-152x152.png',
  '/src/images/icons/icon-192x192.png',
  '/src/images/icons/icon-384x384.png',
  '/src/images/icons/icon-512x512.png',
  '/manifest.json'
];

// Install a service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Cache and return requests with offline fallback
self.addEventListener('fetch', event => {
  // Don't cache dashboard or soil-related URLs
  if (event.request.url.includes('/dashboard/') || 
      event.request.url.includes('/soil/') ||
      event.request.url.includes('/soil-analysis')) {
    // Bypass cache completely for dashboard pages
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Fallback to basic offline page if network fails
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
          return new Response('Network error occurred', { status: 408 });
        })
    );
    return;
  }
  
  // For other resources, use cache-first strategy
  // Skip cross-origin requests
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            // Return cached response if available
            return cachedResponse;
          }

          // Otherwise try to fetch from network
          return fetch(event.request)
            .then(response => {
              // Check if we received a valid response
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              // Clone the response
              const responseToCache = response.clone();

              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });

              return response;
            })
            .catch(() => {
              // Network request failed - check if it's a page navigation
              if (event.request.mode === 'navigate') {
                // Return the offline page as fallback
                return caches.match('/offline.html');
              }
              
              // For images, return a transparent pixel or placeholder
              if (event.request.destination === 'image') {
                return new Response(
                  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
                  { 
                    headers: { 'Content-Type': 'image/gif' },
                    status: 200
                  }
                );
              }
              
              // For other resources, just fail
              return new Response('Network error occurred', {
                status: 408,
                headers: { 'Content-Type': 'text/plain' }
              });
            });
        })
    );
  }
});

// Update the service worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for form submissions
const DB_NAME = 'soillink-offline-requests';
const STORE_NAME = 'pending-requests';

// Create/open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    
    request.onsuccess = event => resolve(event.target.result);
    request.onerror = event => reject(event.target.error);
  });
}

// Store form data when offline
async function storeFormData(formData) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  
  return new Promise((resolve, reject) => {
    const request = store.add(formData);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Process stored form data when online
async function processStoredRequests() {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  
  const requests = await new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  
  for (const request of requests) {
    try {
      // Try to send the stored request
      await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body ? JSON.parse(request.body) : undefined,
        credentials: 'include'
      });
      
      // If successful, delete from the store
      const deleteRequest = store.delete(request.id);
      await new Promise(resolve => {
        deleteRequest.onsuccess = resolve;
      });
    } catch (error) {
      console.error('Failed to reprocess request:', error);
    }
  }
}

// Listen for sync events
self.addEventListener('sync', event => {
  if (event.tag === 'sync-forms') {
    event.waitUntil(processStoredRequests());
  }
});

// Listen for messages from the client
self.addEventListener('message', event => {
  if (event.data.type === 'STORE_FORM' && event.data.payload) {
    storeFormData(event.data.payload)
      .then(() => {
        // Register for background sync if supported
        if ('SyncManager' in self) {
          return self.registration.sync.register('sync-forms');
        }
      })
      .catch(error => console.error('Error storing form data:', error));
  }
});
