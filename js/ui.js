// js/ui.js

// Safe fallbacks if utils.js lacks exports (cache/mismatch safe)
const toast = (Utils && typeof Utils.toast === "function")
  ? Utils.toast
  : function(msg){
      try {
        const el = document.getElementById("toast");
        if (!el) { console.warn("toast:", msg); return; }
        el.textContent = msg; el.hidden = false;
        clearTimeout(el._t); el._t = setTimeout(()=> el.hidden = true, 1600);
      } catch(e){ console.warn("toast fallback failed:", msg, e); }
    };

const downloadJSON = (typeof Utils?.downloadJSON === "function")
  ? Utils.downloadJSON
  : function(filename, obj){
      try {
        const data = new Blob([JSON.stringify(obj, null, 2)], {type:"application/json"});
        const url = URL.createObjectURL(data);
        const a = Object.assign(document.createElement("a"), { href: url, download: filename });
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(()=>URL.revokeObjectURL(url), 500);
      } catch (e) {
        console.error("downloadJSON failed:", e);
        alert("Nu pot salva JSON-ul. Verifică permisiunile browserului.");
      }
    };
import * as Utils from "./utils.js";
export function initUI(state){
  // List interaction
  const listEl = document.getElementById('asset-list');
  if (listEl && !listEl.dataset.bound){
    listEl.dataset.bound = '1';
    listEl.addEventListener('click', (e)=>{
      const actBtn = e.target.closest('.action');
      const item = e.target.closest('.list-item');
      if (actBtn){
        const id = actBtn.dataset.id;
        const a = state.assets.find(x=>x.id===id) || state.extinguishers.find(x=>x.id===id);
        const act = actBtn.dataset.action;
        if (act==='delete'){
          if (confirm('Sigur ștergi ' + id + '?')){
            const ai = state.assets.findIndex(x=>x.id===id);
            if (ai>=0) state.assets.splice(ai,1);
            const ei = state.extinguishers.findIndex(x=>x.id===id);
            if (ei>=0) state.extinguishers.splice(ei,1);
            if (state.selectedId===id) state.selectedId = null;
            if (typeof window.renderList==='function') window.renderList(state);
            if (typeof window.drawMap==='function') window.drawMap();
          }
          return;
        }
        if (act==='move'){
          const handler = (ev)=>{
            const r = state.canvas.getBoundingClientRect();
            const x = (ev.clientX - r.left), y = (ev.clientY - r.top);
            if ('x' in a){ a.x = x; a.y = y; }
            if (typeof window.renderList==='function') window.renderList(state);
            if (typeof window.drawMap==='function') window.drawMap();
          };
          toast('Click pe hartă pentru noua poziție ('+id+').');
          state.canvas.addEventListener('click', handler, { once:true });
          return;
        }
        if (act==='edit'){
          const modal = document.getElementById('add-device-modal');
          if (!modal){ alert('Modal indisponibil.'); return; }
          modal.hidden = false;
          // reset listeners by cloning
          const saveOld = modal.querySelector('#add-save');
          const cancelOld = modal.querySelector('#add-cancel');
          const save = saveOld.cloneNode(true); const cancel = cancelOld.cloneNode(true);
          saveOld.replaceWith(save); cancelOld.replaceWith(cancel);
          // populate
          const isExt = !!state.extinguishers.find(x=>x.id===id);
          modal.querySelector('#add-type').value = isExt ? 'extinguisher' : (a.type||'forklift');
          modal.querySelector('#add-id').value = a.id;
          const extBox = modal.querySelector('#ext-fields');
          if (extBox) extBox.style.display = isExt ? 'block':'none';
          const extChk = modal.querySelector('#add-ext-expired');
          if (extChk) extChk.checked = !!a.expired;
          // handlers
          cancel.addEventListener('click', ()=> modal.hidden = true, {once:true});
          modal.addEventListener('click', (ev)=>{ if (ev.target===modal) modal.hidden = true; }, {once:true});
          save.addEventListener('click', ()=>{
            const newType = modal.querySelector('#add-type').value;
            const newId = modal.querySelector('#add-id').value.trim() || a.id;
            a.id = newId;
            if (!isExt){ a.type = newType; } else { const chk = modal.querySelector('#add-ext-expired'); if (chk) a.expired = !!chk.checked; }
            modal.hidden = true;
            if (typeof window.renderList==='function') window.renderList(state);
            if (typeof window.drawMap==='function') window.drawMap();
          }, {once:true});
          return;
        }
      }
      // normal item selection
      if (item){
        const id = item.dataset.id;
        state.selectedId = id;
        if (typeof window.drawMap==='function') window.drawMap();
        if (typeof window.renderList==='function') window.renderList(state);
      }
    });
  }

  // Restore persisted left panel & filters & zoom
  try {
    const lf = localStorage.getItem("leftCollapsed"); if (lf==="1") document.body.classList.add("left-collapsed");
    const filters = JSON.parse(localStorage.getItem("filters")||"[]"); 
    if (filters && filters.length){ state.filters = new Set(filters); }
    const z = parseFloat(localStorage.getItem("zoom")||"1"); if (!isNaN(z)) state.zoom = Math.max(0.5, Math.min(2, z));
  } catch(e) {}


  // Floating left sidebar toggle icon
  const toggleIcon = document.getElementById("left-toggle");
  if (toggleIcon){
    toggleIcon.addEventListener("click", ()=>{
      document.body.classList.toggle("left-collapsed");
      // Persist preference in session
      try { localStorage.setItem("leftCollapsed", document.body.classList.contains("left-collapsed") ? "1" : "0"); } catch(e){}
    });
    try { if (sessionStorage.getItem("leftCollapsed")==="1") document.body.classList.add("left-collapsed"); } catch(e){}
  }

  // Sidebar toggle (floating)
  const floatToggle = document.getElementById('sidebar-toggle');
  if (floatToggle){ floatToggle.addEventListener('click', ()=>{
    document.body.classList.toggle('left-collapsed');
    try { localStorage.setItem('leftCollapsed', document.body.classList.contains('left-collapsed') ? '1':'0'); } catch(e){}
  }); }

  // Sidebar collapse from left panel header
  
  // Zones UX: cursor, hint, undo (Esc cancels polygon, Z undoes last point)

  const $ = (s)=>document.querySelector(s);
  $("#btn-pause").addEventListener("click", ()=>{
    state.paused = !state.paused;
    $("#btn-pause").textContent = state.paused ? "Pornește" : "Pauză";
  });
  $("#btn-reset").addEventListener("click", ()=>{
    const w = state.canvas.width, h = state.canvas.height;
    for (const a of state.assets){
      a.x = Math.random()*w*0.9 + w*0.05;
      a.y = Math.random()*h*0.9 + h*0.05;
      a.vx = a.vy = 0;
    }
    toast("Poziția a fost resetată.");
  });
  $("#btn-zones").addEventListener("click", ()=>{
    state.canvas.classList.add("drawing-zones");
    const hint = document.createElement("div"); hint.className="zone-hint"; hint.textContent="Mod zone: click pentru puncte • dublu-click închide • Z = undo • Esc = anulare"; document.body.appendChild(hint);
    toast("Modul desenare zone activat: click pentru a crea poligoane; dublu-click pentru a închide.");
    let current = [];
    const onClick = (e)=>{
      const r = state.canvas.getBoundingClientRect();
      current.push({x:e.clientX-r.left, y:e.clientY-r.top});
    };
    const onDbl = ()=>{
      if (current.length>2){ state.zones.push(current); }
      current = [];
    };
    state.canvas.addEventListener("click", onClick);
    state.canvas.addEventListener("dblclick", onDbl, { once:true });
    setTimeout(()=>{
      // auto-exit after 20s if user forgets
      state.canvas.removeEventListener("click", onClick);
    }, 20000);
  });
  $("#btn-clear-zones").addEventListener("click", ()=>{
    state.zones.length = 0;
    toast("Zonele au fost șterse.");
  });
$("#btn-save-config").addEventListener("click", ()=>{
    const cfg = {
      extinguishers: state.extinguishers,
      zones: state.zones,
    };
    downloadJSON("config.json", cfg);
  });

  // Filters and list clicks
  document.getElementById("left-panel").addEventListener("click", (e)=>{
    const b = e.target.closest("[data-filter]"); if (!b) return;
    const f = b.dataset.filter;
    if (f === "all"){ state.filters = new Set(["all"]); }
else {
  if (state.filters.has("all")) state.filters.delete("all");
  if (state.filters.has(f)) state.filters.delete(f); else state.filters.add(f);
  if (state.filters.size === 0) state.filters.add("all");
}
// persist
try { localStorage.setItem("filters", JSON.stringify([...state.filters])); } catch(e){}
renderList(state);
if (typeof window.drawMap === 'function') window.drawMap();
  });

  // Select from list
  document.getElementById("asset-list").addEventListener("mouseover", (e)=>{
    const item = e.target.closest(".list-item"); if (!item) return;
    state.hoveredId = item.dataset.id;
    if (typeof window.drawMap === 'function') window.drawMap();
  });
  document.getElementById("asset-list").addEventListener("mouseleave", ()=>{
    state.hoveredId = null; if (typeof window.drawMap === 'function') window.drawMap();
  });
  document.getElementById("asset-list").addEventListener("click", (e)=>{
    const item = e.target.closest(".list-item"); if (!item) return;
    state.selectedId = item.dataset.id;
    /* details panel removed */
  });
  // Open Add Device modal from left panel
  const addBtn = document.getElementById("btn-add-device");
  if (addBtn && !addBtn.dataset.bound){
    addBtn.dataset.bound = "1";
    addBtn.addEventListener("click", ()=>{ const modal = document.getElementById("add-device-modal"); if(modal) openAddModal(modal); });
  }

  function openAddModal(modal){
    modal.hidden = false;
    // reset buttons to avoid stacked listeners
    const saveOld = modal.querySelector("#add-save");
    const cancelOld = modal.querySelector("#add-cancel");
    const save = saveOld.cloneNode(true); const cancel = cancelOld.cloneNode(true);
    saveOld.replaceWith(save); cancelOld.replaceWith(cancel);
    // type-dependent fields
    const typeSel = modal.querySelector("#add-type");
    const extFields = modal.querySelector("#ext-fields");
    typeSel.addEventListener("change", ()=>{ extFields.style.display = (typeSel.value==="extinguisher")?"block":"none"; });
    extFields.style.display = (typeSel.value==="extinguisher")?"block":"none";
    // handlers
    cancel.addEventListener("click", ()=> modal.hidden = true, {once:true});
    modal.addEventListener("click", (e)=>{ if (e.target === modal) modal.hidden = true; }, {once:true});
    save.addEventListener("click", ()=>{
      const type = modal.querySelector("#add-type").value;
      const id = modal.querySelector("#add-id").value.trim() || (type==='extinguisher'?'E-NEW':'NOU');
      const place = modal.querySelector("#add-place").checked;
      const now = performance.now();
      if (type === 'extinguisher'){
        const expired = modal.querySelector('#add-ext-expired')?.checked || false;
        const ext = { id, x: 40, y: 40, expired };
        if (place){
          placeOnMap((x,y)=>{ ext.x=x; ext.y=y; state.extinguishers.push(ext); finishAdd(); });
        } else { state.extinguishers.push(ext); finishAdd(); }
      } else {
        const a = { id, type, x: 60, y: 60, vx:0, vy:0, status:"moving", lastMove: now, checked: "nou", approved: "nou" };
        if (place){
          placeOnMap((x,y)=>{ a.x=x; a.y=y; state.assets.push(a); finishAdd(); });
        } else { state.assets.push(a); finishAdd(); }
      }
      function finishAdd(){
        modal.hidden = true;
        if (typeof window.renderList === 'function') window.renderList(state);
        if (typeof window.drawMap === 'function') window.drawMap();
        toast("Dispozitiv adăugat.");
      }
    }, {once:true});
  }
// Modal buttons
  const modal = document.getElementById("add-device-modal");
  if (modal){
    modal.addEventListener("click", (e)=>{
      if (e.target === modal) { modal.hidden = true; }
    });
    modal.querySelector("#add-cancel").addEventListener("click", ()=> modal.hidden = true);
    const typeSel = modal.querySelector("#add-type");
    const extFields = modal.querySelector("#ext-fields");
    typeSel.addEventListener("change", ()=>{ extFields.style.display = (typeSel.value==="extinguisher")?"block":"none"; });
    extFields.style.display = (typeSel.value==="extinguisher")?"block":"none";
    modal.querySelector("#add-save").addEventListener("click", ()=>{
      const type = modal.querySelector("#add-type").value;
      const id = modal.querySelector("#add-id").value.trim() || (type==='extinguisher'?'E-NEW':'NOU');
      const place = modal.querySelector("#add-place").checked;
      const now = performance.now();
      if (type === 'extinguisher'){
        const expired = modal.querySelector('#add-ext-expired')?.checked || false;
        const ext = { id, x: 40, y: 40, expired };
        if (place){
          placeOnMap((x,y)=>{ ext.x=x; ext.y=y; state.extinguishers.push(ext); finishAdd(); });
        } else { state.extinguishers.push(ext); finishAdd(); }
      } else {
        const a = { id, type, x: 60, y: 60, vx:0, vy:0, status:"moving", lastMove: now, checked: "nou", approved: "nou" };
        if (place){
          placeOnMap((x,y)=>{ a.x=x; a.y=y; state.assets.push(a); finishAdd(); });
        } else { state.assets.push(a); finishAdd(); }
      }
      function finishAdd(){
        modal.hidden = true;
        if (typeof window.renderList === 'function') window.renderList(state);
        if (typeof window.drawMap === 'function') window.drawMap();
        toast("Dispozitiv adăugat.");
      }
    });
  }
  function placeOnMap(cb){
    toast("Click pe hartă pentru a plasa dispozitivul.");
    const once = (e)=>{
      const r = state.canvas.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      state.canvas.removeEventListener("click", once);
      cb(x,y);
    };
    state.canvas.addEventListener("click", once);
  }

}

