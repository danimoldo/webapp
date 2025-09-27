// app.js (legacy shim - hotfix v2)
// This is a plain (non-module) script. It provides globals expected by older code paths.
(function () {
  // Provide a ui namespace with a renderEvents no-op to silence callers
  window.ui = window.ui || {};
  if (typeof window.ui.renderEvents !== 'function') {
    window.ui.renderEvents = function () { /* legacy no-op */ };
  }

  // Provide a tolerant emitEvent hook used by older simulators
  if (typeof window.emitEvent !== 'function') {
    window.emitEvent = function () { /* legacy no-op */ };
  }

  // Provide a tolerant drawMap placeholder (loop will guard its existence)
  if (typeof window.drawMap !== 'function') {
    window.drawMap = function () { /* legacy no-op */ };
  }

  console.log('[legacy shim] app.js loaded');
})();