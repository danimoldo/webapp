// app.js
import { clamp, now, dist } from './utils.js';
import { ZoneManager } from './zones.js';
import { Simulator } from './sim.js';
import { UI } from './ui.js';
import { RTLSClient } from './ws-client.js';

const state = {
  site: { width_m: 250, height_m: 150, height_m_ceiling: 8 },
  m_per_px: 0.2,
  mps: 1.389,
  zones: new ZoneManager(),
  assets: [],
  events: [],
  heatmap: { enabled:false, cell: 5, grid: {} },
  pointInZone(pt, z){ return window.pointInPoly?window.pointInPoly(pt,z.polygon):true; },
  emitEvent(type, payload){
    const msg=(type==='ENTER_ZONE'||type==='EXIT_ZONE') ? `${payload.asset} ${type==='ENTER_ZONE'?'intră în':'iese din'} ${payload.zone}` :
      (type==='MEET'?`${payload.a} apropie ${payload.b}` : (type==='LEAVE'?`${payload.a} se depărtează de ${payload.b}` : JSON.stringify(payload)));
    this.events.push({ ts: Date.now(), type, msg });
    ui.renderEvents();
  },
  refreshKPIs(){
    document.getElementById('kpiAssets').textContent = this.assets.length;
    const late=this.assets.filter(a => new Date(a.next_check) < new Date()).length;
    document.getElementById('kpiLateInspections').textContent = late;
    const wo=this.assets.reduce((acc,a)=>acc+(a.wo||[]).filter(w=>w.status!=='Finalizată').length,0);
    document.getElementById('kpiWO').textContent = wo;
  }
};
import('./utils.js').then(u=>window.pointInPoly=u.pointInPoly);

const canvasFloor=document.getElementById('floor');
const canvasOverlay=document.getElementById('overlay');
const ctxFloor=canvasFloor.getContext('2d');
const ctxOverlay=canvasOverlay.getContext('2d');

let floorImg=new Image();
floorImg.onload=()=>drawAll();
floorImg.src='img/floor_example.png';

fetch('data/sample_config.json').then(r=>r.json()).then(cfg=>{
  state.site=cfg.site; state.assets=cfg.assets; state.zones.load(cfg.zones);
  state.m_per_px=Math.max(state.site.width_m/canvasFloor.width, state.site.height_m/canvasFloor.height);
  state.refreshKPIs();
});

const sim=new Simulator(state);
const ui=new UI(state);

// Helpers for toggles + mouse
function setToggle(btn, on){ if(!btn) return; btn.classList.toggle('is-active', !!on); btn.setAttribute('aria-pressed', on ? 'true' : 'false'); }
function getMouse(ev, canvas){ const rect=canvas.getBoundingClientRect(); return [ev.clientX-rect.left, ev.clientY-rect.top]; }

// Controls
document.getElementById('btnPlay').onclick=()=>{ sim.setRunning(true); setToggle(document.getElementById('btnPlay'), true); setToggle(document.getElementById('btnPause'), false); };
document.getElementById('btnPause').onclick=()=>{ sim.setRunning(false); setToggle(document.getElementById('btnPause'), true); setToggle(document.getElementById('btnPlay'), false); };
document.getElementById('btnReset').onclick=()=>resetPositions();
document.getElementById('btnDrawZone').onclick=()=>{ startZoneDrawing(); setToggle(document.getElementById('btnDrawZone'), true); };
document.getElementById('btnClearZones').onclick=()=>{ state.zones.clear(); setToggle(document.getElementById('btnDrawZone'), false); drawAll(); };
document.getElementById('btnHeatmap').onclick=(e)=>{ state.heatmap.enabled=!state.heatmap.enabled; setToggle(e.currentTarget, state.heatmap.enabled); };
document.getElementById('btnCalibrate').onclick=()=>{ const w=parseFloat(document.getElementById('siteW').value||'250'); const h=parseFloat(document.getElementById('siteH').value||'150'); state.site.width_m=w; state.site.height_m=h; state.m_per_px=Math.max(w/canvasFloor.width,h/canvasFloor.height); };
document.getElementById('btnExport').onclick=()=>exportConfig();
document.getElementById('btnImport').onclick=()=>document.getElementById('fileImport').click();
document.getElementById('fileImport').onchange=(e)=>importConfig(e.target.files[0]);
document.getElementById('fileFloor').onchange=(e)=>loadFloor(e.target.files[0]);