export function renderList(state){
  window.renderList = renderList;
  const list = document.getElementById("asset-list");
  const filterSet = state.filters;
  // Update chip visual state
  const chips = document.querySelectorAll("#left-panel [data-filter]");
  chips.forEach(c=>{
    const f = c.getAttribute("data-filter");
    if (filterSet.has("all") && f==="all"){ c.classList.add("active"); }
    else if (!filterSet.has("all") && filterSet.has(f)){ c.classList.add("active"); }
    else { c.classList.remove("active"); }
  });

  // Build filtered list
  function matchFilters(a){
    if (filterSet.has("all")) return true;
    // type
    if (filterSet.has("forklifts") && a.type!=="forklift") return false;
    if (filterSet.has("lifters") && a.type!=="lifter") return false;
    if (filterSet.has("extinguishers") && a.type!=="extinguisher") return false;
    // status
    if (filterSet.has("moving") && a.status!=="moving") return false;
    if (filterSet.has("idle") && a.status!=="idle") return false;
    // special expired for extinguishers
    if (filterSet.has("expired") && !(a.type==="extinguisher" && a.expired)) return false;
    return true;
  }
  const items = [
    ...state.assets.map(a=>({ ...a })),
    ...state.extinguishers.map(e=>({ ...e, type:"extinguisher", status: e.expired? "expired":"ok" }))
  ].filter(matchFilters);

  list.innerHTML = items.map(a=>{
    const statusDot = a.type==="extinguisher" ? (a.expired? "status-expired" : "status-ok") : (a.status==="idle"?"status-idle":"status-moving");
    const subtitle = a.type==="extinguisher" ? (a.expired?"Expirat":"Funcțional") : (a.status==="idle"?"Inactiv >5m":"În mișcare");
    const title = (a.type==="forklift"?"Stivuitor": a.type==="lifter"?"Lifter":"Extinctor") + " " + a.id;
    const sel = (state.selectedId===a.id) ? " selected" : "";
    return `<div class="list-item${sel}${(state.hoveredId===a.id && state.selectedId!==a.id) ? " hovered" : ""}" data-id="${a.id}">
      <div><span class="status-dot ${statusDot}"></span> ${title}</div>
      <div class="meta">${a.checked? ("Verificat " + a.checked + " • Aprobat " + a.approved) : ""} ${a.type==="extinguisher"?"":""}</div>
      <div class="meta">${subtitle}</div>
      <div class="actions">
        <button class="action" data-action="edit" data-id="${a.id}">Editează</button>
        <button class="action" data-action="move" data-id="${a.id}">Mută</button>
        <button class="action" data-action="delete" data-id="${a.id}">Șterge</button>
      </div>
    </div>`;
  }).join("");

  // Scroll to selected if visible
  if (state.selectedId){
    const el = list.querySelector(`.list-item[data-id="${state.selectedId}"]`);
    if (el) { el.classList.add("selected"); el.scrollIntoView({block:"nearest"}); }
  }
}
export function renderDetails(state){ /* removed */ }