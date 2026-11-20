// 离线缓存：先用本地缓存秒开，有网时在后台悄悄更新
const CACHE = 'guandan-v6';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin || /\/(room|relay)/.test(e.request.url)) return;
  const net = fetch(e.request).then(r => { if (r && r.ok) caches.open(CACHE).then(c => c.put(e.request, r.clone())); return r; }).catch(() => null);
  e.waitUntil(net.then(() => {}));
  e.respondWith(caches.match(e.request, {ignoreSearch: true}).then(hit => hit || net.then(r => r || caches.match('./index.html'))));
});
