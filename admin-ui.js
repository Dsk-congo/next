/* Administration – confort d'utilisation : carte de profil dans le menu,
   recherche de menu, aperçu en direct du site public, boutons flottants. */
(function () {
  var A = window.NGA;
  if (!A) return;
  var side = document.getElementById("side"), nav = document.getElementById("admin-nav");

  /* Carte de profil et recherche, insérées une seule fois au-dessus du menu */
  var profil = document.createElement("a");
  profil.className = "side-profil"; profil.href = "#compte"; profil.title = "Mon compte";
  var recherche = document.createElement("label");
  recherche.className = "side-recherche";
  recherche.innerHTML = '<span class="sr-only">Chercher un menu</span><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 18a7 7 0 100-14 7 7 0 000 14zM21 21l-4.3-4.3"/></svg><input type="search" placeholder="Chercher un menu…" autocomplete="off">';
  side.insertBefore(recherche, nav);
  side.insertBefore(profil, recherche);
  function majCarte() {
    var a = A.moi(); if (!a) return;
    var role = (A.roles()[a.role] || {}).nom || a.role;
    profil.innerHTML = A.avatar(a, 46, true) + '<span style="min-width:0"><strong>' + A.esc(a.nom) + "</strong><small>" + A.esc(role) + (a.poste ? " · " + A.esc(a.poste) : "") + "</small><small>ID : " + A.esc(a.id) + "</small></span>";
  }
  var champ = recherche.querySelector("input");
  function filtrer() {
    var q = champ.value.trim().toLowerCase();
    nav.querySelectorAll(".nav-group").forEach(function (g) {
      var vus = 0;
      g.querySelectorAll("a").forEach(function (l) { var ok = !q || l.textContent.toLowerCase().indexOf(q) > -1; l.hidden = !ok; if (ok) vus++; });
      g.hidden = !vus;
    });
  }
  champ.addEventListener("input", filtrer);
  champ.addEventListener("keydown", function (e) { if (e.key === "Enter") { var l = nav.querySelector("a:not([hidden])"); if (l) { location.hash = l.getAttribute("href"); champ.value = ""; filtrer(); } } });

  /* Boutons flottants : aperçu en direct et voir le site */
  var flot = document.createElement("div");
  flot.className = "admin-flottants";
  flot.innerHTML = '<button type="button" class="btn btn-gold" id="btn-apercu" aria-expanded="false" aria-controls="apercu">👁 Aperçu en direct</button><a class="btn btn-blanc" href="index.html" target="_blank" rel="noopener">🌐 Voir le site</a>';
  var panneau = document.createElement("aside");
  panneau.className = "apercu-direct"; panneau.id = "apercu"; panneau.setAttribute("aria-label", "Aperçu en direct du site public");
  panneau.innerHTML = '<header><span>Aperçu en direct du site</span><span style="display:flex;gap:8px"><button type="button" class="btn btn-verre btn-sm" id="apercu-recharger">Actualiser</button><button type="button" class="btn btn-verre btn-sm" id="apercu-fermer" aria-label="Fermer l’aperçu">×</button></span></header><iframe title="Site public" loading="lazy"></iframe>';
  var app = document.getElementById("ecran-admin");
  app.appendChild(flot); app.appendChild(panneau);
  var cadre = panneau.querySelector("iframe"), bouton = flot.querySelector("#btn-apercu");
  function ouvrir(o) {
    panneau.classList.toggle("ouvert", o);
    bouton.setAttribute("aria-expanded", String(o));
    if (o && !cadre.src) cadre.src = "index.html";
  }
  bouton.addEventListener("click", function () { ouvrir(!panneau.classList.contains("ouvert")); });
  /* Bouton « Aperçu » dans la barre du haut (remplace les boutons flottants) */
  var haut = document.querySelector(".admin-top .top-right"), voir = haut && haut.querySelector('a[href="index.html"]');
  if (haut) { var bh = document.createElement("button"); bh.type = "button"; bh.className = "btn btn-ghost btn-sm btn-apercu-haut hide-sm"; bh.innerHTML = "👁 Aperçu du site"; bh.addEventListener("click", function () { ouvrir(!panneau.classList.contains("ouvert")); }); haut.insertBefore(bh, voir || haut.firstChild); }
  panneau.querySelector("#apercu-fermer").addEventListener("click", function () { ouvrir(false); bouton.focus(); });
  panneau.querySelector("#apercu-recharger").addEventListener("click", function () { cadre.src = "index.html?t=" + Date.now(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && panneau.classList.contains("ouvert")) ouvrir(false); });
  /* Après chaque enregistrement, l'aperçu se met à jour tout seul */
  window.addEventListener("storage", function () {});
  var timer;
  var origLog = A.S.log;
  A.S.log = function () { var r = origLog.apply(this, arguments); if (panneau.classList.contains("ouvert")) { clearTimeout(timer); timer = setTimeout(function () { cadre.src = "index.html?t=" + Date.now(); }, 400); } return r; };

  /* La carte suit les changements de profil et de vue */
  var origMaj = A.majProfil;
  A.majProfil = function () { origMaj.apply(this, arguments); majCarte(); };
  window.addEventListener("hashchange", function () { setTimeout(function () { majCarte(); filtrer(); }, 0); });
  var obs = new MutationObserver(function () { if (!document.getElementById("ecran-admin").hidden) majCarte(); });
  obs.observe(document.getElementById("ecran-admin"), { attributes: true, attributeFilter: ["hidden"] });
  majCarte();
})();

