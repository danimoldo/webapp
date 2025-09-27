// js/main.js (hotfix v2)
import { initMap } from './map.js';
import { initUI } from './ui.js';
import { mountPartials } from './partials.js';

const state = window.__APP_STATE__ || { assets: [], zones: [], selectedId: null };
window.__APP_STATE__ = state;

async function boot() {
  try {
    // Ensure DOM is ready before we touch it
    if (document.readyState === 'loading') {
      await new Promise(r => document.addEventListener('DOMContentLoaded', r, { once: true }));
    }

    // Mount partials first so UI elements exist
    if (typeof mountPartials === 'function') {
      await mountPartials();
    }

    // Init map & expose draw globally for any legacy loops
    const map = await initMap(state);
    const draw = (map && map.draw) ? map.draw : null;
    if (draw) window.drawMap = draw;

    // Init UI (guards inside to avoid null listeners)
    initUI(state);

    // Animation loop — tolerate missing draw
    function loop() {
      try {
        if (typeof window.drawMap === 'function') window.drawMap();
      } catch (e) {
        // keep the sim alive even if a frame throws
        console.error('[loop] draw error:', e);
      } finally {
        requestAnimationFrame(loop);
      }
    }
    loop();

    console.log('%c[boot] app ready', 'color: green; font-weight:700');
  } catch (err) {
    console.error('[boot] fatal init error', err);
  }
}

boot();
