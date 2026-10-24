/* ЖМК платформасы — service worker: офлайн резерв + push хабарландырулар */
const CACHE = 'zhmk-sw-v27';

self.addEventListener('install', function(e){ self.skipWaiting(); });

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

// Беттерді әрқашан алдымен желіден алады, желі жоқ болса соңғы сақталған нұсқаны көрсетеді
self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if(req.mode === 'navigate'){
    e.respondWith(
      fetch(req).then(function(res){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put('/', copy); });
        return res;
      }).catch(function(){ return caches.match('/'); })
    );
  }
});

self.addEventListener('push', function(e){
  var data = {};
  try{ data = e.data ? e.data.json() : {}; }catch(err){ data = { title: 'ЖМК', body: e.data ? e.data.text() : '' }; }
  var title = data.title || 'Жас мамандар кеңесі';
  e.waitUntil(self.registration.showNotification(title, {
    body: data.body || '',
    icon: '/pwa-apple-touch-icon.png',
    badge: '/pwa-apple-touch-icon.png',
    data: { url: data.url || '/' },
    tag: data.tag || undefined
  }));
});

self.addEventListener('notificationclick', function(e){
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list){
      for(var i=0;i<list.length;i++){
        if('focus' in list[i]){ list[i].navigate(url).catch(function(){}); return list[i].focus(); }
      }
      return self.clients.openWindow(url);
    })
  );
});
