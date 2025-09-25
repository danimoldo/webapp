// js/map.js
import { clamp } from "./utils.js";
export async function initMap(state){

  const canvas = document.getElementById("map-canvas");
  const ctx = canvas.getContext("2d");
  state._mapCtx = ctx;
  // offscreen layer for floor + zones
  const layer = document.createElement("canvas");
  const lctx = layer.getContext("2d");
  function resizeLayer(){
    layer.width = canvas.width;
    layer.height = canvas.height;
    state.layerDirty = true;
  }
 state._mapCtx = ctx;
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight; resizeLayer();
  };
  new ResizeObserver(resize).observe(canvas); resize();

  // Load floor
  const img = new Image();
  img.src = "img/floor.png";
  await new Promise(res => { img.onload = res; img.onerror = res; });
  state.floorImage = img; state.layerDirty = true;

  // Basic interaction: drag extinguishers
  let dragging = null;
  canvas.addEventListener("mousedown", (e)=>{
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    for (const ext of state.extinguishers){
      const dx = x - ext.x, dy = y - ext.y;
      if (dx*dx + dy*dy < 8*8){ dragging = ext; break; }
    }
  });
  window.addEventListener("mousemove", (e)=>{
    if(!dragging) return;
    const r = canvas.getBoundingClientRect();
    dragging.x = clamp(e.clientX - r.left, 0, canvas.width);
    dragging.y = clamp(e.clientY - r.top, 0, canvas.height);
  });
  window.addEventListener("mouseup", ()=> dragging = null);

  function draw(){
    window.drawMap = draw;
    // update layer if dirty
    if (state.layerDirty){
      lctx.setTransform(1,0,0,1,0,0);
      lctx.clearRect(0,0,layer.width,layer.height);
      // floor
      const img = state.floorImage;
      if (img){
        const scale = Math.min(layer.width / img.width, layer.height / img.height);
        const w = img.width*scale, h = img.height*scale;
        lctx.drawImage(img, (layer.width - w)/2, (layer.height - h)/2, w, h);
      } else {
        lctx.fillStyle = "#0e1216"; lctx.fillRect(0,0,layer.width,layer.height);
      }
      // zones
      for (let zi=0; zi<state.zones.length; zi++){
        const poly = state.zones[zi];
        lctx.fillStyle = "rgba(255,90,115,0.15)";
        lctx.strokeStyle = zi===state.selectedZone ? "rgba(255,200,0,0.9)" : "rgba(255,90,115,0.6)";
        lctx.beginPath();
        poly.forEach((p,i)=> i?lctx.lineTo(p.x,p.y):lctx.moveTo(p.x,p.y));
        lctx.closePath(); lctx.fill(); lctx.stroke();
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
    // draw to main with zoom
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.save();
    ctx.scale(state.zoom||1, state.zoom||1);
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
      ctx.fillStyle = color; ctx.fill();
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
    // zones (blocked)
    for (const poly of state.zones){
      ctx.fillStyle = "rgba(255,90,115,0.15)";
      ctx.strokeStyle = "rgba(255,90,115,0.6)";
      ctx.beginPath();
      poly.forEach((p,i)=> i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
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
      ctx.fillStyle = color; ctx.fill();
      // status rim
      ctx.lineWidth = 3;
      ctx.strokeStyle = a.status === "idle" ? "#9097a2" : "#25c47a";
      ctx.stroke();
      /* highlight ring */
      if (a.id === state.selectedId || a.id === state.hoveredId){
        ctx.beginPath();
        ctx.arc(a.x, a.y, 11, 0, Math.PI*2);
        ctx.lineWidth = 2;
        ctx.strokeStyle = a.id === state.selectedId ? "#cfe1ff" : "#8a98a9";
        ctx.stroke();
      }
    }
  }

  // hover & click to highlight

  // Zoom wheel
  canvas.addEventListener('wheel', (e)=>{
    e.preventDefault();
    const z0 = state.zoom||1;
    const dz = e.deltaY < 0 ? 0.1 : -0.1;
    state.zoom = Math.max(0.5, Math.min(2, z0 + dz));
    try { localStorage.setItem("zoom", String(state.zoom)); } catch(e){}
    draw();
  }, { passive:false });

  // Helpers
  function toLogical(e){
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / (state.zoom||1), y: (e.clientY - r.top) / (state.zoom||1) };
  }

  canvas.addEventListener('mousemove', (e)=>{
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    let found = null, minD = 9999;
    for (const a of state.assets){
      const d = Math.hypot(a.x - x, a.y - y);
      if (d < 14 && d < minD){ minD = d; found = a.id; }
    }
    const prev = state.hoveredId;
    state.hoveredId = found;
    if (prev !== state.hoveredId){
      if (typeof window.renderList === 'function'){ window.renderList(state); }
      draw();
    }
  });
  canvas.addEventListener('mouseleave', ()=>{
    if (state.hoveredId){ state.hoveredId = null; if (typeof window.renderList === 'function') window.renderList(state); draw(); }
  });

  let draggingVertex = null; // {zoneIndex, vertexIndex}
  canvas.addEventListener('mousedown', (e)=>{
    const p = toLogical(e);
    // check vertex hit
    for (let zi=0; zi<state.zones.length; zi++){
      const poly = state.zones[zi];
      for (let vi=0; vi<poly.length; vi++){
        const v = poly[vi];
        if (Math.hypot(v.x-p.x, v.y-p.y) < 8){
          state.selectedZone = zi;
          draggingVertex = {zoneIndex:zi, vertexIndex:vi};
          draw();
          return;
        }
      }
    }
  });
  canvas.addEventListener('mousemove', (e)=>{
    if (draggingVertex){
      const p = toLogical(e);
      const poly = state.zones[draggingVertex.zoneIndex];
      poly[draggingVertex.vertexIndex] = {x:p.x, y:p.y};
      state.layerDirty = true;
      draw();
    }
  });
  canvas.addEventListener('mouseup', ()=>{ draggingVertex = null; });
  document.addEventListener('keydown', (e)=>{
    if (e.key==="Delete" && state.selectedZone!=null){
      state.zones.splice(state.selectedZone,1);
      state.selectedZone = null; state.layerDirty = true; draw(); toast("Zonă ștearsă.");
    }
    if (e.key.toLowerCase()==="r" && state.selectedZone!=null){
      const name = prompt("Nume zonă:", state.zones[state.selectedZone].name||"");
      if (name!=null){ state.zones[state.selectedZone].name = name; state.layerDirty = true; draw(); }
    }
  });
  canvas.addEventListener('click', (e)=>{
    const p = toLogical(e);
    // select asset on hover
    if (state.hoveredId){
      state.selectedId = state.hoveredId;
      if (typeof window.renderList === 'function') window.renderList(state);
      draw();
      return;
    }
    // zone hit-test
    function pointInPoly(poly, pt){
      let inside=false;
      for (let i=0,j=poly.length-1;i<poly.length;j=i++){
        const xi=poly[i].x, yi=poly[i].y, xj=poly[j].x, yj=poly[j].y;
        const intersect=((yi>pt.y)!=(yj>pt.y))&&(pt.x<(xj-xi)*(pt.y-yi)/(yj-yi+1e-6)+xi);
        if (intersect) inside=!inside;
      }
      return inside;
    }
    let found=-1;
    for (let zi=0; zi<state.zones.length; zi++){
      if (pointInPoly(state.zones[zi], p)){ found=zi; break; }
    }
    state.selectedZone = (found>=0)? found : null;
    state.layerDirty = true;
    draw();
  });

  return { draw, canvas, ctx };
}
