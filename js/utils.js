// js/utils.js
export const rand = (min, max) => Math.random() * (max - min) + min;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export function fmtHoursAgo(h){ return `${Math.round(h)}z în urmă`; }
export function toast(msg){
  const el = document.getElementById("toast");
  el.textContent = msg; el.hidden = false;
  clearTimeout(el._t); el._t = setTimeout(()=> el.hidden = true, 1600);
}
export function downloadJSON(filename, obj){
  const data = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 2)], {type:"application/json"}));
  const a = Object.assign(document.createElement("a"), { href: data, download: filename });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(data), 500);
}
