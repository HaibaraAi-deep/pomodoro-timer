/**
 * sw.js — Service Worker
 * Pomodoro Timer + Task Tracker
 *
 * Caching strategy:
 *  - Static assets (CSS, JS, icons): Cache First
 *  - Navigation (page requests): Network First
 *  - Offline fallback page served when network is unavailable
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Bump this version whenever cached assets change to trigger cache refresh. */
const CACHE_VERSION = 'pomodoro-v1';

/** Full cache name including version. */
const CACHE_NAME = `pomodoro-cache-${CACHE_VERSION}`;

/** Resources to pre-cache on install. Paths are relative to the SW location (src/). */
const PRECACHE_URLS = [
  './',
  'index.html',
  'css/base.css',
  'js/app.js',
  'js/timer.js',
  'js/timer-worker.js',
  'js/tasks.js',
  'js/stats.js',
  'js/theme.js',
  'js/confetti.js',
  'js/pwa.js',
  'js/audio.js',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

// ---------------------------------------------------------------------------
// Install — pre-cache critical resources
// ---------------------------------------------------------------------------

self.addEventListener('install', function (event) {
  console.log('[SW] Installing v' + CACHE_VERSION + '...');

  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      console.log('[SW] Pre-caching ' + PRECACHE_URLS.length + ' resources');
      return cache.addAll(PRECACHE_URLS).catch(function (err) {
        // Some resources may 404 (e.g. placeholder PNGs) — don't break install
        console.warn('[SW] Pre-cache warning (non-fatal):', err.message);
      });
    }).then(function () {
      console.log('[SW] Pre-cache complete, activating...');
      return self.skipWaiting();
    })
  );
});

// ---------------------------------------------------------------------------
// Activate — clean old caches
// ---------------------------------------------------------------------------

self.addEventListener('activate', function (event) {
  console.log('[SW] Activating v' + CACHE_VERSION);

  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function (name) {
            return name !== CACHE_NAME;
          })
          .map(function (name) {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(function () {
      console.log('[SW] Claiming clients...');
      return self.clients.claim();
    })
  );
});

// ---------------------------------------------------------------------------
// Fetch — routing strategy
// ---------------------------------------------------------------------------

self.addEventListener('fetch', function (event) {
  const requestUrl = new URL(event.request.url);

  // Only handle same-origin requests; let the browser handle cross-origin
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  // Skip chrome-extension and other non-http(s) schemes
  if (!requestUrl.protocol.startsWith('http')) {
    return;
  }

  // --- Strategy 1: Navigation requests → Network First ---
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(function (networkResponse) {
          // Update cache with the fresh response for offline use
          var responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, responseClone);
          });
          return networkResponse;
        })
        .catch(function () {
          // Network unavailable — serve cached version or offline fallback
          return caches.match(event.request).then(function (cachedResponse) {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Ultimate fallback: try to serve the root (index.html)
            return caches.match('./') || offlineFallback();
          });
        })
    );
    return;
  }

  // --- Strategy 2: Static assets → Cache First ---
  event.respondWith(
    caches.match(event.request).then(function (cachedResponse) {
      // Return cached response immediately if available
      if (cachedResponse) {
        return cachedResponse;
      }

      // Not in cache — fetch from network and cache for next time
      return fetch(event.request).then(function (networkResponse) {
        // Don't cache non-successful responses
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        var responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(event.request, responseClone);
        });

        return networkResponse;
      }).catch(function () {
        // Network error for a static asset — could respond with a placeholder
        // For images, return a transparent 1x1 SVG
        if (event.request.url.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/i)) {
          return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>',
            { status: 200, headers: { 'Content-Type': 'image/svg+xml' } }
          );
        }
        // For other static assets, just fail
        throw new Error('[SW] Offline — resource not cached: ' + event.request.url);
      });
    })
  );
});

// ---------------------------------------------------------------------------
// Offline fallback page (inline HTML)
// ---------------------------------------------------------------------------

function offlineFallback() {
  var html = '<!DOCTYPE html>' +
    '<html lang="zh-CN">' +
    '<head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>番茄钟 — 离线模式</title>' +
    '<style>' +
    'body {' +
    '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;' +
    '  background: #1a1a2e; color: #eaeaea;' +
    '  display: flex; align-items: center; justify-content: center;' +
    '  min-height: 100vh; margin: 0; padding: 2rem;' +
    '  text-align: center;' +
    '}' +
    '.card {' +
    '  background: #1f2b47; border-radius: 1rem; padding: 2.5rem 2rem;' +
    '  max-width: 400px; width: 100%;' +
    '  box-shadow: 0 8px 24px rgba(0,0,0,0.5);' +
    '}' +
    '.icon { font-size: 4rem; margin-bottom: 1rem; display: block; }' +
    'h1 { font-size: 1.5rem; margin: 0 0 0.5rem; }' +
    'p { font-size: 0.875rem; color: #a0a8c0; margin: 0 0 1.5rem; line-height: 1.6; }' +
    'button {' +
    '  background: #e74c3c; color: #fff; border: none;' +
    '  padding: 0.75rem 2rem; border-radius: 0.5rem;' +
    '  font-size: 1rem; cursor: pointer;' +
    '  transition: background 0.2s;' +
    '}' +
    'button:hover { background: #c0392b; }' +
    '</style>' +
    '</head>' +
    '<body>' +
    '<div class="card">' +
    '<span class="icon" aria-hidden="true">🍅</span>' +
    '<h1>您处于离线状态</h1>' +
    '<p>请检查网络连接。<br>已缓存的内容仍然可以访问。</p>' +
    '<button onclick="location.reload()">重新连接</button>' +
    '</div>' +
    '</body>' +
    '</html>';

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
