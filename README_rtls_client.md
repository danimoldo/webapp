# RTLSClient Shim

This patch provides a **stub RTLSClient class** so your code:

```js
const rtls = new RTLSClient(state);
rtls.start();
```

works again. Methods delegate to the Stage‑1 AssetsAdd API.

## Files
- `js/rtls-shim.js`

## Integration
In `index.html`, include in this order:

```html
<link rel="stylesheet" href="css/add-assets.css">
<script type="module" src="js/add-assets.js"></script>
<script src="js/rtls-shim.js"></script>
<script type="module" src="js/app.js"></script>
```

## Quick check
Open DevTools Console:
```js
typeof RTLSClient        // "function"
new RTLSClient({}).start // should call AssetsAdd.start()
```