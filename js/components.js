// js/components.js
export async function mountPartials() {
  const slots = [
    ["#left-panel", "components/left-panel.html"],
    ["#right-panel", "components/right-panel.html"],
    ["#toolbar", "components/header.html"],
  ];
  await Promise.all(slots.map(async ([sel, url]) => {
    const el = document.querySelector(sel);
    if (!el) return;
    const res = await fetch(url, { cache: "no-cache" });
    el.innerHTML = await res.text();
  }));
}
