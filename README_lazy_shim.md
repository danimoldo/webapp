# RTLS Shim (Lazy) — Fix for `rtls.start is not a function`

This version resolves script timing issues by looking up `window.AssetsAdd`
**at call time** instead of at load time.

## Include order (recommended)
```html
<link rel="stylesheet" href="css/add-assets.css">
<script type="module" src="js/add-assets.js"></script>
<script src="js/rtls-shim.js"></script>
<script type="module" src="js/app.js"></script>
```

## Quick test
Open DevTools → Console:
```js
typeof rtls, typeof rtls.start
// -> "object" "function"
rtls.start(); // should not throw; if AssetsAdd isn't ready yet you'll see a warning once, then it will work after load.
```