/* Recadrer et redimensionner une photo de profil (glisser pour placer, curseur pour zoomer) */
(function () {
  var A = window.NGA;
  if (!A) return;
  A.recadrer = function (source, taille) {
    taille = taille || 400;
    return new Promise(function (ok) {
      var lire = typeof source === "string" ? Promise.resolve(source) : new Promise(function (r) { var fr = new FileReader(); fr.onload = function () { r(fr.result); }; fr.readAsDataURL(source); });
      lire.then(function (url) {
        var im = new Image();
        im.onload = function () {
          var d = document.createElement("dialog");
          d.className = "modal recadreur";
          d.innerHTML = '<form method="dialog"><div class="modal-head"><h2>Recadrer la photo</h2></div><div class="modal-body"><p class="muted">Glissez la photo pour la placer, réglez le zoom, puis validez.</p><div class="rc-zone"><canvas width="320" height="320" aria-label="Aperçu du recadrage"></canvas><div class="rc-rond" aria-hidden="true"></div></div><label class="field">Zoom<input type="range" min="1" max="4" step="0.01" value="1" name="zoom"></label><div class="hero-actions"><button type="button" class="btn btn-ghost btn-sm" data-rot>↻ Pivoter</button><button type="button" class="btn btn-ghost btn-sm" data-reset>Recentrer</button></div></div><div class="modal-foot"><button type="button" class="btn btn-ghost" data-annuler>Annuler</button><button type="button" class="btn btn-primary" data-ok>Utiliser cette photo</button></div></form>';
          document.body.appendChild(d);
          var cv = d.querySelector("canvas"), ctx = cv.getContext("2d"), z = d.querySelector("[name=zoom]");
          var base = 320 / Math.min(im.width, im.height), zoom = 1, rot = 0, x = 0, y = 0, glisse = null;
          function dessiner(c, t) {
            var k = t / 320, s = base * zoom * k;
            c.fillStyle = "#fff"; c.fillRect(0, 0, t, t);
            c.save(); c.translate(t / 2 + x * k, t / 2 + y * k); c.rotate(rot * Math.PI / 2);
            c.drawImage(im, -im.width * s / 2, -im.height * s / 2, im.width * s, im.height * s); c.restore();
          }
          function maj() { dessiner(ctx, 320); }
          z.addEventListener("input", function () { zoom = Number(z.value); maj(); });
          cv.addEventListener("pointerdown", function (e) { glisse = [e.clientX - x, e.clientY - y]; cv.setPointerCapture(e.pointerId); });
          cv.addEventListener("pointermove", function (e) { if (!glisse) return; x = e.clientX - glisse[0]; y = e.clientY - glisse[1]; maj(); });
          cv.addEventListener("pointerup", function () { glisse = null; });
          cv.addEventListener("wheel", function (e) { e.preventDefault(); zoom = Math.max(1, Math.min(4, zoom - e.deltaY * 0.002)); z.value = zoom; maj(); }, { passive: false });
          d.querySelector("[data-rot]").addEventListener("click", function () { rot = (rot + 1) % 4; maj(); });
          d.querySelector("[data-reset]").addEventListener("click", function () { x = 0; y = 0; zoom = 1; z.value = 1; rot = 0; maj(); });
          function fermer(v) { d.close(); d.remove(); ok(v); }
          d.querySelector("[data-annuler]").addEventListener("click", function () { fermer(null); });
          d.addEventListener("cancel", function (e) { e.preventDefault(); fermer(null); });
          d.querySelector("[data-ok]").addEventListener("click", function () {
            var out = document.createElement("canvas"); out.width = taille; out.height = taille;
            dessiner(out.getContext("2d"), taille);
            fermer(out.toDataURL("image/jpeg", 0.88));
          });
          d.showModal(); maj();
        };
        im.onerror = function () { A.toast("Image illisible", "warn"); ok(null); };
        im.src = url;
      });
    });
  };
})();

