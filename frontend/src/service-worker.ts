/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;

clientsClaim();

// Precache the build's own assets (JS/CSS/HTML/manifest/icons). Injected by
// react-scripts' InjectManifest plugin at build time.
precacheAndRoute(self.__WB_MANIFEST);

// Deliberately no runtime caching for /api/* here. This app serves
// authenticated financial data (salary, expenses); caching those responses
// in the service worker would risk surfacing one user's cached data after
// logout or to a different user on a shared device. If offline support for
// API data is wanted later, it needs an explicit cache-clear-on-logout
// story first, not just a NetworkFirst strategy bolted on.

// SPA fallback: for navigation requests not in the precache, serve the
// cached index.html so client-side routing still works when offline.
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html') as Promise<Response>)
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
