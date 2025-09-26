// utils.js
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export const now = () => performance.now();

export function dist(a, b) {
  const dx = a[0] - b[0], dy = a[1] - b[1];
  return Math.hypot(dx, dy);
}

export function normalize(vx, vy) {
  const m = Math.hypot(vx, vy) || 1;
  return [vx/m, vy/m];
}

// Point-in-polygon (winding number / ray casting)
export function pointInPoly(pt, poly) {
  let [x, y] = pt;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi + 1e-9) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function fmtTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString();
}

export function uid(prefix='ID') {
  return prefix + '-' + Math.random().toString(36).slice(2,8).toUpperCase();
}