/* Firebase : état de la connexion et mise à jour en direct de l'écran */
(function () {
  var A = window.NGA;
  if (!A) return;
  var top = document.querySelector(".admin-top");
  var puce = document.createElement("span");
  puce.className = "cloud-puce";
  puce.setAttribute("role", "status");
  function etat() {
    var c = window.NGCloud;
    var F = window.NG_FIREBASE || {};
    if (c && c.actif) { puce.className = "cloud-puce ok"; puce.innerHTML = "☁ Synchronisé"; puce.title = "Données partagées en direct via Firebase (projet " + c.projet + ")"; }
    else if (c && c.etat === "erreur") { puce.className = "cloud-puce ko"; puce.innerHTML = "☁ Firebase injoignable"; puce.title = c.erreur || ""; }
    else if (F.apiKey) { puce.className = "cloud-puce"; puce.innerHTML = "☁ Connexion…"; }
    else { puce.className = "cloud-puce local"; puce.innerHTML = "💾 Mode local"; puce.title = "Renseignez firebase-config.js pour partager les données entre appareils"; }
  }
  if (top) top.insertBefore(puce, top.querySelector(".top-right"));
  etat();
  window.addEventListener("ng-cloud", etat);
  window.addEventListener("ng-donnees", function (e) {
    var cles = (e.detail && e.detail.cles) || [];
    if (A.afficherEnLigne) A.afficherEnLigne();
    if (cles.every(function (k) { return k === "ng_presence"; })) return;
    if (document.getElementById("ecran-admin").hidden) return;
    var actif = document.activeElement;
    var occupe = document.querySelector("dialog[open]") || (actif && /INPUT|TEXTAREA|SELECT/.test(actif.tagName) && A.vue.contains(actif));
    if (occupe) return;
    A.rafraichir();
    A.toast("Données mises à jour depuis un autre appareil");
  });
})();

/* Alerte immédiate quand un client crée un ticket, une demande ou une inscription (autre onglet ou autre appareil) */
(function () {
  var A = window.NGA;
  if (!A) return;
  var S = A.S;
  var SUIVIS = [["tickets", "🔔 Nouveau ticket", function (x) { return x.id + " : " + x.sujet; }, function (x) { return "#tickets/" + x.id; }],
    ["demandes", "📄 Nouvelle demande de devis", function (x) { return x.id + " · " + (x.entreprise || x.nom); }, function (x) { return "#demandes/" + x.id; }],
    ["inscriptions", "🎓 Nouvelle inscription", function (x) { return x.nom + " · " + x.formation; }, function () { return "#inscriptions"; }],
    ["chats", "💬 Un visiteur démarre un chat", function (x) { return x.nom; }, function () { return "#chat"; }, "chat"],
    ["rendezvous", "📅 Nouveau rendez-vous", function (x) { return x.nom + " · " + x.date + " " + x.heure; }, function () { return "#rendezvous"; }, "rendezvous"],
    ["parrainages", "🤝 Entreprise recommandée", function (x) { return x.entreprise + " (par " + x.parrainNom + ")"; }, function () { return "#parrainages"; }, "parrainages"],
    ["commandes_partenaires", "📦 Commande d’un partenaire", function (x) { return x.partenaireNom || ""; }, function () { return "#partenaires"; }, "partenaires"],
    ["messages", "✉ Nouveau message (page Contact)", function (x) { return x.nom + " · " + (x.sujet || ""); }, function () { return "#messages"; }, "messages"],
    ["candidatures", "👤 Nouvelle candidature", function (x) { return x.nom + " · " + x.poste; }, function () { return "#recrutement"; }, "recrutement"],
    ["paiements_declares", "💳 Paiement déclaré par un client", function (x) { return x.facture + " · " + A.argent(x.montant) + " · " + x.mode; }, function () { return "#paiements"; }, "paiements"],
    ["demandes_mdp", "🔑 Mot de passe oublié", function (x) { return x.nom || x.identifiant; }, function (x) { return "#notifications/mdp-" + x.id; }, "notifications"]];
  var connus = {};
  function lire(nom) { return nom === "demandes" ? S.demandes() : S.liste(nom); }
  SUIVIS.forEach(function (c) { connus[c[0]] = {}; lire(c[0]).forEach(function (x) { connus[c[0]][x.id] = 1; }); });
  var bandeau = document.createElement("div");
  bandeau.className = "alerte-live"; bandeau.setAttribute("role", "status"); bandeau.hidden = true;
  document.body.appendChild(bandeau);
  function verifier() {
    if (document.getElementById("ecran-admin").hidden) return;
    var nouveaux = [];
    SUIVIS.forEach(function (c) {
      lire(c[0]).forEach(function (x) { if (!connus[c[0]][x.id]) { connus[c[0]][x.id] = 1; if (A.autorise(c[4] || c[0])) nouveaux.push({ titre: c[1], txt: c[2](x), lien: c[3](x) }); } });
    });
    if (!nouveaux.length) return;
    var n = nouveaux[0];
    bandeau.innerHTML = "<strong>" + A.esc(n.titre) + "</strong><span>" + A.esc(n.txt) + (nouveaux.length > 1 ? " (+" + (nouveaux.length - 1) + ")" : "") + '</span><a class="btn btn-gold btn-sm" href="' + n.lien + '">👁 Ouvrir</a><button type="button" aria-label="Fermer l’alerte">×</button>';
    bandeau.hidden = false;
    bandeau.querySelector("button").onclick = function () { bandeau.hidden = true; };
    bandeau.querySelector("a").onclick = function () { bandeau.hidden = true; };
    try { var ctx = new (window.AudioContext || window.webkitAudioContext)(), o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 880; g.gain.value = 0.06; o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.18); } catch (e) {}
    clearTimeout(bandeau._t); bandeau._t = setTimeout(function () { bandeau.hidden = true; }, 20000);
    if (A.menu) A.menu((location.hash.slice(1).split("/")[0]) || "tableau");
  }
  window.addEventListener("ng-donnees", function () { setTimeout(verifier, 50); });
  window.addEventListener("storage", function (e) { if (e.key && /^ng_(tickets|demandes|inscriptions|demandes_mdp|paiements_declares|messages|candidatures|chats|rendezvous|parrainages|commandes_partenaires)$/.test(e.key)) setTimeout(verifier, 50); });
  setInterval(verifier, 15000);
})();

