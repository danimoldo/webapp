// fix_modal_visibility.js
(function(){
  function norm(t){ return (t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,""); }
  function $(sel, ctx=document){ return ctx.querySelector(sel); }
  function ensureFallbackCSS(){
    if (document.getElementById("modal-fallback-style")) return;
    const s = document.createElement("style");
    s.id = "modal-fallback-style";
    s.textContent = `
      .modal{position:fixed;inset:0;display:none;z-index:9998}
      .modal[aria-hidden="false"]{display:block}
      .modal__backdrop{position:absolute;inset:0;background:rgba(0,0,0,.35)}
      .modal__dialog{position:relative;width:min(560px,calc(100% - 2rem));margin:10vh auto;background:#fff;
        color:#111;border:1px solid #e5e5e5;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.15);overflow:hidden}
      .modal__header,.modal__footer{padding:12px 16px;background:#fafafa;border-bottom:1px solid #e5e5e5}
      .modal__footer{border-top:1px solid #e5e5e5;border-bottom:none;display:flex;gap:.5rem;align-items:center}
      .modal__body{padding:16px}
      .modal__close{background:transparent;border:none;font-size:20px;cursor:pointer}
      .field{display:grid;gap:.25rem;margin-bottom:.75rem}
      .field input,.field select{padding:.5rem .6rem;border:1px solid #ccc;border-radius:8px;font:inherit}
      #asset-overlay{z-index:9999}
    `;
    document.head.appendChild(s);
  }

  function ensureWrapper(){
    let modal = document.getElementById("asset-modal");
    let dialogOnly = null;

    if (!modal){
      // Maybe only the dialog exists
      dialogOnly = document.querySelector(".modal__dialog");
      if (dialogOnly && !dialogOnly.closest(".modal")){
        modal = document.createElement("div");
        modal.className = "modal";
        modal.id = "asset-modal";
        modal.setAttribute("aria-hidden", "true");
        // insert backdrop + move dialog inside
        const backdrop = document.createElement("div");
        backdrop.className = "modal__backdrop";
        dialogOnly.parentNode.insertBefore(modal, dialogOnly);
        modal.appendChild(backdrop);
        modal.appendChild(dialogOnly);
      }
    }

    if (!modal){
      // Last resort: create empty shell (will be populated by other scripts)
      modal = document.createElement("div");
      modal.className = "modal";
      modal.id = "asset-modal";
      modal.setAttribute("aria-hidden", "true");
      modal.innerHTML = '<div class="modal__backdrop" data-close></div><div class="modal__dialog"></div>';
      document.body.appendChild(modal);
    }

    // Always enforce hidden by default
    if (modal.getAttribute("aria-hidden") === null) modal.setAttribute("aria-hidden", "true");
    return modal;
  }

  function wireClose(modal){
    // Close on [data-close] and Esc
    modal.addEventListener("click", (e)=>{
      const t = e.target;
      if (t && (t.matches("[data-close]") || t.classList.contains("modal__backdrop"))){
        modal.setAttribute("aria-hidden", "true");
      }
    });
    document.addEventListener("keydown", (e)=>{
      if (e.key === "Escape") modal.setAttribute("aria-hidden", "true");
    });
  }

  function moveAddNextToRedare(){
    const addBtn = document.getElementById("btn-add");
    if (!addBtn) return;
    const redare = Array.from(document.querySelectorAll('button')).find(b => norm(b.textContent).trim() === "redare");
    if (redare && redare.parentElement){
      redare.insertAdjacentElement("afterend", addBtn);
    }
  }

  function ensureOpenHandler(modal){
    const addBtn = document.getElementById("btn-add");
    if (!addBtn) return;
    addBtn.addEventListener("click", () => {
      modal.setAttribute("aria-hidden", "false");
    });
  }

  function main(){
    ensureFallbackCSS();
    const modal = ensureWrapper();
    wireClose(modal);
    ensureOpenHandler(modal);
    moveAddNextToRedare();
    // If someone accidentally removed the aria-hidden attribute, enforce hidden at load
    setTimeout(() => { if (!modal.hasAttribute("aria-hidden")) modal.setAttribute("aria-hidden","true"); }, 0);
  }

  if (document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", main);
  } else {
    main();
  }
})();