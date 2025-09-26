# Webapp Demo (RTLS + CMMS) — Patched

**Fixes**
- Clickable asset dots (overlay accepts pointer events, pixel hit-test)
- Toggle states for buttons (visual highlight, `aria-pressed`)
**Features**
- Minimap, scenarios (RO), analytics + CSV
- Zones, alerts, proximity, trails, heatmap
- CMMS drawer (inspections, WO, QR)
- WebSocket client + fallback; mock server included
**Run**
```bash
python3 -m http.server 8080
# or: node server/mock-ws.js
```
