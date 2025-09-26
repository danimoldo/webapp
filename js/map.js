// js/map.js
export async function initMap(state){
  const canvas = document.getElementById("map-canvas");
  const ctx = canvas.getContext("2d");

  // expose for other modules
  state.canvas = canvas;
  state._mapCtx = ctx;


// --- begin: violation overlay helper (canvas) ---
function drawViolation(ctx, x, y, baseR, now){
  const t = (now % 1200) / 1200;
  const pulseR = baseR * (1.7 + 0.7 * t);
  const alpha = 0.9 * (1.0 - t);

  // red ring on the dot itself (always visible even if pulse clipped)
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, baseR + 3, 0, Math.PI*2);
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#ff3b30";
  ctx.stroke();
  ctx.restore();

  // pulsing halo
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, pulseR, 0, Math.PI*2);
  ctx.strokeStyle = `rgba(255,0,0,${alpha.toFixed(3)})`;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // small flag
  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255,0,0,0.95)";
  ctx.fillStyle = "rgba(255,0,0,0.95)";
  const poleX = x + baseR + 2;
  const poleTopY = y - baseR - 6;
  const poleBotY = y - baseR - 1;
  ctx.beginPath();
  ctx.moveTo(poleX, poleBotY);
  ctx.lineTo(poleX, poleTopY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(poleX, poleTopY);
  ctx.lineTo(poleX + 7, poleTopY + 2);
  ctx.lineTo(poleX, poleTopY + 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function pointSegmentDistance(px, py, ax, ay, bx, by){
  const vx = bx - ax, vy = by - ay;
  const wx = px - ax, wy = py - ay;
  const c1 = vx*wx + vy*wy;
  if (c1 <= 0) return Math.hypot(px-ax, py-ay);
  const c2 = vx*vx + vy*vy;
  if (c2 <= c1) return Math.hypot(px-bx, py-by);
  const t = c1 / c2;
  const projx = ax + t*vx, projy = ay + t*vy;
  return Math.hypot(px-projx, py-projy);
}

function zoneIsNoGo(poly){
  if (poly && (poly.isNoGo === true)) return true;
  if (poly && typeof poly.name === "string" && /interzis/i.test(poly.name)) return true;
  return false;
}

function isInNoGo(zones, x, y, clearancePx = 0){
  for (const poly of zones){
    if (!poly || poly.length < 3) continue;
    if (!zoneIsNoGo(poly)) continue;
    if (pointInPoly(poly, {x, y})) return true;
    if (clearancePx > 0){
      for (let i=0; i<poly.length; i++){
        const a = poly[i], b = poly[(i+1)%poly.length];
        if (pointSegmentDistance(x,y,a.x,a.y,b.x,b.y) < clearancePx) return true;
      }
    }
  }
  return false;
}

window.__rtls_debug = Object.assign(window.__rtls_debug || {}, { drawViolation, isInNoGo });
// --- end: violation overlay helper ---



  // offscreen layer for floor + zones
  const layer = document.createElement("canvas");
  const lctx = layer.getContext("2d");
  function resizeLayer(){
    layer.width = canvas.width;
    layer.height = canvas.height;
  }

  // resize
  function resize(){
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    resizeLayer();
    state.layerDirty = true;
    draw();
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  // floor
  const img = new Image();
  img.src = "./img/floor.png";
  await new Promise(res => { img.onload = res; img.onerror = res; });
  state.floorImage = img;
  state.layerDirty = true;

  function draw(){
    // redraw static layer if needed
    if (state.layerDirty){
      lctx.setTransform(1,0,0,1,0,0);
      lctx.clearRect(0,0,layer.width,layer.height);
      if (state.floorImage){
        const scale = Math.min(layer.width / state.floorImage.width, layer.height / state.floorImage.height);
        const w = state.floorImage.width * scale;
        const h = state.floorImage.height * scale;
        lctx.drawImage(state.floorImage, (layer.width - w)/2, (layer.height - h)/2, w, h);
      } else {
        lctx.fillStyle = "#0e1216";
        lctx.fillRect(0,0,layer.width,layer.height);
      }
      // zones
      for (let zi=0; zi<state.zones.length; zi++){
        const poly = state.zones[zi];
        lctx.fillStyle = "rgba(255,90,115,0.15)";
        lctx.strokeStyle = zi===state.selectedZone ? "rgba(255,200,0,0.9)" : "rgba(255,90,115,0.6)";
        lctx.beginPath();
        for (let i=0; i<poly.length; i++){
          const p = poly[i];
          if (i===0) lctx.moveTo(p.x, p.y); else lctx.lineTo(p.x, p.y);
        }
        lctx.closePath();
        lctx.fill();
        lctx.stroke();
        if (poly.name){
          const cx = poly.reduce((s,p)=>s+p.x,0)/poly.length;
          const cy = poly.reduce((s,p)=>s+p.y,0)/poly.length;
          lctx.fillStyle = "rgba(230,235,245,0.85)";
          lctx.font = "12px sans-serif";
          lctx.fillText(poly.name, cx+6, cy-6);
        }
      }
      state.layerDirty = false;
    }

    // main draw
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(layer, 0, 0);

    // extinguishers
    for (const ext of state.extinguishers){
      ctx.beginPath();
      ctx.arc(ext.x, ext.y, 6, 0, Math.PI*2);
      ctx.fillStyle = ext.expired ? "#ff5a73" : "#25c47a";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#0b0d10";
      ctx.stroke();
    }

    // assets
    for (const a of state.assets){
      const color = a.type === "forklift" ? "#5aa0ff" : "#ffd166";
      ctx.beginPath();
      ctx.arc(a.x, a.y, 7, 0, Math.PI*2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = a.status === "idle" ? "#9097a2" : "#25c47a";
      ctx.stroke();
      // no-go visual highlight (red flag + pulse + red ring)
      try {
        const clearancePx = Math.round((state.pxPerMeter || 3) * 0.5); // ~0.5m buffer
        if (isInNoGo(state.zones, a.x, a.y, clearancePx)) {
          drawViolation(ctx, a.x, a.y, 7, performance.now());
        }
      } catch(e) {
        console.warn("violation overlay failed", e);
      }


      if (a.id === state.selectedId || a.id === state.hoveredId){
        ctx.beginPath();
        ctx.arc(a.x, a.y, 11, 0, Math.PI*2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = a.id === state.selectedId ? "#cfe1ff" : "#8a98a9";
        ctx.stroke();
      }
    }
  }

  window.drawMap = draw;
  state.draw = draw;

  const tip = document.getElementById("map-tooltip");
  const area = document.getElementById("map-area");
  function showTip(text, ev){
    if (!tip || !area) return;
    tip.textContent = text;
    tip.hidden = false;
    const r = area.getBoundingClientRect();
    tip.style.left = (ev.clientX - r.left + 12) + "px";
    tip.style.top  = (ev.clientY - r.top  - 12) + "px";
  }
  function hideTip(){ if (tip) tip.hidden = true; }

  // hover highlight over assets
  canvas.addEventListener("mousemove", (e)=>{
    const p = toLogical(e);
    let prev = state.hoveredId;
    state.hoveredId = null;
    let tipText = "";
    for (const a of state.assets){
      if (Math.hypot(a.x - p.x, a.y - p.y) < 10){
        state.hoveredId = a.id;
        const status = (a.status==="idle") ? "Inactiv >5m" : "În mișcare";
        const label = (a.type==="forklift"?"Stivuitor": a.type==="lifter"?"Lifter":"Dispozitiv");
        tipText = `${label} ${a.id} • ${status}`;
        break;
      }
    }
    if (!state.hoveredId){
      for (const ex of state.extinguishers){
        if (Math.hypot(ex.x - p.x, ex.y - p.y) < 10){
          state.hoveredId = ex.id;
          tipText = `Extinctor ${ex.id} • ${ex.expired ? "Expirat" : "Funcțional"}`;
          break;
        }
      }
    }
    if (state.hoveredId){ showTip(tipText, e); } else { hideTip(); }
    if (prev !== state.hoveredId){
      if (typeof window.renderList === "function"){ window.renderList(state); }
      draw();
    }
  });
  canvas.addEventListener("mouseleave", ()=>{ hideTip();
    if (state.hoveredId){
      state.hoveredId = null;
      if (typeof window.renderList === "function"){ window.renderList(state); }
      draw();
    }
  });

  // click: select hovered asset or zone
  canvas.addEventListener("click", (e)=>{
    const p = toLogical(e);
    if (state.hoveredId){
      state.selectedId = state.hoveredId;
      if (typeof window.renderList === "function"){ window.renderList(state); }
      draw();
      return;
    }
    // zone hit test
    let found = -1;
    for (let zi=0; zi<state.zones.length; zi++){
      if (pointInPoly(state.zones[zi], p)){ found = zi; break; }
    }
    state.selectedZone = (found>=0) ? found : null;
    state.layerDirty = true;
    draw();
  });

  // drag vertices and extinguishers
  let draggingVertex = null; // {zoneIndex, vertexIndex}
  let draggingExt = -1; // index of extinguisher

  canvas.addEventListener("mousedown", (e)=>{
    draggingExt = -1;
    const p = toLogical(e);
    // vertices
    for (let zi=0; zi<state.zones.length; zi++){
      const poly = state.zones[zi];
      for (let vi=0; vi<poly.length; vi++){
        const v = poly[vi];
        if (Math.hypot(v.x-p.x, v.y-p.y) < 8){
          state.selectedZone = zi;
          draggingVertex = {zoneIndex: zi, vertexIndex: vi};
          draw();
          return;
        }
      }
    }
    // extinguishers
    for (let i=0; i<state.extinguishers.length; i++){
      const ex = state.extinguishers[i];
      if (Math.hypot(ex.x - p.x, ex.y - p.y) < 10){
        draggingExt = i;
        return;
      }
    }
  });

  canvas.addEventListener("mousemove", (e)=>{
    if (draggingExt >= 0){
      const p = toLogical(e);
      const ex = state.extinguishers[draggingExt];
      ex.x = p.x; ex.y = p.y;
      state.layerDirty = true;
      draw();
      return;
    }
    if (!draggingVertex) return;
    const p = toLogical(e);
    const poly = state.zones[draggingVertex.zoneIndex];
    poly[draggingVertex.vertexIndex] = {x:p.x, y:p.y};
    state.layerDirty = true;
    draw();
  });

  canvas.addEventListener("mouseup", ()=>{
    draggingVertex = null;
    draggingExt = -1;
  });

  document.addEventListener("keydown", (e)=>{
    if (e.key === "Delete" && state.selectedZone != null){
      state.zones.splice(state.selectedZone, 1);
      state.selectedZone = null;
      state.layerDirty = true;
      draw();
    }
    if (e.key.toLowerCase() === "r" && state.selectedZone != null){
      const name = prompt("Nume zonă:", state.zones[state.selectedZone].name || "");
      if (name != null){
        state.zones[state.selectedZone].name = name;
        state.layerDirty = true;
        draw();
      }
    }
  });

  // helpers
  function toLogical(e){
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left), y: (e.clientY - r.top) };
  }
  function pointInPoly(poly, pt){
    let inside = false;
    for (let i=0, j=poly.length-1; i<poly.length; j=i++){
      const xi=poly[i].x, yi=poly[i].y, xj=poly[j].x, yj=poly[j].y;
      const intersect = ((yi>pt.y)!=(yj>pt.y)) && (pt.x < (xj - xi) * (pt.y - yi) / ((yj - yi) || 1e-6) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  // initial draw
  draw();

  return { draw, canvas, ctx };
}
