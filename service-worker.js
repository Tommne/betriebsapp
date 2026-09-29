const CACHE_NAME = 'betriebsapp-v1.0.16';
const APP_FILES = ['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./version-1.0.16.js'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(APP_FILES)));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const u=new URL(event.request.url);
 if(event.request.mode==='navigate'||u.pathname.endsWith('/index.html')||u.pathname.endsWith('/')){
   event.respondWith(fetch(event.request).then(async response=>{
     const type=response.headers.get('content-type')||'';
     if(!type.includes('text/html'))return response;
     let html=await response.text();
     if(!html.includes('version-1.0.16.js'))html=html.replace('</body>','<script src="./version-1.0.16.js"></script></body>');
     return new Response(html,{status:response.status,statusText:response.statusText,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-cache'}})
   }).catch(()=>caches.match('./index.html').then(async r=>{if(!r)return new Response('Offline',{status:503});let html=await r.text();if(!html.includes('version-1.0.16.js'))html=html.replace('</body>','<script src="./version-1.0.16.js"></script></body>');return new Response(html,{headers:{'content-type':'text/html; charset=utf-8'}})})));
   return;
 }
 event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE_NAME).then(c=>c.put(event.request,copy));return response}).catch(()=>caches.match(event.request)));
});