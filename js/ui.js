// js/ui.js
import { toast, downloadJSON } from "./utils.js";
export function initUI(state){

  // Floating left sidebar toggle icon
  const toggleIcon = document.getElementById("left-toggle");
  if (toggleIcon){
    toggleIcon.addEventListener("click", ()=>{
      document.body.classList.toggle("left-collapsed");
      // Persist preference in session
      try { sessionStorage.setItem("leftCollapsed", document.body.classList.contains("left-collapsed") ? "1" : "0"); } catch(e){}
    });
    try { if (sessionStorage.getItem("leftCollapsed")==="1") document.body.classList.add("left-collapsed"); } catch(e){}
  }

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
    const f = e.target.files[0]; if (!f) return;
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = ()=>{ state.floorImage = img; toast("Imagine încărcată."); };
    img.src = url;
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
    state.filters = new Set([f]);
    renderList(state);
  });

  // Select from list
  document.getElementById("asset-list").addEventListener("click", (e)=>{
    const item = e.target.closest(".list-item"); if (!item) return;
    state.selectedId = item.dataset.id;
    /* details panel removed */
  });
  // Open Add Device modal from left panel
  document.getElementById("left-panel").addEventListener("click", (e)=>{
    const b = e.target.closest("[data-action='add-device']"); if (!b) return;
    const modal = document.getElementById("add-device-modal");
    modal.hidden = false;
  });
  // Modal buttons
  const modal = document.getElementById("add-device-modal");
  if (modal){
    modal.addEventListener("click", (e)=>{
      if (e.target === modal) { modal.hidden = true; }
    });
    modal.querySelector("#add-cancel").addEventListener("click", ()=> modal.hidden = true);
    modal.querySelector("#add-save").addEventListener("click", ()=>{
      const type = modal.querySelector("#add-type").value;
      const id = modal.querySelector("#add-id").value.trim() || (type==='extinguisher'?'E-NEW':'NOU');
      const place = modal.querySelector("#add-place").checked;
      const now = performance.now();
      if (type === 'extinguisher'){
        const ext = { id, x: 40, y: 40, expired: false };
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
  const filter = [...state.filters][0];
  const items = state.assets.filter(a=>{
    if (filter==="all") return true;
    if (filter==="forklifts") return a.type==="forklift";
    if (filter==="lifters") return a.type==="lifter";
    if (filter==="moving") return a.status==="moving";
    if (filter==="idle") return a.status==="idle";
    return true;
  });
  list.innerHTML = items.map(a => `
    <div class="list-item ${a.id===state.selectedId?'active':''} ${a.id===state.hoveredId?'hovered':''}" data-id="${a.id}">
      <div><strong>${a.type==="forklift"?"Stivuitor":"Lifter"} ${a.id}</strong></div>
      <div class="meta">Verificat ${a.checked} • Aprobat ${a.approved}</div>
      <div class="meta">${a.status==="idle"?"Inactiv >5m":"În mișcare"}</div>
    </div>
  `).join("");
  list.querySelectorAll('.list-item').forEach(el=>{
    el.addEventListener('click',()=>{
      state.selectedId = el.getAttribute('data-id');
      /* details panel removed */
      renderList(state);
      const s = document.querySelector('.list-item.active'); if (s) s.scrollIntoView({block:'nearest', behavior:'smooth'});
    });
  });
}
export function renderDetails(state){
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
