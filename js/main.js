// js/main.js
import { mountPartials } from "./components.js";
import { initState } from "./state.js";
import { renderList, renderDetails, initUI } from "./ui.js";
import { startSim } from "./sim.js";
import { initMap } from "./map.js";


// Inline data fallbacks for offline/file:// usage
const __INLINE_MACHINES__ = JSON.parse(String.raw`{
  "forklifts": [
    {
      "id": "F-001",
      "checked": "9z în urmă",
      "approved": "25z în urmă"
    },
    {
      "id": "F-002",
      "checked": "12z în urmă",
      "approved": "2z în urmă"
    },
    {
      "id": "F-003",
      "checked": "20z în urmă",
      "approved": "1z în urmă"
    },
    {
      "id": "F-004",
      "checked": "5z în urmă",
      "approved": "8z în urmă"
    },
    {
      "id": "F-005",
      "checked": "30z în urmă",
      "approved": "30z în urmă"
    }
  ],
  "lifters": [
    {
      "id": "L-001",
      "checked": "10z în urmă",
      "approved": "40z în urmă"
    },
    {
      "id": "L-002",
      "checked": "14z în urmă",
      "approved": "40z în urmă"
    },
    {
      "id": "L-003",
      "checked": "3z în urmă",
      "approved": "12z în urmă"
    },
    {
      "id": "L-004",
      "checked": "15z în urmă",
      "approved": "18z în urmă"
    },
    {
      "id": "L-005",
      "checked": "18z în urmă",
      "approved": "20z în urmă"
    }
  ]
}`);
const __INLINE_EXTS__ = JSON.parse(String.raw`[
  {
    "id": "E-01",
    "x": 120,
    "y": 340,
    "expires": "2026-02-01",
    "expired": false
  },
  {
    "id": "E-02",
    "x": 220,
    "y": 120,
    "expires": "2024-07-01",
    "expired": true
  },
  {
    "id": "E-03",
    "x": 420,
    "y": 260,
    "expires": "2025-12-20",
    "expired": false
  }
]`);

async function boot(){
  await mountPartials();
  const state = initState();

  // Load data
  let machines, exts;
  try {
    const resM = await fetch("data/machines.json");
    const resE = await fetch("data/extinguishers.json");
    if (!resM.ok || !resE.ok) throw new Error("fetch failed");
    machines = await resM.json();
    exts = await resE.json();
  } catch(e){
    machines = __INLINE_MACHINES__;
    exts = __INLINE_EXTS__;
  }
  const canvas = document.getElementById("map-canvas");
  const { draw, canvas: cnv } = await initMap(state);
  state.draw = draw; state.canvas = cnv;

  // Seed assets positions randomly
  const w = state.canvas.width, h = state.canvas.height;
  const now = performance.now();
  state.assets = [
    ...machines.forklifts.map((m,i)=> ({
      ...m, type:"forklift",
      x: Math.random()*w, y: Math.random()*h, vx:0, vy:0, status:"moving", lastMove:now
    })),
    ...machines.lifters.map((m,i)=> ({
      ...m, type:"lifter",
      x: Math.random()*w, y: Math.random()*h, vx:0, vy:0, status:"moving", lastMove:now
    }))
  ];
  state.extinguishers = exts;

  initUI(state);
  renderList(state);
  renderDetails(state);
  startSim(state);
}
boot();


// --- UI handlers (added) ---
// --- Movement driver fallback (added) ---
(function(){
  if (window.__movementDriverAdded) return;
  window.__movementDriverAdded = true;
  const SPEED = 0.6; // px per frame
  function step(){
    const devices = window.__devices || [];
    for (let d of devices){
      const canvas = document.getElementById('map-canvas');
      if (!canvas) continue;
      if (!d._target) d._target = { x: Math.random()*canvas.width, y: Math.random()*canvas.height };
      const dx = d._target.x - d.x, dy = d._target.y - d.y;
      const dist = Math.hypot(dx,dy);
      if (dist < 1){
        if (!d._pause) d._pause = performance.now();
        if (performance.now() - d._pause > 1000){
          d._target = { x: Math.random()*canvas.width, y: Math.random()*canvas.height };
          d._pause = 0;
        }
      } else {
        d.x += (dx/dist)*SPEED;
        d.y += (dy/dist)*SPEED;
      }
    }
    if (typeof window.drawMap === 'function') window.drawMap();
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
})();
