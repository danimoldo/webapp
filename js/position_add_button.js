
// position_add_button.js
(function(){
  function norm(t){ return (t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,""); }
  function place(){
    const redare = Array.from(document.querySelectorAll('button')).find(b => norm(b.textContent).trim() === "redare");
    const add = document.getElementById("btn-add");
    if (!add) return;
    if (redare && redare.parentElement){
      redare.insertAdjacentElement("afterend", add);
    }
  }
  if (document.readyState === "loading"){ document.addEventListener("DOMContentLoaded", place); window.addEventListener("load", place); } else { place(); }
})();
