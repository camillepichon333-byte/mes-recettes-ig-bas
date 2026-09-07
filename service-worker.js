const CACHE_NAME='mes-recettes-ig-bas-v5';
const FILES_TO_CACHE=['./','./index.html','./style.css','./script.js','./manifest.json','./icon-192.png','./icon-512.png','./images/pommes.svg','./images/tarte.svg','./images/choco.svg','./images/legumes.svg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(FILES_TO_CACHE)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request)))})
