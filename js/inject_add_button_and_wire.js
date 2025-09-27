// inject_add_button_and_wire.js
(function(){
  function $(sel, ctx=document){ return ctx.querySelector(sel); }
  function create(tag, attrs={}, text=""){
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k,v])=> el.setAttribute(k, v));
    if (text) el.textContent = text;
    return el;
  }
  function norm(t){ return (t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }

  // 1) Ensure modal markup exists (if missing, inject it)
  function ensureModal(){
    if (document.getElementById("asset-modal")) return;
    const wrap = document.createElement("div");
    wrap.innerHTML = `
    <link rel="stylesheet" href="css/modal.css">
    <div class="modal" id="asset-modal" aria-hidden="true">
      <div class="modal__backdrop" data-close></div>
      <div class="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="asset-modal-title">
        <div class="modal__header">
          <h2 id="asset-modal-title">Adăugare / Editare</h2>
          <button class="modal__close" data-close aria-label="Închide">×</button>
        </div>
        <div class="modal__body">
          <form id="asset-form">
            <div class="field">
              <label for="assetType">Tip</label>
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
      </div>
    </div>`;
    document.body.appendChild(wrap);
  }

  // 2) Move "+ Adăugare" next to "Redare"
  function ensureAddButton(){
    // Remove legacy buttons
    document.querySelectorAll('button').forEach(btn => {
      const t = norm(btn.textContent);
      if (/(adauga|adaugă)\s*(stivuitor|lifter|liftier[ăa]|extinctor)/.test(t)) btn.remove();
    });

    // Find "Redare" button
    let playBtn = Array.from(document.querySelectorAll('button')).find(b => norm(b.textContent).trim() === "redare");
    if (!playBtn){
      // fallback: look for text node "Redare" inside toolbar-like container
      playBtn = Array.from(document.querySelectorAll('.toolbar button, .controls button, button')).find(b => norm(b.textContent).includes("redare"));
    }

    // Ensure our button exists
    let addBtn = document.getElementById("btn-add");
    if (!addBtn){
      addBtn = create("button", { id:"btn-add", class:"btn" }, "+ Adăugare");
    }

    if (playBtn && playBtn.parentElement){
      // Insert right after Redare
      if (addBtn !== playBtn.nextSibling){
        playBtn.insertAdjacentElement("afterend", addBtn);
      }
    } else {
      // Fallback: top of body
      if (!addBtn.parentElement) document.body.insertAdjacentElement("afterbegin", addBtn);
    }

    return addBtn;
  }

  // 3) Modal logic + strong adapter (inline to avoid load order issues)
  function setupModal(){
    const modal = document.getElementById("asset-modal");
    const idInput = document.getElementById("assetId");
    const typeInput = document.getElementById("assetType");
    const entryInput = document.getElementById("entryDate");
    const verifyInput = document.getElementById("verifyExpiry");
    const iscirInput = document.getElementById("iscirExpiry");

    function toDateInput(val){ const d = val? new Date(val): new Date(); const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,"0"); const da=String(d.getDate()).padStart(2,"0"); return `${y}-${m}-${da}`; }
    function addMonths(date, n){ const d=new Date(date); d.setMonth(d.getMonth()+n); return d; }
    function genIdFor(type){ const p = type==="stivuitor"?"S":(type==="lifter"?"L":"E"); return `${p}-${String(Math.floor(1+Math.random()*999)).padStart(3,"0")}`; }

    function openModal(asset=null){
      if (asset){
        idInput.value = asset.id || "";
        typeInput.value = (asset.type||"").toLowerCase();
        entryInput.value = asset.entryDate ? toDateInput(asset.entryDate) : toDateInput(new Date());
        verifyInput.value = asset.verifyExpiry ? toDateInput(asset.verifyExpiry) : toDateInput(addMonths(new Date(),12));
        iscirInput.value = asset.iscirExpiry ? toDateInput(asset.iscirExpiry) : toDateInput(addMonths(new Date(),12));
      } else {
        idInput.value = "";
        typeInput.value = "stivuitor";
        const t = new Date();
        entryInput.value = toDateInput(t);
        verifyInput.value = toDateInput(addMonths(t,12));
        iscirInput.value = toDateInput(addMonths(t,12));
      }
      modal.setAttribute("aria-hidden", "false");
    }
    function closeModal(){ modal.setAttribute("aria-hidden", "true"); }

    document.querySelectorAll('[data-close]').forEach(el=> el.addEventListener('click', closeModal));
    document.addEventListener('keydown', (e)=> { if (e.key === "Escape") closeModal(); });

    // Strong adapter
    function mapType(t){ t=(t||"").toLowerCase(); if (t.startsWith("stiv")) return "forklift"; if (t.startsWith("lift")) return "lifter"; if (t.startsWith("ext")) return "extinguisher"; return t||"forklift"; }
    function gather(){
      const type = typeInput.value;
      const payload = {
        id: idInput.value || genIdFor(type),
        type,
        entryDate: entryInput.value,
        verifyExpiry: verifyInput.value,
        iscirExpiry: iscirInput.value
      };
      return payload;
    }
    function ensureOverlay(){
      let c = document.getElementById('asset-overlay');
      if (!c){ c = document.createElement('canvas'); c.id='asset-overlay'; c.style.position='fixed'; c.style.inset='0'; c.style.pointerEvents='none'; document.body.appendChild(c); window.addEventListener('resize', ()=>{ c.width=innerWidth; c.height=innerHeight; draw(); }); c.width=innerWidth; c.height=innerHeight; }
      return c;
    }
    const fallbackStore = [];
    function iconFor(t){ t=String(t||"").toLowerCase(); if (t.includes("fork")||t.includes("stiv")) return "🟧"; if (t.includes("lift")) return "🟡"; if (t.includes("ext")) return "🧯"; return "⚪"; }
    function draw(){
      const app = window.app, ui = window.ui;
      try { if (ui?.renderAssets) return ui.renderAssets(); } catch(_){}
      try { if (ui?.render) return ui.render(); } catch(_){}
      try { if (app?.render) return app.render(); } catch(_){}
      const c = ensureOverlay(); const ctx = c.getContext('2d'); ctx.clearRect(0,0,c.width,c.height);
      ctx.font="16px system-ui,sans-serif"; ctx.textAlign="center"; ctx.textBaseline="middle";
      fallbackStore.forEach((a,i)=>{ const cols=6,g=110; const col=i%cols,row=(i/cols)|0; const x=90+col*g,y=150+row*g;
        ctx.beginPath(); ctx.arc(x,y,10,0,Math.PI*2); ctx.fillStyle="#2f81f7"; ctx.fill();
        ctx.fillStyle="#000"; ctx.fillText(iconFor(a.type), x, y-18); ctx.fillText(a.id, x, y+18);
      });
    }
    function addAssetNative(p){
      const app = window.app, ui = window.ui;
      if (app?.addAsset) return app.addAsset(p);
      if (ui?.addAsset)  return ui.addAsset(p);
      // Try common stores
      const candidates = [app?.assets, ui?.assets, window.assets, app?.state?.assets, ui?.state?.assets].filter(Boolean);
      if (candidates.length){
        const s = candidates[0];
        if (Array.isArray(s)){ const i = s.findIndex(x=>x.id===p.id); if (i>=0) s[i]=p; else s.push(p); }
        else if (typeof s === "object"){ s[p.id]=p; }
        draw();
        return true;
      }
      // fallback visual only
      const i = fallbackStore.findIndex(x => x.id === p.id);
      if (i>=0) fallbackStore[i]=p; else fallbackStore.push(p);
      draw();
      return true;
    }
    function updateAssetNative(p){
      const app = window.app, ui = window.ui;
      if (app?.updateAsset) return app.updateAsset(p);
      if (ui?.updateAsset)  return ui.updateAsset(p);
      return addAssetNative(p);
    }
    function removeAssetNative(o){
      const app = window.app, ui = window.ui;
      if (app?.removeAsset) return app.removeAsset(o);
      if (ui?.removeAsset)  return ui.removeAsset(o);
      const id = o?.id; if (!id) return;
      // remove from common stores
      const candidates = [window.app?.assets, window.ui?.assets, window.assets, window.app?.state?.assets, window.ui?.state?.assets].filter(Boolean);
      if (candidates.length){
        const s = candidates[0];
        if (Array.isArray(s)){ const idx = s.findIndex(x=>x.id===id); if (idx>=0) s.splice(idx,1); }
        else if (typeof s === "object"){ if (id in s) delete s[id]; }
      }
      // remove from fallback
      const idx = fallbackStore.findIndex(x=>x.id===id); if (idx>=0) fallbackStore.splice(idx,1);
      draw();
    }

    // Wire buttons
    document.getElementById("btn-save").addEventListener("click", (e)=>{ e.preventDefault(); const p = gather(); addAssetNative(p); closeModal(); });
    document.getElementById("btn-edit").addEventListener("click", (e)=>{ e.preventDefault(); const p = gather(); updateAssetNative(p); closeModal(); });
    document.getElementById("btn-delete").addEventListener("click", (e)=>{ e.preventDefault(); const id = idInput.value.trim(); if (id) removeAssetNative({id}); closeModal(); });

    // Public open
    window.openAssetEditor = (asset) => { openModal(asset||null); };
    return { openModal };
  }

  function main(){
    ensureModal();
    const addBtn = ensureAddButton();
    const api = setupModal();
    addBtn.addEventListener("click", () => api.openModal());
  }

  if (document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", main);
  } else {
    main();
  }
})();