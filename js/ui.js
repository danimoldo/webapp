// js/ui.js
import { toast, downloadJSON } from "./utils.js";
export function initUI(state){
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

  // Sidebar collapse from left panel header
  const collapseBtn = document.getElementById("btn-left-collapse");
  if (collapseBtn){ collapseBtn.addEventListener("click", ()=>{
    document.body.classList.toggle("left-collapsed");
    try { localStorage.setItem("leftCollapsed", document.body.classList.contains("left-collapsed") ? "1":"0"); } catch(e){}
  }); }

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
  document.getElementById("btn-add-device")?.addEventListener("click", ()=>{ const modal = document.getElementById("add-device-modal"); if(modal) modal.hidden = false; });
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
    return \`<div class="list-item\${sel}" data-id="\${a.id}">
      <div><span class="status-dot \${statusDot}"></span> \${title}</div>
      <div class="meta">\${a.checked? ("Verificat " + a.checked + " • Aprobat " + a.approved) : ""} \${a.type==="extinguisher"?"":""}</div>
      <div class="meta">\${subtitle}</div>
      <div class="actions">
        <button class="action" data-action="edit" data-id="\${a.id}">Editează</button>
        <button class="action" data-action="move" data-id="\${a.id}">Mută</button>
        <button class="action" data-action="delete" data-id="\${a.id}">Șterge</button>
      </div>
    </div>\`;
  }).join("");

  // Scroll to selected if visible
  if (state.selectedId){
    const el = list.querySelector(\`.list-item[data-id="\${state.selectedId}"]\`);
    if (el) { el.classList.add("selected"); el.scrollIntoView({block:"nearest"}); }
  }
}
export function renderDetails(state){ /* removed */ }(state){
  window.renderDetails = renderDetails;
  const box = document.getElementById("details");
  const a = state.assets.find(x=>x.id===state.selectedId);
  if(!a){ box.textContent = "Selectează un activ."; return; }
  box.innerHTML = `
    <div><strong>${a.type==="forklift"?"Stivuitor":"Lifter"} ${a.id}</strong></div>
    <div class="meta">Verificat ${a.checked} • Aprobat ${a.approved}</div>
    <div class="meta">Stare: ${a.status==="idle"?"Inactiv >5m":"În mișcare"}</div>
  `;
}
