
(() => {
  const $ = (s, c=document)=>c.querySelector(s);
  const on=(el,ev,fn)=>el&&el.addEventListener(ev,fn);
  if (!$('#btn-add')){
    const btn=document.createElement('button'); btn.id='btn-add'; btn.className='btn'; btn.textContent='+ Adăugare';
    const toolbar = document.querySelector('.toolbar') || document.body;
    toolbar.insertBefore(btn, toolbar.firstChild);
  }
  if (!$('#asset-modal')){
    const wrap=document.createElement('div');
    wrap.innerHTML=`
    <div class="modal" id="asset-modal" aria-hidden="true">
      <div class="modal__backdrop" data-close></div>
      <div class="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="asset-modal-title">
        <div class="modal__header"><h2 id="asset-modal-title">Adăugare / Editare</h2><button class="modal__close" data-close aria-label="Închide">×</button></div>
        <div class="modal__body">
          <form id="asset-form">
            <div class="field"><label for="assetType">Tip</label>
              <select id="assetType" required><option value="stivuitor">Stivuitor</option><option value="lifter">Liftieră</option><option value="extinctor">Extinctor</option></select>
            </div>
            <div class="field"><label for="entryDate">Data intrării</label><input type="date" id="entryDate" required></div>
            <div class="field"><label for="verifyExpiry">Data expirării verificării</label><input type="date" id="verifyExpiry" required></div>
            <div class="field"><label for="iscirExpiry">Data expirării ISCIR</label><input type="date" id="iscirExpiry" required></div>
            <input type="hidden" id="assetId">
          </form>
        </div>
        <div class="modal__footer"><button id="btn-save" class="btn btn-primary">Salvează</button><button id="btn-edit" class="btn">Editează</button><button id="btn-delete" class="btn btn-danger">Șterge</button><span class="modal__spacer"></span><button class="btn" data-close>Renunță</button></div>
      </div>
    </div>`;
    document.body.appendChild(wrap);
  }
  const modal=$("#asset-modal"); const btnAdd=$("#btn-add");
  function toDateInput(d){ d=new Date(d||Date.now()); const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),da=String(d.getDate()).padStart(2,"0"); return `${y}-${m}-${da}`; }
  function addMonths(d,n){ d=new Date(d||Date.now()); d.setMonth(d.getMonth()+n); return d; }
  function open(){ $('#assetId').value=''; $('#assetType').value='stivuitor'; const t=new Date(); $('#entryDate').value=toDateInput(t); $('#verifyExpiry').value=toDateInput(addMonths(t,12)); $('#iscirExpiry').value=toDateInput(addMonths(t,12)); modal.setAttribute('aria-hidden','false'); }
  function close(){ modal.setAttribute('aria-hidden','true'); }
  on(btnAdd,'click',open);
  modal.querySelectorAll('[data-close]').forEach(el=> on(el, 'click', close));
  on(document,'keydown',(e)=>{ if (e.key==='Escape') close(); });
})();