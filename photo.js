/* =========================================================
   Photo de profil : recadrer (glisser), zoomer, pivoter.
   NGPhoto.recadrer(fichier) → Promise(dataURL JPEG carré ou null)
   NGPhoto.avatar(personne, taille) → HTML (photo ou initiales)
   ========================================================= */
(function () {
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function initiales(n) { return esc(String(n || "?").split(" ").filter(Boolean).map(function (m) { return m[0]; }).join("").slice(0, 2).toUpperCase()); }
  function avatar(p, taille) {
    taille = taille || 48;
    var st = 'style="width:' + taille + "px;height:" + taille + "px;font-size:" + Math.round(taille * 0.36) + 'px"';
    return p && p.photo ? '<img class="ng-av" ' + st + ' src="' + esc(p.photo) + '" alt="Photo de ' + esc(p.nom) + '">' : '<span class="ng-av ng-av-ini" ' + st + ' aria-hidden="true">' + initiales(p && p.nom) + "</span>";
  }
  var css = document.createElement("style");
  css.textContent = ".ng-av{border-radius:50%;object-fit:cover;flex-shrink:0;display:inline-grid;place-items:center;border:3px solid #f7c948;background:#eaf1ff;color:#0b4aa2;font-weight:800}" +
    ".ng-rc{width:min(420px,calc(100vw - 24px));border:0;border-radius:22px;padding:0;box-shadow:0 30px 80px rgba(4,23,53,.35)}.ng-rc::backdrop{background:rgba(4,23,53,.55)}" +
    ".ng-rc-b{padding:18px;display:grid;gap:12px;font-family:inherit}.ng-rc h2{margin:0;font-size:1.2rem}.ng-rc-z{position:relative;width:300px;max-width:100%;aspect-ratio:1;margin:0 auto;border-radius:16px;overflow:hidden;background:#eef2f8}" +
    ".ng-rc-z canvas{width:100%;height:100%;display:block;cursor:grab;touch-action:none}.ng-rc-o{position:absolute;inset:0;pointer-events:none;border-radius:50%;box-shadow:0 0 0 999px rgba(4,23,53,.45);border:2px solid #fff}" +
    ".ng-rc-a{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end}.ng-rc button{min-height:42px;padding:0 16px;border-radius:999px;border:1px solid #cfd9e8;background:#fff;font:700 14px inherit;cursor:pointer}.ng-rc .ok{background:#0b4aa2;color:#fff;border-color:#0b4aa2}.ng-rc input[type=range]{width:100%}";
  document.head.appendChild(css);
  function recadrer(source, taille) {
    taille = taille || 360;
    return new Promise(function (ok) {
      var lire = typeof source === "string" ? Promise.resolve(source) : new Promise(function (r) { var fr = new FileReader(); fr.onload = function () { r(fr.result); }; fr.readAsDataURL(source); });
      lire.then(function (url) {
        var im = new Image();
        im.onload = function () {
          var d = document.createElement("dialog");
          d.className = "ng-rc";
          d.setAttribute("aria-label", "Recadrer la photo");
          d.innerHTML = '<div class="ng-rc-b"><h2>Ajuster ma photo</h2><p style="margin:0;color:#5d6b82;font-size:.9rem">Glissez la photo pour la placer et réglez le zoom.</p><div class="ng-rc-z"><canvas width="300" height="300"></canvas><div class="ng-rc-o"></div></div><label style="display:grid;gap:4px;font-weight:600;font-size:.9rem">Zoom<input type="range" min="1" max="4" step="0.01" value="1"></label><div class="ng-rc-a"><button type="button" data-rot>↻ Pivoter</button><button type="button" data-non>Annuler</button><button type="button" class="ok" data-oui>Utiliser cette photo</button></div></div>';
          document.body.appendChild(d);
          var cv = d.querySelector("canvas"), ctx = cv.getContext("2d"), z = d.querySelector("input"), base = 300 / Math.min(im.width, im.height), zoom = 1, rot = 0, x = 0, y = 0, g = null;
          function dessiner(c, t) { var k = t / 300, s = base * zoom * k; c.fillStyle = "#fff"; c.fillRect(0, 0, t, t); c.save(); c.translate(t / 2 + x * k, t / 2 + y * k); c.rotate(rot * Math.PI / 2); c.drawImage(im, -im.width * s / 2, -im.height * s / 2, im.width * s, im.height * s); c.restore(); }
          function maj() { dessiner(ctx, 300); }
          z.addEventListener("input", function () { zoom = Number(z.value); maj(); });
          cv.addEventListener("pointerdown", function (e) { g = [e.clientX - x, e.clientY - y]; cv.setPointerCapture(e.pointerId); });
          cv.addEventListener("pointermove", function (e) { if (g) { x = e.clientX - g[0]; y = e.clientY - g[1]; maj(); } });
          cv.addEventListener("pointerup", function () { g = null; });
          d.querySelector("[data-rot]").addEventListener("click", function () { rot = (rot + 1) % 4; maj(); });
          function fin(v) { d.close(); d.remove(); ok(v); }
          d.querySelector("[data-non]").addEventListener("click", function () { fin(null); });
          d.addEventListener("cancel", function (e) { e.preventDefault(); fin(null); });
          d.querySelector("[data-oui]").addEventListener("click", function () { var o = document.createElement("canvas"); o.width = taille; o.height = taille; dessiner(o.getContext("2d"), taille); fin(o.toDataURL("image/jpeg", 0.86)); });
          d.showModal(); maj();
        };
        im.onerror = function () { alert("Cette image ne peut pas être lue. Choisissez une photo JPG ou PNG."); ok(null); };
        im.src = url;
      });
    });
  }
  window.NGPhoto = { recadrer: recadrer, avatar: avatar };
})();