// Scenario buttons
document.getElementById('scnNoGo').onclick=()=>{ const a=state.assets.find(x=>x.type==='lifter')||state.assets[0]; a.vel=[1,0]; state.emitEvent('SCENARIO',{note:'Interdicție încălcată'}); };
document.getElementById('scnMeet').onclick=()=>{ const f1=state.assets.find(x=>x.type==='forklift'); const f2=state.assets.filter(x=>x.type==='forklift')[1]||state.assets[1]; if(f1&&f2){ f1.pos=[50,50]; f1.vel=[1,0]; f2.pos=[60,50]; f2.vel=[-1,0]; state.emitEvent('SCENARIO',{note:'Apropiere periculoasă'}); } };
document.getElementById('scnExpired').onclick=()=>{ const e=state.assets.find(x=>x.type==='extinguisher'); if(e){ e.next_check='2025-01-01'; state.emitEvent('ALERT',{asset:e.id, note:'Stingător expirat'}); } };

// Canvas interactions
let drawing=false;
canvasOverlay.addEventListener('mousedown',(ev)=>{ const p=toMeters(ev); if(drawing){ state.zones.addPoint(p); drawAll(); }});
canvasOverlay.addEventListener('dblclick',(ev)=>{ if(drawing){ drawing=false; state.zones.finish('Zonă interzisă','no_go'); setToggle(document.getElementById('btnDrawZone'), false); drawAll(); }});
canvasOverlay.addEventListener('click',(ev)=>{ if(drawing) return; const [px,py]=getMouse(ev, canvasOverlay);
  const hit=state.assets.find(a=>{ const ax=a.pos[0]/state.m_per_px, ay=a.pos[1]/state.m_per_px; return Math.hypot(ax-px, ay-py)<=10; });
  ui.renderDrawer(hit||null);
});

function startZoneDrawing(){ drawing=true; state.zones.startDrawing(); }
function resetPositions(){ for(const a of state.assets){ a.pos=[Math.random()*state.site.width_m, Math.random()*state.site.height_m]; } }
function loadFloor(file){ const url=URL.createObjectURL(file); floorImg=new Image(); floorImg.onload=()=>drawAll(); floorImg.src=url; }

