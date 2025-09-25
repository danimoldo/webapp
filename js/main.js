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
