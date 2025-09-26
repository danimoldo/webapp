import { toast, downloadJSON } from "./utils.js";
export function renderList(state){
  window.renderList = renderList;
  const list = document.getElementById("asset-list");
  const items = state.assets.slice(); // TODO filter by state.filters
  list.innerHTML = items.map(a => `
    <div class="list-item ${a.id===state.selectedId?'active':''} ${a.id===state.hoveredId?'hovered':''}" data-id="${a.id}">
      <div><strong>${a.type==="forklift"?"Stivuitor":"Lifter"} ${a.id}</strong></div>
      <div class="meta">Verificat ${a.checked || a.checkedISO || ""} • Aprobat ${a.approved || a.approvedISO || ""}</div>
      <div class="meta">${a.status==="idle"?"Inactiv >5m":"În mișcare"}</div>
    </div>
  `).join("");
  list.querySelectorAll('.list-item').forEach(el=>{
    el.addEventListener('click',()=>{
      state.selectedId = el.getAttribute('data-id');
      renderDetails(state);
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
  const chk = a.checkedISO || a.checked || "";
  const apr = a.approvedISO || a.approved || "";
  const id = a.id || "";
  const type = a.type || "forklift";
  box.innerHTML = `
    <div class="details-form">
      <div class="row">
        <label for="dt-checked">Ultima verificare</label>
        <input id="dt-checked" type="datetime-local" value="${/T/.test(chk)?chk: ''}" placeholder="YYYY-MM-DDThh:mm" />
      </div>
      <div class="row">
        <label for="dt-approved">Aprobat de autorități</label>
        <input id="dt-approved" type="datetime-local" value="${/T/.test(apr)?apr: ''}" placeholder="YYYY-MM-DDThh:mm" />
      </div>
      <div class="row">
        <label for="txt-tag">Tag</label>
        <input id="txt-tag" type="text" value="${id}" />
      </div>
      <div class="row">
        <label for="sel-type">Tip</label>
        <select id="sel-type">
          <option value="forklift" ${type==='forklift'?'selected':''}>Stivuitor</option>
          <option value="lifter" ${type==='lifter'?'selected':''}>Lifter</option>
        </select>
      </div>
      <div class="actions">
        <button id="btn-save-details" class="btn">Salvează</button>
        <span class="muted">* Modificările sunt salvate în sesiunea curentă</span>
      </div>
    </div>
  `;
  const elChecked = document.getElementById('dt-checked');
  const elApproved = document.getElementById('dt-approved');
  const elTag = document.getElementById('txt-tag');
  const elType = document.getElementById('sel-type');
  const elSave = document.getElementById('btn-save-details');
  elSave.addEventListener('click', ()=>{
    a.checkedISO = elChecked.value || "";
    a.approvedISO = elApproved.value || "";
    const newId = (elTag.value || '').trim();
    const newType = elType.value;
    if (newId && newId !== a.id){
      if (state.assets.some(x=>x.id===newId)){
        alert('ID deja existent în listă.');
      } else {
        a.id = newId; state.selectedId = newId;
      }
    }
    a.type = newType;
    if (typeof window.renderList === 'function') window.renderList(state);
    if (state.draw) state.draw();
  });
}
export function initUI(state){
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
  $("#btn-upload").addEventListener("click", ()=> $("#file-input").click());
  $("#file-input").addEventListener("change", (e)=>{
    const file = e.target.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = ()=>{ state.floorImage = img; state.draw(); };
    img.src = URL.createObjectURL(file);
  });
  $("#btn-toggle-left").addEventListener("click", ()=> document.body.classList.toggle("left-collapsed"));
  $("#btn-save-config").addEventListener("click", ()=> downloadJSON({assets:state.assets, extinguishers:state.extinguishers}));
  // filters
  document.querySelectorAll(".chip[data-filter]").forEach(el=>{
    el.addEventListener("click", ()=>{
      const f = el.getAttribute("data-filter");
      state.filters = new Set([f]); renderList(state);
    });
  });
  // add device
  document.getElementById("btn-add-device").addEventListener("click", ()=>{
    const type = prompt('Tip dispozitiv (forklift/lifter):','forklift');
    if (!type || !/^(forklift|lifter)$/i.test(type)) return;
    const id = prompt('ID dispozitiv (ex: F-006 sau L-006):','');
    if (!id) return;
    const c = state.canvas;
    const dev = { id, type: type.toLowerCase(), x: Math.random()*c.width, y: Math.random()*c.height, vx:0, vy:0, status:"moving", lastMove:performance.now() };
    state.assets.push(dev); renderList(state); state.draw();
  });
}
