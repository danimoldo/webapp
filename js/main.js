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


// --- UI handlers (added) ---
(function(){
  document.addEventListener('click', (e)=>{
    // Toggle left panel
    if (e.target && e.target.id === 'btn-toggle-left'){
      document.body.classList.toggle('left-collapsed');
    }
    // Add device
    if (e.target && e.target.id === 'btn-add-device'){
      const type = prompt('Tip dispozitiv (forklift/lifter):','forklift');
      if (!type || !/^(forklift|lifter)$/i.test(type)) return;
      const id = prompt('ID dispozitiv (ex: F-006 sau L-006):','');
      if (!id) return;
      const canvas = document.getElementById('map-canvas');
      const dev = { id, type: type.toLowerCase(), x: Math.random()*(canvas?canvas.width:500), y: Math.random()*(canvas?canvas.height:300) };
      window.__devices = window.__devices || [];
      window.__devices.push(dev);
      if (typeof window.drawMap === 'function') window.drawMap();
    }
  });
})();


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
