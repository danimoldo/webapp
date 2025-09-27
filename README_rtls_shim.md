# RTLS Shim Patch

This adds `js/rtls-shim.js` which maps your existing `rtls.*` calls
to the new `AssetsAdd` API.

Include order:

```html
<link rel="stylesheet" href="css/add-assets.css">
<script type="module" src="js/add-assets.js"></script>
<script src="js/rtls-shim.js"></script>
<script type="module" src="js/app.js"></script>
```

That way, `rtls.start()` works again.