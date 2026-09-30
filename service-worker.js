const CACHE_NAME = 'betriebsapp-v1-0-16-dev';

const APP_FILES = [
  './',
  './index.html',
  './version-1.0.16.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))));
  self.clients.claim();
});

async function appHtml(request){
  try {
    const response = await fetch(request);
    if (!response.ok) return response;
    let html = await response.text();
    if (!html.includes('version-1.0.16.js')) {
      html = html.replace('</body>', '<script src="./version-1.0.16.js"></script>\n</body>');
    }
    return new Response(html, {status: response.status, statusText: response.statusText, headers: {'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache'}});
  } catch (e) {
    const cached = await caches.match('./index.html');
    if (!cached) throw e;
    let html = await cached.text();
    if (!html.includes('version-1.0.16.js')) html = html.replace('</body>', '<script src="./version-1.0.16.js"></script>\n</body>');
    return new Response(html, {headers:{'Content-Type':'text/html; charset=utf-8'}});
  }
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const isAppPage = event.request.mode === 'navigate' || url.pathname.endsWith('/index.html');
  if (isAppPage) {
    event.respondWith(appHtml(event.request));
    return;
  }
  event.respondWith(fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request)));
});