function exportConfig(){ const cfg={site:state.site, zones:state.zones.zones, assets:state.assets}; const blob=new Blob([JSON.stringify(cfg,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='config.json'; a.click(); }
function importConfig(file){ const r=new FileReader(); r.onload=()=>{ const cfg=JSON.parse(r.result); state.site=cfg.site||state.site; state.zones.load(cfg.zones||[]); state.assets=cfg.assets||state.assets; state.m_per_px=Math.max(state.site.width_m/canvasFloor.width, state.site.height_m/canvasFloor.height); }; r.readAsText(file); }
function toMeters(ev){ const rect=canvasOverlay.getBoundingClientRect(); const x=(ev.clientX-rect.left)*state.m_per_px; const y=(ev.clientY-rect.top)*state.m_per_px; return [x,y]; }

function drawAll(){
  ctxFloor.clearRect(0,0,canvasFloor.width, canvasFloor.height);
  ctxFloor.drawImage(floorImg, 0,0, canvasFloor.width, canvasFloor.height);
  ctxOverlay.clearRect(0,0,canvasOverlay.width, canvasOverlay.height);
  state.zones.draw(ctxOverlay, 1/state.m_per_px);
  if(state.heatmap.enabled) drawHeatmap();
  for(const a of state.assets){
    const x=a.pos[0]/state.m_per_px, y=a.pos[1]/state.m_per_px;
    ctxOverlay.fillStyle = a.type==='forklift' ? '#8ef' : (a.type==='lifter' ? '#7f7' : '#faa');
    if(a.status==='gray') ctxOverlay.fillStyle='rgba(200,200,200,0.9)';
    ctxOverlay.beginPath(); ctxOverlay.arc(x,y,6,0,Math.PI*2); ctxOverlay.fill();
    ctxOverlay.fillStyle='#cde'; ctxOverlay.fillText(a.id, x+8, y-8);
  }
  requestAnimationFrame(drawAll);
}

// Heatmap
function addHeat(x,y,dt){ const g=state.heatmap; const gx=Math.floor(x/g.cell), gy=Math.floor(y/g.cell); const key=gx+','+gy; g.grid[key]=(g.grid[key]||0)+dt; }
function drawHeatmap(){ const g=state.heatmap; const cellPx=g.cell/state.m_per_px; for(const [key,val] of Object.entries(g.grid)){ const [gx,gy]=key.split(',').map(Number); const x=gx*cellPx, y=gy*cellPx; const alpha=Math.min(0.4, val/120); ctxOverlay.fillStyle=`rgba(255,128,0,${alpha})`; ctxOverlay.fillRect(x,y,cellPx,cellPx); } }

// Minimap
const mini=document.getElementById('minimap'); const miniCtx=mini.getContext('2d');
function drawMinimap(){
  miniCtx.clearRect(0,0,mini.width, mini.height);
  miniCtx.fillStyle='#10142f'; miniCtx.fillRect(0,0,mini.width, mini.height);
  for(const z of state.zones.zones){
    miniCtx.beginPath();
    const sx=mini.width/state.site.width_m, sy=mini.height/state.site.height_m;
    const poly=z.polygon.map(([x,y])=>[x*sx,y*sy]);
    miniCtx.moveTo(poly[0][0], poly[0][1]); for(let i=1;i<poly.length;i++) miniCtx.lineTo(poly[i][0], poly[i][1]);
    miniCtx.closePath(); miniCtx.fillStyle='rgba(255,80,80,0.15)'; miniCtx.strokeStyle='rgba(255,80,80,0.8)'; miniCtx.fill(); miniCtx.stroke();
  }
  for(const a of state.assets){
    const sx=mini.width/state.site.width_m, sy=mini.height/state.site.height_m;
    const x=a.pos[0]*sx, y=a.pos[1]*sy;
    miniCtx.fillStyle = a.type==='forklift' ? '#8ef' : (a.type==='lifter' ? '#7f7' : '#faa');
    if(a.status==='gray') miniCtx.fillStyle='rgba(200,200,200,0.9)';
    miniCtx.beginPath(); miniCtx.arc(x,y,3,0,Math.PI*2); miniCtx.fill();
  }
  requestAnimationFrame(drawMinimap);
}
drawMinimap();

// Analytics
function recalcAnalytics(){
  const util=state.assets.map(a=>({id:a.id, pct: Math.round(a.status==='gray'?0:100)}));
  document.getElementById('chartUtil').innerHTML = util.map(u=>`<div class="bar" style="height:${u.pct}%"><div class="val">${u.pct}%</div></div>`).join('');
  const counts={}; const cutoff=Date.now()-30*60*1000;
  for(const ev of state.events){ if(ev.ts<cutoff) continue; const id=(ev.msg.match(/FORK-[0-9]+|LIFT-[0-9]+|EXT-[0-9]+/)||[])[0]||'N/A'; counts[id]=(counts[id]||0)+1; }
  const arr=Object.entries(counts).map(([id,n])=>({id,n})).sort((a,b)=>b.n-a.n);
  const max=Math.max(1,*( [1]+arr.map(x=>x.n) )); // ensure non-zero
}
document.getElementById('btnRecalc').onclick=()=>{
  // rebuild bars similar to initial render
  const util=state.assets.map(a=>({id:a.id, pct: Math.round(a.status==='gray'?0:100)}));
  document.getElementById('chartUtil').innerHTML = util.map(u=>`<div class="bar" style="height:${u.pct}%"><div class="val">${u.pct}%</div></div>`).join('');
  const counts={}; const cutoff=Date.now()-30*60*1000;
  for(const ev of state.events){ if(ev.ts<cutoff) continue; const id=(ev.msg.match(/FORK-[0-9]+|LIFT-[0-9]+|EXT-[0-9]+/)||[])[0]||'N/A'; counts[id]=(counts[id]||0)+1; }
  const arr=Object.entries(counts).map(([id,n])=>({id,n})).sort((a,b)=>b.n-a.n);
  const max=Math.max(1, ...arr.map(x=>x.n));
  document.getElementById('chartEvents').innerHTML = arr.map(x=>`<div class="bar" style="height:${Math.round(x.n/max*100)}%"><div class="val">${x.n}</div></div>`).join('');
};
document.getElementById('btnCSV').onclick=()=>{
  const cutoff=Date.now()-30*60*1000; const rows=[['timestamp','type','message']];
  for(const ev of state.events) if(ev.ts>=cutoff) rows.push([new Date(ev.ts).toISOString(), ev.type, ev.msg.replaceAll(',',';')]);
  const csv=rows.map(r=>r.join(',')).join('\n'); const blob=new Blob([csv],{type:'text/csv'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='raport_evenimente.csv'; a.click();
};

// Main loop
let last=now();
function loop(){ const t=now(); const dt=(t-last)/1000; last=t; sim.tick(); if(state.heatmap.enabled){ for(const a of state.assets) addHeat(a.pos[0], a.pos[1], dt); } requestAnimationFrame(loop); }
loop();

// Init toggles
setToggle(document.getElementById('btnPlay'), true);
setToggle(document.getElementById('btnPause'), false);
setToggle(document.getElementById('btnHeatmap'), state.heatmap.enabled);

// Backend WS
const rtls=new RTLSClient(state); rtls.start();
