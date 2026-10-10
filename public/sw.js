// Cache only the application shell and same-origin built assets. Never cache API quotes or model calls.
const CACHE = 'alpha-shell-v2'
self.addEventListener('install', event => {event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(['/','/manifest.webmanifest','/icon.svg'])))})
self.addEventListener('activate', event => {event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('alpha-shell-')&&k!==CACHE).map(k=>caches.delete(k)))))})
self.addEventListener('fetch', event => {
 const url = new URL(event.request.url)
 if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return
 if(!event.request.mode.includes('navigate')&&!url.pathname.startsWith('/assets/')&&!['/manifest.webmanifest','/icon.svg'].includes(url.pathname))return
 event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy))}return response}).catch(async()=>{const found=await caches.match(event.request);return found??(event.request.mode==='navigate'?await caches.match('/'):Response.error())}))
})
