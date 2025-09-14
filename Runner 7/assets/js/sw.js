self.addEventListener('install', e=>{
  e.waitUntil(caches.open('a1-runner-v1').then(c=>c.addAll([
    './','./index.html','./manifest.json',
    './assets/BG_mid.png','./assets/BG_ground.png',
    './icons/icon-192.png','./icons/icon-512.png'
  ])));
});
self.addEventListener('fetch', e=>{
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
