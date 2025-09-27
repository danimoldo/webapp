// main.js (patched)
import { initMap } from './map.js';
import { initUI } from './ui.js';
import { mountPartials } from './partials.js';

const state = { assets: [], zones: [], selectedId: null };

async function main() {
  await mountPartials();
  const { draw, canvas: cnv } = await initMap(state);
  window.drawMap = draw; // expose for animation & UI

  initUI(state);

  function loop() {
    if (typeof window.drawMap === 'function') window.drawMap();
    requestAnimationFrame(loop);
  }
  loop();
}

main();
