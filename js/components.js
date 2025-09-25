// js/components.js
export async function mountPartials(){
  async function inject(id, url){
    const el = document.getElementById(id);
    if (!el) return;
    try {
      const res = await fetch(url);
      const html = await res.text();
      el.innerHTML = html;
    } catch(e){ console.warn("mountPartials failed for", id, url, e); }
  }
  await inject("left-panel", "components/left-panel.html");
  await inject("toolbar", "components/header.html");
  await inject("footer", "components/footer.html");
  // right-panel optional
  if (document.getElementById("right-panel")){
    await inject("right-panel", "components/right-panel.html");
  }
}
;

  const slots = [
    ["#left-panel", "components/left-panel.html"],
    ["#right-panel", "components/right-panel.html"],
    ["#toolbar", "components/header.html"],
  ];
  await Promise.all(slots.map(async ([sel, url]) => {
    const el = document.querySelector(sel);
    if (!el) return;
    try {
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) throw new Error("fetch failed");
      el.innerHTML = await res.text();
    } catch(e) {
      el.innerHTML = __INLINE_COMPONENTS__[sel] || "";
    }
  }));
}
