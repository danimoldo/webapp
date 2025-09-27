// js/rtls-shim.js (LAZY VERSION)
//
// Fixes timing issues when add-assets.js (type="module") hasn't finished
// loading before this shim runs. We DON'T capture AssetsAdd at load time;
// instead we look it up on every call.

(function () {
  // Ensure global namespace
  const R = (window.rtls = window.rtls || {});

  // Helper to safely invoke a method on AssetsAdd when it's ready
  function call(method, ...args) {
    const A = window.AssetsAdd;
    if (A && typeof A[method] === 'function') return A[method](...args);
    console.warn(`[rtls-shim] AssetsAdd.${method} not ready yet`);
  }

  if (typeof R.start !== 'function') R.start = () => call('start');
  if (typeof R.stop  !== 'function') R.stop  = () => call('stop');

  const map = ['addForklift','addLifter','addExtinguisher','setScale','getState'];
  for (const fn of map) {
    if (typeof R[fn] !== 'function') {
      R[fn] = (...args) => call(fn, ...args);
    }
  }
})();