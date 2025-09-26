export async function mountPartials(){
  // Try fetch, fallback to inline strings
  const parts = [
    ["#toolbar","components/header.html"],
    ["#left-panel","components/left-panel.html"],
    ["#right-panel","components/right-panel.html"],
  ];
  for (const [sel, url] of parts){
    const el = document.querySelector(sel);
    try{
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) throw new Error("fetch failed");
      el.innerHTML = await res.text();
    }catch(e){
      // inline fallbacks
      if (sel==="#toolbar") el.innerHTML = `<div class="toolbar-inner">
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
</div>`;
      if (sel==="#left-panel") el.innerHTML = `<section class="panel">
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
    <button class="chip" data-filter="moving">În mișcare</button>
    <button class="chip" data-filter="idle">Inactiv &gt;5m</button>
  </div>
</section>
<section class="panel">
  <h3>Active</h3>
  <div id="asset-list"></div>
</section>`;
      if (sel==="#right-panel") el.innerHTML = `<section class="panel"><h3>DETALII</h3><div id="details">Selectează un activ.</div></section>`;
    }
  }
}