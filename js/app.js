// app.js
import { clamp, now, dist } from './utils.js';
import { ZoneManager } from './zones.js';
import { Simulator } from './sim.js';
import { UI } from './ui.js';

const state = {
  site: { width_m: 250, height_m: 150, height_m_ceiling: 8 },
  m_per_px: 0.2, // default until calibrated
  mps: 1.389, // 5 km/h
  zones: new ZoneManager(),
  assets: [],
  events: [],
  heatmap: { enabled:false, cell: 5, grid: {} },
  pointInZone(pt, z){ return window.pointInPoly?window.pointInPoly(pt,z.polygon):true; },
  emitEvent(type, payload){
    const msg = (type==='ENTER_ZONE'||type==='EXIT_ZONE') ? `${payload.asset} ${type==='ENTER_ZONE'?'intră în':'iese din'} ${payload.zone}` :
      (type==='MEET' ? `${payload.a} apropie ${payload.b}` :
      (type==='LEAVE' ? `${payload.a} se depărtează de ${payload.b}` : JSON.stringify(payload)));
    this.events.push({ ts: Date.now(), type, msg });
    ui.renderEvents();
  },
  refreshKPIs(){
    document.getElementById('kpiAssets').textContent = this.assets.length;
    const late = this.assets.filter(a => new Date(a.next_check) < new Date()).length;
    document.getElementById('kpiLateInspections').textContent = late;
    const wo = this.assets.reduce((acc,a)=>acc+(a.wo||[]).filter(w=>w.status!=='Finalizată').length,0);
    document.getElementById('kpiWO').textContent = wo;
  }
};

// expose pointInPoly for app (from utils via ESM not directly available on window)
import('./utils.js').then(u => window.pointInPoly = u.pointInPoly);

const canvasFloor = document.getElementById('floor');
const canvasOverlay = document.getElementById('overlay');
const ctxFloor = canvasFloor.getContext('2d');
const ctxOverlay = canvasOverlay.getContext('2d');

let floorImg = new Image();
floorImg.onload = () => drawAll();
floorImg.src = 'img/floor_example.png';

// Load sample config
fetch('data/sample_config.json').then(r=>r.json()).then(cfg=>{
  state.site = cfg.site;
  state.assets = cfg.assets;
  state.zones.load(cfg.zones);
  state.m_per_px = Math.max(state.site.width_m / canvasFloor.width, state.site.height_m / canvasFloor.height);
  state.refreshKPIs();
});

// Simulator + UI
const sim = new Simulator(state);
const ui = new UI(state);

// Controls
document.getElementById('btnPlay').onclick = () => sim.setRunning(true);
document.getElementById('btnPause').onclick = () => sim.setRunning(false);
document.getElementById('btnReset').onclick = () => resetPositions();
document.getElementById('btnDrawZone').onclick = () => startZoneDrawing();
document.getElementById('btnClearZones').onclick = () => { state.zones.clear(); drawAll(); };
document.getElementById('btnHeatmap').onclick = () => { state.heatmap.enabled = !state.heatmap.enabled; };
document.getElementById('btnCalibrate').onclick = () => {
  const w = parseFloat(document.getElementById('siteW').value||'250');
  const h = parseFloat(document.getElementById('siteH').value||'150');
  state.site.width_m = w; state.site.height_m = h;
  state.m_per_px = Math.max(w / canvasFloor.width, h / canvasFloor.height);
};
document.getElementById('btnExport').onclick = () => exportConfig();
document.getElementById('btnImport').onclick = () => document.getElementById('fileImport').click();
document.getElementById('fileImport').onchange = (e) => importConfig(e.target.files[0]);
document.getElementById('fileFloor').onchange = (e) => loadFloor(e.target.files[0]);
document.getElementById('btnScenarios').onclick = () => runScenario();

// Playback slider is UI-only in this lightweight demo
document.getElementById('playback').oninput = (e)=>{};

// Canvas interactions for zone drawing + asset selection
let drawing = false;
canvasOverlay.addEventListener('mousedown', (ev)=>{
  const p = toMeters(ev);
  if (drawing) { state.zones.addPoint(p); drawAll(); }
});
canvasOverlay.addEventListener('dblclick', (ev)=>{
  if (drawing) {
    drawing = false;
    state.zones.finish('Zonă interzisă','no_go');
    drawAll();
  }
});
canvasOverlay.addEventListener('click', (ev)=>{
  if (drawing) return;
  // pick asset
  const m = toMeters(ev);
  const hit = state.assets.find(a => dist(a.pos, m) < 3);
  ui.renderDrawer(hit||null);
});

