import { rand } from "./utils.js";
export function startSim(state){
  const SPEED_MPS = 1.39; // ~5 km/h
  function step(now){
    const dt = Math.min(0.05, (now - state.lastTick)/1000);
    state.lastTick = now;
    if (!state.paused){
      const maxPxPerSec = SPEED_MPS * state.pxPerMeter;
      for (const a of state.assets){
        if (!a._target || Math.hypot(a._target.x - a.x, a._target.y - a.y) < 5){
          const w = state.canvas.width, h = state.canvas.height;
          a._target = { x: Math.random()*w*0.9 + w*0.05, y: Math.random()*h*0.9 + h*0.05 };
        }
        const dx = a._target.x - a.x, dy = a._target.y - a.y;
        const dist = Math.hypot(dx,dy) || 1;
        a.vx = (dx/dist) * maxPxPerSec;
        a.vy = (dy/dist) * maxPxPerSec;
        const moving = Math.hypot(a.vx, a.vy) > 0.01;
        if (moving){ a.lastMove = now; }
        a.status = (now - a.lastMove) > (5*60*1000) ? "idle" : "moving";
        a.x += a.vx * dt; a.y += a.vy * dt;
      }
    }
    state.draw();
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}