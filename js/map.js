// js/map.js
export async function initMap(state){
  const canvas = document.getElementById("map-canvas");
  const ctx = canvas.getContext("2d");

  // expose for other modules (zones guide, etc.)
  state.canvas = canvas;
  state._mapCtx = ctx;

  // offscreen layer for static floor + zones (define BEFORE resize uses it)
  const layer = document.createElement("canvas");
  const lctx = layer.getContext("2d");
  function resizeLayer(){
    layer.width = canvas.width;
    layer.height = canvas.height;
  }

  // handle resize (now safe to call resizeLayer)
  function resize(){
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    resizeLayer();
    state.layerDirty = true;
    draw();
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  // load floor image
  const img = new Image();
  img.src = "./img/floor.png";
  await new Promise(res => { img.onload = res; img.onerror = res; });
  state.floorImage = img;
  state.layerDirty = true;

  function draw(){
    // draw static layer if dirty
    if (state.layerDirty){
      lctx.setTransform(1,0,0,1,0,0);
      lctx.clearRect(0,0,layer.width,layer.height);
      // floor
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
      for (let zi = 0; zi < state.zones.length; zi++){
        const poly = state.zones[zi];
        lctx.fillStyle = "rgba(255,90,115,0.15)";
        lctx.strokeStyle = zi===state.selectedZone ? "rgba(255,200,0,0.9)" : "rgba(255,90,115,0.6)";
        lctx.beginPath();
        poly.forEach((p,i)=> i?lctx.lineTo(p.x,p.y):lctx.moveTo(p.x,p.y));
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
    ctx.save();
    
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

      if (a.id === state.selectedId || a.id === state.hoveredId){
        ctx.beginPath();
        ctx.arc(a.x, a.y, 11, 0, Math.PI*2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = a.id === state.selectedId ? "#cfe1ff" : "#8a98a9";
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // expose draw for other modules
  window.drawMap = draw;
  state.draw = draw;

  // hover handling
  canvas.addEventListener("mousemove", (e)=>{
    if (draggingExt>=0){ const p = toLogical(e); const ex = state.extinguishers[draggingExt]; ex.x = p.x; ex.y = p.y; state.layerDirty = true; draw(); return; }
    const p = toLogical(e);
    let prev = state.hoveredId;
    state.hoveredId = null;
    for (const a of state.assets){
      if (Math.hypot(a.x - p.x, a.y - p.y) < 10){
        state.hoveredId = a.id;
        break;
      }
    }
    if (prev !== state.hoveredId){
      if (typeof window.renderList === "function"){ window.renderList(state); }
      draw();
    }
  });
  canvas.addEventListener("mouseleave", ()=>{
    if (state.hoveredId){
      state.hoveredId = null;
      if (typeof window.renderList === "function"){ window.renderList(state); }
      draw();
    }
  });

  // click: select hovered asset or zone
  canvas.addEventListener("click", (e)=>{
    const p = toLogical(e);
    // asset selection
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
    state.selectedZone = (found>=0)? found : null;
    state.layerDirty = true;
    draw();
  });

  // zoom
  // zone vertex dragging
  let draggingVertex = null; // {zoneIndex, vertexIndex}
  let draggingExt = -1; // index in extinguishers
  canvas.addEventListener("mousedown", (e)=>{
    draggingExt = -1;
    const p = toLogical(e);
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
    // try extinguisher drag
    for (let i=0; i<state.extinguishers.length; i++){
      const ex = state.extinguishers[i];
      if (Math.hypot(ex.x - p.x, ex.y - p.y) < 10){ draggingExt = i; return; }
    }
        }
      }
    }
  });
  canvas.addEventListener("mousemove", (e)=>{
    if (draggingExt>=0){ const p = toLogical(e); const ex = state.extinguishers[draggingExt]; ex.x = p.x; ex.y = p.y; state.layerDirty = true; draw(); return; }
    if (!draggingVertex) return;
    const p = toLogical(e);
    const poly = state.zones[draggingVertex.zoneIndex];
    poly[draggingVertex.vertexIndex] = {x:p.x, y:p.y};
    state.layerDirty = true;
    draw();
  });
  canvas.addEventListener("mouseup", ()=>{ draggingVertex = null; draggingExt = -1; });

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
    return { x: (e.clientX - r.left) / z, y: (e.clientY - r.top) / z };
  }
  function pointInPoly(poly, pt){
    let inside=false;
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
