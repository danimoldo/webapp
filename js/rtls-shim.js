// js/rtls-shim.js
(function () {
  const A = window.AssetsAdd || {};
  const R = (window.rtls = window.rtls || {});

  if (typeof R.start !== 'function') R.start = () => A.start && A.start();
  if (typeof R.stop  !== 'function') R.stop  = () => A.stop && A.stop();

  const mapFns = ['addForklift','addLifter','addExtinguisher','setScale','getState'];
  for (const fn of mapFns) {
    if (typeof R[fn] !== 'function' && typeof A[fn] === 'function') {
      R[fn] = (...args) => A[fn](...args);
    }
  }
})();