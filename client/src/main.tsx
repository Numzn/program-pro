import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Service Worker update handler - Clear caches on new deployment
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    // Wait for service worker to be ready (VitePWA registers it automatically)
    navigator.serviceWorker.ready
      .then((registration) => {
        // Check for updates periodically
        setInterval(() => {
          registration.update()
        }, 60 * 60 * 1000) // Every hour

        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available - clear all caches and reload
                if ('caches' in window) {
                  caches.keys().then((cacheNames) => {
                    cacheNames.forEach((cacheName) => {
                      caches.delete(cacheName)
                    })
                  })
                }
                // Reload to use new service worker
                window.location.reload()
              }
            })
          }
        })
      })
      .catch((error) => {
        console.error('Service Worker update handler failed:', error)
      })

    // Handle controller change (when new service worker takes control)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // New service worker activated - clear all caches
      if ('caches' in window) {
        caches.keys().then((cacheNames) => {
          cacheNames.forEach((cacheName) => {
            caches.delete(cacheName)
          })
        })
      }
    })
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)