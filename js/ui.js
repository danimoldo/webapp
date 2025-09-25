// js/ui.js
import { toast, downloadJSON } from "./utils.js";
// Hide/Show left panel
document.addEventListener("click", (e)=>{
  if (e.target.id === "toggle-left") {
    const root = document.querySelector(".layout");
    const collapsed = root.classList.toggle("left-collapsed");
    e.target.textContent = collapsed ? "Arată panoul" : "Ascunde panoul";
  }
});
export function initUI(state){
  // Add new assets
const $ = (s)=>document.querySelector(s);
function addAsset(type){
  const w = state.canvas.width, h = state.canvas.height;
  const idPrefix = type==="forklift" ? "F" : (type==="lifter" ? "L" : "E");
  const nextNum = (arr)=>String(arr.length+1).padStart(3,"0");
  if (type==="ext"){
    const id = `E-${nextNum(state.extinguishers)}`;
    state.extinguishers.push({ id, x: Math.random()*w, y: Math.random()*h, expires:"2026-01-01", expired:false });
  } else {
    const id = `${idPrefix}-${nextNum(state.assets.filter(a=>a.type===type))}`;
    state.assets.push({
      id, type, x: Math.random()*w, y: Math.random()*h,
      status: "moving", checked: "1z în urmă", approved: "1z în urmă",
      heading: Math.random()*Math.PI*2, speedPx: 1.39*state.pxPerMeter
    });
  }
  renderList(state);
}

$("#left-panel").addEventListener("click", (e)=>{
  if (e.target.id === "add-forklift") addAsset("forklift");
  if (e.target.id === "add-lifter") addAsset("lifter");
  if (e.target.id === "add-ext") addAsset("ext");
});
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
  $("#btn-upload").addEventListener("click", ()=> $("#file-input").click());
  $("#file-input").addEventListener("change", (e)=>{
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
    renderDetails(state);
  });
}

export function renderList(state){
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
    <div class="list-item" data-id="${a.id}">
      <div><strong>${a.type==="forklift"?"Stivuitor":"Lifter"} ${a.id}</strong></div>
      <div class="meta">Verificat ${a.checked} • Aprobat ${a.approved}</div>
      <div class="meta">${a.status==="idle"?"Inactiv >5m":"În mișcare"}</div>
    </div>
  `).join("");
}
export function renderDetails(state){
  const box = document.getElementById("details");
  const a = state.assets.find(x=>x.id===state.selectedId);
  if(!a){ box.textContent = "Selectează un activ."; return; }
  box.innerHTML = `
    <div><strong>${a.type==="forklift"?"Stivuitor":"Lifter"} ${a.id}</strong></div>
    <div class="meta">Verificat ${a.checked} • Aprobat ${a.approved}</div>
    <div class="meta">Stare: ${a.status==="idle"?"Inactiv >5m":"În mișcare"}</div>
  `;
}
