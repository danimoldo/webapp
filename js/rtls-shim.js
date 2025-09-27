// js/rtls-shim.js
// Provides a stub RTLSClient class that delegates to AssetsAdd

class RTLSClient {
  constructor(state) {
    this.state = state;
  }
  start() { if (window.AssetsAdd?.start) window.AssetsAdd.start(); }
  stop()  { if (window.AssetsAdd?.stop) window.AssetsAdd.stop(); }

  addForklift(...args)     { return window.AssetsAdd?.addForklift(...args); }
  addLifter(...args)       { return window.AssetsAdd?.addLifter(...args); }
  addExtinguisher(...args) { return window.AssetsAdd?.addExtinguisher(...args); }
  setScale(...args)        { return window.AssetsAdd?.setScale(...args); }
  getState()               { return window.AssetsAdd?.getState(); }
}

// Expose globally
window.RTLSClient = RTLSClient;