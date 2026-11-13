/* =========================================================
   Administration NextGenIT – noyau
   Outils communs, connexion, rôles, présence en ligne,
   navigation, fenêtres modales et graphiques animés.

   ⚠ VERSION DE DÉMONSTRATION : données et connexion dans le
   navigateur. Avant la mise en production, branchez une base
   de données et une authentification serveur (voir README).
   ========================================================= */
(function () {
  var S = window.NGStore, C = window.NG_CONTENU, T = window.NGTheme;
  var HASH_DEFAUT = "992f5e39cc20f487b29547df9d24193c576f59b34f500e1c5d0c7d95922b3f67"; // admin@nextgenit.com / NextGenIT@2026

  /* ---------- Outils ---------- */
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function argent(n) { return "$\u00a0" + Number(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function jour(iso) { return iso ? new Date(iso).toLocaleDateString("fr-FR") : "—"; }
  function heure(iso) { return iso ? new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"; }
  function moisDe(iso) { return (iso || "").slice(0, 7); }
  var MOIS = new Date().toISOString().slice(0, 7);
  function nomMois(m, court) { return new Date(m + "-01T12:00:00").toLocaleDateString("fr-FR", court ? { month: "short" } : { month: "long", year: "numeric" }); }
  function moisPrecedents(n) {
    var out = [], d = new Date();
    d.setDate(1);
    for (var i = n - 1; i >= 0; i--) { var x = new Date(d.getFullYear(), d.getMonth() - i, 1, 12); out.push(x.toISOString().slice(0, 7)); }
    return out;
  }
  function uid(p) { return (p || "ID-") + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase(); }
  function toast(t, type) {
    document.querySelectorAll(".toast").forEach(function (x) { x.remove(); });
    var el = document.createElement("div");
    el.className = "toast" + (type ? " toast-" + type : "");
    el.setAttribute("role", "status");
    el.textContent = t;
    document.body.appendChild(el);
    setTimeout(function () { el.classList.add("out"); }, 2600);
    setTimeout(function () { el.remove(); }, 3000);
  }
  function sha256(txt) {
    if (!window.crypto || !crypto.subtle) { alert("Ouvrez l’administration via https:// (GitHub Pages) ou un serveur local."); return Promise.resolve(""); }
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(txt)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
    });
  }
  function motDePasse() {
    var a = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789", out = "";
    var r = new Uint32Array(10);
    (window.crypto || window.msCrypto).getRandomValues(r);
    for (var i = 0; i < 10; i++) out += a[r[i] % a.length];
    return out + "!";
  }
  function options(liste, actuel) {
    return liste.map(function (o) { var v = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o; return '<option value="' + esc(v) + '"' + (String(v) === String(actuel) ? " selected" : "") + ">" + esc(l) + "</option>"; }).join("");
  }
  /* Export en PDF : ouvre un rapport mis en page (logo, titre, date) prêt à « Enregistrer au format PDF » */
  function csv(nom, lignes) {
    var R = S.reglages(), titre = nom.charAt(0).toUpperCase() + nom.slice(1).replace(/-/g, " ");
    var w = window.open("", "_blank");
    if (!w) { toast("Autorisez les fenêtres pour exporter en PDF", "warn"); return; }
    var e = function (t) { return String(t == null ? "" : t).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); };
    var tete = lignes[0] || [], corps = lignes.slice(1);
    w.document.write('<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>' + e(titre) + " – NextGenIT</title><style>" +
      "@page{size:A4 landscape;margin:12mm}body{font:12px Inter,system-ui,Arial,sans-serif;color:#0B1033;margin:0;padding:18px}" +
      ".h{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #0b4aa2;padding-bottom:10px;margin-bottom:14px}.h img{height:54px}" +
      "h1{font-size:20px;margin:0}small{color:#5d6b82}table{width:100%;border-collapse:collapse}th{background:#041735;color:#fff;text-align:left;padding:7px 8px;font-size:11px}" +
      "td{padding:6px 8px;border-bottom:1px solid #E1E6F5;vertical-align:top}tr:nth-child(even) td{background:#F5F8FD}.bar{margin-bottom:12px}.bar button{padding:10px 16px;border:0;border-radius:8px;background:#0b4aa2;color:#fff;font-weight:700;cursor:pointer}@media print{.bar{display:none}}" +
      '</style></head><body><div class="bar"><button onclick="print()">Enregistrer en PDF / Imprimer</button></div><div class="h"><div><h1>' + e(titre) + "</h1><small>" + e(R.raisonSociale) + " · édité le " + new Date().toLocaleString("fr-FR") + " · " + corps.length + ' ligne(s)</small></div><img src="' + e(new URL(img(R.logo), location.href).href) + '" alt=""></div>' +
      "<table><thead><tr>" + tete.map(function (c) { return "<th>" + e(c) + "</th>"; }).join("") + "</tr></thead><tbody>" + corps.map(function (l) { return "<tr>" + l.map(function (c) { return "<td>" + e(c) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table>" +
      "<script>setTimeout(function(){print()},600)<\/script></body></html>");
    w.document.close();
    S.log("Export PDF", nom);
  }
  function interrupteur(attr, actif, label) {
    return '<button type="button" class="switch" ' + attr + ' role="switch" aria-checked="' + actif + '" aria-label="' + esc(label) + '"><span></span></button>';
  }
  function img(chemin) { return !chemin ? "" : /^(data:|https?:|blob:)/.test(chemin) ? chemin : "" + chemin; }
  function initiales(n) { return String(n || "?").split(/\s+/).map(function (x) { return x[0]; }).join("").slice(0, 2).toUpperCase(); }
  function avatar(p, taille, enLigne) {
    taille = taille || 38;
    var c = '<span class="av" style="width:' + taille + "px;height:" + taille + "px;font-size:" + Math.round(taille * 0.36) + 'px">' + (p && p.photo ? '<img src="' + esc(p.photo) + '" alt="">' : esc(initiales(p && p.nom))) + (enLigne ? '<i class="av-dot" aria-label="en ligne"></i>' : "") + "</span>";
    return c;
  }
  function redimensionner(fichier, max) {
    return new Promise(function (ok, ko) {
      var r = new FileReader();
      r.onload = function () {
        var im = new Image();
        im.onload = function () {
          var k = Math.min(1, max / Math.max(im.width, im.height));
          var cv = document.createElement("canvas");
          cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k);
          cv.getContext("2d").drawImage(im, 0, 0, cv.width, cv.height);
          ok(cv.toDataURL(fichier.type === "image/png" ? "image/png" : "image/jpeg", 0.86));
        };
        im.onerror = ko;
        im.src = r.result;
      };
      r.onerror = ko;
      r.readAsDataURL(fichier);
    });
  }

  /* ---------- Modules, groupes et rôles ---------- */
  var GROUPES = [
    ["Pilotage", [["tableau", "Tableau de bord"], ["notifications", "Notifications"], ["rapports", "Rapports financiers"], ["journal", "Historique"]]],
    ["Commercial", [["demandes", "Demandes et devis"], ["messages", "Messages reçus"], ["chat", "Chat en direct"], ["rendezvous", "Rendez-vous"], ["clients", "Clients (CRM)"], ["comptesclients", "Comptes clients"], ["pipeline", "Pipeline commercial"], ["avis", "Avis clients"], ["realisations", "Réalisations"], ["partenaires", "Partenaires"], ["parrainages", "Parrainages"]]],
    ["Opérations", [["calendrier", "Calendrier partagé"], ["projets", "Projets (Kanban, Gantt)"], ["interventions", "Interventions"], ["tickets", "Helpdesk et tickets"], ["stock", "Stock et matériel"], ["parc", "Parc des clients"], ["supervision", "Supervision en ligne"], ["vehicules", "Véhicules et carburant"], ["techniciens", "Personnel et RH"]]],
    ["Finances", [["factures", "Factures et devis"], ["paiements", "Paiements et caisse"], ["depenses", "Dépenses et paie"]]],
    ["Académie", [["formations", "Formations et cours"], ["inscriptions", "Inscriptions"], ["etudiants", "Comptes étudiants"], ["ressources", "Publications ciblées"], ["suivi", "Présences et évaluations"]]],
    ["Administration", [["admins", "Administrateurs et droits"], ["site", "Site public"], ["connaissances", "Centre d’aide"], ["newsletter", "Newsletter"], ["recrutement", "Recrutement"], ["apparence", "Apparence"], ["parametres", "Paramètres et documents"], ["compte", "Mon compte"]]]
  ];
  var MODULES = [];
  GROUPES.forEach(function (g) { g[1].forEach(function (m) { MODULES.push(m); }); });
  var TOUS = MODULES.map(function (m) { return m[0]; });
  var ROLES_DEFAUT = {
    super: { nom: "Super admin", modules: TOUS },
    gestionnaire: { nom: "Gestionnaire", modules: TOUS.filter(function (m) { return m !== "admins"; }) },
    comptable: { nom: "Comptable", modules: ["tableau", "notifications", "rapports", "journal", "clients", "factures", "paiements", "depenses", "compte"] },
    formateur: { nom: "Formateur", modules: ["tableau", "notifications", "calendrier", "formations", "etudiants", "ressources", "suivi", "compte"] },
    technicien: { nom: "Technicien", modules: ["tableau", "notifications", "calendrier", "projets", "interventions", "tickets", "stock", "compte"] },
    support: { nom: "Agent support", modules: ["tableau", "notifications", "clients", "comptesclients", "demandes", "commandes", "tickets", "inscriptions", "compte"] }
  };
  function roles() {
    var r = S.liste("roles");
    if (!r || Array.isArray(r)) r = JSON.parse(JSON.stringify(ROLES_DEFAUT));
    Object.keys(ROLES_DEFAUT).forEach(function (k) { if (!r[k]) r[k] = JSON.parse(JSON.stringify(ROLES_DEFAUT[k])); });
    /* Nouveaux modules ajoutés aux rôles déjà enregistrés */
    var NOUVEAUX = { gestionnaire: ["calendrier", "avis", "realisations", "parc", "supervision", "vehicules", "newsletter", "messages", "recrutement", "connaissances", "chat", "rendezvous", "partenaires", "parrainages"], technicien: ["calendrier", "parc", "supervision", "vehicules"], support: ["avis", "parc", "supervision", "messages", "connaissances", "chat", "rendezvous"], comptable: ["vehicules"] };
    Object.keys(NOUVEAUX).forEach(function (k) { if (r[k] && Array.isArray(r[k].modules)) NOUVEAUX[k].forEach(function (m) { if (r[k].modules.indexOf(m) < 0) r[k].modules.push(m); }); });
    r.super.modules = TOUS;
    return r;
  }
  function admins() {
    var a = S.liste("admins");
    if (!a.length) {
      a = [{ id: "A-01", nom: "Administrateur principal", email: "admin@nextgenit.com", telephone: "", poste: "Directeur général", role: "super", statut: "actif", hash: localStorage.getItem("ng_admin_hash") || HASH_DEFAUT, creeLe: new Date().toISOString() }];
      S.enregistrerListe("admins", a);
    }
    return a;
  }
  function moi() { var id = sessionStorage.getItem("ng_admin"); return admins().filter(function (a) { return a.id === id; })[0]; }
  function modulesDe(a) { if (!a) return []; if (a.role === "super") return TOUS; if (a.modules && a.modules.length) return a.modules; var r = roles()[a.role]; return r ? r.modules : ["compte"]; }
  function autorise(m) { return modulesDe(moi()).indexOf(m) > -1; }

  /* ---------- Présence en ligne ---------- */
  var vueCourante = "tableau";
  function presences() { try { return JSON.parse(localStorage.getItem("ng_presence") || "{}"); } catch (e) { return {}; } }
  function battement() {
    var a = moi(); if (!a) return;
    var p = presences();
    p[a.id] = { t: Date.now(), vue: vueCourante };
    localStorage.setItem("ng_presence", JSON.stringify(p));
    afficherEnLigne();
  }
  function enLigne() {
    var p = presences(), now = Date.now();
    return admins().filter(function (a) { return p[a.id] && now - p[a.id].t < 45000 && a.statut === "actif"; }).map(function (a) { return Object.assign({ vue: p[a.id].vue }, a); });
  }
  function nomModule(id) { var m = MODULES.filter(function (x) { return x[0] === id; })[0]; return m ? m[1] : id; }
  function afficherEnLigne() {
    var box = document.getElementById("online-stack");
    if (!box) return;
    var l = enLigne();
    box.innerHTML = '<span class="online-label"><span class="live-dot"></span>' + l.length + " en ligne</span>" + l.slice(0, 6).map(function (a) {
      return '<span class="online-item" title="' + esc(a.nom + " · " + nomModule(a.vue)) + '">' + avatar(a, 32, true) + "</span>";
    }).join("");
  }
  window.addEventListener("storage", function (e) { if (e.key === "ng_presence") afficherEnLigne(); });
  window.addEventListener("beforeunload", function () { var a = moi(); if (!a) return; var p = presences(); delete p[a.id]; localStorage.setItem("ng_presence", JSON.stringify(p)); });

  /* ---------- Vues ---------- */
  var VUES = {};
  var vue = document.getElementById("vue");
  var side = document.getElementById("side");
  function badges() {
    return {
      demandes: S.demandes().filter(function (d) { return d.statut === "a_evaluer"; }).length,
      inscriptions: S.liste("inscriptions").filter(function (i) { return i.statut === "en_attente"; }).length,
      depenses: S.liste("sorties").filter(function (x) { return x.statut === "demande"; }).length,
      commandes: S.liste("commandes").filter(function (c) { return c.statut === "nouvelle"; }).length,
      tickets: S.liste("tickets").filter(function (t) { return ["resolu", "ferme"].indexOf(t.statut) < 0; }).length,
      notifications: window.NGA && window.NGA.compterNotifs ? window.NGA.compterNotifs() : 0,
      factures: S.liste("factures").filter(function (f) { return f.statut !== "payee" && f.statut !== "annulee" && f.echeance && f.echeance < new Date().toISOString().slice(0, 10); }).length
    };
  }
  /* Icône de chaque module du menu */
  var ICONES = {
    tableau: "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z",
    notifications: "M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0",
    rapports: "M4 20V10M10 20V4M16 20v-6M22 20H2",
    journal: "M12 8v4l3 2M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8M3 3v5h5",
    demandes: "M6 2h9l5 5v15H6zM14 2v6h6M9 13h6M9 17h6",
    commandes: "M6 6h15l-1.5 9h-12zM6 6L5 2H2M9 20a1 1 0 100-2 1 1 0 000 2zM18 20a1 1 0 100-2 1 1 0 000 2z",
    comptesclients: "M5 11h14v10H5zM8 11V7a4 4 0 018 0v4M12 15v2",
    clients: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8",
    pipeline: "M3 4h18l-7 8v6l-4 2v-8z",
    calendrier: "M3 5h18v16H3zM16 3v4M8 3v4M3 10h18",
    chat: "M8 10h8M8 14h5M21 12a9 9 0 01-13.5 7.8L3 21l1.2-4.5A9 9 0 1121 12z",
    rendezvous: "M3 5h18v16H3zM16 3v4M8 3v4M3 10h18M9 15l2 2 4-4",
    partenaires: "M12 21l-8-8a5 5 0 017-7l1 1 1-1a5 5 0 017 7z",
    parrainages: "M16 11a4 4 0 100-8 4 4 0 000 8zM2 21v-1a6 6 0 0112 0v1M8 11a3 3 0 100-6M22 21v-1a6 6 0 00-4-5.6",
    messages: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
    recrutement: "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM19 8v6M22 11h-6",
    connaissances: "M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z",
    avis: "M12 2l3 7 7 .6-5.3 4.7L18.3 21 12 17l-6.3 4 1.6-6.7L2 9.6 9 9z",
    realisations: "M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6",
    parc: "M2 4h20v12H2zM8 20h8M12 16v4",
    supervision: "M22 12h-4l-3 9L9 3l-3 9H2",
    vehicules: "M3 13l2-6h14l2 6v5H3zM7 18v2M17 18v2M3 13h18",
    newsletter: "M4 4h16v16H4zM4 7l8 6 8-6",
    projets: "M3 3h5v18H3zM10 3h5v12h-5zM17 3h4v8h-4z",
    interventions: "M14.7 6.3a4 4 0 00-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 005.4-5.4l-2.5 2.5-2.5-.5-.5-2.5z",
    tickets: "M4 7h16v4a2 2 0 000 4v4H4v-4a2 2 0 000-4zM12 7v12",
    stock: "M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8",
    techniciens: "M16 21v-2a4 4 0 00-8 0v2M12 11a4 4 0 100-8 4 4 0 000 8zM4 21h16",
    factures: "M6 2h12v20l-3-2-3 2-3-2-3 2zM9 7h6M9 11h6M9 15h4",
    paiements: "M2 6h20v12H2zM2 10h20M6 15h4",
    depenses: "M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
    formations: "M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5",
    inscriptions: "M16 21v-2a4 4 0 00-8 0v2M12 11a4 4 0 100-8 4 4 0 000 8zM19 8v6M22 11h-6",
    etudiants: "M4 19.5A2.5 2.5 0 016.5 17H20V3H6.5A2.5 2.5 0 004 5.5zM4 19.5A2.5 2.5 0 006.5 22H20v-5",
    ressources: "M4 4h16v12H5.2L4 17.2zM8 8h8M8 12h5",
    suivi: "M9 11l3 3 8-8M20 12v7H4V5h11",
    admins: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4",
    site: "M12 22a10 10 0 100-20 10 10 0 000 20zM2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20",
    apparence: "M12 22a10 10 0 110-20c5.5 0 10 4 10 9a5 5 0 01-5 5h-2a2 2 0 00-1.5 3.3A2 2 0 0112 22zM7.5 11.5h.01M10.5 7.5h.01M15.5 7.5h.01",
    parametres: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z",
    compte: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
  };
  function iconeModule(id) { return '<svg class="nav-ico" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + (ICONES[id] || ICONES.tableau) + '"/></svg>'; }
  function menu(actif) {
    var b = badges();
    var cloche = document.getElementById("notif-count");
    if (cloche) { cloche.textContent = b.notifications || ""; cloche.hidden = !b.notifications; }
    document.getElementById("admin-nav").innerHTML = GROUPES.map(function (g) {
      var items = g[1].filter(function (m) { return autorise(m[0]); });
      if (!items.length) return "";
      return '<div class="nav-group"><span class="nav-title">' + g[0] + "</span>" + items.map(function (m) {
        return '<a href="#' + m[0] + '"' + (m[0] === actif ? ' aria-current="page"' : "") + '><span class="nav-lbl">' + iconeModule(m[0]) + "<span>" + m[1] + "</span></span>" + (b[m[0]] ? '<span class="count">' + b[m[0]] + "</span>" : "") + "</a>";
      }).join("") + "</div>";
    }).join("");
  }
  function entete(titre, sous, actions) {
    return '<div class="topbar"><div><h1>' + titre + '</h1><p class="muted">' + sous + '</p></div><div class="hero-actions">' + (actions || "") + "</div></div>";
  }
  function majProfil() {
    var a = moi(); if (!a) return;
    document.getElementById("me-nom").textContent = a.nom;
    document.getElementById("me-role").textContent = (roles()[a.role] || {}).nom || a.role;
    document.getElementById("me-photo").innerHTML = avatar(a, 40, true);
  }
  function router() {
    var a = moi();
    if (!a || a.statut !== "actif") { sessionStorage.removeItem("ng_admin"); location.reload(); return; }
    var id = (location.hash || "#tableau").slice(1).split("/")[0];
    if (!VUES[id]) id = "tableau";
    vueCourante = id;
    menu(id);
    side.classList.remove("open");
    vue.classList.remove("view-in"); void vue.offsetWidth; vue.classList.add("view-in");
    battement();
    if (window.NGA && window.NGA.fin && window.NGA.fin.auto && autorise("factures")) { try { window.NGA.fin.auto(); } catch (e) {} }
    if (!autorise(id)) {
      vue.innerHTML = entete("Accès non autorisé", "Votre rôle ne donne pas accès à ce module.") + '<div class="card"><p>Demandez au Super admin d’ajouter ce module à votre rôle dans « Administrateurs et rôles ».</p><a class="btn btn-primary" href="#tableau" style="align-self:flex-start">Retour au tableau de bord</a></div>';
    } else {
      VUES[id]();
    }
    animer();
    battement();
    vue.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
  function rafraichir() { if (window.NGA && window.NGA.fin && window.NGA.fin.auto && autorise("factures")) { try { window.NGA.fin.auto(); } catch (e) {} } var y = window.scrollY; VUES[vueCourante](); animer(); menu(vueCourante); window.scrollTo(0, y); }

  /* ---------- Animations : compteurs et graphiques ---------- */
  function animer() {
    var reduit = matchMedia("(prefers-reduced-motion: reduce)").matches;
    vue.querySelectorAll("[data-count]").forEach(function (el) {
      var cible = Number(el.dataset.count) || 0, fmt = el.dataset.format;
      var aff = function (v) { el.textContent = fmt === "argent" ? argent(v) : fmt === "pc" ? Math.round(v) + " %" : Math.round(v).toLocaleString("fr-FR"); };
      if (reduit) { aff(cible); return; }
      var t0 = performance.now(), d = 900;
      (function pas(t) { var k = Math.min(1, (t - t0) / d); aff(cible * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(pas); })(t0);
    });
  }
  function graphLigne(labels, series, h) {
    h = h || 220;
    var w = 640, pad = 34, max = 1;
    series.forEach(function (s) { s.valeurs.forEach(function (v) { if (v > max) max = v; }); });
    max = Math.ceil(max * 1.15);
    var x = function (i) { return pad + i * (w - pad * 2) / Math.max(1, labels.length - 1); };
    var y = function (v) { return h - 26 - v / max * (h - 46); };
    var grille = [0, 0.25, 0.5, 0.75, 1].map(function (k) { var yy = y(max * k); return '<line x1="' + pad + '" x2="' + (w - pad) + '" y1="' + yy + '" y2="' + yy + '" class="g-grid"/><text x="' + (pad - 6) + '" y="' + (yy + 4) + '" class="g-axe" text-anchor="end">' + (max * k >= 1000 ? Math.round(max * k / 1000) + "k" : Math.round(max * k)) + "</text>"; }).join("");
    var axeX = labels.map(function (l, i) { return '<text x="' + x(i) + '" y="' + (h - 6) + '" class="g-axe" text-anchor="middle">' + esc(l) + "</text>"; }).join("");
    var courbes = series.map(function (s, k) {
      var pts = s.valeurs.map(function (v, i) { return x(i) + "," + y(v); });
      var d = "M" + pts.join(" L");
      var aire = d + " L" + x(s.valeurs.length - 1) + "," + y(0) + " L" + x(0) + "," + y(0) + " Z";
      return '<path d="' + aire + '" fill="' + s.couleur + '" class="g-aire" style="animation-delay:' + (0.5 + k * 0.2) + 's"/><path d="' + d + '" fill="none" stroke="' + s.couleur + '" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" pathLength="1" class="g-trait" style="animation-delay:' + (k * 0.2) + 's"/>' +
        s.valeurs.map(function (v, i) { return '<circle cx="' + x(i) + '" cy="' + y(v) + '" r="4" fill="' + s.couleur + '" class="g-point" style="animation-delay:' + (0.6 + i * 0.06) + 's"><title>' + esc(s.nom + " · " + labels[i] + " : " + argent(v)) + "</title></circle>"; }).join("");
    }).join("");
    var legende = '<div class="g-legende">' + series.map(function (s) { return '<span><i style="background:' + s.couleur + '"></i>' + esc(s.nom) + "</span>"; }).join("") + "</div>";
    return legende + '<svg viewBox="0 0 ' + w + " " + h + '" class="graph" role="img" aria-label="' + esc(series.map(function (s) { return s.nom; }).join(" et ")) + ' par mois">' + grille + axeX + courbes + "</svg>";
  }
  function graphAnneau(segments, centre) {
    var tot = segments.reduce(function (a, s) { return a + s.val; }, 0) || 1, cumul = 0;
    var arcs = segments.map(function (s, i) {
      var pc = s.val / tot * 100;
      var c = '<circle r="15.9155" cx="21" cy="21" fill="none" stroke="' + s.couleur + '" stroke-width="5.5" pathLength="100" stroke-dasharray="' + pc + " " + (100 - pc) + '" stroke-dashoffset="' + (25 - cumul) + '" class="g-arc" style="animation-delay:' + i * 0.12 + 's"><title>' + esc(s.label + " : " + s.val) + "</title></circle>";
      cumul += pc;
      return c;
    }).join("");
    return '<div class="donut"><svg viewBox="0 0 42 42" role="img" aria-label="Répartition">' + '<circle r="15.9155" cx="21" cy="21" fill="none" stroke="var(--line)" stroke-width="5.5"/>' + arcs + '</svg><div class="donut-centre">' + centre + '</div></div><div class="g-legende col">' + segments.map(function (s) { return '<span><i style="background:' + s.couleur + '"></i>' + esc(s.label) + " <b>" + s.val + "</b></span>"; }).join("") + "</div>";
  }
  function barres(items, fmt) {
    var max = Math.max.apply(null, items.map(function (i) { return i.val; }).concat([1]));
    return '<div class="stack" style="gap:12px">' + items.map(function (i, k) {
      return '<div><div style="display:flex;justify-content:space-between;gap:10px;font-size:.9rem"><span>' + esc(i.label) + "</span><strong>" + (fmt === "argent" ? argent(i.val) : i.val) + '</strong></div><div class="progress mt-1"><span style="width:' + Math.round(i.val / max * 100) + "%;animation-delay:" + k * 0.08 + "s" + (i.couleur ? ";background:" + i.couleur : "") + '"></span></div></div>';
    }).join("") + "</div>";
  }

  /* ---------- Fenêtre modale ---------- */
  var dlg = document.getElementById("modal");
  var dlgForm = document.getElementById("modal-form");
  var dlgSubmit = null;
  function modal(o) {
    document.getElementById("modal-titre").textContent = o.titre;
    document.getElementById("modal-body").innerHTML = o.corps;
    document.getElementById("modal-foot").innerHTML = (o.annuler === false ? "" : '<button type="button" class="btn btn-ghost" data-close>' + (o.annuler || "Annuler") + "</button>") + (o.valider ? '<button type="submit" class="btn btn-primary">' + o.valider + "</button>" : "");
    dlg.style.width = o.large ? "min(880px, calc(100vw - 24px))" : "";
    dlgSubmit = o.onSubmit || null;
    if (!dlg.open) dlg.showModal();
    if (o.apres) o.apres(dlgForm);
    var premier = dlgForm.querySelector(".modal-body input, .modal-body select, .modal-body textarea");
    if (premier) premier.focus();
  }
  function fermer() { if (dlg.open) dlg.close(); }
  dlg.addEventListener("click", function (e) { if (e.target.closest("[data-close]") || e.target === dlg) fermer(); });
  dlgForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!dlgSubmit) { fermer(); return; }
    var r = dlgSubmit(dlgForm, e.submitter);
    if (r && typeof r.then === "function") r.then(function (v) { if (v !== false) fermer(); });
    else if (r !== false) fermer();
  });

  /* ---------- Connexion ---------- */
  var login = document.getElementById("ecran-login");
  var app = document.getElementById("ecran-admin");
  function demarrer() {
    var a = moi();
    if (!a || a.statut !== "actif") { sessionStorage.removeItem("ng_admin"); return; }
    login.hidden = true; app.hidden = false;
    majProfil();
    router();
    setInterval(battement, 15000);
    setInterval(afficherEnLigne, 10000);
  }
  /* ---------- Double authentification (TOTP, compatible Google / Microsoft Authenticator) ---------- */
  var B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  function secretTotp() { var b = new Uint8Array(20); crypto.getRandomValues(b); var bits = "", out = ""; b.forEach(function (x) { bits += ("00000000" + x.toString(2)).slice(-8); }); for (var i = 0; i + 5 <= bits.length; i += 5) out += B32[parseInt(bits.substr(i, 5), 2)]; return out; }
  function b32octets(s) { var bits = ""; s.replace(/=+$/, "").toUpperCase().split("").forEach(function (c) { var v = B32.indexOf(c); if (v >= 0) bits += ("00000" + v.toString(2)).slice(-5); }); var out = new Uint8Array(Math.floor(bits.length / 8)); for (var i = 0; i < out.length; i++) out[i] = parseInt(bits.substr(i * 8, 8), 2); return out; }
  function codeTotp(secret, decalage) {
    var compteur = Math.floor(Date.now() / 30000) + (decalage || 0), msg = new Uint8Array(8);
    for (var i = 7, c = compteur; i >= 0; i--) { msg[i] = c & 255; c = Math.floor(c / 256); }
    return crypto.subtle.importKey("raw", b32octets(secret), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]).then(function (k) { return crypto.subtle.sign("HMAC", k, msg); }).then(function (sig) {
      var h = new Uint8Array(sig), o = h[h.length - 1] & 15;
      var n = ((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
      return String(n % 1000000).padStart(6, "0");
    });
  }
  function verifierTotp(secret, code) { code = String(code || "").replace(/\D/g, ""); return Promise.all([-1, 0, 1].map(function (d) { return codeTotp(secret, d); })).then(function (l) { return l.indexOf(code) > -1; }); }

  /* ---------- Connexion : mot de passe, blocage après 5 échecs, puis code ---------- */
  var formLogin = document.getElementById("form-admin-login"), form2 = document.getElementById("form-2fa"), enAttente = null;
  function blocage() { try { return JSON.parse(localStorage.getItem("ng_blocage") || "{}"); } catch (e) { return {}; } }
  function echec(email) { var b = blocage(), x = b[email] || { n: 0 }; x.n++; if (x.n >= 5) { x.jusqua = Date.now() + 15 * 60000; x.n = 0; } b[email] = x; localStorage.setItem("ng_blocage", JSON.stringify(b)); return x; }
  function reussite(email) { var b = blocage(); delete b[email]; localStorage.setItem("ng_blocage", JSON.stringify(b)); }
  function ouvrirSession(a) {
    S.modifier("admins", a.id, { derniereConnexion: new Date().toISOString() });
    sessionStorage.setItem("ng_admin", a.id); sessionStorage.setItem("ng_admin_nom", a.nom);
    S.log("Connexion", a.nom + " (" + a.email + ")" + (a.totpActif ? " · double authentification" : ""));
    demarrer();
  }
  var principal = admins()[0];

  document.getElementById("voir-mdp").addEventListener("click", function () { var b = this, vis = formLogin.mdp.type === "password"; formLogin.mdp.type = vis ? "text" : "password"; b.setAttribute("aria-pressed", String(vis)); b.setAttribute("aria-label", vis ? "Masquer le mot de passe" : "Afficher le mot de passe"); });
  formLogin.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = formLogin, email = f.email.value.trim().toLowerCase(), err = document.getElementById("err-admin");
    if (!email || !f.mdp.value) { err.textContent = "Indiquez votre email et votre mot de passe."; err.hidden = false; return; }
    var bl = blocage()[email];
    if (bl && bl.jusqua > Date.now()) { err.textContent = "Trop d’essais. Réessayez dans " + Math.ceil((bl.jusqua - Date.now()) / 60000) + " minute(s)."; err.hidden = false; return; }
    sha256(email + ":" + f.mdp.value).then(function (h) {
      var a = admins().filter(function (x) { return x.email.toLowerCase() === email; })[0];
      if (!a || a.hash !== h) { var x = echec(email); err.textContent = x.jusqua && x.jusqua > Date.now() ? "Trop d’essais : compte bloqué 15 minutes." : "Email ou mot de passe incorrect (" + (5 - x.n) + " essai(s) restant(s))."; err.hidden = false; f.mdp.value = ""; f.mdp.focus(); S.log("Connexion refusée", email); return; }
      if (a.statut !== "actif") { err.textContent = a.statut === "suspendu" ? "Ce compte est suspendu. Contactez le Super admin." : "Ce compte est désactivé."; err.hidden = false; return; }
      reussite(email); err.hidden = true;
      if (a.totpActif && a.totpSecret) { enAttente = a; formLogin.hidden = true; form2.hidden = false; form2.code.value = ""; form2.code.focus(); return; }
      ouvrirSession(a);
    });
  });
  form2.addEventListener("submit", function (e) {
    e.preventDefault();
    var err = document.getElementById("err-2fa");
    verifierTotp(enAttente.totpSecret, form2.code.value).then(function (ok) {
      if (!ok) { err.textContent = "Code incorrect ou expiré. Utilisez le code affiché maintenant dans votre application."; err.hidden = false; form2.code.select(); S.log("Code de double authentification refusé", enAttente.email); return; }
      ouvrirSession(enAttente);
    });
  });
  form2.code.addEventListener("input", function () { this.value = this.value.replace(/\D/g, "").slice(0, 6); if (this.value.length === 6) form2.requestSubmit(); });
  document.getElementById("retour-login").addEventListener("click", function () { enAttente = null; form2.hidden = true; formLogin.hidden = false; formLogin.mdp.value = ""; formLogin.mdp.focus(); });
  document.getElementById("logout").addEventListener("click", function () {
    var a = moi(); S.log("Déconnexion", a ? a.nom : "");
    var p = presences(); if (a) delete p[a.id]; localStorage.setItem("ng_presence", JSON.stringify(p));
    sessionStorage.removeItem("ng_admin"); sessionStorage.removeItem("ng_admin_nom"); location.hash = ""; location.reload();
  });
  document.getElementById("btn-menu").addEventListener("click", function () { side.classList.toggle("open"); });
  window.addEventListener("hashchange", function () { if (moi()) router(); });

  /* Démarrage après le chargement de tous les modules */
  window.addEventListener("load", function () { if (sessionStorage.getItem("ng_admin")) demarrer(); });

  /* ---------- API partagée entre les modules ---------- */
  window.NGA = {
    S: S, C: C, T: T, VUES: VUES, vue: vue, MODULES: MODULES, GROUPES: GROUPES, MOIS: MOIS,
    esc: esc, argent: argent, jour: jour, heure: heure, moisDe: moisDe, nomMois: nomMois, moisPrecedents: moisPrecedents, uid: uid,
    toast: toast, sha256: sha256, secretTotp: secretTotp, verifierTotp: verifierTotp, motDePasse: motDePasse, options: options, csv: csv, interrupteur: interrupteur, img: img, avatar: avatar, initiales: initiales, redimensionner: redimensionner,
    iconeModule: iconeModule, roles: roles, admins: admins, moi: moi, autorise: autorise, modulesDe: modulesDe, mdpParDefaut: function () { var m = moi(); return !!m && m.hash === HASH_DEFAUT; }, TOUS: TOUS, enLigne: enLigne, nomModule: nomModule, majProfil: majProfil, afficherEnLigne: afficherEnLigne,
    entete: entete, menu: menu, rafraichir: rafraichir, router: router, animer: animer,
    graphLigne: graphLigne, graphAnneau: graphAnneau, barres: barres, modal: modal, fermer: fermer,
    ROLES_DEFAUT: ROLES_DEFAUT,
    vueCourante: function () { return vueCourante; },
    lier: function (sel, evt, fn) { vue.querySelectorAll(sel).forEach(function (el) { el.addEventListener(evt, function (e) { fn.call(el, e, el); }); }); }
  };
})();
