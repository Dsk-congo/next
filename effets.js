/* =========================================================
   Compléments du site public : barre du haut, boutons d'appel
   et d'email, barre de progression, retour en haut.
   (Les animations de transition ont été retirées.)
   ========================================================= */
(function () {
  var reduit = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var pro = document.documentElement.getAttribute("data-theme") === "pro";
  var E = (window.NG_CONTENU || {}).entreprise || {};

  /* Barre du haut (slogan) */
  var header = document.getElementById("site-header");
  if (header && !document.querySelector(".pro-top")) {
    var top = document.createElement("div");
    top.className = "pro-top";
    top.textContent = "NextGenIT — Réseaux, cybersécurité, web, cloud et formations à Kolwezi et partout en RDC";
    header.parentNode.insertBefore(top, header);
  }

  /* Boutons d'appel et d'email ajoutés aux boutons flottants */
  var flot = document.querySelector(".floating");
  if (flot && E.telephone && !flot.querySelector(".fab-tel")) {
    var tel = document.createElement("a");
    tel.className = "fab fab-tel"; tel.href = "tel:" + String(E.telephone).replace(/\s/g, ""); tel.setAttribute("aria-label", "Appeler NextGenIT");
    tel.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7l.7 2.8a2 2 0 01-.5 2.1L8 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4l2.8.7a2 2 0 011.7 2z"/></svg>';
    var mail = document.createElement("a");
    mail.className = "fab fab-mail"; mail.href = "mailto:" + (E.email || ""); mail.setAttribute("aria-label", "Écrire un email à NextGenIT");
    mail.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18v12H3zM3 6l9 7 9-7"/></svg>';
    flot.appendChild(tel); flot.appendChild(mail);
  }

  /* Barre de progression et ombre du menu */
  var barre = document.createElement("div");
  barre.id = "pro-progress";
  document.body.appendChild(barre);
  var hautBtn = document.createElement("button");
  hautBtn.type = "button"; hautBtn.className = "haut"; hautBtn.setAttribute("aria-label", "Revenir en haut de la page");
  hautBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  hautBtn.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduit ? "auto" : "smooth" }); });
  document.body.appendChild(hautBtn);
  var hero = document.querySelector(".hero");
  function surDefilement() {
    var h = document.documentElement.scrollHeight - innerHeight;
    barre.style.width = (h > 0 ? scrollY / h * 100 : 0) + "%";
    if (header) header.classList.toggle("scrolled", scrollY > 10);
    hautBtn.classList.toggle("vu", scrollY > 600);
  }
  addEventListener("scroll", surDefilement, { passive: true });
  surDefilement();


  /* Mise à jour en direct : quand l'administration enregistre, la page se recharge à la même position
     (sauf si un formulaire est en cours de saisie) */
  try { var y0 = sessionStorage.getItem("ng_scroll_" + location.pathname); if (y0) { sessionStorage.removeItem("ng_scroll_" + location.pathname); window.scrollTo(0, Number(y0)); } } catch (e) {}
  window.addEventListener("ng-donnees", function (e) {
    var cles = (e.detail && e.detail.cles) || [];
    if (cles.every(function (k) { return k === "ng_presence" || k === "ng_journal"; })) return;
    var saisie = Array.prototype.some.call(document.querySelectorAll("main input:not([type=hidden]):not([type=radio]):not([type=checkbox]), main textarea"), function (x) { return x.value; });
    if (saisie || document.querySelector("dialog[open]")) return;
    try { sessionStorage.setItem("ng_scroll_" + location.pathname, String(scrollY)); } catch (er) {}
    location.reload();
  });
})();
