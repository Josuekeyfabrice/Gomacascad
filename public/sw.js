const CACHE_NAME = 'gomacascade-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/placeholder.svg'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - Stale-While-Revalidate strategy
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and Supabase API calls
  if (event.request.method !== 'GET' || event.request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((response) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
        return response || fetchPromise;
      });
    })
  );
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  let data = {
    title: 'GoMaCascade',
    body: 'Nouvelle notification',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'default',
    data: {}
  };
  
  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: data.tag === 'incoming-call',
    actions: data.tag === 'incoming-call' ? [
      { action: 'accept', title: 'Décrocher' },
      { action: 'reject', title: 'Refuser' }
    ] : []
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const data = event.notification.data || {};
  let url = '/';
  
  if (event.action === 'accept' && data.callId && data.callerId) {
    url = `/call/${data.callerId}?callId=${data.callId}&type=${data.callType || 'voice'}`;
  } else if (event.action === 'reject') {
    return;
  } else if (data.url) {
    url = data.url;
  } else if (data.type === 'message') {
    url = '/messages';
  } else if (data.type === 'call') {
    url = `/call/${data.callerId}?callId=${data.callId}&type=${data.callType || 'voice'}`;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
