/* =========================================================
   Script commun : en-tête, pied de page, menu mobile,
   assistant, WhatsApp et rendu des listes de contenu.
   ========================================================= */
(function () {
  var C = window.NG_CONTENU;
  var E = C.entreprise;

  /* ---------- Icônes (tracés SVG 24×24) ---------- */
  var ICONES = {
    reseau: "M9 3h6v6H9zM12 9v3M5 15v-3h14v3M3 15h4v6H3zM10 15h4v6h-4zM17 15h4v6h-4z",
    virtualisation: "M3 4h18v6H3zM3 14h8v6H3zM13 14h8v6h-8zM7 7h.01M7 17h.01M17 17h.01",
    serveur: "M4 4h16v6H4zM4 14h16v6H4zM8 7h.01M8 17h.01",
    satellite: "M4 10a8 8 0 0110 10M4 4a14 14 0 0116 16M5 19h.01",
    camera: "M3 7l13-3 2 6-13 3zM7 12l1 4h4M3 20h7M12 16v4",
    bouclier: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4",
    parefeu: "M3 5h18v14H3zM3 10h18M3 15h18M9 5v5M15 10v5M9 15v4",
    badge: "M5 3h14v18H5zM9 7h6M12 11a2 2 0 100 4 2 2 0 000-4zM9 18h6",
    web: "M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18",
    mail: "M3 6h18v12H3zM3 6l9 7 9-7",
    moniteur: "M3 4h18v12H3zM8 20h8M12 16v4M6 12l3-3 3 2 5-5",
    outil: "M14.7 6.3a4 4 0 00-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 005.4-5.4l-2.5 2.5-2.5-.5-.5-2.5z",
    engrenage: "M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2",
    casque: "M4 14v-2a8 8 0 0116 0v2M4 14h3v5H4zM17 14h3v5h-3z",
    eclair: "M13 2L4 14h7l-1 8 9-12h-7z",
    check: "M20 6L9 17l-5-5",
    calendrier: "M3 5h18v16H3zM3 10h18M8 3v4M16 3v4",
    horloge: "M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2",
    lieu: "M12 21s-7-6.5-7-12a7 7 0 0114 0c0 5.5-7 12-7 12zM12 11a2 2 0 100-4 2 2 0 000 4z",
    chat: "M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12zM8 11h.01M12 11h.01M16 11h.01",
    whatsapp: "M3 21l1.6-4.7A9 9 0 1121 12a9 9 0 01-13.3 7.9zM9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.4-1.9-1-1 .8a4 4 0 01-2.2-2.2l.8-1-1-1.9z",
    envoyer: "M22 2L11 13M22 2l-7 20-4-9-9-4z",
    menu: "M4 7h16M4 12h16M4 17h16",
    fermer: "M6 6l12 12M18 6L6 18",
    cadenas: "M5 11h14v10H5zM8 11V7a4 4 0 018 0v4",
    logo: "M5 19V5l14 14V5"
  };
  function icone(nom, extra) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (extra || "") + '><path d="' + (ICONES[nom] || ICONES.check) + '"/></svg>';
  }
  function esc(t) {
    return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  window.NGUtil = { icone: icone, esc: esc, ICONES: ICONES };

  var page = document.body.getAttribute("data-page") || "";

  /* ---------- En-tête ---------- */
  /* Menu principal : [lien, libellé, page, sous-menu éventuel [lien, libellé, description]] */
  var MENU = [
    ["index.html#services", "Services", "services", [
      ["index.html#services", "Réseaux et infrastructure", "Câblage, LAN/WAN, Wi-Fi d’entreprise"],
      ["index.html#services", "Cybersécurité", "Audit, pare-feu, VPN, durcissement"],
      ["index.html#services", "Vidéosurveillance", "Caméras IP, enregistreurs, accès mobile"],
      ["index.html#services", "Web et logiciel", "Sites, e-commerce, applications"],
      ["index.html#services", "Hébergement et cloud", "VPS, messagerie, Microsoft 365"],
      ["index.html#contrats", "Contrats de maintenance", "Votre service informatique au mois"],
      ["index.html#equipements", "Équipements", "Matériel professionnel installé"],
      ["catalogue.html", "Catalogue de matériel", "Prix sur demande, en privé"]]],
    ["formations.html", "Formations", "formations"],
    ["realisations.html", "Réalisations", "realisations"],
    ["support.html", "Ressources", "ressources", [
      ["actualites.html", "Actualités", "Nouveautés, alertes, conseils"],
      ["support.html", "Centre d’aide", "Guides, questions fréquentes, suivi de ticket"],
      ["verification.html", "Vérifier un badge", "Technicien ou attestation"]]],
    ["a-propos.html", "L’entreprise", "entreprise", [
      ["a-propos.html", "À propos", "Notre équipe et notre méthode"],
      ["carrieres.html", "Carrières", "Rejoindre NextGenIT"],
      ["contact.html", "Contact", "Adresse, horaires, formulaire"],
      ["rendez-vous.html", "Prendre rendez-vous", "Visite, audit ou appel conseil"],
      ["partenaire.html", "Espace partenaires", "Revendeurs et apporteurs d’affaires"]]]
  ];
  var PAGES_SM = { actualites: "ressources", support: "ressources", verification: "ressources", apropos: "entreprise", carrieres: "entreprise", rendezvous: "entreprise", partenaire: "entreprise", catalogue: "services" };
  var actif = function (m) { return page === m[2] || PAGES_SM[page] === m[2]; };
  var header = document.getElementById("site-header");
  if (header) {
    var navHtml = MENU.map(function (m, i) {
      if (!m[3]) return '<a href="' + m[0] + '"' + (actif(m) ? ' aria-current="page"' : "") + ">" + m[1] + "</a>";
      return '<div class="nav-deroul"><button type="button" class="nav-btn' + (actif(m) ? " actif" : "") + '" aria-expanded="false" aria-controls="sm-' + i + '">' + m[1] + ' <span aria-hidden="true">▾</span></button><div class="sous-menu' + (m[3].length > 4 ? " large" : "") + '" id="sm-' + i + '">' + m[3].map(function (x) { return '<a href="' + x[0] + '"><strong>' + x[1] + "</strong><small>" + x[2] + "</small></a>"; }).join("") + "</div></div>";
    }).join("");
    header.className = "site-header";
    header.innerHTML =
      '<div class="container bar">' +
      '<a class="brand" href="index.html" aria-label="' + esc(E.nom) + ', accueil"><img class="brand-logo" src="assets/img/embleme.png" alt="" width="46" height="46"><span class="brand-txt"><span>NextGen<b>IT</b></span><small>Solutions informatiques</small></span></a>' +
      '<nav class="nav" aria-label="Navigation principale">' + navHtml + "</nav>" +
      '<div class="header-actions">' +
      (window.NGLangue ? window.NGLangue.selecteur("langues-entete hide-mobile") : "") +
      (function () { var e = null, c = null; try { e = sessionStorage.getItem("ng_etudiant"); c = localStorage.getItem("ng_session"); } catch (x) {} return e ? '<a class="btn btn-ghost btn-sm hide-mobile" href="etudiant.html">🎓 Mon espace</a>' : c ? '<a class="btn btn-ghost btn-sm hide-mobile" href="mon-espace.html">👤 Mon espace</a>' : '<a class="btn btn-ghost btn-sm hide-mobile" href="connexion.html">' + icone("cadenas", ' width="16" height="16"') + "Se connecter</a>"; })() +
      '<a class="btn btn-primary btn-sm hide-mobile" href="devis.html">Demander un devis</a>' +
      '<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav" aria-label="Ouvrir le menu">' + icone("menu", ' width="22" height="22"') + "</button>" +
      "</div></div>" +
      '<div class="tiroir-fond" hidden></div>' +
      '<nav id="mobile-nav" class="mobile-nav tiroir" aria-label="Menu" aria-hidden="true">' +
        '<div class="tiroir-tete"><a class="brand" href="index.html"><img class="brand-logo" src="assets/img/embleme.png" alt="" width="40" height="40"><span class="brand-txt"><span>NextGen<b>IT</b></span><small>Solutions informatiques</small></span></a><button type="button" class="tiroir-fermer" aria-label="Fermer le menu">' + icone("fermer", ' width="20" height="20"') + "</button></div>" +
        (function () { var e = null, c = null; try { e = sessionStorage.getItem("ng_etudiant"); c = localStorage.getItem("ng_session"); } catch (x) {} return e ? '<a class="tiroir-compte" href="etudiant.html">🎓 Mon espace étudiant</a>' : c ? '<a class="tiroir-compte" href="mon-espace.html">👤 Mon espace client</a>' : ""; })() +
        (window.NGLangue ? '<div class="tiroir-titre">Langue</div>' + window.NGLangue.selecteur("langues-tiroir") : "") +
        MENU.map(function (m) { return m[3] ? '<div class="tiroir-titre">' + m[1] + "</div>" + m[3].map(function (x) { return '<a class="tiroir-lien tiroir-sous" href="' + x[0] + '"><span>' + x[1] + "</span></a>"; }).join("") : '<a class="tiroir-lien" href="' + m[0] + '"' + (actif(m) ? ' aria-current="page"' : "") + "><span>" + m[1] + "</span></a>"; }).join("") +
        '<div class="tiroir-titre">Espaces</div>' +
        '<a class="tiroir-lien" href="connexion.html">🔐 Se connecter</a><a class="tiroir-lien" href="connexion.html?etudiant">🎓 Espace étudiant</a><a class="tiroir-lien" href="verification.html">🛡 Vérifier un badge</a>' +
        '<button type="button" class="btn btn-ghost tiroir-installer" data-installer hidden>📲 Installer l’application</button>' +
        '<div class="tiroir-actions"><a class="btn btn-primary" href="devis.html">Demander un devis</a><a class="btn btn-whatsapp" href="https://wa.me/' + esc(E.whatsapp) + '" target="_blank" rel="noopener">WhatsApp</a></div>' +
        '<p class="tiroir-pied">' + esc(E.telephone) + "<br>" + esc(E.email) + "</p></nav>";

    header.querySelectorAll(".nav-btn").forEach(function (b) {
      b.addEventListener("click", function (e) { e.stopPropagation(); var o = b.getAttribute("aria-expanded") === "true"; header.querySelectorAll(".nav-btn").forEach(function (x) { x.setAttribute("aria-expanded", "false"); }); b.setAttribute("aria-expanded", String(!o)); });
    });
    document.addEventListener("click", function () { header.querySelectorAll(".nav-btn").forEach(function (x) { x.setAttribute("aria-expanded", "false"); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") header.querySelectorAll(".nav-btn").forEach(function (x) { x.setAttribute("aria-expanded", "false"); }); });
    var toggle = header.querySelector(".menu-toggle");
    var mnav = header.querySelector(".mobile-nav"), fond = header.querySelector(".tiroir-fond");
    /* Le tiroir est placé directement dans la page (l’en-tête a un effet de flou qui le bloquerait) */
    document.body.appendChild(fond); document.body.appendChild(mnav);
    function ouvrirMenu(open) {
      mnav.classList.toggle("open", open); fond.hidden = !open; mnav.setAttribute("aria-hidden", String(!open));
      toggle.setAttribute("aria-expanded", String(open)); toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
      document.body.style.overflow = open ? "hidden" : "";
      if (open) { var p = mnav.querySelector(".tiroir-fermer"); if (p) p.focus(); } else toggle.focus();
    }
    toggle.addEventListener("click", function () { ouvrirMenu(!mnav.classList.contains("open")); });
    fond.addEventListener("click", function () { ouvrirMenu(false); });
    mnav.querySelector(".tiroir-fermer").addEventListener("click", function () { ouvrirMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && mnav.classList.contains("open")) ouvrirMenu(false); });
    mnav.addEventListener("click", function (e) { if (e.target.closest("a")) ouvrirMenu(false); });
  }

  /* ---------- Bannière d'annonce et sections masquées (gérées dans l'administration) ---------- */
  (function () {
    if (!window.NGStore) return;
    var P = window.NGStore.contenuPerso(), B = P.banniere;
    (P.masquer || []).forEach(function (id) { var el = document.getElementById(id); if (el && el.tagName === "SECTION") el.hidden = true; });
    try { if (B && B.actif && B.texte && sessionStorage.getItem("ng_banniere_fermee") !== B.texte) {
      var d = document.createElement("div");
      d.className = "annonce"; d.setAttribute("role", "region"); d.setAttribute("aria-label", "Annonce");
      d.innerHTML = esc(B.texte) + (B.lien ? ' <a href="' + esc(B.lien) + '">' + esc(B.lienTexte || "En savoir plus") + "</a>" : "") + '<button type="button" aria-label="Fermer l’annonce">×</button>';
      d.querySelector("button").addEventListener("click", function () { d.remove(); sessionStorage.setItem("ng_banniere_fermee", B.texte); });
      document.body.insertBefore(d, document.body.firstChild);
    } } catch (e) {}
  })();

  /* ---------- Pied de page ---------- */
  var footer = document.getElementById("site-footer");
  if (footer) {
    footer.className = "site-footer";
    footer.innerHTML =
      '<div class="container"><div class="footer-grid">' +
      '<div><a class="brand-pied" href="index.html" aria-label="' + esc(E.nom) + ', accueil"><img src="assets/img/logo-sombre.png" alt="NextGenIT – Solutions informatiques" width="300" height="87"></a>' +
      '<p class="muted mt-2" style="max-width:34ch">' + esc(E.slogan) + ".</p></div>" +
      "<div><h3>Services</h3><ul>" +
      '<li><a href="index.html#services">Réseau et Wi-Fi</a></li><li><a href="index.html#services">Vidéosurveillance</a></li><li><a href="index.html#services">Virtualisation</a></li><li><a href="index.html#services">Cybersécurité</a></li></ul></div>' +
      "<div><h3>NextGenIT</h3><ul>" +
      '<li><a href="a-propos.html">À propos</a></li><li><a href="realisations.html">Réalisations</a></li><li><a href="actualites.html">Actualités</a></li><li><a href="carrieres.html">Carrières</a></li><li><a href="support.html">Centre d’aide</a></li><li><a href="catalogue.html">Catalogue</a></li><li><a href="rendez-vous.html">Prendre rendez-vous</a></li><li><a href="partenaire.html">Espace partenaires</a></li><li><a href="contact.html">Contact</a></li><li><a href="formations.html">Formations</a></li><li><a href="index.html#faq">Questions fréquentes</a></li><li><a href="connexion.html">Espace client et étudiant</a></li></ul></div>' +
      "<div><h3>Contact</h3><ul>" +
      '<li><a href="tel:' + esc(E.telephone.replace(/\s/g, "")) + '">' + esc(E.telephone) + "</a></li>" +
      '<li><a href="mailto:' + esc(E.email) + '">' + esc(E.email) + "</a></li>" +
      '<li class="muted">' + esc(E.adresse) + "</li>" +
      '<li class="muted">' + esc(E.horaires) + "</li></ul></div>" +
      "</div>" +
      '<form class="newsletter" id="form-newsletter" novalidate><div><strong>Recevez nos actualités</strong><span>Conseils, nouveautés et sessions de formation. Pas plus de deux messages par mois.</span></div><div class="nl-champs"><input type="email" name="email" required placeholder="Votre adresse email" aria-label="Votre adresse email"><button class="btn btn-gold" type="submit">S’inscrire</button></div><p class="nl-msg" hidden aria-live="polite"></p></form>' +
      '<div class="footer-bottom"><span>© ' + new Date().getFullYear() + " " + esc(E.nom) + '. Tous droits réservés.</span><span><a href="mentions.html">Mentions légales et confidentialité</a></span></div></div>';
  }

  var fnl = document.getElementById("form-newsletter");
  if (fnl) fnl.addEventListener("submit", function (e) {
    e.preventDefault();
    var em = fnl.email.value.trim().toLowerCase(), msg = fnl.querySelector(".nl-msg");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { msg.textContent = "Adresse email invalide."; msg.hidden = false; return; }
    var S0 = window.NGStore;
    if (S0 && !S0.liste("abonnes").some(function (x) { return x.email === em; })) { S0.ajouter("abonnes", { email: em, langue: window.NGLangue ? window.NGLangue.actuelle() : "fr", page: location.pathname.split("/").pop() }, "NL-"); S0.log("Inscription à la newsletter", em); }
    msg.textContent = "✔ Merci ! Vous êtes inscrit à nos actualités."; msg.hidden = false; fnl.email.value = "";
  });

  /* ---------- Boutons flottants + assistant ---------- */
  function monterAssistant() {
    var box = document.createElement("div");
    box.className = "floating";
    box.innerHTML =
      '<a class="fab fab-wa" href="https://wa.me/' + esc(E.whatsapp) + '" target="_blank" rel="noopener" aria-label="Écrire sur WhatsApp">' + icone("whatsapp") + "</a>" +
      '<button class="fab fab-chat" type="button" aria-expanded="false" aria-controls="ng-chat" aria-label="Ouvrir l’assistant">' + icone("chat") + "</button>";
    var panel = document.createElement("section");
    panel.id = "ng-chat";
    panel.className = "panel chat-panel";
    panel.hidden = true;
    panel.setAttribute("aria-label", "Assistant NextGenIT");
    panel.innerHTML =
      '<div class="chat-head"><span class="avatar">NG</span><div><strong>Assistant NextGenIT</strong><small>Répond tout de suite, 24 h/24</small></div>' +
      '<button type="button" class="close" aria-label="Fermer l’assistant" style="position:static;margin-left:auto">×</button></div>' +
      '<div class="chat-log" role="log" aria-live="polite"></div>' +
      '<form class="chat-form"><label class="sr-only" for="ng-chat-input">Votre message</label><input id="ng-chat-input" autocomplete="off" placeholder="Écrivez votre question…"><button type="submit" aria-label="Envoyer">' + icone("envoyer", ' width="18" height="18"') + "</button></form>";
    document.body.appendChild(panel);
    document.body.appendChild(box);

    var log = panel.querySelector(".chat-log");
    var btn = box.querySelector(".fab-chat");
    function dire(texte, qui, chips) {
      var m = document.createElement("div");
      m.className = "msg " + (qui || "bot");
      m.innerHTML = texte;
      log.appendChild(m);
      if (chips) {
        var c = document.createElement("div");
        c.className = "chips";
        c.innerHTML = chips.map(function (x) { return '<button type="button">' + esc(x) + "</button>"; }).join("");
        log.appendChild(c);
      }
      log.scrollTop = log.scrollHeight;
    }
    function repondre(q) {
      var t = q.toLowerCase();
      if (/devis|prix|tarif|co[uû]t|combien/.test(t)) return 'Nos prix sont fixés après évaluation de votre besoin. <a href="devis.html">Demandez votre devis ici</a> : vous le recevez par email, WhatsApp ou SMS.';
      if (/formation|cours|attestation|inscri/.test(t)) return 'Voici <a href="formations.html">les formations disponibles, en cours et terminées</a>. Le tarif vous est envoyé après la demande d’inscription.';
      if (/humain|conseiller|appeler|whatsapp|t[eé]l[eé]phone/.test(t)) return 'Un conseiller vous répond sur <a href="https://wa.me/' + esc(E.whatsapp) + '" target="_blank" rel="noopener">WhatsApp</a> ou au ' + esc(E.telephone) + ".";
      if (/v[eé]rifi|badge|faux/.test(t)) return 'Vous pouvez <a href="verification.html">vérifier un badge ou une attestation</a> avec son numéro.';
      for (var i = 0; i < C.services.length; i++) {
        var s = C.services[i];
        var mots = s.titre.toLowerCase().split(/[\s,]+/).filter(function (w) { return w.length > 3; });
        if (mots.some(function (w) { return t.indexOf(w.slice(0, 5)) > -1; })) {
          return "<strong>" + esc(s.titre) + "</strong> : " + esc(s.texte) + ' <a href="devis.html">Demander un devis</a>.';
        }
      }
      for (var j = 0; j < C.faq.length; j++) {
        var f = C.faq[j];
        var cles = f.q.toLowerCase().split(/[\s,?’']+/).filter(function (w) { return w.length > 5; });
        if (cles.some(function (w) { return t.indexOf(w) > -1; })) return esc(f.r);
      }
      return 'Je transmets volontiers votre question à un technicien. <a href="devis.html">Décrivez votre besoin ici</a> ou écrivez-nous sur <a href="https://wa.me/' + esc(E.whatsapp) + '" target="_blank" rel="noopener">WhatsApp</a>.';
    }
    var demarre = false;
    function ouvrir(o) {
      panel.hidden = !o;
      btn.setAttribute("aria-expanded", String(o));
      if (o && maConv()) { log.innerHTML = ""; vus = 0; afficherLive(); }
      else if (o && !demarre) {
        demarre = true;
        dire("Bonjour ! Je réponds à vos questions sur nos services et nos formations.", "bot", ["Demander un devis", "Formations", "Parler à un humain"]);
      }
      if (o) panel.querySelector("input").focus();
    }
    btn.addEventListener("click", function () { ouvrir(panel.hidden); });
    panel.querySelector(".close").addEventListener("click", function () { ouvrir(false); btn.focus(); });
    /* ---------- Chat en direct avec un conseiller (les réponses arrivent depuis l’administration) ---------- */
    var Sx = window.NGStore, liveId = null, vus = 0;
    try { liveId = localStorage.getItem("chat_ng_id"); } catch (x) {}
    function maConv() { return liveId && Sx ? Sx.liste("chats").filter(function (c) { return c.id === liveId; })[0] : null; }
    function afficherLive() {
      var c = maConv(); if (!c) return;
      panel.querySelector(".chat-head strong").textContent = "Conseiller NextGenIT";
      panel.querySelector(".chat-head small").textContent = c.statut === "ferme" ? "Conversation terminée" : "Chat en direct · réponse en quelques minutes";
      (c.messages || []).slice(vus).forEach(function (m) { dire(esc(m.texte).replace(/\n/g, "<br>"), m.de === "client" ? "me" : "bot"); });
      vus = (c.messages || []).length;
    }
    function demarrerLive() {
      if (maConv()) { afficherLive(); return; }
      var m = document.createElement("form"); m.className = "msg bot chat-live-form";
      m.innerHTML = "Un conseiller vous répond ici, en direct. Indiquez votre nom et votre téléphone (pour vous rappeler si besoin) :" + '<input name="nom" placeholder="Votre nom" required aria-label="Votre nom"><input name="tel" type="tel" placeholder="Téléphone / WhatsApp" aria-label="Téléphone"><button class="btn btn-primary btn-sm" type="submit">Démarrer le chat</button>';
      log.appendChild(m); log.scrollTop = log.scrollHeight; m.nom.focus();
      m.addEventListener("submit", function (e) {
        e.preventDefault(); if (!m.nom.value.trim()) return;
        var c = Sx.ajouter("chats", { nom: m.nom.value.trim(), telephone: m.tel.value.trim(), page: location.pathname.split("/").pop() || "index.html", statut: "ouvert", nonLu: true, messages: [{ de: "conseiller", texte: "Bonjour " + m.nom.value.trim() + " ! Un conseiller NextGenIT arrive. Posez votre question.", date: new Date().toISOString() }], langue: window.NGLangue ? window.NGLangue.actuelle() : "fr" }, "CHAT-");
        liveId = c.id; try { localStorage.setItem("chat_ng_id", c.id); } catch (x) {}
        Sx.log("Chat en direct ouvert", c.nom);
        m.remove(); vus = 0; log.querySelectorAll(".msg, .chips").forEach(function (x) { x.remove(); }); afficherLive();
      });
    }
    function envoyerLive(v) {
      var c = maConv(); if (!c) return false;
      if (c.statut === "ferme") { Sx.modifier("chats", c.id, { statut: "ouvert" }); }
      Sx.modifier("chats", c.id, { messages: (c.messages || []).concat([{ de: "client", texte: v, date: new Date().toISOString() }]), nonLu: true, dernier: new Date().toISOString() });
      vus++; return true;
    }
    window.addEventListener("ng-donnees", function () { if (liveId && !panel.hidden) afficherLive(); });
    window.addEventListener("storage", function (e) { if (e.key === "ng_chats" && liveId && !panel.hidden) afficherLive(); });
    setInterval(function () { if (liveId && !panel.hidden) afficherLive(); }, 5000);
    if (liveId && maConv() && maConv().statut !== "ferme") { demarre = true; }
    log.addEventListener("click", function (e) {
      var b = e.target.closest(".chips button");
      if (!b) return;
      dire(esc(b.textContent), "me");
      if (/humain|conseiller|human|mtu/i.test(b.textContent)) { demarrerLive(); return; }
      dire(repondre(b.textContent));
    });
    panel.querySelector("form").addEventListener("submit", function (e) {
      e.preventDefault();
      var inp = panel.querySelector("input");
      var v = inp.value.trim();
      if (!v) return;
      inp.value = "";
      if (maConv()) { dire(esc(v), "me"); envoyerLive(v); return; }
      dire(esc(v), "me");
      if (/conseiller|humain|parler à quelqu/i.test(v)) { demarrerLive(); return; }
      setTimeout(function () { dire(repondre(v)); }, 300);
    });
  }

  /* ---------- Surtitres des sections (petit libellé cuivre au-dessus des titres) ---------- */
  var SURTITRES = { services: "Expertise", pourquoi: "Nos engagements", solutions: "Secteurs", equipements: "Matériel", fonctionnement: "Méthode", contrats: "Maintenance", recruter: "Renfort", "espace-client": "Plateforme", formations: "Academy", realisations: "Références", avis: "Témoignages", actualites: "Actualités", faq: "Aide", contact: "Contact" };
  Object.keys(SURTITRES).forEach(function (id) {
    var sec = document.getElementById(id); if (!sec) return;
    var h = sec.querySelector(".section-head h2") || sec.querySelector("h2"); if (!h || h.querySelector(".surtitre")) return;
    var s0 = document.createElement("span"); s0.className = "surtitre"; s0.textContent = SURTITRES[id]; h.insertBefore(s0, h.firstChild);
  });

  /* ---------- Rendu des sections de l'accueil ---------- */
  function rendreAccueil() {
    var A = C.accueil;
    var set = function (sel, html) { var el = document.querySelector(sel); if (el) el.innerHTML = html; };
    set("[data-txt=badge]", '<span class="dot pulse"></span>' + esc(A.badge));
    set("[data-txt=titre]", esc(A.titre).replace(/(suivie en temps réel\.?)$/, '<span class="acc">$1</span>'));
    set("[data-txt=texte]", esc(A.texte));
    set("[data-txt=points]", A.points.map(function (p) { return "<span>" + icone("check") + esc(p) + "</span>"; }).join(""));
    set("[data-liste=secteurs]", C.secteurs.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join(""));

    /* Services avec onglets */
    var tabs = document.querySelector("[data-liste=categories]");
    var grille = document.querySelector("[data-liste=services]");
    if (tabs && grille) {
      var actif = "tous";
      var rendre = function () {
        tabs.innerHTML = C.categories.map(function (c) {
          return '<button class="tab" type="button" role="tab" aria-selected="' + (c.id === actif) + '" data-cat="' + c.id + '">' + esc(c.nom) + "</button>";
        }).join("");
        if (actif === "tous" && C.domaines) {
          grille.innerHTML = C.categories.filter(function (c) { return c.id !== "tous"; }).map(function (c) {
            var d = C.domaines[c.id] || {}, n = C.services.filter(function (x) { return x.cat === c.id; });
            return '<article class="card domaine"><div class="icon-box">' + icone(d.icone || "check") + "</div><h3>" + esc(c.nom) + "</h3><p>" + esc(d.texte || "") + '</p><ul class="sub-list">' + n.slice(0, 3).map(function (x) { return "<li>" + icone("check") + "<span>" + esc(x.titre) + "</span></li>"; }).join("") + '</ul><div class="foot"><span>' + n.length + ' prestation(s)</span><button type="button" class="lien-btn" data-cat="' + c.id + '">Voir le détail →</button></div></article>';
          }).join("");
          return;
        }
        grille.innerHTML = C.services.filter(function (s) { return actif === "tous" || s.cat === actif; }).map(function (s) {
          var cible = s.cat === "formation" ? "formations.html" : "devis.html?service=" + encodeURIComponent(s.titre);
          return '<article class="card reveal vu"><div class="icon-box">' + icone(s.icone) + "</div><h3>" + esc(s.titre) + "</h3><p>" + esc(s.texte) + "</p>" + (s.details ? '<ul class="sub-list">' + s.details.map(function (d) { return "<li>" + icone("check") + "<span>" + esc(d) + "</span></li>"; }).join("") + "</ul>" : "") + '<div class="foot"><span>' + esc(s.equipe) + '</span><a href="' + cible + '">' + (s.cat === "formation" ? "Voir les formations" : "Demander un devis") + "</a></div></article>";
        }).join("");
      };
      tabs.addEventListener("click", function (e) {
        var b = e.target.closest("[data-cat]");
        if (b) { actif = b.dataset.cat; rendre(); }
      });
      rendre();
      grille.addEventListener("click", function (e) {
        var b = e.target.closest("[data-cat]");
        if (b) { actif = b.dataset.cat; rendre(); tabs.scrollIntoView({ block: "start" }); var t = tabs.querySelector('[aria-selected="true"]'); if (t) t.focus(); }
      });
    }

    set("[data-liste=solutions]", (C.solutions || []).map(function (x) {
      return '<article class="card reveal vu"><div class="icon-box">' + icone(x.icone) + "</div><h3>" + esc(x.titre) + "</h3><p>" + esc(x.texte) + '</p><ul class="sub-list">' + x.points.map(function (p) { return "<li>" + icone("check") + "<span>" + esc(p) + "</span></li>"; }).join("") + '</ul><div class="foot"><span>Étude gratuite de votre besoin</span><a href="devis.html">Demander un devis</a></div></article>';
    }).join(""));
    if (window.NGStore) set("[data-liste=actualites]", window.NGStore.liste("actualites").filter(function (a) { return a.publie; }).sort(function (x, y) { return (y.epingle ? 1 : 0) - (x.epingle ? 1 : 0) || String(y.date).localeCompare(String(x.date)); }).slice(0, 3).map(function (a) {
      return '<a class="card news-card reveal vu" href="actualites.html?id=' + a.id + '">' + (a.image ? '<span class="news-img" style="background-image:url(' + "'" + esc(a.image) + "'" + ')"></span>' : "") + '<span class="tag ' + (/alerte/i.test(a.categorie) ? "tag-warn" : "tag-accent") + ' cat">' + esc(a.categorie) + '</span><h3>' + esc(a.titre) + "</h3><p>" + esc(a.texte) + '</p><span class="date">' + new Date(a.date + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) + " · Lire la suite →</span></a>";
    }).join("") || '<p class="muted">Aucune actualité pour le moment.</p>');

    /* Défilé de l'écran d'accueil : services puis équipements */
    var ts = document.querySelector("[data-liste=ticker-services]");
    if (ts) {
      var p = C.services.map(function (s) {
        return '<a class="pill" href="devis.html?service=' + encodeURIComponent(s.titre) + '"><span class="ico">' + icone(s.icone) + "</span>" + esc(s.titre) + "</a>";
      }).join("");
      ts.innerHTML = p + p.replace(/<a class="pill"/g, '<a class="pill" tabindex="-1" aria-hidden="true"');
    }
    var te = document.querySelector("[data-liste=ticker-equipements]");
    if (te) {
      var m = C.equipements.map(function (e) {
        return '<div class="mini-device"><div class="stage">' + appareil(e) + "</div><div><strong>" + esc(e.nom) + "</strong><small>" + esc(e.texte) + "</small></div></div>";
      }).join("");
      te.innerHTML = m + m.replace(/<div class="mini-device">/g, '<div class="mini-device" aria-hidden="true">');
    }

    set("[data-liste=chiffres]", (C.chiffres || []).map(function (x) { return '<div class="chiffre"><strong>' + esc(x.valeur) + "</strong><span>" + esc(x.texte) + "</span></div>"; }).join(""));
    set("[data-liste=atouts]", (C.atouts || []).map(function (x) { return '<article class="card"><div class="icon-box">' + icone(x.icone) + "</div><h3>" + esc(x.titre) + "</h3><p>" + esc(x.texte) + "</p></article>"; }).join(""));
    /* Aperçu de la boutique */
    var ba = document.querySelector("[data-liste=boutique-apercu]");
    if (ba && window.NGStore) {
      var TY = { "Vidéosurveillance": "camera", "Réseau": "ap", "Postes et serveurs": "laptop" };
      ba.innerHTML = window.NGStore.liste("articles").filter(function (a) { return a.boutique; }).slice(0, 4).map(function (a) {
        return '<a class="card product reveal" href="boutique.html" style="color:var(--text)"><div class="product-img">' + (a.photo ? '<img src="' + a.photo + '" alt="">' : appareil({ type: TY[a.categorie] || "rack", court: (a.reference || "").slice(0, 6) })) + '</div><small class="muted">' + esc(a.categorie) + "</small><h3>" + esc(a.nom) + '</h3><div class="foot"><span>Prix sur devis</span><span style="color:var(--accent);font-weight:700">Commander</span></div></a>';
      }).join("");
    }

    /* Équipements (défilé) */
    var eq = document.querySelector("[data-liste=equipements]");
    if (eq) {
      var cartes = C.equipements.map(function (e) {
        return '<article class="device"><div class="device-stage">' + appareil(e) + '</div><div class="device-body"><h3>' + esc(e.nom) + "</h3><p>" + esc(e.texte) + "</p></div></article>";
      }).join("");
      eq.innerHTML = cartes + cartes.replace(/<article class="device">/g, '<article class="device" aria-hidden="true">');
    }

    set("[data-liste=etapes]", C.etapes.map(function (e) { return "<li><h3>" + esc(e.titre) + "</h3><p>" + esc(e.texte) + "</p></li>"; }).join(""));

    set("[data-liste=offres]", C.offres.map(function (o) {
      return '<article class="card offer' + (o.vedette ? " featured" : "") + '">' +
        (o.vedette ? '<span class="tag tag-accent" style="align-self:flex-start">Le plus choisi</span>' : "") +
        "<h3>" + esc(o.nom) + '</h3><p>' + esc(o.pour) + '</p><div class="price">Sur devis <small>selon votre parc</small></div><ul class="check-list">' +
        o.points.map(function (p) { return "<li>" + icone("check") + "<span>" + esc(p) + "</span></li>"; }).join("") +
        '</ul><a class="btn ' + (o.vedette ? "btn-primary" : "btn-ghost") + ' mt-2" href="devis.html?service=' + encodeURIComponent("Contrat " + o.nom) + '">Demander ce contrat</a></article>';
    }).join(""));

    set("[data-liste=formations-apercu]", formationsPubliques().filter(function (f) { return f.statut === "ouverte"; }).slice(0, 3).map(carteFormation).join(""));

    var AVP = window.NGStore ? window.NGStore.liste("avis_publics") : [];
    set("[data-liste=avis]", (AVP.length ? AVP.map(function (a) { return { texte: a.texte, nom: a.nom, role: a.fonction, note: a.note }; }) : C.avis).map(function (a) {
      return '<figure class="card" style="margin:0">' + (a.note ? '<div class="avis-etoiles" aria-label="' + a.note + ' sur 5">' + "★★★★★".slice(0, a.note) + "</div>" : "") + '<blockquote style="margin:0;font-size:1.05rem">« ' + esc(a.texte) + ' »</blockquote><figcaption class="foot"><span><strong style="color:var(--text)">' + esc(a.nom) + "</strong><br>" + esc(a.role || "") + '</span><span class="tag tag-ok">Avis vérifié</span></figcaption></figure>';
    }).join(""));
    /* Réalisations sur l'accueil */
    var REA = window.NGStore ? window.NGStore.liste("realisations").filter(function (r) { return r.publie; }) : [];
    var zr = document.querySelector("[data-liste=realisations]");
    if (zr) { var secR = zr.closest("section"); if (!REA.length) { if (secR) secR.hidden = true; } else { if (secR) secR.hidden = false; zr.innerHTML = REA.slice(0, 3).map(function (r) { return '<a class="card actu-carte" href="realisations.html#' + r.id + '"><span class="actu-img" style="background-image:url(' + "'" + esc(r.apres || r.avant || "") + "'" + ')"></span><span class="actu-txt"><span class="actu-meta"><span class="tag tag-accent">' + esc(r.secteur) + "</span><small>" + esc(r.lieu || "") + "</small></span><strong>" + esc(r.titre) + '</strong><span class="muted">' + esc((r.resultat || r.description || "").slice(0, 130)) + "</span></span></a>"; }).join(""); } }

    set("[data-liste=faq]", C.faq.map(function (f, i) {
      return "<details" + (i === 0 ? " open" : "") + "><summary>" + esc(f.q) + "</summary><p>" + esc(f.r) + "</p></details>";
    }).join(""));

    set("[data-txt=contact]",
      '<li class="row-item"><span class="muted">Téléphone et WhatsApp</span><a href="tel:' + esc(E.telephone.replace(/\s/g, "")) + '">' + esc(E.telephone) + "</a></li>" +
      '<li class="row-item"><span class="muted">Email</span><a href="mailto:' + esc(E.email) + '">' + esc(E.email) + "</a></li>" +
      '<li class="row-item"><span class="muted">Adresse</span><span>' + esc(E.adresse) + "</span></li>" +
      '<li class="row-item"><span class="muted">Horaires</span><span>' + esc(E.horaires) + "</span></li>");

    /* Vérification d'un badge ou d'une attestation */
    var vf = document.getElementById("form-verifier");
    if (vf) {
      var codeUrl = new URLSearchParams(location.search).get("verifier");
      if (codeUrl) setTimeout(function () { vf.querySelector("input").value = codeUrl; vf.requestSubmit ? vf.requestSubmit() : vf.dispatchEvent(new Event("submit", { cancelable: true })); }, 300);
      vf.addEventListener("submit", function (e) {
        e.preventDefault();
        var code = vf.querySelector("input").value.trim().toUpperCase();
        var r = C.verifications[code];
        if (!r && window.NGStore) {
          var etu = window.NGStore.liste("comptes_etudiants").filter(function (x) { return (x.attestation || "").toUpperCase() === code; })[0];
          if (etu) { var fo = window.NGStore.formations().filter(function (x) { return x.id === etu.formationId; })[0]; r = { type: "Attestation de formation", nom: etu.nom, detail: (fo ? fo.titre + " · " : "") + "délivrée le " + new Date(etu.attestationLe || Date.now()).toLocaleDateString("fr-FR") }; }
        }
        if (!r && window.NGStore) {
          var pers = window.NGStore.liste("personnel").filter(function (x) { return (x.badge || "").toUpperCase() === code; })[0];
          if (pers) r = pers.actif ? { type: "Technicien NextGenIT", nom: pers.nom, detail: pers.poste + (pers.specialites && pers.specialites.length ? " · " + pers.specialites.join(", ") : "") } : null;
        }
        var out = document.getElementById("verify-result");
        out.innerHTML = r
          ? '<div class="row-item" style="border-color:var(--ok)"><div><span class="tag tag-ok">Authentique</span><p class="mt-1"><strong>' + esc(r.nom) + "</strong> · " + esc(r.type) + '</p><p class="muted">' + esc(r.detail) + "</p></div></div>"
          : '<div class="row-item" style="border-color:var(--danger)"><div><span class="tag" style="background:var(--danger);color:#fff">Introuvable</span><p class="mt-1">Aucun badge ni attestation ne porte le numéro « ' + esc(code) + ' ». Vérifiez le numéro ou appelez-nous avant de laisser entrer la personne.</p></div></div>';
      });
    }
  }

  function formationsPubliques() {
    return (window.NGStore ? window.NGStore.formations() : C.formations).filter(function (f) { return f.publie !== false; });
  }
  window.NGFormationsPubliques = formationsPubliques;
  function carteFormation(f) {
    var tag = f.statut === "ouverte" ? (f.inscriptionsOuvertes === false ? '<span class="tag tag-muted">Complet</span>' : '<span class="tag tag-ok">Inscriptions ouvertes</span>') : f.statut === "encours" ? '<span class="tag tag-accent">En cours</span>' : '<span class="tag tag-muted">Terminée</span>';
    var bas = f.statut === "ouverte" && f.inscriptionsOuvertes !== false
      ? '<span>' + (f.places ? f.places + " places" : "") + '</span><a class="btn btn-primary btn-sm" href="formations.html#' + esc(f.id) + '">S’inscrire</a>'
      : f.statut === "encours"
        ? '<span>Session en cours</span><a class="btn btn-ghost btn-sm" href="connexion.html">Espace étudiant</a>'
        : '<span>Prochaine session bientôt</span><a class="btn btn-ghost btn-sm" href="formations.html#' + esc(f.id) + '">Détails</a>';
    var avancement = f.statut === "encours" ? '<div><div class="muted" style="display:flex;justify-content:space-between;font-size:.85rem;margin-bottom:6px"><span>Avancement de la session</span><strong style="color:var(--text)">' + f.avancement + ' %</strong></div><div class="progress"><span style="width:' + f.avancement + '%"></span></div></div>' : "";
    return '<article class="card training">' + (f.image ? '<div class="training-img" style="background-image:url(' + "'" + esc(f.image) + "'" + ')" role="img" aria-label="' + esc(f.titre) + '"></div>' : "") + '<div class="training-top">' + tag + '<span class="muted" style="font-size:.85rem;position:relative;z-index:1">' + esc(f.mode) + "</span></div><h3>" + esc(f.titre) + "</h3><p>" + esc(f.texte) + '</p><div class="meta"><span>' + icone("calendrier") + esc(f.periode) + "</span><span>" + icone("horloge") + esc(f.duree) + " · " + esc(f.niveau) + "</span>" + (f.formateur ? "<span>" + icone("casque") + "Formateur : " + esc(f.formateur) + "</span>" : "") + "</div>" + avancement + '<div class="foot">' + bas + "</div></article>";
  }
  window.NGCarteFormation = carteFormation;

  /* Illustrations SVG des équipements */
  window.NGAppareil = function (e) { return appareil(e); };
  function appareil(e) {
    var o = '<svg viewBox="0 0 220 140" aria-hidden="true">';
    var s = "</svg>";
    var corps = 'fill="var(--surface)" stroke="var(--line-2)" stroke-width="2"';
    var trou = 'fill="var(--bg)" stroke="var(--line-2)"';
    var ombre = '<ellipse cx="110" cy="124" rx="86" ry="6" fill="#000" opacity=".25"/>';
    if (e.type === "rack") {
      var ports = "";
      for (var i = 0; i < 7; i++) ports += '<rect x="' + (74 + i * 14) + '" y="66" width="10" height="10" rx="1.5" ' + trou + "/>";
      return o + ombre + '<rect x="14" y="48" width="192" height="52" rx="7" ' + corps + '/><rect x="24" y="64" width="40" height="24" rx="4" ' + trou + '/><text x="44" y="80" text-anchor="middle" font-size="9" font-weight="700" fill="var(--accent)" font-family="sans-serif">' + esc(e.court || "") + "</text>" + ports +
        '<circle class="led" cx="79" cy="86" r="2" fill="var(--ok)"/><circle class="led" cx="107" cy="86" r="2" fill="var(--ok)" style="animation-delay:.5s"/><circle class="led" cx="188" cy="68" r="3.5" fill="var(--accent)"/><circle class="led" cx="188" cy="82" r="3.5" fill="var(--ok)" style="animation-delay:.7s"/>' + s;
    }
    if (e.type === "serveur") {
      var baies = "";
      [28, 72].forEach(function (y) { for (var k = 0; k < 4; k++) baies += '<rect x="' + (36 + k * 22) + '" y="' + (y + 7) + '" width="18" height="24" rx="2" ' + trou + "/>"; });
      return o + ombre + '<rect x="24" y="24" width="172" height="40" rx="6" ' + corps + '/><rect x="24" y="70" width="172" height="40" rx="6" ' + corps + "/>" + baies + '<circle class="led" cx="180" cy="38" r="3" fill="var(--ok)"/><circle class="led" cx="180" cy="84" r="3" fill="var(--accent)" style="animation-delay:.6s"/>' + s;
    }
    if (e.type === "ap") {
      return o + ombre + '<path class="led" d="M68 40a60 60 0 0184 0M80 52a42 42 0 0160 0M92 64a24 24 0 0136 0" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"/><ellipse cx="110" cy="96" rx="66" ry="18" fill="var(--line-2)"/><ellipse cx="110" cy="90" rx="66" ry="18" ' + corps + '/><ellipse class="led" cx="110" cy="90" rx="14" ry="4" fill="var(--accent)"/>' + s;
    }
    if (e.type === "laptop") {
      return o + ombre + '<rect x="48" y="14" width="124" height="82" rx="7" ' + corps + '/><rect x="56" y="22" width="108" height="66" rx="3" fill="var(--bg)"/><rect x="64" y="32" width="40" height="4" rx="2" fill="var(--accent)"/><rect x="64" y="42" width="72" height="4" rx="2" fill="var(--ok)" opacity=".8"/><rect x="72" y="52" width="56" height="4" rx="2" fill="var(--muted)"/><rect class="led" x="98" y="62" width="7" height="4" rx="1" fill="var(--text)"/><path d="M26 100h168l-12 16H38z" ' + corps + "/>" + s;
    }
    if (e.type === "camera") {
      return o + ombre + '<rect x="26" y="34" width="14" height="74" rx="3" fill="var(--line-2)"/><rect x="38" y="62" width="32" height="12" rx="3" fill="var(--line-2)"/><rect x="62" y="44" width="124" height="46" rx="22" ' + corps + '/><circle cx="172" cy="67" r="16" fill="var(--bg)" stroke="var(--line-2)" stroke-width="3"/><circle class="led" cx="172" cy="67" r="6" fill="var(--accent)"/><circle class="led" cx="84" cy="67" r="3" fill="var(--danger)"/>' + s;
    }
    return o + s;
  }

  /* ---------- Apparition au défilement ---------- */
  function reveler() {
    var els = document.querySelectorAll(".card, .section-head, .process li, .device, .faq details");
    if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var io = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("vu"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { if (!el.closest(".hero") && !el.closest(".marquee") && !el.closest("dialog")) { el.classList.add("reveal"); io.observe(el); } });
  }
  window.NGReveler = reveler;

  /* ---------- Démarrage ---------- */
  rendreAccueil();
  monterAssistant();
  reveler();
})();
