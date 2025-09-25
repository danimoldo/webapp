// js/map.js
import { clamp } from "./utils.js";
export async function initMap(state){
  const canvas = document.getElementById("map-canvas");
  const ctx = canvas.getContext("2d");
  const resize = () => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  };
  new ResizeObserver(resize).observe(canvas); resize();

  // Load floor
  const img = new Image();
  img.src = "img/floor.png";
  await new Promise(res => { img.onload = res; img.onerror = res; });
  state.floorImage = img;

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
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // floor:
    if (img && img.width){
      // cover mode
      const scale = Math.max(canvas.width/img.width, canvas.height/img.height);
      const w = img.width*scale, h = img.height*scale;
      ctx.drawImage(img, (canvas.width - w)/2, (canvas.height - h)/2, w, h);
    } else {
      ctx.fillStyle = "#0e1216"; ctx.fillRect(0,0,canvas.width,canvas.height);
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
    }
  }
  return { draw, canvas, ctx };
}
