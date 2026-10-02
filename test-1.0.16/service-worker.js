const CACHE='betriebsapp-test-1-0-16-v3';
self.addEventListener('install',e=>{self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('betriebsapp-test-1-0-16-')&&k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim()})())});
function guard(){return `<script>(function(){const P='__BA_TEST_1016__:';const g=Storage.prototype.getItem,s=Storage.prototype.setItem,r=Storage.prototype.removeItem,c=Storage.prototype.clear;Storage.prototype.getItem=function(k){return this===localStorage?g.call(this,P+k):g.call(this,k)};Storage.prototype.setItem=function(k,v){return this===localStorage?s.call(this,P+k,v):s.call(this,k,v)};Storage.prototype.removeItem=function(k){return this===localStorage?r.call(this,P+k):r.call(this,k)};Storage.prototype.clear=function(){if(this!==localStorage)return c.call(this);const ks=[];for(let i=0;i<this.length;i++){const k=this.key(i);if(k&&k.startsWith(P))ks.push(k)}ks.forEach(k=>r.call(this,k))};window.__BETRIEBSAPP_TEST__=true})();</script>`}
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 const u=new URL(e.request.url);
 if(e.request.mode==='navigate'&&u.pathname.endsWith('/test-1.0.16/index.html')){
  e.respondWith(fetch(e.request,{cache:'no-store'}).then(async res=>{
   let h=await res.text();
   const headPos=h.indexOf('<head>');
   if(headPos>=0)h=h.slice(0,headPos+6)+guard()+h.slice(headPos+6);
   const bodyPos=h.lastIndexOf('</body>');
   const addon='<script src="./version-1.0.16.js?v=3"></script><script src="./version-1.0.16-subareas.js?v=3"></script>';
   if(bodyPos>=0)h=h.slice(0,bodyPos)+addon+h.slice(bodyPos);else h+=addon;
   return new Response(h,{status:res.status,statusText:res.statusText,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}})
  }));
  return;
 }
 e.respondWith(fetch(e.request,{cache:'no-store'}).catch(()=>caches.match(e.request)))
});