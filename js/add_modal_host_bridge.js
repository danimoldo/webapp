
// add_modal_host_bridge.js
(function(){
  function norm(t){ return (t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,""); }
  function findButtonByText(txt){
    const target = norm(txt);
    return Array.from(document.querySelectorAll('button')).find(b => norm(b.textContent).trim() === target);
  }
  const btns = {
    forklift: ["Adaugă stivuitor","Adauga stivuitor"].map(findButtonByText).find(Boolean),
    lifter:   ["Adaugă lifter","Adauga lifter","Adauga liftiera","Adaugă liftieră"].map(findButtonByText).find(Boolean),
    extinguisher: ["Adaugă extinctor","Adauga extinctor"].map(findButtonByText).find(Boolean)
  };
  Object.values(btns).forEach(b => { if (b){ b.style.display = "none"; b.classList.add("hidden"); } });

  function getStoreCandidates(){
    const app = window.app, ui = window.ui;
    return [app?.assets, ui?.assets, window.assets, app?.state?.assets, ui?.state?.assets].filter(Boolean);
  }
  function snapshotIds(){
    const set = new Set();
    getStoreCandidates().forEach(s => {
      if (Array.isArray(s)) s.forEach(a => a?.id && set.add(a.id));
      else if (s && typeof s === "object") Object.keys(s).forEach(k => set.add(k));
    });
    return set;
  }
  function detectNewAsset(prev){
    for (const s of getStoreCandidates()){
      if (Array.isArray(s)){
        for (const a of s){ if (a?.id && !prev.has(a.id)) return a; }
      } else if (s && typeof s === "object"){
        for (const [id,a] of Object.entries(s)){ if (!prev.has(id)) return a; }
      }
    }
    return null;
  }
  function updateAssetMeta(a, p){
    if (!a) return;
    a.entryDate = p.entryDate || a.entryDate;
    a.verifyExpiry = p.verifyExpiry || a.verifyExpiry;
    a.iscirExpiry = p.iscirExpiry || a.iscirExpiry;
    try { if (window.ui?.renderAssets) window.ui.renderAssets(); } catch(_){}
    try { if (window.ui?.render) window.ui.render(); } catch(_){}
    try { if (window.app?.render) window.app.render(); } catch(_){}
  }

  window.hostCreateAsset = function(payload){
    const type = String(payload.type||"").toLowerCase();
    const btn = type.startsWith("stiv") ? btns.forklift : type.startsWith("lift") ? btns.lifter : btns.extinguisher;
    if (!btn){
      // Fallback to strong adapter
      return (window.app?.addAsset || window.assetAdapter?.addToStore || function(){ })(payload);
    }
    const prev = snapshotIds();
    btn.click();
    setTimeout(() => {
      const added = detectNewAsset(prev);
      if (added){
        updateAssetMeta(added, payload);
      } else {
        try { (window.app?.addAsset || window.assetAdapter?.addToStore || function(){})(payload); } catch(_){}
      }
    }, 80);
  };

  function patchModal(){
    const save = document.getElementById("btn-save");
    const edit = document.getElementById("btn-edit");
    const del  = document.getElementById("btn-delete");
    if (!save || save.__patched) return;
    save.__patched = true;

    function val(id){ const el = document.getElementById(id); return el ? el.value : ""; }
    function gather(){ return { id: val("assetId"), type: val("assetType"), entryDate: val("entryDate"), verifyExpiry: val("verifyExpiry"), iscirExpiry: val("iscirExpiry") }; }
    function close(){ const m = document.getElementById("asset-modal"); if (m) m.setAttribute("aria-hidden","true"); }

    save.addEventListener("click", (e)=>{ e.preventDefault(); const p = gather(); if (window.hostCreateAsset) window.hostCreateAsset(p); else if (window.app?.addAsset) app.addAsset(p); else if (window.ui?.addAsset) ui.addAsset(p); else if (window.assetAdapter?.addToStore) window.assetAdapter.addToStore(p); close(); });
    edit.addEventListener("click", (e)=>{ e.preventDefault(); const p = gather(); if (window.app?.updateAsset) app.updateAsset(p); else if (window.ui?.updateAsset) ui.updateAsset(p); else if (window.assetAdapter?.addToStore) window.assetAdapter.addToStore(p); close(); });
    del.addEventListener("click", (e)=>{ e.preventDefault(); const id = val("assetId"); if (!id) return close(); if (window.app?.removeAsset) app.removeAsset({id}); else if (window.ui?.removeAsset) ui.removeAsset({id}); else if (window.assetAdapter?.removeFromStore) window.assetAdapter.removeFromStore(id); close(); });
  }

  if (document.readyState === "loading"){ document.addEventListener("DOMContentLoaded", patchModal); } else { patchModal(); }
})();
