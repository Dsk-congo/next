(function () {
  /* Suivi des modifications locales pour la synchronisation Firebase (cloud.js).
     Installé le plus tôt possible pour ne manquer aucune écriture. */
  try {
    if (!window.__ngSuivi) {
      window.__ngSuivi = true;
      window.__ngAttente = [];
      var LOCAUX = { ng_session: 1, ng_client_tel: 1 };
      var setO = Storage.prototype.setItem, remO = Storage.prototype.removeItem;
      var noter = function (st, k) {
        if (st !== window.localStorage || !k || k.indexOf("ng_") !== 0 || LOCAUX[k] || k.indexOf("ng_sync") === 0) return;
        var mod = {};
        try { mod = JSON.parse(localStorage.getItem("ng_sync_mod") || "{}"); } catch (e) {}
        mod[k] = Date.now();
        setO.call(localStorage, "ng_sync_mod", JSON.stringify(mod));
        if (window.__ngPousser) window.__ngPousser(k); else window.__ngAttente.push(k);
      };
      Storage.prototype.setItem = function (k, v) { setO.call(this, k, v); noter(this, k); };
      Storage.prototype.removeItem = function (k) { remO.call(this, k); noter(this, k); };
      window.__ngSetOrig = setO; window.__ngRemOrig = remO;
    }
  } catch (e) {}
})();
/* =========================================================
   Thème du site, choisi par l'administrateur
   (Administration → Apparence). Le même thème s'applique au
   site public et à l'administration.
   Chargé dans le <head> pour éviter un flash de couleurs.
   ========================================================= */
(function () {
  var THEMES = [
    { id: "pro", nom: "NextGen Pro", couleurs: ["#F3F7FD", "#0B4AA2"], texte: "Bleu marine, bleu et or : style officiel et professionnel" },
    { id: "pro-ocean", nom: "Pro Océan", couleurs: ["#F1F8FC", "#0369A1"], texte: "Bleu océan et turquoise, frais et lumineux" },
    { id: "pro-emeraude", nom: "Pro Émeraude", couleurs: ["#F2F8F5", "#047857"], texte: "Vert émeraude et or, rassurant et naturel" },
    { id: "pro-bordeaux", nom: "Pro Bordeaux", couleurs: ["#FBF5F6", "#9F1239"], texte: "Bordeaux et or, élégant et premium" },
    { id: "pro-violet", nom: "Pro Violet", couleurs: ["#F7F5FD", "#6D28D9"], texte: "Violet et ambre, créatif et moderne" },
    { id: "pro-graphite", nom: "Pro Graphite", couleurs: ["#F4F5F7", "#0F172A"], texte: "Gris anthracite et orange, sobre et technique" },
    { id: "pro-nuit", nom: "Pro Nuit (sombre)", couleurs: ["#070D1C", "#60A5FA"], texte: "Mode sombre, reposant pour les yeux" },
    { id: "nextgen-clair", nom: "NextGen Clair", couleurs: ["#F3F7FC", "#1677E0"], texte: "Lumineux, bleu et vert du logo" },
    { id: "nextgen", nom: "NextGen Nuit", couleurs: ["#050E1C", "#34C6F4"], texte: "Couleurs du logo : bleu, cyan et vert" },
    { id: "nuit", nom: "Nuit", couleurs: ["#080C24", "#7C9CFF"], texte: "Bleu nuit, accent indigo" },
    { id: "clair", nom: "Clair", couleurs: ["#F4F6FD", "#3A56D4"], texte: "Fond clair, bleu profond" },
    { id: "cobalt", nom: "Cobalt", couleurs: ["#FFFFFF", "#1747D6"], texte: "Blanc et bleu cobalt" },
    { id: "cuivre", nom: "Cuivre", couleurs: ["#0F1417", "#E39B5B"], texte: "Ardoise et cuivre du Katanga" },
    { id: "malachite", nom: "Malachite", couleurs: ["#061410", "#3DDC97"], texte: "Vert malachite profond" }
  ];
  var POLICES = [
    { id: "jakarta", nom: "Plus Jakarta", texte: "Plus Jakarta Sans, nette et moderne" },
    { id: "moderne", nom: "Moderne", texte: "Space Grotesk + Inter" },
    { id: "elegante", nom: "Élégante", texte: "Fraunces + Inter" },
    { id: "arrondie", nom: "Arrondie", texte: "Nunito" },
    { id: "systeme", nom: "Système", texte: "Police de l’appareil, la plus rapide" }
  ];
  var TAILLES = [
    { id: "petit", nom: "Petite" },
    { id: "normal", nom: "Normale" },
    { id: "grand", nom: "Grande" }
  ];

  function lire(cle, defaut) {
    try { return localStorage.getItem(cle) || defaut; } catch (e) { return defaut; }
  }
  function reglages() {
    return { theme: lire("ng_theme_site", "pro"), font: lire("ng_font_site", "jakarta"), size: lire("ng_size_site", "normal") };
  }
  function appliquer(r) {
    r = r || reglages();
    var html = document.documentElement;
    html.setAttribute("data-theme", r.theme);
    html.setAttribute("data-skin", String(r.theme).indexOf("pro") === 0 ? "pro" : "");
    html.setAttribute("data-font", r.font);
    html.setAttribute("data-size", r.size);
    var meta = document.querySelector('meta[name="theme-color"]');
    var t = THEMES.filter(function (x) { return x.id === r.theme; })[0];
    if (meta && t) meta.setAttribute("content", t.couleurs[0]);
  }
  function enregistrer(r) {
    try {
      localStorage.setItem("ng_theme_site", r.theme);
      localStorage.setItem("ng_font_site", r.font);
      localStorage.setItem("ng_size_site", r.size);
    } catch (e) {}
    appliquer(r);
  }
  /* Si l'admin change le thème dans un autre onglet, la page suit */
  window.addEventListener("storage", function (e) { if (e.key && e.key.indexOf("ng_") === 0 && e.key.indexOf("_site") > 0) appliquer(); });

  /* Avec Firebase : la page attend la dernière version des données (3 s maximum) */
  try {
    var F = window.NG_FIREBASE || {};
    if (F.apiKey && F.projectId && !sessionStorage.getItem("ng_sync_ok")) {
      document.documentElement.classList.add("ng-sync");
      setTimeout(function () { document.documentElement.classList.remove("ng-sync"); }, 3000);
    }
  } catch (e) {}
  appliquer();
  window.NGTheme = { appliquer: appliquer, enregistrer: enregistrer, reglages: reglages, THEMES: THEMES, POLICES: POLICES, TAILLES: TAILLES };
})();
