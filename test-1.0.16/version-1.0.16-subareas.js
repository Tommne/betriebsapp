/* BetriebsApp 1.0.16 – Teilflächen einfach nach ha teilen */
(()=>{
'use strict';
const BLUE='#1769aa';
const activeSub=(f,y)=>(f?.subAreas||[]).filter(s=>!s.archived&&Number(s.year)===Number(y));
const subSum=(f,y)=>activeSub(f,y).reduce((a,s)=>a+num(s.area),0);
const restArea=(f,y)=>Math.max(0,num(f?.area)-subSum(f,y));
const subById=id=>{for(const f of db.fields||[]){const s=(f.subAreas||[]).find(x=>x.id===id);if(s)return {f,s}}return null};
const workYear=date=>Number(String(date||today()).slice(0,4))||new Date().getFullYear();
let splitFieldId=null;

/* Einfache Teilung ohne Karte: gewünschte ha eingeben, Rest wird automatisch berechnet. */
window.openSubAreas=function(id){
 const f=field(id); if(!f)return;
 splitFieldId=id;
 const y=rotationYear(), used=subSum(f,y), available=Math.max(0,num(f.area)-used);
 openModal('Feld teilen – '+f.name,`
  <div class="note"><b>${esc(f.name)}</b> hat insgesamt <b>${fmt(f.area,2)} ha</b>.<br>Du gibst nur die Größe der Teilfläche ein. Die verbleibende Fläche des Schlages wird automatisch berechnet. Die Teilung gilt nur für das gewählte Jahr und bleibt später in der Historie erhalten.</div>
  <div class="form3">
   <div><label>Name der Teilfläche</label><input id="subNameSimple" placeholder="z. B. Weizenfläche"></div>
   <div><label>Kultur</label><input id="subCropSimple" placeholder="z. B. Weizen"></div>
   <div><label>Jahr</label><input id="subYearSimple" type="number" value="${y}" onchange="updateSimpleSplitPreview()"></div>
  </div>
  <div class="form2">
   <div><label>Teilfläche in ha</label><input id="subAreaSimple" type="number" min="0.01" step="0.01" placeholder="z. B. 1,00" oninput="updateSimpleSplitPreview()"></div>
   <div><label>Verbleibende Hauptfläche</label><input id="subRestSimple" value="${fmt(available,2)} ha" disabled></div>
  </div>
  <div id="subPreviewSimple" class="note" style="margin-top:10px">Verfügbar für ${y}: <b>${fmt(available,2)} ha</b></div>
  <br><button class="primary" onclick="saveSimpleSubArea()">Teilung speichern</button>
  <h3>Teilflächen & Historie</h3><div id="subListSimple"></div>`);
 renderSimpleList(f);
};
window.updateSimpleSplitPreview=function(){
 const f=field(splitFieldId); if(!f)return;
 const y=num(document.getElementById('subYearSimple')?.value)||rotationYear();
 const a=num(document.getElementById('subAreaSimple')?.value), available=Math.max(0,num(f.area)-subSum(f,y)), rest=available-a;
 const r=document.getElementById('subRestSimple'); if(r)r.value=fmt(Math.max(0,rest),2)+' ha';
 const p=document.getElementById('subPreviewSimple'); if(p)p.innerHTML=a>0?(rest>=0?`Teilfläche: <b style="color:${BLUE}">${fmt(a,2)} ha</b> · Rest von ${esc(f.name)}: <b>${fmt(rest,2)} ha</b>`:`<b style="color:#bb3b34">Die Teilfläche ist größer als die noch verfügbare Fläche.</b>`):`Verfügbar für ${y}: <b>${fmt(available,2)} ha</b>`;
};
function renderSimpleList(f){
 const e=document.getElementById('subListSimple'); if(!e)return;
 e.innerHTML=(f.subAreas||[]).slice().sort((a,b)=>Number(b.year)-Number(a.year)).map(s=>`<div class="note" style="margin:5px 0;border-left:4px solid ${BLUE}"><b style="color:${BLUE}">↳ ${esc(s.name||s.crop||'Teilfläche')}</b> · ${fmt(s.area,2)} ha · ${s.year} · ${esc(s.crop||'–')} ${s.archived?'<span class="small">(Historie / abgeschlossen)</span>':`<button class="secondary" style="float:right;padding:3px 7px" onclick="archiveSubArea('${f.id}','${s.id}')">Für Folgejahr beenden</button>`}</div>`).join('')||'<div class="small">Noch keine Teilflächen.</div>';
}
window.saveSimpleSubArea=function(){
 const f=field(splitFieldId); if(!f)return;
 const y=num(document.getElementById('subYearSimple').value)||rotationYear(), a=num(document.getElementById('subAreaSimple').value), available=Math.max(0,num(f.area)-subSum(f,y));
 if(!(a>0))return alert('Bitte eine Teilfläche größer 0 ha eingeben.');
 if(a>available+.001)return alert(`Für ${y} sind nur noch ${fmt(available,2)} ha verfügbar.`);
 const crop=document.getElementById('subCropSimple').value.trim(), name=document.getElementById('subNameSimple').value.trim()||crop||'Teilfläche';
 f.subAreas=f.subAreas||[]; f.subAreas.push({id:uid('sa'),name,crop,year:y,area:a,archived:false,createdAt:today()});
 persist('Teilfläche gespeichert'); closeModal(); setTimeout(()=>openSubAreas(f.id),80);
};
window.archiveSubArea=function(fid,sid){
 const f=field(fid),s=(f?.subAreas||[]).find(x=>x.id===sid); if(!s)return;
 if(!confirm('Teilfläche für Folgejahre beenden? Sie bleibt in der Historie des Feldes erhalten.'))return;
 s.archived=true; s.archivedAt=today(); persist('Teilfläche archiviert'); closeModal(); setTimeout(()=>openSubAreas(fid),80);
};
window.deleteSubArea=window.archiveSubArea;

/* Feld-Detail: nur noch ein einfacher Knopf „Feld teilen“. */
const baseFieldDetail=window.fieldDetail;
window.fieldDetail=function(id){
 baseFieldDetail(id); const f=field(id),d=document.getElementById('modalBody'); if(!f||!d)return;
 [...d.querySelectorAll('button')].filter(b=>/Teilflächen planen|Feld teilen/.test(b.textContent)).forEach(b=>b.remove());
 const b=document.createElement('button'); b.className='secondary'; b.style.marginLeft='5px'; b.textContent='Feld teilen'; b.onclick=()=>openSubAreas(id);
 const edit=[...d.querySelectorAll('button')].find(x=>x.textContent.includes('Feld bearbeiten')); if(edit)edit.after(b); else d.prepend(b);
 const all=f.subAreas||[]; if(all.length){const sec=document.createElement('div');sec.innerHTML=`<h3>Teilflächen-Historie</h3>${all.slice().sort((a,b)=>Number(b.year)-Number(a.year)).map(s=>`<div class="note" style="margin:5px 0;border-left:4px solid ${BLUE}"><b style="color:${BLUE}">↳ ${esc(s.name||s.crop||'Teilfläche')}</b> · ${s.year} · ${fmt(s.area,2)} ha · ${esc(s.crop||'–')}${s.archived?' · abgeschlossen':''}</div>`).join('')}`;d.appendChild(sec)}
};

/* Arbeitsgänge: Hauptfeld mit Restfläche, Teilflächen blau direkt darunter. */
window.newWork=function(){
 const y=workYear(today());
 openModal('Arbeitsgang erfassen',`<div class="form3"><div><label>Datum</label><input id="wDate" type="date" value="${today()}" onchange="newWork()"></div><div><label>Arbeitsgang</label><select id="wType">${db.settings.workTypes.map(x=>`<option>${x}</option>`).join('')}</select></div><div><label>Notiz (optional)</label><input id="wNote"></div></div><label>Felder / Wiesen</label><div class="checklist">${activeFields().map(f=>{const subs=activeSub(f,y),rest=restArea(f,y);return `<label><input class="workFieldSimple" type="checkbox" data-kind="field" value="${f.id}"><b>${esc(f.name)}</b> · ${fmt(rest,2)} ha${subs.length?'<span class="small"> Restfläche</span>':''}</label>${subs.map(s=>`<label style="padding-left:30px;color:${BLUE}"><input class="workFieldSimple" type="checkbox" data-kind="sub" data-parent="${f.id}" value="${s.id}"><b>↳ ${esc(s.name||s.crop||'Teilfläche')}</b> · ${fmt(s.area,2)} ha · Teilfläche</label>`).join('')}`}).join('')}</div><br><button class="primary" onclick="saveWorkSimple()">Speichern / Weiter</button>`);
};
window.saveWorkSimple=function(){
 const chosen=[...document.querySelectorAll('.workFieldSimple:checked')]; if(!chosen.length)return alert('Mindestens ein Feld oder eine Teilfläche auswählen.');
 const date=document.getElementById('wDate').value,type=document.getElementById('wType').value; if(!date||!type||type==='__ADD__')return alert('Datum und Arbeitsgang sind notwendig.');
 const fieldIds=[],subs=[],mains=[]; chosen.forEach(x=>{if(x.dataset.kind==='sub'){subs.push(x.value);if(!fieldIds.includes(x.dataset.parent))fieldIds.push(x.dataset.parent)}else{if(!fieldIds.includes(x.value))fieldIds.push(x.value);mains.push(x.value)}});
 const w={id:uid('w'),date,type,fieldIds,note:document.getElementById('wNote').value.trim(),details:{},subAreaIds:subs,mainFieldIds:mains}; db.workOperations.push(w); persist('Arbeitsgang '+w.type+' angelegt'); closeModal();
 if(w.type==='Säen')openSowingDetails(w.id);else if(w.type==='Begrünung säen')openCoverDetails(w.id);else if(w.type==='Rundballen pressen')openBaleDetails(w.id);else if(w.type==='Dreschen')openHarvestDetails(w.id);else if(w.type==='Mist streuen'||w.type==='Gülle fahren')openOrganicFertilizerDetails(w.id);else maybeEndTrialsForWork(w.id);
};
const baseArea=window.workAreaInfo;
window.workAreaInfo=function(w){if(!w?.subAreaIds?.length&&!w?.mainFieldIds)return baseArea(w);let sum=0,missing=[];(w.mainFieldIds||[]).forEach(id=>{const f=field(id);if(f)sum+=restArea(f,workYear(w.date));else missing.push(id)});(w.subAreaIds||[]).forEach(id=>{const z=subById(id);if(z)sum+=num(z.s.area);else missing.push(id)});return {sum,missing,complete:!missing.length}};
const baseSow=window.openSowingDetails;
window.openSowingDetails=function(id){baseSow(id);const w=db.workOperations.find(x=>x.id===id);if(!w)return;const rows=[...document.querySelectorAll('.sowRow')];rows.forEach(r=>{const fid=r.dataset.field,subs=(w.subAreaIds||[]).map(subById).filter(Boolean).filter(z=>z.f.id===fid),main=(w.mainFieldIds||[]).includes(fid);if(subs.length===1&&!main){const s=subs[0].s;r.querySelector('b').innerHTML=`<span style="color:${BLUE}">↳ ${esc(s.name||s.crop)} (Teilfläche)</span>`;const a=r.querySelector('.area');if(a){a.value=num(s.area);updateSowingRow(r)}}else if(main){const f=field(fid),a=r.querySelector('.area');if(a){a.value=restArea(f,workYear(w.date));updateSowingRow(r)}}})};

/* Fruchtfolge: Teilflächen blau direkt unter dem Hauptfeld; Hauptfeld zeigt Restfläche. */
const baseRenderRotation=window.renderRotation;
window.renderRotation=function(){
 baseRenderRotation(); const table=document.querySelector('#rotationView table'); if(!table)return;
 const y=rotationYear(),rows=[...table.querySelectorAll('tbody tr')];
 rows.forEach(r=>{const name=r.cells?.[0]?.textContent?.trim(),f=(db.fields||[]).find(x=>x.name===name);if(!f)return;const subs=activeSub(f,y);if(!subs.length)return;const rest=restArea(f,y);if(r.cells[1])r.cells[1].innerHTML=`<b>${fmt(rest,2)} ha</b><div class="small">Restfläche von ${fmt(f.area,2)} ha</div>`;let after=r;subs.forEach(s=>{const p=(db.rotationPlans||[]).find(x=>x.subAreaId===s.id&&Number(x.year)===y),tr=document.createElement('tr');tr.style.color=BLUE;tr.innerHTML=`<td style="padding-left:28px"><b>↳ ${esc(s.name||s.crop||'Teilfläche')}</b><div class="small" style="color:${BLUE}">Teilfläche von ${esc(f.name)}</div></td><td><b>${fmt(s.area,2)} ha</b></td><td colspan="3">${esc(s.crop||'–')}</td><td><b>${esc(p?.crop||s.crop||'–')}</b></td><td colspan="5">Teilfläche ${s.year}</td>`;after.after(tr);after=tr})});
};
})();