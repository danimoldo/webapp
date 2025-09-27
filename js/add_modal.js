
(() => {
  const $ = (sel, ctx=document) => ctx.querySelector(sel);
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  const modal = $("#asset-modal");
  const form = $("#asset-form");
  const btnAdd = $("#btn-add");
  const btnSave = $("#btn-save");
  const btnEdit = $("#btn-edit");
  const btnDelete = $("#btn-delete");
  const idInput = $("#assetId");
  const typeInput = $("#assetType");
  const entryInput = $("#entryDate");
  const verifyInput = $("#verifyExpiry");
  const iscirInput = $("#iscirExpiry");

  let mode = "create"; // or "edit"

  function openModal(newMode="create", asset=null) {
    mode = newMode;
    if (asset) {
      idInput.value = asset.id || "";
      typeInput.value = (asset.type || "").toLowerCase();
      entryInput.value = toDateInput(asset.entryDate);
      verifyInput.value = toDateInput(asset.verifyExpiry);
      iscirInput.value = toDateInput(asset.iscirExpiry);
    } else {
      idInput.value = "";
      typeInput.value = "stivuitor";
      const today = new Date();
      entryInput.value = toDateInput(today);
      verifyInput.value = toDateInput(addMonths(today, 12));
      iscirInput.value = toDateInput(addMonths(today, 12));
    }
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    modal.setAttribute("aria-hidden", "true");
  }

  function toDateInput(val) {
    if (!val) return "";
    const d = (val instanceof Date) ? val : new Date(val);
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function addMonths(date, n) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + n);
    return d;
  }

  function genIdFor(type) {
    // Generate readable IDs: S-###, L-###, E-###
    const prefix = type === "stivuitor" ? "S" : (type === "lifter" ? "L" : "E");
    const n = Math.floor(1 + Math.random()*999);
    return `${prefix}-${String(n).padStart(3, "0")}`;
  }

  function gatherForm() {
    const type = typeInput.value;
    const payload = {
      id: idInput.value || genIdFor(type),
      type,
      meta: {
        entryDate: entryInput.value,
        verifyExpiry: verifyInput.value,
        iscirExpiry: iscirInput.value
      }
    };
    // also top-level for convenience
    payload.entryDate = payload.meta.entryDate;
    payload.verifyExpiry = payload.meta.verifyExpiry;
    payload.iscirExpiry = payload.meta.iscirExpiry;
    return payload;
  }

  function tryCallOrEmit(fnName, eventName, detail) {
    const app = window.app || window.App || null;
    if (app && typeof app[fnName] === "function") {
      try { app[fnName](detail); }
      catch (e) { console.warn(`[modal] ${fnName} failed, falling back to event`, e); window.dispatchEvent(new CustomEvent(eventName, { detail })); }
    } else {
      window.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
  }

  // Public hook to open in edit mode with an existing asset
  window.openAssetEditor = function(asset) {
    openModal("edit", asset);
  };

  // Wire up UI
  on(btnAdd, "click", () => openModal("create"));

  // Close on backdrop / close buttons
  modal.querySelectorAll("[data-close]").forEach(el => on(el, "click", closeModal));
  on(document, "keydown", (e) => {
    if (e.key === "Escape" && modal.getAttribute("aria-hidden") === "false") closeModal();
  });

  on(btnSave, "click", (e) => {
    e.preventDefault();
    const data = gatherForm();
    tryCallOrEmit("addAsset", "asset:create", data);
    closeModal();
  });

  on(btnEdit, "click", (e) => {
    e.preventDefault();
    const data = gatherForm();
    tryCallOrEmit("updateAsset", "asset:update", data);
    closeModal();
  });

  on(btnDelete, "click", (e) => {
    e.preventDefault();
    const id = idInput.value.trim();
    if (!id) return;
    tryCallOrEmit("removeAsset", "asset:delete", { id });
    closeModal();
  });

  // Example listeners (no-ops) so nothing breaks if app doesn't listen yet.
  // You can remove these if your app already handles the events.
  window.addEventListener("asset:create", (e) => console.debug("[event] asset:create", e.detail));
  window.addEventListener("asset:update", (e) => console.debug("[event] asset:update", e.detail));
  window.addEventListener("asset:delete", (e) => console.debug("[event] asset:delete", e.detail));
})();
