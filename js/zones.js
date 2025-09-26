// zones.js
import { pointInPoly } from './utils.js';

export class ZoneManager {
  constructor() {
    this.zones = []; // {id,name,type,polygon:[ [x,y],... ]}
    this._drawing = false;
    this._current = [];
  }

  load(zones) { this.zones = zones || []; }
  clear() { this.zones = []; }

  startDrawing() { this._drawing = true; this._current = []; }
  addPoint(p) { if (this._drawing) this._current.push(p); }
  finish(name='Zonă', type='no_go') {
    if (!this._drawing || this._current.length < 3) return null;
    const z = { id: 'Z-' + Date.now(), name, type, polygon: this._current.slice() };
    this.zones.push(z);
    this._drawing = false; this._current = [];
    return z;
  }

  containsPoint(p) {
    return this.zones.filter(z => pointInPoly(p, z.polygon));
  }

  draw(ctx, scale) {
    ctx.save();
    ctx.lineWidth = 2;
    for (const z of this.zones) {
      ctx.beginPath();
      const poly = z.polygon.map(([x,y])=>[x*scale, y*scale]);
      ctx.moveTo(poly[0][0], poly[0][1]);
      for (let i=1;i<poly.length;i++) ctx.lineTo(poly[i][0], poly[i][1]);
      ctx.closePath();
      ctx.fillStyle = z.type==='no_go' ? 'rgba(255,64,64,0.15)' : 'rgba(64,200,255,0.12)';
      ctx.strokeStyle = z.type==='no_go' ? 'rgba(255,64,64,0.8)' : 'rgba(64,200,255,0.8)';
      ctx.fill(); ctx.stroke();
      // label
      ctx.fillStyle = '#cde';
      const [cx, cy] = poly[0];
      ctx.fillText(z.name, cx+6, cy+14);
    }
    ctx.restore();
  }
}
