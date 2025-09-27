// js/ui.js (hotfix v5)
function safeBind(el, type, handler) {
  if (!el || (el.dataset && el.dataset.bound === '1')) return;
  el.addEventListener(type, handler);
  if (el.dataset) el.dataset.bound = '1';
}

export function initUI(state) {
  safeBind(document.getElementById('asset-list'), 'click', (e) => {
    const item = e.target.closest('.list-item');
    if (!item) return;
    state.selectedId = item.dataset.id;
    if (window.ui && typeof window.ui.renderEvents === 'function') {
      window.ui.renderEvents();
    }
  });
}

export function renderEvents() {}
if (!window.ui) window.ui = {};
if (typeof window.ui.renderEvents !== 'function') window.ui.renderEvents = renderEvents;
