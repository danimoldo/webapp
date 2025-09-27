// js/rtls-universal-shim.js
// Bulletproof shim: supports multiple calling styles used by legacy app.js files.
//
// Covers all patterns:
//   1) const rtls = new RTLSClient(state); rtls.start();
//   2) const rtls = new RTLS(state);       rtls.start();
//   3) rtls.start();                        // using a global instance
//   4) createRTLS(state).start();          // factory fallback
//
// Works regardless of module load timing (lazy lookup of window.AssetsAdd).

(function(){
  // Helper that safely calls AssetsAdd methods when ready
  function call(method, ...args) {
    const A = window.AssetsAdd;
    if (A && typeof A[method] === 'function') return A[method](...args);
    console.warn(`[rtls-shim] AssetsAdd.${method} not ready yet`);
  }

  // Base proto with methods
  const Methods = {
    start(){ return call('start'); },
    stop(){ return call('stop'); },
    addForklift(){ return call('addForklift', ...arguments); },
    addLifter(){ return call('addLifter', ...arguments); },
    addExtinguisher(){ return call('addExtinguisher', ...arguments); },
    setScale(){ return call('setScale', ...arguments); },
    getState(){ return call('getState'); }
  };

  // Universal constructor function (works even if `class` semantics differ)
  function RTLSClient(state){ this.state = state || {}; }
  RTLSClient.prototype = Object.create(Methods);
  RTLSClient.prototype.constructor = RTLSClient;

  // Alias constructor some apps use
  function RTLS(state){ RTLSClient.call(this, state); }
  RTLS.prototype = Object.create(RTLSClient.prototype);
  RTLS.prototype.constructor = RTLS;

  // Factory
  function createRTLS(state){ return new RTLSClient(state); }

  // Expose globals but don't overwrite if they already exist
  if (typeof window.RTLSClient !== 'function') window.RTLSClient = RTLSClient;
  if (typeof window.RTLS       !== 'function') window.RTLS       = RTLS;
  if (typeof window.createRTLS !== 'function') window.createRTLS = createRTLS;

  // Also provide a prebuilt global instance for code that uses `window.rtls`
  if (!window.rtls) window.rtls = new RTLSClient({});
})();