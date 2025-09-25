# Evora Demo (modular)
- Deschide `index.html` local sau publică pe GitHub Pages (`main` -> Settings -> Pages).
- Editează UI în `components/*.html`, stilurile în `css/`, logica în `js/`.
- Datele se află în `data/*.json` (stivuitoare, liftere, extinctoare).
- În toolbar: Încarcă imagine (schimbă harta), Pauză, Resetează poziția,
  Zone interzise (desenează poligoane), Șterge zonele, Descarcă config (JSON).
  
## Changelog (v5.3) – 2025-09-25
** What’s new **
- Multi-select filters (AND logic)
- You can now select multiple chips at once: e.g. Stivuitoare + În mișcare.
- “Toate” resets back to show everything.
- Selected chips show an active style.
- Persistent settings
- Remembers: sidebar state, selected filters, zoom (saved in localStorage).
- Restored automatically on reload.
- Zone editing
- Click a zone to select it.
- Drag vertices (grab the small points) to reshape.
- Delete selected zone with the Delete key.
- Rename selected zone with the R key (prompt).
- Zone names render near the centroid.
- Static floor + zones are cached on an offscreen layer for speed.
- Device actions in the list
- Each item now has actions: Editează, Mută, Șterge.
- Edit opens the existing modal prefilled.
- Move lets you click the map to set a new position.
- Delete removes the device (with confirm).
- Scroll-to-selected & stronger sync
- Clicking a dot selects list item, applies stronger highlight, and scrolls it into view.
- Hovering list items highlights the dot on the map; leaving clears.
- Mobile tweaks
- Bigger touch targets for buttons and actions.
- Sidebar becomes an overlay on smaller screens; toggle with the hamburger icon.
- Small perf boost
- Introduced a buffer canvas for static layers (floor + zones), redrawn only when needed.
- Dynamic assets (dots) are drawn each frame on top — smoother on larger datasets.

## Changelog (v5.1) – 2025-09-25

### Added
- **Collapsible left sidebar** with a floating **icon toggle** (hamburger). State persists per session.
- **Zone drawing UX**: crosshair cursor, dashed preview, bottom hint, **Z = Undo**, **Esc = Cancel**, double-click to close polygon.
- **“+ Adaugă dispozitiv(e)”** flow now functional: modal with Tip/ID, optional **place-on-map** click, auto-refresh list & map.
- Toolbar **visual polish**: blurred overlay, subtle border and shadow.

### Changed / Removed
- **Right sidebar (“Detalii”) removed** from the default layout (details surface in the **Active** list instead).
- Top bar cleanup: removed **“Ascunde/Afișează”** and **“Încarcă imagine”**.
- Movement speed calibrated at ~**5 km/h** (1.39 m/s).

### Hotfixes
- **Robust partial mounting**: `mountPartials()` now checks target elements before injecting HTML to avoid null-reference crashes.
- **Compatibility with GitHub Pages**: a hidden `<aside id="right-panel" style="display:none">` is kept in `index.html` to prevent legacy code from failing when the right panel is removed.
- Exposed canvas context and draw hook for helpers: `state._mapCtx`, `window.drawMap`.

### Deployment Notes (GitHub Pages)
1. Build is **static**; no bundler required.
2. Upload the contents of `/webapp_repo_v5/` to your Pages branch (e.g., `main` or `gh-pages`).  
3. Ensure the folder structure is preserved:  
   - `index.html`  
   - `components/` `css/` `js/` `img/` `data/`  
4. If you completely remove `#right-panel`, make sure your `components.js` includes the **null-safe** `mountPartials()` (v5.1+) implementation.

### Keyboard & Mouse Shortcuts
- **Zones**: Click to add points → **Double‑click** to close → **Z** to undo last point → **Esc** to cancel.
- **Sidebar**: Click the **hamburger icon** (top-left) to toggle **Filtre/Active** panel.
- **Map**: Click a dot to select; hover to preview highlight.

### Troubleshooting
- **“Almost nothing works” on first load**: likely a mounting error if an expected element is missing. Use v5.1 `mountPartials()` (null-safe) and keep a hidden `#right-panel` if needed.
- **CORS/file:// issues**: run via a local static server or deploy to Pages; avoid opening `index.html` directly from disk in some browsers.
- **Legend/UI overlap**: Toolbar and legend are overlays; adjust spacing in `css/layout.css` if your map image or viewport is small.

### Known Limitations
- Filters currently support **single selection** (chips). Multi-select can be enabled in `ui.js` if required.
- Zones are stored **in-memory**; use **Descarcă config** to export, or wire to storage as needed.

### File Map (v5.1 highlights)
- `index.html`: base layout, **floating legend**, **hidden right-panel** (for compatibility), modal container for add-device.
- `components/header.html`: top toolbar (without hide/show & upload), **left toggle icon**.
- `components/left-panel.html`: **Filtre**, **Active**, **+ Adaugă dispozitive** (with `data-action="add-device"`).
- `js/components.js`: **null-safe `mountPartials()`**.
- `js/ui.js`: sidebar toggle logic, add-device modal flow, enhanced zone drawing UX, list selection (no right-panel render).
- `js/map.js`: exposes `window.drawMap`, stores `state._mapCtx`, hover/selection highlights, legend rendering.
- `js/sim.js`: RAF loop, pause/resume via `state.paused`, ~5 km/h motion, idle detection (>5m).
- `css/layout.css`: sidebar collapse rules, toolbar polish, zone hint styles, active list highlights.
