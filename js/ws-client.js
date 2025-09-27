// js/ws-client.js
// Stable WS helpers + RTLSClient used by app.js (Stage 1 friendly)

export function makeWSUrl(){
  try{
    const isPages = location.hostname.endsWith('github.io');
    const u = new URL(location.href);
    const qp = u.searchParams.get('ws');
    if (qp) return qp;
    if (isPages) return null;                 // No WS on GitHub Pages by default
    return 'ws://localhost:8081/positions';   // Local dev default
  }catch(e){ return null; }
}

// Minimal connect() that won't crash if WS is unavailable.
// onMessage receives already-parsed JSON messages.
export function connect({ onMessage, onOpen, onClose } = {}){
  const url = makeWSUrl();
  let ws = null, closed = false;

  function softClose(reason){
    try{ ws && ws.close(); }catch(_){}
    onClose && onClose(reason || 'closed');
  }

  if(!url){
    // No WS in this environment: simulate "no-WS" close to let app fall back.
    setTimeout(()=> softClose('no-ws-url'), 0);
    return { close: ()=>{ closed=true; } };
  }

  try{
    ws = new WebSocket(url);
    ws.addEventListener('open', ()=> onOpen && onOpen());
    ws.addEventListener('message', (ev)=>{
      try{ const msg = JSON.parse(ev.data); onMessage && onMessage(msg); }
      catch(e){ console.warn('[ws] bad message', e); }
    });
    ws.addEventListener('close', ()=>!closed && softClose('closed'));
    ws.addEventListener('error', ()=>!closed && softClose('error'));
  }catch(e){
    console.warn('[ws] failed to open', e);
    setTimeout(()=> softClose('exception'), 0);
  }

  return { close: ()=>{ closed=true; softClose('closed-by-app'); } };
}

// ---- RTLSClient (used by app.js) -----------------------------------------
// Stage‑1: delegate movement/add/remove to the in-page engine (AssetsAdd).
// Your app calls: const rtls = new RTLSClient(state); rtls.start();

export class RTLSClient{
  constructor(state){
    this.state = state || {};
  }
  start(){ if (window.AssetsAdd?.start) window.AssetsAdd.start(); }
  stop(){ if (window.AssetsAdd?.stop) window.AssetsAdd.stop(); }

  addForklift(...a){ return window.AssetsAdd?.addForklift?.(...a); }
  addLifter(...a){ return window.AssetsAdd?.addLifter?.(...a); }
  addExtinguisher(...a){ return window.AssetsAdd?.addExtinguisher?.(...a); }
  setScale(...a){ return window.AssetsAdd?.setScale?.(...a); }
  getState(){ return window.AssetsAdd?.getState?.(); }
}

export default RTLSClient;
