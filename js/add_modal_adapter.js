
(function(){
  const prefers = [
    () => (window.app && typeof window.app.addAsset === "function") ? "app" : null,
    () => (window.ui && typeof window.ui.addAsset === "function") ? "ui" : null,
    () => null
  ].map(f=>f()).find(Boolean);

  function getStores() {
    const app = window.app || null;
    const ui = window.ui || null;
    const stores = [
      app && app.assets,
      ui && ui.assets,
      window.assets,
      (app && app.state && app.state.assets),
      (ui && ui.state && ui.state.assets)
    ].filter(Boolean);
    return stores.length ? stores : [createFallbackStore()];
  }
  function createFallbackStore(){ if (!window.__assets) window.__assets = []; return window.__assets; }

  function mapType(t){
    t = (t||"").toLowerCase();
    if (t.startsWith("stiv")) return "forklift";
    if (t.startsWith("lift")) return "lifter";
    if (t.startsWith("ext")) return "extinguisher";
    return t || "forklift";
  }

  function normalize(a){
    const id = a.id || a.name || a.label || a.code || `S-${Math.floor(Math.random()*900+100)}`;
    const type = mapType(a.type);
    const nowISO = new Date().toISOString();
    return {
      id,
      label: a.label || id,
      type,
      status: a.status || "idle",
      entryDate: a.entryDate || a.meta?.entryDate || nowISO.slice(0,10),
      verifyExpiry: a.verifyExpiry || a.meta?.verifyExpiry || "",
      iscirExpiry: a.iscirExpiry || a.meta?.iscirExpiry || "",
      x: a.x ?? a.pos?.x ?? a.position?.x ?? null,
      y: a.y ?? a.pos?.y ?? a.position?.y ?? null,
      meta: Object.assign({}, a.meta || {})
    };
  }

  function tryRender(){
    try { if (window.ui && typeof ui.renderAssets === "function") return ui.renderAssets(); } catch(e){}
    try { if (window.ui && typeof ui.render === "function") return ui.render(); } catch(e){}
    try { if (window.app && typeof app.render === "function") return app.render(); } catch(e){}
    try { window.dispatchEvent(new CustomEvent("assets:changed")); } catch(e){}
  }

  function addToStore(asset){
    const stores = getStores();
    for (const s of stores){
      if (Array.isArray(s)){
        const idx = s.findIndex(x => x.id === asset.id);
        if (idx >= 0) s[idx] = asset; else s.push(asset);
      } else if (s && typeof s === "object"){
        s[asset.id] = asset;
      }
    }
    tryRender();
  }

  function removeFromStore(id){
    const stores = getStores();
    for (const s of stores){
      if (Array.isArray(s)){
        const idx = s.findIndex(x => x.id === id);
        if (idx >= 0) s.splice(idx,1);
      } else if (s && typeof s === "object"){
        if (id in s) delete s[id];
      }
    }
    tryRender();
  }

  function callPreferred(name, payload){
    if (prefers === "app"){ return window.app[name](payload); }
    if (prefers === "ui"){ return window.ui[name](payload); }
    throw new Error("no preferred target");
  }

  function safeCall(name, payload){
    try { return callPreferred(name, payload); }
    catch (e){
      if (name === "addAsset" || name === "updateAsset"){ addToStore(normalize(payload)); }
      else if (name === "removeAsset"){ removeFromStore(payload.id); }
    }
  }

  window.addEventListener("asset:create", e => { safeCall("addAsset", e.detail); });
  window.addEventListener("asset:update", e => { safeCall("updateAsset", e.detail); });
  window.addEventListener("asset:delete", e => { safeCall("removeAsset", e.detail); });

  window.assetAdapter = { addToStore, removeFromStore, refresh: tryRender };
})();
