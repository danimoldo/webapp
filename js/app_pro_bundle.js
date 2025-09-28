// app_pro_bundle.js — HOTFIX (no DOM rewrites, single +Adăugare, safe layer, fixed placement & drag)
(function(){
  // ---------- helpers ----------
  const $ = (s, c=document) => c.querySelector(s);
  const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));
  const norm = t => (t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");

  // Find the best "map/plan" root to host markers (largest visible candidate)
  function findMapRoot(){
    const candidates = [
      "#plan", "#harta", "#map", ".plan", ".map", ".leaflet-container",
      ".mapboxgl-canvas", ".canvas", "canvas", "#canvas"
    ].map(sel => $$(sel)).flat();
    const visible = candidates.filter(el=>{
      if (!el || !el.getBoundingClientRect) return false;
      const r = el.getBoundingClientRect();
      return r.width>200 && r.height>200 && getComputedStyle(el).display!=="none" && r.top < window.innerHeight && r.bottom > 0;
    });
    if (visible.length===0) return null;
    visible.sort((a,b)=>{
      const ra=a.getBoundingClientRect(), rb=b.getBoundingClientRect();
      return (rb.width*rb.height) - (ra.width*ra.height);
    });
    return visible[0];
  }

  // Ensure a single toolbar; attach next to "Redare" if found
  function ensureToolbar(){
    if ($(".toolbar-pro")) return;
    const redareBtn = $$("button").find(b => norm(b.textContent).trim() === "redare");
    const block = document.createElement("div");
    block.className = "toolbar-pro";
    block.innerHTML = `
      <button id="btn-add" class="btn">+ Adăugare</button>
      <div class="divider"></div>
      <label class="f-label">Filtru tip</label>
      <select id="filterType" class="sel">
        <option value="toate">Toate</option>
        <option value="stivuitor">Stivuitor</option>
        <option value="lifter">Liftieră</option>
        <option value="extinctor">Extinctor</option>
      </select>
      <label class="f-label">Stare</label>
      <select id="filterStatus" class="sel">
        <option value="toate">Toate</option>
        <option value="ok">În termen</option>
        <option value="warning">Aproape expirat</option>
        <option value="expired">Expirat</option>
      </select>
      <input id="searchId" class="inp" placeholder="Caută după ID…" />
      <div class="divider"></div>
      <button id="btn-export-json" class="btn">Export JSON</button>
      <button id="btn-export-csv" class="btn">Export CSV</button>
      <label class="btn btn-file">Import <input id="importFile" type="file" accept=".json,.csv" hidden></label>
      <div class="divider"></div>
      <button id="btn-help" class="btn">Ajutor</button>
    `;
    if (redareBtn?.parentElement) redareBtn.insertAdjacentElement("afterend", block);
    else document.body.insertAdjacentElement("afterbegin", block);
  }

  // Ensure modals (add/edit + help)
  function ensureModals(){
    if (!$("#asset-modal")){
      const m = document.createElement("div");
      m.className = "modal"; m.id = "asset-modal"; m.setAttribute("aria-hidden","true");
      m.innerHTML = `
        <div class="modal__backdrop" data-close></div>
        <div class="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="asset-modal-title">
          <div class="modal__header">
            <h2 id="asset-modal-title">Adăugare / Editare</h2>
            <button class="modal__close" data-close aria-label="Închide">×</button>
          </div>
          <div class="modal__body">
            <form id="asset-form">
              <div class="field"><label for="assetType">Tip</label>
                <select id="assetType" required>
                  <option value="stivuitor">Stivuitor</option>
                  <option value="lifter">Liftieră</option>
                  <option value="extinctor">Extinctor</option>
                </select>
              </div>
              <div class="field"><label for="entryDate">Data intrării</label><input type="date" id="entryDate" required></div>
              <div class="field"><label for="verifyExpiry">Data expirării verificării</label><input type="date" id="verifyExpiry" required></div>
              <div class="field"><label for="iscirExpiry">Data expirării ISCIR</label><input type="date" id="iscirExpiry" required></div>
              <input type="hidden" id="assetId">
            </form>
          </div>
          <div class="modal__footer">
            <button id="btn-save" class="btn btn-primary">Salvează</button>
            <button id="btn-edit" class="btn">Editează</button>
            <button id="btn-delete" class="btn btn-danger">Șterge</button>
            <span class="modal__spacer"></span>
            <button class="btn" data-close>Renunță</button>
          </div>
        </div>`;
      document.body.appendChild(m);
    }
    if (!$("#help-modal")){
      const m = document.createElement("div");
      m.className = "modal"; m.id = "help-modal"; m.setAttribute("aria-hidden","true");
      m.innerHTML = `
        <div class="modal__backdrop" data-close></div>
        <div class="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="help-title">
          <div class="modal__header"><h2 id="help-title">Ajutor</h2><button class="modal__close" data-close aria-label="Închide">×</button></div>
          <div class="modal__body">
            <ol>
              <li><strong>+ Adăugare</strong> — alege tipul și datele, apoi <em>Salvează</em>.</li>
              <li>Dă <strong>click pe hartă</strong> (plan) pentru a plasa activul; apoi <strong>drag &amp; drop</strong>.</li>
              <li><strong>Click pe marker</strong> pentru editare/ștergere.</li>
              <li><strong>Filtre &amp; căutare</strong> — după Tip/Stare + ID.</li>
              <li><strong>Export/Import</strong> — JSON/CSV; persistă automat în localStorage.</li>
            </ol>
          </div>
          <div class="modal__footer"><button class="btn" data-close>Închis</button></div>
        </div>`;
      document.body.appendChild(m);
    }
  }

  // Create the layer INSIDE the map root
  function ensureAssetLayer(){
    let layer = $(".asset-layer");
    if (layer) return layer;
    const host = findMapRoot() || document.body;
    // Make host positioned for absolute overlay
    const cs = getComputedStyle(host);
    if (cs.position === "static") host.style.position = "relative";
    layer = document.createElement("div");
    layer.className = "asset-layer";
    host.appendChild(layer);
    return layer;
  }

  // ---------- Core app ----------
  const App = (function(){
    let layer = ensureAssetLayer();
    const state = {
      assets: [],
      filters: { type: "toate", status: "toate", search: "" },
      placementForId: null,
      drag: { id:null, dx:0, dy:0 },
      host: layer.parentElement
    };

    // If layout changes (e.g., map mounts later), reattach layer
    const mo = new MutationObserver(()=> {
      const newHost = findMapRoot();
      if (newHost && newHost !== state.host){
        state.host = newHost;
        if (getComputedStyle(newHost).position === "static") newHost.style.position = "relative";
        newHost.appendChild(layer);
      }
    });
    mo.observe(document.body, { childList:true, subtree:true });

    const typeIcon = (t) => {
      t = (t||"").toLowerCase();
      if (t.startsWith("stiv")) return "🟧";
      if (t.startsWith("lift")) return "🟡";
      if (t.startsWith("ext")) return "🧯";
      return "⚪";
    };
    const daysUntil = s => {
      if (!s) return Infinity;
      const n=new Date(); n.setHours(0,0,0,0);
      const d=new Date(s); d.setHours(0,0,0,0);
      return Math.ceil((d-n)/(1000*60*60*24));
    };
    const computeStatus = a => {
      const l = Math.min(daysUntil(a.verifyExpiry), daysUntil(a.iscirExpiry));
      if (l===Infinity) return "ok";
      if (l<0) return "expired";
      if (l<=30) return "warning";
      return "ok";
    };
    const matches = a => {
      const f = state.filters;
      if (f.type!=="toate"){
        if ((f.type==="stivuitor" && !/^stiv/i.test(a.type)) ||
            (f.type==="lifter" && !/^lift/i.test(a.type)) ||
            (f.type==="extinctor" && !/^ext/i.test(a.type))) return false;
      }
      if (f.status!=="toate" && computeStatus(a)!==f.status) return false;
      if (f.search && !String(a.id||"").toLowerCase().includes(f.search.toLowerCase())) return false;
      return true;
    };

    function ensureMarker(a){
      let el = layer.querySelector(`.asset-marker[data-id="${CSS.escape(a.id)}"]`);
      if (!el){
        el = document.createElement("div");
        el.className = "asset-marker"; el.dataset.id = a.id;
        el.innerHTML = `<div class="bubble"><span class="icon"></span><span class="id"></span><span class="status"></span></div>`;
        layer.appendChild(el);
        el.addEventListener("click", (e)=>{
          e.stopPropagation();
          window.openAssetEditor && window.openAssetEditor(a);
          const id = $("#assetId"); if (id) id.value = a.id;
        });
        el.addEventListener("mousedown", (e)=>{
          const r = layer.getBoundingClientRect();
          state.drag.id=a.id;
          state.drag.dx = e.clientX - (a.x|| (r.left + 80));
          state.drag.dy = e.clientY - (a.y|| (r.top  + 120));
          showHint("Glisează pentru a muta…");
        });
      }
      return el;
    }

    function showHint(t){
      let h=document.querySelector(".drag-hint");
      if(!h){ h=document.createElement("div"); h.className="drag-hint"; document.body.appendChild(h); }
      h.textContent=t; clearTimeout(h.__t);
      h.style.opacity="1"; h.__t=setTimeout(()=>h.style.opacity="0",1200);
    }

    function render(){
      layer = ensureAssetLayer();
      const ids = new Set(state.assets.map(x=>x.id));
      layer.querySelectorAll(".asset-marker").forEach(m=>{ if(!ids.has(m.dataset.id)) m.remove(); });
      for (const a of state.assets){
        const el = ensureMarker(a);
        if (!matches(a)){ el.style.display="none"; continue; }
        el.style.display="";
        const r = layer.getBoundingClientRect();
        const x = (a.x ?? (r.left + 80)) - r.left;
        const y = (a.y ?? (r.top  + 120)) - r.top;
        el.style.left = x + "px";
        el.style.top  = y + "px";
        el.querySelector(".icon").textContent = typeIcon(a.type);
        el.querySelector(".id").textContent = a.id;
        const st = computeStatus(a);
        const badge = el.querySelector(".status");
        badge.className = "status " + st;
        badge.title = st==="ok"?"În termen":(st==="warning"?"Aproape expirat (<30 zile)":"Expirat");
      }
      try{ if (window.ui?.renderAssets) window.ui.renderAssets(); }catch(_){}
      try{ if (window.ui?.render) window.ui.render(); }catch(_){}
      try{ if (window.app?.render) window.app.render(); }catch(_){}
    }

    // Dragging relative to layer
    document.addEventListener("mousemove", (e)=>{
      if(!state.drag.id) return;
      const a=state.assets.find(x=>x.id===state.drag.id); if(!a) return;
      const r = layer.getBoundingClientRect();
      a.x = Math.max(r.left, Math.min(e.clientX - state.drag.dx, r.right));
      a.y = Math.max(r.top , Math.min(e.clientY - state.drag.dy, r.bottom));
      render();
    });
    document.addEventListener("mouseup", ()=>{
      if(state.drag.id){ state.drag.id=null; window.dispatchEvent(new CustomEvent("assets:changed",{detail:{reason:"drag"}})); }
    });

    // Place on map only when clicking inside layer host
    document.addEventListener("click", (e)=>{
      if(!state.placementForId) return;
      const r = layer.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
      const a=state.assets.find(x=>x.id===state.placementForId);
      if(!a){ state.placementForId=null; return; }
      a.x=e.clientX; a.y=e.clientY; state.placementForId=null; render();
      window.dispatchEvent(new CustomEvent("assets:changed",{detail:{reason:"placed"}}));
    }, true);

    function upsert(p){
      const id = p.id || ((p.type==="stivuitor"?"S":p.type==="lifter"?"L":"E")+"-"+String(Math.floor(1+Math.random()*999)).padStart(3,"0"));
      const i = state.assets.findIndex(x=>x.id===id);
      const n = { id, type:p.type||"stivuitor", entryDate:p.entryDate||"", verifyExpiry:p.verifyExpiry||"", iscirExpiry:p.iscirExpiry||"", x: p.x??null, y:p.y??null };
      if (i>=0) state.assets[i] = Object.assign({}, state.assets[i], n); else state.assets.push(n);
      render(); window.dispatchEvent(new CustomEvent("assets:changed",{detail:{reason:"upsert", id}}));
    }
    function remove(p){
      const id=typeof p==="string"?p:p?.id; if(!id) return;
      const i=state.assets.findIndex(x=>x.id===id); if(i>=0) state.assets.splice(i,1);
      render(); window.dispatchEvent(new CustomEvent("assets:changed",{detail:{reason:"remove", id}}));
    }
    function setFilters(o){
      if(o.type!=null) state.filters.type=o.type;
      if(o.status!=null) state.filters.status=o.status;
      if(o.search!=null) state.filters.search=o.search;
      render();
    }
    function requestPlacement(id){ state.placementForId=id; showHint("Click pe hartă (plan) pentru a plasa…"); }

    window.App = window.App || {};
    window.App.assets = state.assets;
    window.App.render = render;
    window.App.addAsset = (p)=>{ upsert(p); requestPlacement(p.id); };
    window.App.updateAsset = upsert;
    window.App.removeAsset = remove;
    window.App.setFilters = setFilters;
    window.App.requestPlacement = requestPlacement;

    setTimeout(render,50);
    window.addEventListener("resize", render);
    return window.App;
  })();

  // ---------- Modal behavior ----------
  (function(){
    function $(s,c=document){ return c.querySelector(s); }
    const modal = $("#asset-modal");
    const idInput = $("#assetId"), typeInput=$("#assetType"), entryInput=$("#entryDate"), verifyInput=$("#verifyExpiry"), iscirInput=$("#iscirExpiry");
    const toDateInput = v => { const d=v?new Date(v):new Date(); const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,"0"), da=String(d.getDate()).padStart(2,"0"); return `${y}-${m}-${da}`; };
    const addMonths = (d,n)=>{ d=new Date(d||Date.now()); d.setMonth(d.getMonth()+n); return d; };

    function open(asset){
      if (asset){ idInput.value=asset.id||""; typeInput.value=(asset.type||"").toLowerCase();
        entryInput.value=asset.entryDate||toDateInput();
        verifyInput.value=asset.verifyExpiry||toDateInput(addMonths(null,12));
        iscirInput.value=asset.iscirExpiry||toDateInput(addMonths(null,12));
      } else {
        idInput.value=""; typeInput.value="stivuitor";
        const t=new Date();
        entryInput.value=toDateInput(t);
        verifyInput.value=toDateInput(addMonths(t,12));
        iscirInput.value=toDateInput(addMonths(t,12));
      }
      modal.setAttribute("aria-hidden","false");
    }
    function close(){ modal.setAttribute("aria-hidden","true"); }
    window.openAssetEditor = open;

    // Reuse an existing "+ Adăugare" if present; otherwise our injected one.
    const userAdd = $$("button").find(b => norm(b.textContent).includes("+ adaugare")) || $("#btn-add");
    userAdd?.addEventListener("click", ()=>open());

    modal.addEventListener("click", (e)=>{ if (e.target.matches("[data-close]")||e.target.classList.contains("modal__backdrop")) close(); });
    document.addEventListener("keydown", (e)=>{ if (e.key==="Escape") close(); });

    const gather = ()=>({ id: idInput.value.trim(), type:typeInput.value, entryDate:entryInput.value, verifyExpiry:verifyInput.value, iscirExpiry:iscirInput.value });

    document.addEventListener("click", (e)=>{
      if (e.target?.id==="btn-save"){ e.preventDefault(); const p=gather(); if(!p.id) p.id=(p.type==="stivuitor"?"S":p.type==="lifter"?"L":"E")+"-"+String(Math.floor(1+Math.random()*999)).padStart(3,"0"); window.App?.addAsset?.(p); close(); }
      if (e.target?.id==="btn-edit"){ e.preventDefault(); const p=gather(); if(!p.id) return; window.App?.updateAsset?.(p); close(); }
      if (e.target?.id==="btn-delete"){ e.preventDefault(); const id=idInput.value.trim(); if(!id) return; window.App?.removeAsset?.(id); close(); }
      if (e.target?.id==="btn-help"){ const hm=$("#help-modal"); hm?.setAttribute("aria-hidden","false"); }
    });
  })();

  // ---------- Filters & search ----------
  (function(){
    const tSel = () => $("#filterType");
    const sSel = () => $("#filterStatus");
    const qInp = () => $("#searchId");
    function apply(){ window.App?.setFilters?.({ type: tSel()?.value||"toate", status: sSel()?.value||"toate", search: qInp()?.value?.trim()||"" }); }
    document.addEventListener("change", (e)=>{ if (e.target===tSel() || e.target===sSel()) apply(); });
    document.addEventListener("input",  (e)=>{ if (e.target===qInp()) apply(); });
  })();

  // ---------- Persistence & export/import ----------
  (function(){
    const KEY="rtls_assets_v1";
    function save(){ try{ const items=(window.App?.assets)||[]; localStorage.setItem(KEY, JSON.stringify(items)); }catch(e){} }
    function load(){ try{ const raw=localStorage.getItem(KEY); if(!raw) return; const items=JSON.parse(raw); if(Array.isArray(items)) items.forEach(a=>window.App?.updateAsset?.(a)); }catch(e){} }
    function toCSV(items){ const cols=["id","type","x","y","entryDate","verifyExpiry","iscirExpiry"]; const out=[cols.join(",")]; items.forEach(a=> out.push(cols.map(k=> (a[k]!=null?String(a[k]).replace(/"/g,'""'):"")).join(","))); return out.join("\\n"); }
    function download(name, content, mime){ const b=new Blob([content],{type:mime}); const u=URL.createObjectURL(b); const a=document.createElement("a"); a.href=u; a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(u); a.remove(); },0); }
    function exportJSON(){ const items=window.App?.assets||[]; download("assets.json", JSON.stringify(items,null,2),"application/json"); }
    function exportCSV(){ const items=window.App?.assets||[]; download("assets.csv", toCSV(items),"text/csv"); }
    function parseCSV(txt){ const lines=txt.trim().split(/\\r?\\n/); const headers=lines.shift().split(","); const idx={}; headers.forEach((h,i)=> idx[h.trim()]=i); const out=[]; for(const line of lines){ const cells=line.split(","); const a={ id:cells[idx.id]||"", type:cells[idx.type]||"stivuitor", x:cells[idx.x]?Number(cells[idx.x]):null, y:cells[idx.y]?Number(cells[idx.y]):null, entryDate:cells[idx.entryDate]||"", verifyExpiry:cells[idx.verifyExpiry]||"", iscirExpiry:cells[idx.iscirExpiry]||"" }; out.push(a);} return out; }
    function importFile(file){ const r=new FileReader(); r.onload=()=>{ try{ const txt=String(r.result); let items=[]; if (file.name.toLowerCase().endsWith(".csv")) items=parseCSV(txt); else items=JSON.parse(txt); if(Array.isArray(items)){ items.forEach(a=>window.App?.updateAsset?.(a)); window.dispatchEvent(new CustomEvent("assets:changed",{detail:{reason:"import"}})); alert(`Import: ${items.length} înregistrări.`);} }catch(e){ alert("Import invalid: "+e.message);} }; r.readAsText(file); }
    document.addEventListener("click", (e)=>{ if (e.target?.id==="btn-export-json") exportJSON(); if (e.target?.id==="btn-export-csv") exportCSV(); });
    document.addEventListener("change", (e)=>{ if (e.target?.id==="importFile"){ const f=e.target.files[0]; if (f) importFile(f); e.target.value=""; }});
    document.addEventListener("DOMContentLoaded", load); window.addEventListener("load", load);
    window.addEventListener("assets:changed", save); window.addEventListener("beforeunload", save);
  })();

  // ---------- Boot ----------
  function boot(){ ensureToolbar(); ensureModals(); ensureAssetLayer(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();