function startZoneDrawing(){ drawing = true; state.zones.startDrawing(); }

function resetPositions() {
  for (const a of state.assets) {
    a.pos = [Math.random()*state.site.width_m, Math.random()*state.site.height_m];
  }
}

function loadFloor(file){
  const url = URL.createObjectURL(file);
  floorImg = new Image();
  floorImg.onload = () => drawAll();
  floorImg.src = url;
}

function exportConfig(){
  const cfg = {
    site: state.site,
    zones: state.zones.zones,
    assets: state.assets
  };
  const blob = new Blob([JSON.stringify(cfg,null,2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'config.json';
  a.click();
}

function importConfig(file){
  const r = new FileReader();
  r.onload = () => {
    const cfg = JSON.parse(r.result);
    state.site = cfg.site || state.site;
    state.zones.load(cfg.zones||[]);
    state.assets = cfg.assets || state.assets;
    state.m_per_px = Math.max(state.site.width_m / canvasFloor.width, state.site.height_m / canvasFloor.height);
  };
  r.readAsText(file);
}

function toMeters(ev){
  const rect = canvasOverlay.getBoundingClientRect();
  const x = (ev.clientX - rect.left) * state.m_per_px;
  const y = (ev.clientY - rect.top) * state.m_per_px;
  return [x,y];
}

function drawAll(){
  // floor
  ctxFloor.clearRect(0,0,canvasFloor.width, canvasFloor.height);
  ctxFloor.drawImage(floorImg, 0,0, canvasFloor.width, canvasFloor.height);

  // overlay
  ctxOverlay.clearRect(0,0,canvasOverlay.width, canvasOverlay.height);

  // zones
  state.zones.draw(ctxOverlay, 1/state.m_per_px);

  // heatmap (optional lightweight)
  if (state.heatmap.enabled) drawHeatmap();

  // assets
  for (const a of state.assets) {
    const x = a.pos[0] / state.m_per_px;
    const y = a.pos[1] / state.m_per_px;
    ctxOverlay.fillStyle = a.type==='forklift' ? '#8ef' : (a.type==='lifter' ? '#7f7' : '#faa');
    if (a.status==='gray') ctxOverlay.fillStyle = 'rgba(200,200,200,0.9)';
    ctxOverlay.beginPath();
    ctxOverlay.arc(x, y, 6, 0, Math.PI*2);
    ctxOverlay.fill();
    // id
    ctxOverlay.fillStyle = '#cde';
    ctxOverlay.fillText(a.id, x+8, y-8);
  }

  requestAnimationFrame(drawAll);
}

// Heatmap accumulates in grid keyed by 'gx,gy'
function addHeat(x,y,dt){
  const g = state.heatmap;
  const gx = Math.floor(x / g.cell), gy = Math.floor(y / g.cell);
  const key = gx+','+gy;
  g.grid[key] = (g.grid[key]||0) + dt;
}
function drawHeatmap(){
  const g = state.heatmap;
  const cellPx = g.cell / state.m_per_px;
  for (const [key, val] of Object.entries(g.grid)) {
    const [gx, gy] = key.split(',').map(Number);
    const x = gx*cellPx, y = gy*cellPx;
    const alpha = Math.min(0.4, val/120); // saturate around 2 min dwell
    ctxOverlay.fillStyle = `rgba(255,128,0,${alpha})`;
    ctxOverlay.fillRect(x,y,cellPx,cellPx);
  }
}

// Demo scenarios
function runScenario(){
  if (!state.assets.length) return;
  // 1) Interdicție încălcată
  const a = state.assets[0];
  a.vel = [1,0]; // push towards right; zone handler will bounce but will trigger ENTER/EXIT
  // 2) Apropiere periculoasă
  if (state.assets[1]) {
    const b = state.assets[1];
    b.vel = [-1,0];
    b.pos = [a.pos[0]+10, a.pos[1]];
  }
  // 3) Inspecție expirată -> auto WO
  const exp = state.assets.find(x=>x.type==='extinguisher');
  if (exp) {
    exp.next_check = '2025-01-01';
    state.emitEvent('ALERT', {asset:exp.id, note:'Stingător expirat'});
  }
}

// Main loop
let last = now();
function loop(){
  const t = now(); const dt = (t-last)/1000; last = t;
  sim.tick();
  for (const a of state.assets) if (state.heatmap.enabled) addHeat(a.pos[0], a.pos[1], dt);
  requestAnimationFrame(loop);
}
loop();

// Expose selection to UI
window.addEventListener('click', (ev)=>{
  // handled in canvas click
});
