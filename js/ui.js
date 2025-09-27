// ui.js (patched)
export function initUI(state) {
  // Example guarded binding
  const assetListEl = document.getElementById("asset-list");
  if (assetListEl && !assetListEl.dataset.bound) {
    assetListEl.dataset.bound = "1";
    assetListEl.addEventListener("click", (e) => {
      const item = e.target.closest(".list-item");
      if (!item) return;
      state.selectedId = item.dataset.id;
    });
  }
}

// Optional: back-compat for older app.js expecting renderEvents
export function renderEvents() { /* no-op for legacy callers */ }
if (!window.renderEvents) window.renderEvents = renderEvents;
