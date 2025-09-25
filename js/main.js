// js/main.js
import { mountPartials } from "./components.js";
import { initState } from "./state.js";
import { renderList, renderDetails, initUI } from "./ui.js";
import { startSim } from "./sim.js";
import { initMap } from "./map.js";

async function boot(){
  await mountPartials();
  const state = initState();

  // Load data
  const [machines, exts] = await Promise.all([
    fetch("data/machines.json").then(r=>r.json()),
    fetch("data/extinguishers.json").then(r=>r.json())
  ]);
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


// --- Movement driver fallback (added by assistant) ---
(function(){
  if (window.__movementDriverAdded) return;
  window.__movementDriverAdded = true;
  const SPEED = 0.5; // pixels per frame
  function step(){
    const devices = window.__devices || [];
    let moved = false;
    for (let d of devices){
      if (!d._target) {
        const canvas = document.getElementById('map-canvas');
        if (!canvas) continue;
        d._target = { x: Math.random()*canvas.width, y: Math.random()*canvas.height };
      }
      const dx = d._target.x - d.x;
      const dy = d._target.y - d.y;
      const dist = Math.sqrt(dx*dx+dy*dy);
      if (dist < 1){
        if (!d._pause) d._pause = Date.now();
        if (Date.now() - d._pause > 1000){
          const canvas = document.getElementById('map-canvas');
          d._target = { x: Math.random()*canvas.width, y: Math.random()*canvas.height };
          d._pause = 0;
        }
      } else {
        const nx = d.x + (dx/dist)*SPEED;
        const ny = d.y + (dy/dist)*SPEED;
        d.x = nx; d.y = ny;
        moved = true;
      }
    }
    if (typeof window.drawMap === 'function') window.drawMap();
    window.requestAnimationFrame(step);
  }
  window.requestAnimationFrame(step);
})();
