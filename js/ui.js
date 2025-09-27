// js/ui.js (hotfix v2)
function safeBind(el, type, handler) {
  if (!el) return;
  if (el.dataset && el.dataset.bound === '1') return;
  el.addEventListener(type, handler);
  if (el.dataset) el.dataset.bound = '1';
}

export function initUI(state) {
  // Example guarded binding for asset list
  safeBind(document.getElementById('asset-list'), 'click', (e) => {
    const item = e.target.closest('.list-item');
    if (!item) return;
    state.selectedId = item.dataset.id;
    if (window.ui && typeof window.ui.renderEvents === 'function') {
      // optional legacy refresh
      window.ui.renderEvents();
    }
  });

  // Any other buttons/inputs should use safeBind the same way:
  // safeBind(document.getElementById('some-btn'), 'click', onClick);
}

// Back-compat: provide a no-op renderEvents for old callers
export function renderEvents() { /* no-op for legacy */ }
if (!window.ui) window.ui = {};
if (!window.ui.renderEvents) window.ui.renderEvents = renderEvents;
