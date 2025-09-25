
// --- Device seeder fallback ---
if (!window.__devices){
  window.__devices = [];
  const canvas = document.getElementById('map-canvas') || { width: 800, height: 500 };
  for (let i=0;i<5;i++){window.__devices.push({id:'F-'+String(i+1).padStart(3,'0'),type:'forklift',x:Math.random()*canvas.width,y:Math.random()*canvas.height})}
  for (let i=0;i<5;i++){window.__devices.push({id:'L-'+String(i+1).padStart(3,'0'),type:'lifter',x:Math.random()*canvas.width,y:Math.random()*canvas.height})}
}
// js/sim.js
import { rand } from "./utils.js";
const SPEED_MPS = 1.39; // ~5 km/h
export function startSim(state){
  const SPEED_MPS = 1.39; // ~5 km/h
  function step(now){
    const dt = Math.min(0.05, (now - state.lastTick)/1000);
    state.lastTick = now;
    if (!state.paused){
      const maxPxPerSec = SPEED_MPS * state.pxPerMeter;
      for (const a of state.assets){
        // set target if missing
        if (!a._target || Math.hypot(a._target.x - a.x, a._target.y - a.y) < 5){
          const w = state.canvas.width, h = state.canvas.height;
          a._target = { x: Math.random()*w*0.9 + w*0.05, y: Math.random()*h*0.9 + h*0.05 };
        }
        // compute velocity towards target
        const dx = a._target.x - a.x, dy = a._target.y - a.y;
        const dist = Math.hypot(dx,dy) || 1;
        a.vx = (dx/dist) * maxPxPerSec;
        a.vy = (dy/dist) * maxPxPerSec;

        // Update status
        const moving = Math.hypot(a.vx, a.vy) > 0.01;
        if (moving){ a.lastMove = now; }
        a.status = (now - a.lastMove) > (5*60*1000) ? "idle" : "moving";

        // integrate
        a.x += a.vx * dt;
        a.y += a.vy * dt;
      }
    }
    state.draw();
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
