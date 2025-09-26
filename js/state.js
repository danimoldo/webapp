// js/state.js
export function initState() {
  return {
    paused: false,
    filters: new Set(["all"]),
    assets: [],
    extinguishers: [],
    selectedId: null,
    hoveredId: null,
    zones: [], // array of polygons [[{x,y},...], ...]
    floorImage: null,
    pxPerMeter: 3, // tune to your floor plan scale
    lastTick: performance.now(),
  };
}
