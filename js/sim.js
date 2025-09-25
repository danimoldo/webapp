// js/sim.js
const SPEED_MPS = 1.39;              // ~5 km/h
const TURN_RATE = Math.PI / 12;      // rad/s (gentle turns)

export function startSim(state){
  // Seed headings & speed
  for (const a of state.assets){
    a.heading = Math.random()*Math.PI*2;
    a.speedPx = SPEED_MPS * state.pxPerMeter * (0.7 + Math.random()*0.6); // 70–130%
    a.lastMove = performance.now();
  }

  function step(now){
    const dt = Math.min(0.05, (now - state.lastTick)/1000);
    state.lastTick = now;

    if (!state.paused){
      for (const a of state.assets){
        // random heading drift
        const drift = (Math.random()-0.5) * TURN_RATE * 2 * dt;
        a.heading += drift;

        // velocity from heading
        const vx = Math.cos(a.heading) * a.speedPx;
        const vy = Math.sin(a.heading) * a.speedPx;

        a.x += vx * dt;
        a.y += vy * dt;

        // bounce on edges
        const r = 10;
        if (a.x < r || a.x > state.canvas.width - r) {
          a.heading = Math.PI - a.heading;
          a.x = Math.max(r, Math.min(state.canvas.width - r, a.x));
        }
        if (a.y < r || a.y > state.canvas.height - r) {
          a.heading = -a.heading;
          a.y = Math.max(r, Math.min(state.canvas.height - r, a.y));
        }

        // status (idle if no movement >5m). Here movement always occurs, but keep logic:
        a.status = (now - a.lastMove) > (5*60*1000) ? "idle" : "moving";
        a.lastMove = now;
      }
    }

    state.draw();
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
