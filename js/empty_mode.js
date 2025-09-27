
(function(){
  function hasEmptyFlag(){
    const p = new URLSearchParams(location.search);
    return p.get("empty") === "1" || p.get("seed") === "0";
  }
  if (!hasEmptyFlag()) return;
  function clearAll(){
    const candidates = [
      () => window.app && window.app.assets,
      () => window.ui && window.ui.assets,
      () => window.assets,
      () => window.app && window.app.state && window.app.state.assets,
      () => window.ui && window.ui.state && window.ui.state.assets
    ];
    let cleared = false;
    for (const f of candidates){
      try{
        const store = f();
        if (!store) continue;
        if (Array.isArray(store)){ store.splice(0, store.length); cleared = true; }
        else if (typeof store === "object"){ for (const k of Object.keys(store)) delete store[k]; cleared = true; }
      }catch(e){}
    }
    // Remove any DOM overlays that may have been injected by legacy scripts
    document.querySelectorAll('.asset.machine, .asset.extinguisher').forEach(el => el.remove());
    // Trigger a render
    window.dispatchEvent(new CustomEvent("assets:changed"));
    try { if (window.ui?.renderAssets) window.ui.renderAssets(); } catch(e){}
    try { if (window.ui?.render) window.ui.render(); } catch(e){}
    try { if (window.app?.render) window.app.render(); } catch(e){}
    if (cleared) console.log("[empty-mode] seeded assets cleared");
  }
  // Try once at DOMContentLoaded and again at load (in case seed arrives late)
  document.addEventListener("DOMContentLoaded", () => setTimeout(clearAll, 50));
  window.addEventListener("load", () => setTimeout(clearAll, 100));
})();
