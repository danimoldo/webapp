# Evora Demo (modular)
v5-2 (update)
Here’s what changed:
Left sidebar: collapsible + icon toggle
Added a floating icon button (hamburger) at the top-left to Show/Hide the left sidebar.
Sidebar state persists per-session; click again to toggle.
Polished the overlay toolbar (blur, subtle border, shadow).
Removed the right sidebar
The Detalii panel is gone.
Selection now just highlights in the Active list (which already shows device details). No broken references.
Top bar cleanup
Removed “Ascunde/Afișează” and “Încarcă imagine” (and its file input).
Kept the rest: Pauză/Pornește, Resetează poziția, Zone interzise, Șterge zonele, Descarcă config.
Zone drawing UX
When Zone interzise is clicked:
Canvas cursor switches to crosshair.
A bottom hint appears: “Mod zone: click pentru puncte • dublu-click închide • Z = undo • Esc = anulare”.
Undo with Z, cancel with Esc.
While drawing, a dashed preview line shows the polygon.
On close (double-click), the zone is saved; toast confirms.
“+ Adaugă dispozitive” now actually adds devices
Clicking the button opens a small modal: pick Tip (Stivuitor/Lifter/Extinctor) and ID.
Option to place on map by clicking the floor after saving.
Adds to the appropriate list (assets or extinguishers) and re-renders the map & list with a confirmation toast.
If you want, I can also:
move/resize the sidebar toggle icon,
make the left sidebar collapsible on hover,
tweak the list-item detail density,
add “Edit / Delete device” in the modal.

Start v1
- Deschide `index.html` local sau publică pe GitHub Pages (`main` -> Settings -> Pages).
- Editează UI în `components/*.html`, stilurile în `css/`, logica în `js/`.
- Datele se află în `data/*.json` (stivuitoare, liftere, extinctoare).
- În toolbar: Încarcă imagine (schimbă harta), Pauză, Resetează poziția,
- Zone interzise (desenează poligoane), Șterge zonele, Descarcă config (JSON).
