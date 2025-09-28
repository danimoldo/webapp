
// add_modal_adapter_strong.js
(function(){
  // Basic overlay renderer to guarantee visual feedback if the host app doesn't render assets.
  function ensureOverlay(){
    let c = document.getElementById('asset-overlay');
    if (!c){
      c = document.createElement('canvas');
      c.id = 'asset-overlay';
      document.body.appendChild(c);
      const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; render(); };
      window.addEventListener('resize', resize);
      resize();
    }
    return c;
  }

  const store = { items: [] }; // minimal fallback store

  function iconFor(type){
    const t = String(type||"").toLowerCase();
    if (t.includes("fork") || t.includes("stiv")) return "🟧";   // forklift
    if (t.includes("lift")) return "🟡";                         // lifter
    if (t.includes("ext")) return "🧯";                         // extinguisher
    return "⚪";
  }

  function placeIfMissing(a, i){
    if (a.x == null || a.y == null){
      // spread items in a grid
      const cols = 6, gap = 100;
      const col = i % cols, row = Math.floor(i / cols);
      a.x = 80 + col*gap;
      a.y = 120 + row*gap;
    }
  }

  function render(){
    const app = window.app, ui = window.ui;
    // If host has a renderer, try that first
    try { if (ui && typeof ui.renderAssets === "function") return ui.renderAssets(); } catch(e){}
    try { if (ui && typeof ui.render === "function") return ui.render(); } catch(e){}
    try { if (app && typeof app.render === "function") return app.render(); } catch(e){}

    // Fallback: draw overlay
    const c = ensureOverlay();
    const ctx = c.getContext('2d');
    ctx.clearRect(0,0,c.width,c.height);
    ctx.font = "20px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    store.items.forEach((a,i)=>{
      placeIfMissing(a, i);
      const x = a.x, y = a.y;
      // dot
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI*2);
      ctx.fillStyle = "#2f81f7";
      ctx.fill();
      ctx.closePath();
      // icon
      ctx.fillStyle = "#000";
      ctx.fillText(iconFor(a.type), x, y - 18);
      // label
      ctx.fillText(a.id || a.label || "?", x, y + 18);
    });
  }

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

  function getNativeStore(){
    const app = window.app, ui = window.ui;
    return (
      (app && app.assets) ||
      (ui && ui.assets) ||
      (app && app.state && app.state.assets) ||
      (ui && ui.state && ui.state.assets) ||
      window.assets ||
      null
    );
  }

  function addAsset(payload){
    const app = window.app, ui = window.ui;
    // Try native methods
    if (app?.addAsset) return app.addAsset(payload);
    if (ui?.addAsset)  return ui.addAsset(payload);
    // Fallback: mutate detected store or local store
    const a = normalize(payload);
    const s = getNativeStore();
    if (Array.isArray(s)){
      const i = s.findIndex(x => x.id === a.id);
      if (i>=0) s[i] = a; else s.push(a);
    } else if (s && typeof s === "object"){
      s[a.id] = a;
    } else {
      const i = store.items.findIndex(x => x.id === a.id);
      if (i>=0) store.items[i] = a; else store.items.push(a);
    }
    render();
  }

  function updateAsset(payload){
    const app = window.app, ui = window.ui;
    if (app?.updateAsset) return app.updateAsset(payload);
    if (ui?.updateAsset)  return ui.updateAsset(payload);
    const a = normalize(payload);
    const s = getNativeStore() || store.items;
    if (Array.isArray(s)){
      const i = s.findIndex(x => x.id === a.id);
      if (i>=0) s[i] = a; else s.push(a);
    } else if (s && typeof s === "object"){
      s[a.id] = a;
    }
    render();
  }

  function removeAsset(payload){
    const app = window.app, ui = window.ui;
    if (app?.removeAsset) return app.removeAsset(payload);
    if (ui?.removeAsset)  return ui.removeAsset(payload);
    const id = payload && payload.id;
    const s = getNativeStore() || store.items;
    if (Array.isArray(s)){
      const i = s.findIndex(x => x.id === id);
      if (i>=0) s.splice(i,1);
    } else if (s && typeof s === "object"){
      if (id in s) delete s[id];
    }
    render();
  }

  // Listen to modal events
  window.addEventListener("asset:create", e => addAsset(e.detail));
  window.addEventListener("asset:update", e => updateAsset(e.detail));
  window.addEventListener("asset:delete", e => removeAsset(e.detail));

  // Expose shims so add_modal.js can "find" app.* even if not present
  window.app = window.app || {};
  if (!window.app.addAsset)   window.app.addAsset = addAsset;
  if (!window.app.updateAsset)window.app.updateAsset = updateAsset;
  if (!window.app.removeAsset)window.app.removeAsset = removeAsset;

  // Kick one render in case there is pre-seeded data
  setTimeout(render, 50);
})();


// HOTFIX v3b: Ajutor modal
(function(){
  function qs(s){return document.querySelector(s);}
  var btn = qs('#helpBtn');
  var modal = qs('#helpModal');
  if(btn && modal){
    btn.addEventListener('click', function(){ modal.style.display='flex'; });
    modal.addEventListener('click', function(e){ if(e.target===modal){ modal.style.display='none'; } });
    var closeBtn = qs('#helpCloseBtn');
    if(closeBtn){ closeBtn.addEventListener('click', function(){ modal.style.display='none'; });}
  }
})();


// HOTFIX v3b: Live search/filter
(function(){
  var input = document.querySelector('#search, #filter, input[data-role="search"], input[name="search"]');
  if(!input) return;
  function norm(s){ return (s||'').toString().toLowerCase(); }
  function run(){
    var q = norm(input.value.trim());
    var rows = Array.from(document.querySelectorAll('table tbody tr'));
    var items = Array.from(document.querySelectorAll('[data-search-item], .search-item'));
    var targets = rows.length ? rows : items;
    if(!targets.length) targets = Array.from(document.querySelectorAll('#list > * , .list > *'));
    targets.forEach(function(el){
      var text = norm(el.innerText || el.textContent);
      el.style.display = text.indexOf(q) !== -1 ? '' : 'none';
    });
  }
  input.addEventListener('input', run);
  input.addEventListener('keyup', run);
})();
