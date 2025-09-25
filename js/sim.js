
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
  function step(now){
    const dt = Math.min(0.05, (now - state.lastTick)/1000); // clamp large jumps
    state.lastTick = now;
    if (!state.paused){
      for (const a of state.assets){
        // Update idle/moving status
        const moving = Math.hypot(a.vx, a.vy) > 0.01;
        if (moving){ a.lastMove = now; }
        a.status = (now - a.lastMove) > (5*60*1000) ? "idle" : "moving";

        // Random wandering inside canvas bounds
        a.vx += rand(-0.5,0.5)*dt;
        a.vy += rand(-0.5,0.5)*dt;

        // Speed cap in px/s (convert meters to pixels using state.pxPerMeter)
        const maxPxPerSec = SPEED_MPS * state.pxPerMeter;
        const speed = Math.hypot(a.vx, a.vy);
        const max = maxPxPerSec;
        if (speed > max){ a.vx = a.vx / speed * max; a.vy = a.vy / speed * max; }

        a.x += a.vx * dt;
        a.y += a.vy * dt;

        // Bounce off edges
        if (a.x < 10 || a.x > state.canvas.width-10) a.vx *= -1;
        if (a.y < 10 || a.y > state.canvas.height-10) a.vy *= -1;
      }
    }
    state.draw();
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
