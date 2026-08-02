/* Licence dashboard service worker.
   The page changes often, so HTML is always fetched from the network first —
   only the logos and icons are served from cache. That keeps the app
   installable and quick without ever showing a stale build. */
var CACHE='bec-lic-v2';
var ASSETS=['./icon-192.png','./icon-512.png',
            './icon-maskable-192.png','./icon-maskable-512.png',
            './apple-touch-icon.png','./favicon.png',
            './BEC_logo.png','./al-ansari-logo-white-100px.png','./manifest.json'];

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){
    return Promise.all(ASSETS.map(function(u){
      return c.add(u).catch(function(){});     // a missing file must not block install
    }));
  }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){return k!==CACHE;})
                           .map(function(k){return caches.delete(k);}));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener('fetch', function(e){
  var req=e.request;
  if(req.method!=='GET') return;
  var url=new URL(req.url);
  if(url.origin!==location.origin) return;             // never touch Google API calls

  if(req.mode==='navigate' || /\.html$/.test(url.pathname)){
    e.respondWith(fetch(req).catch(function(){ return caches.match('./index.html'); }));
    return;
  }
  if(/\.(png|jpg|jpeg|svg|webp|json)$/.test(url.pathname)){
    e.respondWith(caches.match(req).then(function(hit){
      return hit || fetch(req).then(function(res){
        var copy=res.clone();
        caches.open(CACHE).then(function(c){ c.put(req,copy); });
        return res;
      });
    }));
  }
});
