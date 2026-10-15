// Service worker Langkah Baitullah: jaring pengaman offline. Selalu coba jaringan dulu supaya update langsung terbaca.
const V='lb-v1';
const OFFLINE=['./','./index.html','./icon-192.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(OFFLINE)).catch(()=>{}));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin)return; // API & CDN tidak disentuh
  e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(V).then(c=>c.put(r,cp)).catch(()=>{});return res}).catch(()=>caches.match(r).then(m=>m||caches.match('./index.html'))));
});
