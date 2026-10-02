/* BetriebsApp 1.0.16 – Teilflächen Hotfix */
(()=>{
'use strict';
const BLUE='#1769aa';
function cleanupLegacyTestSubareas(){
 let changed=false,removed=[];
 (db.fields||[]).forEach(f=>{
  const old=f.subAreas||[];
  const keep=old.filter(s=>{
   const legacy=!!s.geometry;
   if(legacy){removed.push(s.id);changed=true;return false}
   return true;
  });
  f.subAreas=keep;
 });
 if(removed.length){db.rotationPlans=(db.rotationPlans||[]).filter(p=>!removed.includes(p.subAreaId));}
 if(changed)persist('Alte Test-Teilflächen entfernt');
}
function installSplitButton(id){
 const f=field(id),d=document.getElementById('modalBody');if(!f||!d)return;
 [...d.querySelectorAll('button')].filter(b=>/Teilflächen planen|Feld teilen/.test(b.textContent||'')).forEach(b=>b.remove());
 const b=document.createElement('button');
 b.type='button';b.className='secondary';b.style.marginLeft='5px';b.textContent='Feld teilen';
 b.setAttribute('onclick',`openSubAreas('${id}')`);
 b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();window.openSubAreas(id)});
 const edit=[...d.querySelectorAll('button')].find(x=>(x.textContent||'').includes('Feld bearbeiten'));
 if(edit)edit.insertAdjacentElement('afterend',b);else d.prepend(b);
}
const prevFieldDetail=window.fieldDetail;
window.fieldDetail=function(id){prevFieldDetail(id);setTimeout(()=>installSplitButton(id),0)};
function boot(){cleanupLegacyTestSubareas()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();