/* Sécurité : déconnexion automatique après 30 minutes sans activité */
(function () {
  var A = window.NGA; if (!A) return;
  var DUREE = 30 * 60000, dernier = Date.now(), prevenu = false;
  ["click", "keydown", "pointermove", "scroll", "touchstart"].forEach(function (ev) { document.addEventListener(ev, function () { dernier = Date.now(); prevenu = false; }, { passive: true, capture: true }); });
  setInterval(function () {
    if (document.getElementById("ecran-admin").hidden) return;
    var reste = DUREE - (Date.now() - dernier);
    if (reste <= 60000 && reste > 0 && !prevenu) { prevenu = true; A.toast("Sans activité, vous serez déconnecté dans 1 minute", "warn"); }
    if (reste <= 0) { var b = document.getElementById("logout"); if (b) { A.S.log("Déconnexion automatique", "30 minutes sans activité"); b.click(); } dernier = Date.now(); }
  }, 15000);
})();

/* Marque « administration ouverte sur cet appareil » (non synchronisée) : permet d'ouvrir les documents non publiés */
(function () {
  function marquer() { try { if (!document.getElementById("ecran-admin").hidden) localStorage.setItem("nga_admin_ouvert", String(Date.now())); } catch (e) {} }
  setInterval(marquer, 60000); setTimeout(marquer, 1500); window.addEventListener("hashchange", marquer); document.addEventListener("click", function () { setTimeout(marquer, 300); }, { once: false, passive: true });
  var lo = document.getElementById("logout"); if (lo) lo.addEventListener("click", function () { try { localStorage.removeItem("nga_admin_ouvert"); } catch (e) {} });
})();

/* Sauvegarde automatique chaque semaine (Super admin) : copie gardée sur l'appareil et en ligne si possible */
(function () {
  var A = window.NGA; if (!A) return;
  A.donneesSauvegarde = function () { var d = {}; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k.indexOf("ng_") === 0 && k.indexOf("ng_sync") !== 0 && k !== "ng_session") d[k] = localStorage.getItem(k); } return JSON.stringify({ application: "NextGenIT", version: 1, date: new Date().toISOString(), automatique: true, donnees: d }); };
  function verifier() {
    var m = A.moi(); if (!m || m.role !== "super" || !window.NGFichiers) return;
    var der = localStorage.getItem("ng_sauvegarde_auto_le");
    if (der && Date.now() - new Date(der).getTime() < 7 * 864e5) return;
    var blob = new Blob([A.donneesSauvegarde()], { type: "application/json" });
    window.NGFichiers.enregistrer("sauvegarde-auto", blob).then(function () {
      localStorage.setItem("ng_sauvegarde_auto_le", new Date().toISOString());
      A.S.log("Sauvegarde automatique hebdomadaire", Math.round(blob.size / 1024) + " Ko" + (window.NGFichiers.enLigne(blob.size) ? " · copie en ligne" : " · copie sur cet appareil"));
    }).catch(function () {});
  }
  var obs = new MutationObserver(function () { if (!document.getElementById("ecran-admin").hidden) setTimeout(verifier, 4000); });
  obs.observe(document.getElementById("ecran-admin"), { attributes: true, attributeFilter: ["hidden"] });
  if (!document.getElementById("ecran-admin").hidden) setTimeout(verifier, 4000);
})();
