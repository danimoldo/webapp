// js/components.js
export async function mountPartials() {
  const slots = [
    ["#left-panel", "components/left-panel.html"],
    ["#right-panel", "components/right-panel.html"],
    ["#toolbar", "components/header.html"],
    ["#legend-floating", "components/legend-floating.html"],
  ];
  await Promise.all(slots.map(async ([sel, url]) => {
    const el = document.querySelector(sel);
    if (!el) return;
    try {
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) throw new Error(`${url} → ${res.status}`);
      el.innerHTML = await res.text();
    } catch (err) {
      el.innerHTML = `<div style="padding:.6rem;border:1px solid #ff5a73;border-radius:.5rem;background:rgba(255,90,115,.1);">
        Eroare la încărcarea <code>${url}</code> (${err.message}). Verifică că fișierul există la aceeași rădăcină pe GitHub Pages.
      </div>`;
      console.error("Partial load failed:", url, err);
    }
  }));
}
