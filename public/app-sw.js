const CACHE_NAME = 'aahaar-app-v1'
const STATIC_CACHE_NAME = 'aahaar-app-static-v1'
const DYNAMIC_CACHE_NAME = 'aahaar-app-dynamic-v1'

// URLs to cache immediately
const STATIC_ASSETS = [
  '/app-manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/placeholder.jpg',
  '/logo.png'
]

// App routes to cache
const APP_ROUTES = [
  '/app',
  '/app/login'
]

// API routes that should be cached with network-first strategy
const API_ROUTES = [
  '/api/courts',
  '/api/auth',
  '/api/cart'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...')
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('[SW] Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      }),
      caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
        console.log('[SW] Caching app routes')
        return cache.addAll(APP_ROUTES)
      })
    ])
  )
  // Force the waiting service worker to become the active service worker
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName.startsWith('aahaar-app-') && 
                   cacheName !== STATIC_CACHE_NAME && 
                   cacheName !== DYNAMIC_CACHE_NAME
          })
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          })
      )
    })
  )
  // Ensure the service worker takes control immediately
  self.clients.claim()
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle requests for our app scope
  if (!url.pathname.startsWith('/app')) {
    return
  }

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request))
    return
  }

  // Handle app routes with cache-first strategy for better performance
  if (APP_ROUTES.some(route => url.pathname.startsWith(route))) {
    event.respondWith(cacheFirstStrategy(request))
    return
  }

  // Handle static assets with cache-first strategy
  if (STATIC_ASSETS.some(asset => url.pathname.includes(asset.split('/').pop()))) {
    event.respondWith(cacheFirstStrategy(request))
    return
  }

  // Default: network-first for everything else
  event.respondWith(networkFirstStrategy(request))
})

// Cache-first strategy (good for static assets and app shell)
async function cacheFirstStrategy(request) {
  try {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    const networkResponse = await fetch(request)
    if (networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.log('[SW] Network failed, returning offline page')
    
    // Return offline fallback for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/app/offline') || new Response('Offline', { status: 503 })
    }
    
    throw error
  }
}

// Network-first strategy (good for API calls and dynamic content)
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request)
    
    // Cache successful responses
    if (networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('[SW] Network failed, trying cache')
    const cachedResponse = await caches.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline response for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/app/offline') || new Response('Offline', { status: 503 })
    }
    
    throw error
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag)
  
  if (event.tag === 'cart-sync') {
    event.waitUntil(syncCart())
  }
  
  if (event.tag === 'order-sync') {
    event.waitUntil(syncOrders())
  }
})

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push received')
  
  let notificationData = {
    title: 'Aahaar',
    body: 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'aahaar-notification',
    data: {
      url: '/app'
    }
  }

  if (event.data) {
    try {
      const data = event.data.json()
      notificationData = { ...notificationData, ...data }
    } catch (e) {
      console.error('[SW] Error parsing push data:', e)
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      vibrate: [200, 100, 200],
      actions: [
        {
          action: 'open',
          title: 'Open App',
          icon: '/icons/icon-72x72.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/icons/icon-72x72.png'
        }
      ]
    })
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked')
  event.notification.close()

  if (event.action === 'close') {
    return
  }

  const urlToOpen = event.notification.data?.url || '/app'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes('/app') && 'focus' in client) {
          return client.focus()
        }
      }
      
      // Open new window if app is not open
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

// Helper functions for background sync
async function syncCart() {
  // Implementation for syncing cart data when back online
  console.log('[SW] Syncing cart data...')
  // Add your cart sync logic here
}

async function syncOrders() {
  // Implementation for syncing order data when back online
  console.log('[SW] Syncing order data...')
  // Add your order sync logic here
}

// Share target handling (if implementing Web Share Target API)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  
  if (url.pathname === '/app/share-target' && event.request.method === 'POST') {
    event.respondWith(handleSharedContent(event.request))
  }
})

async function handleSharedContent(request) {
  const formData = await request.formData()
  const title = formData.get('title')
  const text = formData.get('text')
  const url = formData.get('url')
  
  // Handle shared content (e.g., restaurant links, food items)
  console.log('[SW] Shared content:', { title, text, url })
  
  // Redirect to appropriate app page
  return Response.redirect('/app', 302)
}
