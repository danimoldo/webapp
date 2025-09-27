# Webapp Demo (RTLS + CMMS)

**Features**
- 250m × 150m store calibration (meters ↔ pixels)
- Speed cap 5 km/h, dt-based movement; idle → gray after 5 min
- Zones (draw/clear), ENTER/EXIT alerts + log
- Proximity bubbles with MEET/LEAVE events
- Trails + optional heatmap
- Asset drawer (Limble-like): inspections, hours, WO create, PM confirm
- Export/Import JSON config
- Demo scenarios button

**Run locally**
```bash
python3 -m http.server 8080
# open http://localhost:8080
```

**Structure**
- `index.html` – entry point (ES modules)
- `css/` – styles
- `js/` – `app.js` (bootstrap), plus modules: `sim.js`, `zones.js`, `ui.js`, `utils.js`
- `data/sample_config.json` – example site, zones, and assets
- `img/floor_example.png` – placeholder floor plan
- `.nojekyll` – enables GitHub Pages static hosting
