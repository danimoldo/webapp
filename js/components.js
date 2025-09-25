// js/components.js
export async function mountPartials() {

// Fallback content (inlined) for offline/file:// usage
const __INLINE_COMPONENTS__ = {
  "#left-panel": String.raw`<section class="panel">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.4rem;">
    <h3 style="margin:0">Filtre</h3>
    <div>
      <button id="btn-add-device" class="btn btn-alt" title="Adaugă dispozitiv">+ Adaugă dispozitive</button>
    </div>
  </div>
  <div class="chip-row">
    <button class="chip" data-filter="all">Toate</button>
    <button class="chip" data-filter="forklifts">Stivuitoare</button>
    <button class="chip" data-filter="lifters">Liftere</button>
    <button class="chip" data-filter="ext">Extinctoare</button>
    <button class="chip" data-filter="moving">În mișcare</button>
    <button class="chip" data-filter="idle">Inactiv &gt;5m</button>
    <button class="chip" data-filter="expired">Extinct. expirate</button>
  </div>
</section>
<section class="panel">
  <h3>Active</h3>
  <div id="asset-list" class="list"></div>
</section>
`,
  "#right-panel": String.raw`<section class="panel">
  <h3>Detalii</h3>
  <div id="details" class="details">Selectează un activ de pe hartă sau din listă.</div>
</section>
`,
  "#toolbar": String.raw`<div class="toolbar-inner">
  <div class="toolbar-left">
    <button id="btn-toggle-left" class="btn btn-alt" title="Ascunde/Afișează panoul stânga">Ascunde/Afișează</button>
    <button id="btn-upload" title="Încarcă imagine" class="btn">Încarcă imagine</button>
    <input type="file" id="file-input" accept="image/*" hidden>
    <button id="btn-pause" class="btn">Pauză</button>
    <button id="btn-reset" class="btn">Resetează poziția</button>
  </div>
  <div class="toolbar-right">
    <button id="btn-zones" class="btn">Zone interzise</button>
    <button id="btn-clear-zones" class="btn btn-alt">Șterge zonele</button>
    <button id="btn-save-config" class="btn btn-alt">Descarcă config</button>
  </div>
</div>
`
};

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
