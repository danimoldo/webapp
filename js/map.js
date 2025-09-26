export function initMap(state){
  const canvas = document.getElementById("map-canvas");
  const ctx = canvas.getContext("2d");
  function resize(){
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.max(600, r.width);
    canvas.height = Math.max(400, r.height);
  }
  window.addEventListener("resize", resize); resize();

  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // floor image
    if (state.floorImage && state.floorImage.complete){
      ctx.drawImage(state.floorImage, 0, 0, canvas.width, canvas.height);
    } else {
      // grid bg
      ctx.fillStyle = "#0a0f14";
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.strokeStyle = "#12202b"; ctx.lineWidth = 1;
      for (let x=0;x<canvas.width;x+=40){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke(); }
      for (let y=0;y<canvas.height;y+=40){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke(); }
    }
    // extinguishers
    for (const ext of state.extinguishers){
      ctx.beginPath(); ctx.arc(ext.x, ext.y, 6, 0, Math.PI*2);
      ctx.fillStyle = ext.status==="expired" ? "#f87171" : "#22c55e"; ctx.fill();
    }
    // assets
    for (const a of state.assets){
      const color = a.type==="forklift" ? "#7dd3fc" : "#a78bfa";
      ctx.beginPath(); ctx.arc(a.x, a.y, 7, 0, Math.PI*2);
      ctx.fillStyle = color; ctx.fill();
      // status rim
      ctx.lineWidth = 3; ctx.strokeStyle = a.status === "idle" ? "#9097a2" : "#25c47a"; ctx.stroke();
      /* highlight ring */
      if (a.id === state.selectedId || a.id === state.hoveredId){
        ctx.beginPath(); ctx.arc(a.x, a.y, 11, 0, Math.PI*2);
        ctx.lineWidth = 2; ctx.strokeStyle = (a.id===state.selectedId) ? "#cfe1ff" : "#8a98a9"; ctx.stroke();
      }
    }
  }
  state.draw = draw;

  // hover & click to highlight
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
  canvas.addEventListener('click', ()=>{
    if (state.hoveredId){ state.selectedId = state.hoveredId; if (typeof window.renderDetails === 'function') window.renderDetails(state); if (typeof window.renderList === 'function') window.renderList(state); draw(); }
  });

  return { draw, canvas, ctx };
}