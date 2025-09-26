export function initState() {
  return {
    paused: false,
    filters: new Set(["all"]),
    assets: [],
    extinguishers: [],
    selectedId: null,
    hoveredId: null,
    zones: [],
    floorImage: null,
    pxPerMeter: 3,
    lastTick: performance.now(),
    draw: ()=>{}
  };
}