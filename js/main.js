import { mountPartials } from "./components.js";
import { initState } from "./state.js";
import { renderList, renderDetails, initUI } from "./ui.js";
import { startSim } from "./sim.js";
import { initMap } from "./map.js";

async function boot(){
  await mountPartials();
  const state = initState();

  // Load data (with inline fallback)
  let machines, exts;
  try{
    const [m,e] = await Promise.all([
      fetch("data/machines.json").then(r=>r.json()),
      fetch("data/extinguishers.json").then(r=>r.json())
    ]);
    machines = m; exts = e;
  }catch(e){
    machines = {"forklifts": [{"id": "F-001", "checked": "2025-09-20T10:00", "approved": "2025-09-01T09:00"}, {"id": "F-002", "checked": "2025-09-20T10:00", "approved": "2025-09-01T09:00"}, {"id": "F-003", "checked": "2025-09-20T10:00", "approved": "2025-09-01T09:00"}, {"id": "F-004", "checked": "2025-09-20T10:00", "approved": "2025-09-01T09:00"}, {"id": "F-005", "checked": "2025-09-20T10:00", "approved": "2025-09-01T09:00"}], "lifters": [{"id": "L-001", "checked": "2025-09-18T12:00", "approved": "2025-09-02T11:30"}, {"id": "L-002", "checked": "2025-09-18T12:00", "approved": "2025-09-02T11:30"}, {"id": "L-003", "checked": "2025-09-18T12:00", "approved": "2025-09-02T11:30"}, {"id": "L-004", "checked": "2025-09-18T12:00", "approved": "2025-09-02T11:30"}, {"id": "L-005", "checked": "2025-09-18T12:00", "approved": "2025-09-02T11:30"}]};
    exts = [{"id": "E-001", "x": 50, "y": 40, "status": "ok"}, {"id": "E-002", "x": 100, "y": 80, "status": "ok"}, {"id": "E-003", "x": 150, "y": 120, "status": "ok"}, {"id": "E-004", "x": 200, "y": 160, "status": "ok"}, {"id": "E-005", "x": 250, "y": 200, "status": "ok"}, {"id": "E-006", "x": 300, "y": 240, "status": "ok"}, {"id": "E-007", "x": 350, "y": 280, "status": "ok"}, {"id": "E-008", "x": 400, "y": 320, "status": "ok"}, {"id": "E-009", "x": 450, "y": 360, "status": "ok"}, {"id": "E-010", "x": 500, "y": 400, "status": "ok"}];
  }

  const map = initMap(state);
  state.canvas = map.canvas;

  const w = state.canvas.width, h = state.canvas.height, now = performance.now();
  state.assets = [
    ...machines.forklifts.map((m)=> ({...m, type:"forklift", x: Math.random()*w, y: Math.random()*h, vx:0, vy:0, status:"moving", lastMove:now})),
    ...machines.lifters.map((m)=> ({...m, type:"lifter",   x: Math.random()*w, y: Math.random()*h, vx:0, vy:0, status:"moving", lastMove:now}))
  ];
  state.extinguishers = exts;

  initUI(state);
  renderList(state);
  renderDetails(state);
  startSim(state);
}
boot();
