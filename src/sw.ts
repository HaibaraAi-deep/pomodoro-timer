const CACHE_VERSION: string = 'pomodoro-v3';

const CACHE_NAME: string = `pomodoro-cache-${CACHE_VERSION}`;

const PRECACHE_URLS: string[] = [
  './',
  'index.html',
  'css/base.css',
  'js/i18n.ts',
  'js/events.ts',
  'js/app.ts',
  'js/timer.ts',
  'js/timer-worker.ts',
  'js/tasks.ts',
  'js/stats.ts',
  'js/theme.ts',
  'js/confetti.ts',
  'js/pwa.ts',
  'js/audio.ts',
  'js/settings.ts',
  'js/vitals.ts',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

(self as any).addEventListener('install', function (event: any): void {
  console.log('[SW] Installing v' + CACHE_VERSION + '...');

  event.waitUntil(
    (caches as any).open(CACHE_NAME).then(function (cache: any): Promise<void> {
      console.log('[SW] Pre-caching ' + PRECACHE_URLS.length + ' resources');
      return cache.addAll(PRECACHE_URLS).catch(function (err: Error): void {
        console.warn('[SW] Pre-cache warning (non-fatal):', err.message);
      }) as Promise<void>;
    }).then(function (): Promise<void> {
      console.log('[SW] Pre-cache complete, activating...');
      return (self as any).skipWaiting();
    })
  );
});

(self as any).addEventListener('activate', function (event: any): void {
  console.log('[SW] Activating v' + CACHE_VERSION);

  event.waitUntil(
    (caches as any).keys().then(function (cacheNames: string[]): Promise<void> {
      return Promise.all(
        cacheNames
          .filter(function (name: string): boolean {
            return name !== CACHE_NAME;
          })
          .map(function (name: string): Promise<boolean> {
            console.log('[SW] Deleting old cache:', name);
            return (caches as any).delete(name);
          })
      ) as unknown as Promise<void>;
    }).then(function (): Promise<void> {
      console.log('[SW] Claiming clients...');
      return (self as any).clients.claim();
    })
  );
});

(self as any).addEventListener('fetch', function (event: any): void {
  const requestUrl: URL = new URL(event.request.url);

  if (requestUrl.origin !== (self as any).location.origin) {
    return;
  }

  if (!requestUrl.protocol.startsWith('http')) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(function (networkResponse: Response): Response {
          const responseClone: Response = networkResponse.clone();
          (caches as any).open(CACHE_NAME).then(function (cache: any): void {
            cache.put(event.request, responseClone);
          });
          return networkResponse;
        })
        .catch(function (): Promise<Response> {
          return (caches as any).match(event.request).then(function (cachedResponse: Response | undefined): Response | Promise<Response> {
            if (cachedResponse) {
              return cachedResponse;
            }
            return (caches as any).match('./').then(function (fallback: Response | undefined): Response {
              return fallback || offlineFallback();
            });
          });
        })
    );
    return;
  }

  event.respondWith(
    (caches as any).match(event.request).then(function (cachedResponse: Response | undefined): Response | Promise<Response> {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then(function (networkResponse: Response): Response {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        const responseClone: Response = networkResponse.clone();
        (caches as any).open(CACHE_NAME).then(function (cache: any): void {
          cache.put(event.request, responseClone);
        });

        return networkResponse;
      }).catch(function () {
        if (event.request.url.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/i)) {
          return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>',
            { status: 200, headers: { 'Content-Type': 'image/svg+xml' } }
          );
        }
        throw new Error('[SW] Offline — resource not cached: ' + event.request.url);
      });
    })
  );
});

function offlineFallback(): Response {
  const html: string = '<!DOCTYPE html>' +
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
