/* Administration – Opérations : demandes et devis, interventions, techniciens */
(function () {
  var A = window.NGA, S = A.S, C = A.C, esc = A.esc, argent = A.argent;
  var LIB = { a_evaluer: ["À évaluer", "tag-warn"], devis_envoye: ["Devis envoyé", "tag-accent"], accepte: ["Accepté", "tag-ok"], paye: ["Payé", "tag-ok"], cloture: ["Clôturé", "tag-muted"], refuse: ["Refusé", "tag-muted"] };
  var ETAPES = [["", "À planifier"], ["assigne", "Technicien assigné"], ["en_route", "En route"], ["sur_site", "Sur site"], ["termine", "Travaux terminés"]];
  var STATUTS_TECH = ["Disponible", "En route", "Sur site", "Indisponible", "En congé"];
  var SPECIALITES = ["Réseau", "Vidéosurveillance", "Cybersécurité", "Pare-feu", "Virtualisation", "Serveurs", "Web", "Cloud", "Supervision", "Dépannage", "Maintenance", "Support", "Formation"];

  function totaux(d) {
    var tva = S.reglages().tva;
    var st = (d.lignes || []).reduce(function (a, l) { return a + (Number(l.qte) || 0) * (Number(l.pu) || 0); }, 0);
    return { st: st, tva: st * tva / 100, ttc: st * (1 + tva / 100), taux: tva };
  }
  function techs() { return S.liste("personnel").filter(function (p) { return (p.type === "technicien"); }); }
  function tech(id) { return S.liste("personnel").filter(function (p) { return p.id === id; })[0]; }
  function tagTech(s) { var c = s === "Disponible" ? "tag-ok" : s === "Indisponible" || s === "En congé" ? "tag-muted" : "tag-warn"; return '<span class="tag ' + c + '">' + esc(s) + "</span>"; }
  function factureDe(d) { return S.liste("factures").filter(function (f) { return f.demandeId === d.id && f.statut !== "annulee"; })[0]; }
  function ouvrirEnvoi(type, d, msg, sujet) {
    var tel = (d.telephone || "").replace(/[^\d]/g, "");
    var url = type === "wa" ? "https://wa.me/" + tel + "?text=" + encodeURIComponent(msg)
      : type === "mail" ? "mailto:" + encodeURIComponent(d.email || "") + "?subject=" + encodeURIComponent(sujet || "NextGenIT") + "&body=" + encodeURIComponent(msg)
      : "sms:" + tel + "?body=" + encodeURIComponent(msg);
    window.open(url, "_blank", "noopener");
  }
  A.LIB = LIB; A.ETAPES = ETAPES; A.totaux = totaux; A.techs = techs; A.tech = tech; A.tagTech = tagTech; A.ouvrirEnvoi = ouvrirEnvoi; A.factureDe = factureDe;

  /* =================== Demandes et devis =================== */
  var filtre = "a_evaluer";
  A.VUES.demandes = function () {
    var L = S.demandes();
    var sel = location.hash.split("/")[1] || "";
    var courant = L.filter(function (d) { return d.id === sel; })[0];
    if (courant) filtre = courant.statut;
    var liste = L.filter(function (d) { return filtre === "tous" || d.statut === filtre; });
    if (!courant && liste.length) courant = liste[0];
    var onglets = [["a_evaluer", "À évaluer"], ["devis_envoye", "Envoyés"], ["accepte", "Acceptés"], ["paye", "Payés"], ["tous", "Toutes"]];
    A.vue.innerHTML = A.entete("Demandes et devis", "Évaluez, fixez le montant, assignez un technicien, envoyez le devis puis générez la facture") +
      '<div class="tabs" role="tablist">' + onglets.map(function (o) {
        var n = o[0] === "tous" ? L.length : L.filter(function (d) { return d.statut === o[0]; }).length;
        return '<button class="tab" type="button" role="tab" data-filtre="' + o[0] + '" aria-selected="' + (filtre === o[0]) + '">' + o[1] + " (" + n + ")</button>";
      }).join("") + "</div>" +
      '<div class="split"><div class="stack">' +
      (liste.length ? liste.map(function (d) { var l = LIB[d.statut]; return '<button class="req" type="button" data-ouvrir="' + d.id + '" aria-current="' + (courant && courant.id === d.id) + '"><span style="display:flex;justify-content:space-between;gap:8px"><small>' + d.id + " · " + A.jour(d.creeLe) + '</small><span class="tag ' + l[1] + '">' + l[0] + "</span></span><strong>" + esc(d.entreprise || d.nom) + "</strong><small>" + esc((d.services || []).join(", ")) + "</small></button>"; }).join("") : '<div class="card empty"><p>Aucune demande dans cette liste.</p></div>') +
      "</div><div>" + (courant ? detail(courant) : '<div class="card empty"><p>Sélectionnez une demande.</p></div>') + "</div></div>";
    A.lier("[data-filtre]", "click", function (e, b) { filtre = b.dataset.filtre; history.replaceState(null, "", "#demandes"); A.rafraichir(); });
    A.lier("[data-ouvrir]", "click", function (e, b) { location.hash = "#demandes/" + b.dataset.ouvrir; });
    if (courant) brancher(courant);
  };
  function resume(t) { return '<span>Total</span><strong style="font-size:1.25rem">' + argent(t.ttc) + "</strong>"; }
  function detail(d) {
    var t = totaux(d), fac = factureDe(d);
    var lignes = (d.lignes && d.lignes.length) ? d.lignes : [{ designation: "", qte: 1, pu: 0 }];
    var tk = techs().filter(function (x) { return x.actif; });
    var peutFacturer = ["accepte", "paye", "cloture"].indexOf(d.statut) > -1 && d.lignes && d.lignes.length;
    return '<div class="stack" style="gap:18px" id="detail-demande">' +
      '<div class="card"><div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px"><div><small class="muted">' + d.id + " · reçue le " + A.heure(d.creeLe) + '</small><h2 style="font-size:1.4rem">' + esc(d.entreprise || d.nom) + '</h2></div><label class="field" style="min-width:190px">Statut<select id="d-statut">' + Object.keys(LIB).map(function (k) { return '<option value="' + k + '"' + (k === d.statut ? " selected" : "") + ">" + LIB[k][0] + "</option>"; }).join("") + "</select></label></div>" +
      '<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr))">' +
      '<div class="row-item block"><small class="muted">Contact</small><strong>' + esc(d.nom) + "</strong><span>" + esc(d.telephone) + "</span><span>" + esc(d.email || "—") + "</span></div>" +
      '<div class="row-item block"><small class="muted">Adresse</small><span>' + esc(d.adresse || "—") + '</span><small class="muted">Date souhaitée : ' + esc(d.date || "—") + "</small></div>" +
      '<div class="row-item block"><small class="muted">Devis souhaité par</small><strong>' + esc((d.canaux || []).join(", ")) + '</strong><small class="muted">' + esc(d.urgence || "") + "</small></div></div>" +
      '<div><small class="muted">Services demandés</small><p><strong>' + esc((d.services || []).join(", ")) + "</strong></p></div>" +
      '<div class="notice neutral">' + esc(d.description) + (d.quantite ? '<br><small class="muted">Quantité indiquée : ' + esc(d.quantite) + "</small>" : "") + "</div>" +
      (d.fichiers && d.fichiers.length ? '<p class="muted" style="font-size:.9rem">Fichiers joints : ' + d.fichiers.map(esc).join(", ") + "</p>" : "") +
      '<label class="field">Technicien assigné<select id="d-tech"><option value="">— Choisir un technicien —</option>' + tk.map(function (x) { return '<option value="' + x.id + '"' + (x.id === d.techId ? " selected" : "") + ">" + esc(x.nom) + " · " + esc(x.specialites.join(", ")) + " · " + esc(x.statut) + "</option>"; }).join("") + "</select></label></div>" +

      '<div class="card"><h2 class="h-card">Évaluation et montant</h2><div class="table-wrap"><table class="t"><thead><tr><th>Désignation</th><th style="width:90px">Qté</th><th style="width:140px">Prix unit. ($)</th><th class="r" style="width:130px">Total</th><th style="width:50px"><span class="sr-only">Supprimer</span></th></tr></thead><tbody id="d-lignes">' +
      lignes.map(function (l, i) {
        return '<tr><td><input aria-label="Désignation ligne ' + (i + 1) + '" data-f="designation" value="' + esc(l.designation) + '" placeholder="Ex. Caméra IP 4K – fourniture et pose"></td><td><input aria-label="Quantité ligne ' + (i + 1) + '" data-f="qte" type="number" min="0" step="1" value="' + l.qte + '"></td><td><input aria-label="Prix unitaire ligne ' + (i + 1) + '" data-f="pu" type="number" min="0" step="0.01" value="' + l.pu + '"></td><td class="r" data-tot>' + argent(l.qte * l.pu) + '</td><td><button class="icon-btn" type="button" data-suppr="' + i + '" aria-label="Supprimer la ligne ' + (i + 1) + '">×</button></td></tr>';
      }).join("") + "</tbody></table></div>" +
      '<button class="btn btn-ghost btn-sm" type="button" id="d-ajout" style="align-self:flex-start">+ Ajouter une ligne</button>' +
      '<div class="form-grid"><label class="field">Validité du devis<select id="d-validite">' + A.options(["15 jours", "30 jours"], d.validite || "15 jours") + '</select></label><label class="field">Délai d’exécution<input id="d-delai" value="' + esc(d.delai || "") + '" placeholder="Ex. 3 jours ouvrables"></label><label class="field">Acompte demandé<select id="d-acompte">' + A.options([["0", "Aucun"], ["30", "30 %"], ["50", "50 %"], ["100", "Paiement complet"]], String(d.acompte || 0)) + '</select></label><label class="field full">Note pour le client<textarea id="d-note" placeholder="Ex. Matériel garanti 1 an.">' + esc(d.note || "") + "</textarea></label></div>" +
      '<div class="row-item total-row" id="d-sum">' + resume(t) + "</div>" +
      '<button class="btn btn-primary" type="button" id="d-enregistrer">Enregistrer le devis</button></div>' +

      '<div class="card"><h2 class="h-card">Envoyer et facturer</h2><p>Les boutons ouvrent WhatsApp, l’email ou les SMS avec le message prêt.</p><div class="send-row">' +
      '<button class="btn btn-whatsapp" type="button" data-envoi="wa">WhatsApp</button>' +
      '<button class="btn btn-ghost" type="button" data-envoi="mail"' + (d.email ? "" : " disabled") + ">Email</button>" +
      '<button class="btn btn-ghost" type="button" data-envoi="sms">SMS</button>' +
      '<a class="btn btn-ghost" href="document.html?type=devis&id=' + d.id + '" target="_blank" rel="noopener">Devis PDF</a></div>' +
      (fac ? '<div class="notice">Facture <strong>' + esc(fac.numero) + "</strong> générée le " + A.jour(fac.emiseLe) + " · " + argent(fac.ttc) + ' · <a href="#factures/' + fac.id + '">Ouvrir la facture</a></div>'
        : peutFacturer ? '<button class="btn btn-primary" type="button" id="d-facturer">Générer la facture</button>'
          : '<p class="muted" style="font-size:.9rem">Le bouton « Générer la facture » apparaît quand le devis est accepté par le client.</p>') +
      '<button class="btn btn-ghost btn-sm danger-link" type="button" id="d-supprimer" style="align-self:flex-start">Supprimer la demande</button></div></div>';
  }
  function lireLignes() {
    return Array.prototype.map.call(A.vue.querySelectorAll("#d-lignes tr"), function (tr) {
      var v = function (f) { return tr.querySelector('[data-f="' + f + '"]').value; };
      return { designation: v("designation").trim(), qte: Number(v("qte")) || 0, pu: Number(v("pu")) || 0 };
    }).filter(function (l) { return l.designation || l.pu; });
  }
  function sauver(d, extra) {
    return S.majDemande(d.id, Object.assign({
      lignes: lireLignes(), validite: A.vue.querySelector("#d-validite").value, acompte: Number(A.vue.querySelector("#d-acompte").value),
      delai: A.vue.querySelector("#d-delai").value.trim(), note: A.vue.querySelector("#d-note").value.trim(), evalueLe: new Date().toISOString()
    }, extra || {}));
  }
  function msgDevis(d) {
    var t = totaux(d), base = location.href.split("/admin")[0];
    return "Bonjour " + d.nom + ",\n\nVotre devis NextGenIT pour " + (d.services || []).join(", ") + " est prêt.\nMontant : " + argent(t.ttc) + (d.validite ? ", valable " + d.validite : "") + (d.acompte ? ".\nAcompte à la commande : " + d.acompte + " % (" + argent(t.ttc * d.acompte / 100) + ")" : "") + ".\n\nConsulter et accepter : " + base + "/connexion.html\nRéférence : " + d.id + "\n\nNextGenIT – " + C.entreprise.telephone;
  }
  function brancher(d) {
    A.vue.querySelector("#d-statut").addEventListener("change", function (e) { var x = sauver(d, { statut: e.target.value }); S.log("Statut de demande", x.id + " → " + LIB[e.target.value][0]); filtre = e.target.value; A.rafraichir(); });
    A.vue.querySelector("#d-tech").addEventListener("change", function (e) { var x = S.majDemande(d.id, { techId: e.target.value, etape: e.target.value ? (d.etape || "assigne") : "" }); var t = tech(e.target.value); S.log("Technicien assigné", x.id + " → " + (t ? t.nom : "aucun")); A.toast(t ? t.nom + " assigné" : "Technicien retiré", "ok"); });
    A.vue.querySelector("#d-ajout").addEventListener("click", function () { var l = lireLignes(); l.push({ designation: "", qte: 1, pu: 0 }); S.majDemande(d.id, { lignes: l }); A.rafraichir(); });
    A.lier("[data-suppr]", "click", function (e, b) { S.majDemande(d.id, { lignes: lireLignes().filter(function (x, i) { return i !== Number(b.dataset.suppr); }) }); A.rafraichir(); });
    A.vue.querySelector("#d-lignes").addEventListener("input", function (e) {
      var tr = e.target.closest("tr"); if (!tr) return;
      var q = Number(tr.querySelector("[data-f=qte]").value) || 0, pu = Number(tr.querySelector("[data-f=pu]").value) || 0;
      tr.querySelector("[data-tot]").textContent = argent(q * pu);
      A.vue.querySelector("#d-sum").innerHTML = resume(totaux(sauver(d)));
    });
    A.vue.querySelector("#d-enregistrer").addEventListener("click", function () { var x = sauver(d); S.log("Devis évalué", x.id + " · " + (x.entreprise || x.nom), totaux(x).ttc); A.toast("Devis enregistré", "ok"); A.rafraichir(); });
    A.lier("[data-envoi]", "click", function (e, b) {
      if (!lireLignes().length) { A.toast("Ajoutez au moins une ligne avec un prix avant d’envoyer", "warn"); return; }
      var x = sauver(d, { statut: d.statut === "a_evaluer" ? "devis_envoye" : d.statut, envoyeLe: new Date().toISOString() });
      ouvrirEnvoi(b.dataset.envoi, x, msgDevis(x), "Votre devis NextGenIT " + x.id);
      S.log("Devis envoyé (" + b.textContent.trim() + ")", x.id, totaux(x).ttc);
      A.toast("Devis marqué comme envoyé", "ok"); filtre = x.statut; A.rafraichir();
    });
    var bf = A.vue.querySelector("#d-facturer");
    if (bf) bf.addEventListener("click", function () { var x = sauver(d); var f = A.fin.creerFacture(x); A.toast("Facture " + f.numero + " générée", "ok"); location.hash = "#factures/" + f.id; });
    A.vue.querySelector("#d-supprimer").addEventListener("click", function () { if (confirm("Supprimer définitivement la demande " + d.id + " ?")) { S.supprimerDemande(d.id); S.log("Demande supprimée", d.id); history.replaceState(null, "", "#demandes"); A.rafraichir(); } });
  }

  /* =================== Interventions =================== */
  A.VUES.interventions = function () {
    var L = S.demandes().filter(function (d) { return ["accepte", "paye", "cloture"].indexOf(d.statut) > -1 || d.techId; });
    var tk = techs().filter(function (x) { return x.actif; });
    var col = function (et) { return L.filter(function (d) { return (d.etape || "") === et && d.statut !== "cloture"; }); };
    A.vue.innerHTML = A.entete("Interventions", "Assignez, suivez l’étape et l’avancement de chaque chantier") +
      '<div class="kanban">' + ETAPES.map(function (e) {
        var items = col(e[0]);
        return '<section class="kcol"><h2>' + e[1] + " <span>" + items.length + "</span></h2>" + items.map(function (d) {
          var t = tech(d.techId);
          return '<article class="kcard" data-int="' + d.id + '"><small class="muted">' + d.id + '</small><strong>' + esc(d.entreprise || d.nom) + '</strong><span class="muted" style="font-size:.85rem">' + esc((d.services || []).join(", ")) + '</span><div class="progress"><span style="width:' + (d.avancement || 0) + '%"></span></div><span style="display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:.85rem">' + (t ? A.avatar(t, 26) + " " + esc(t.nom) : '<em class="muted">Non assigné</em>') + "<b>" + (d.avancement || 0) + ' %</b></span><button class="btn btn-ghost btn-sm" type="button" data-gerer>Gérer</button></article>';
        }).join("") + "</section>";
      }).join("") + "</div>" +
      (L.filter(function (d) { return d.statut === "cloture"; }).length ? '<p class="muted mt-2">' + L.filter(function (d) { return d.statut === "cloture"; }).length + " intervention(s) clôturée(s).</p>" : "") +
      (L.length ? "" : '<div class="card empty mt-2"><h2 class="h-card">Aucune intervention</h2><p>Une intervention apparaît dès qu’un devis est accepté ou qu’un technicien est assigné.</p></div>');
    A.lier("[data-gerer]", "click", function (e, b) {
      var id = b.closest("[data-int]").dataset.int, d = S.demandes().filter(function (x) { return x.id === id; })[0], t = tech(d.techId);
      A.modal({
        titre: d.id + " · " + (d.entreprise || d.nom), valider: "Enregistrer",
        corps: '<p class="muted">' + esc((d.services || []).join(", ")) + " · " + esc(d.adresse || "Adresse à confirmer") + '</p><div class="form-grid">' +
          '<label class="field">Technicien<select name="tech"><option value="">— Non assigné —</option>' + tk.map(function (x) { return '<option value="' + x.id + '"' + (x.id === d.techId ? " selected" : "") + ">" + esc(x.nom) + " (" + esc(x.statut) + ")</option>"; }).join("") + "</select></label>" +
          '<label class="field">Étape<select name="etape">' + A.options(ETAPES, d.etape || "") + "</select></label>" +
          '<label class="field">Avancement (%)<input name="av" type="number" min="0" max="100" step="5" value="' + (d.avancement || 0) + '"></label>' +
          '<label class="field">Date prévue<input name="date" type="date" value="' + esc(d.datePrevue || d.date || "") + '"></label></div>' +
          ((d.photosTech || []).length ? '<div><strong>Photos du technicien</strong><div class="hero-actions">' + d.photosTech.map(function (ph, k) { return '<button type="button" class="btn btn-ghost btn-sm" data-photo-t="' + k + '">📷 ' + (ph.moment === "avant" ? "Avant" : "Après") + " · " + A.heure(ph.date) + "</button>"; }).join("") + "</div></div>" : "") +
          '<div class="hero-actions">' + (t ? '<a class="btn btn-ghost btn-sm" href="tel:' + esc(t.telephone.replace(/\s/g, "")) + '">Appeler ' + esc(t.nom) + "</a>" : "") + '<button class="btn btn-ghost btn-sm" type="button" id="i-info">Informer le client (WhatsApp)</button><button class="btn btn-ghost btn-sm" type="button" id="i-rapport">Rapport signé par le client</button><button class="btn btn-ghost btn-sm" type="button" id="i-clore">Clôturer</button></div>',
        apres: function (f) {
          f.querySelectorAll("[data-photo-t]").forEach(function (b) { b.addEventListener("click", function () { var ph = d.photosTech[Number(b.dataset.photoT)]; window.NGFichiers.ouvrir(ph.cle, "photo-" + d.id + ".jpg"); }); });
          f.querySelector("#i-rapport").addEventListener("click", function () { A.fermer(); A.rapportSigne(null, d); });
          f.querySelector("#i-info").addEventListener("click", function () { var et = f.etape.options[f.etape.selectedIndex].text; ouvrirEnvoi("wa", d, "Bonjour " + d.nom + ",\nSuivi de votre intervention " + d.id + " : " + et + ", avancement " + f.av.value + " %.\nNextGenIT", ""); S.log("Client informé", d.id + " · " + et); });
          f.querySelector("#i-clore").addEventListener("click", function () { S.majDemande(d.id, { statut: "cloture", etape: "termine", avancement: 100, cloreLe: new Date().toISOString() }); if (d.techId) S.modifier("personnel", d.techId, { statut: "Disponible" }); S.log("Intervention clôturée", d.id); A.fermer(); A.rafraichir(); A.toast("Intervention clôturée", "ok"); });
        },
        onSubmit: function (f) {
          var map = { assigne: "Disponible", en_route: "En route", sur_site: "Sur site", termine: "Disponible", "": "Disponible" };
          var modif = { techId: f.tech.value, etape: f.etape.value, avancement: f.etape.value === "termine" ? 100 : Math.max(0, Math.min(100, Number(f.av.value) || 0)), datePrevue: f.date.value };
          if (modif.techId && !modif.etape) modif.etape = "assigne";
          S.majDemande(d.id, modif);
          if (modif.techId) S.modifier("personnel", modif.techId, { statut: map[modif.etape] });
          S.log("Intervention mise à jour", d.id + " · " + f.etape.options[f.etape.selectedIndex].text + " · " + modif.avancement + " %");
          A.rafraichir(); A.toast("Intervention mise à jour", "ok");
        }
      });
    });
  };

  /* =================== Techniciens et personnel =================== */
  /* Badge généré automatiquement pour chaque membre du personnel */
  function nouveauBadge(type) {
    var pris = S.liste("personnel").map(function (x) { return x.badge; }), b;
    do { b = (type === "technicien" ? "NG-T-" : "NG-P-") + String(Math.floor(1000 + Math.random() * 9000)); } while (pris.indexOf(b) > -1);
    return b;
  }
  function expiration() { var d = new Date(); d.setFullYear(d.getFullYear() + 1); return d.toISOString().slice(0, 10); }
  function badgesManquants() { S.liste("personnel").forEach(function (x) { if (!x.badge || !x.badgeExpire) S.modifier("personnel", x.id, { badge: x.badge || nouveauBadge(x.type), badgeExpire: x.badgeExpire || expiration() }); }); }
  A.VUES.techniciens = function () {
    badgesManquants();
    var P = S.liste("personnel"), L = S.demandes();
    var tk = P.filter(function (p) { return (p.type === "technicien") && p.actif; });
    var specs = {};
    tk.forEach(function (t) { t.specialites.forEach(function (s) { specs[s] = specs[s] || [0, 0]; specs[s][1]++; if (t.statut === "Disponible") specs[s][0]++; }); });
    A.vue.innerHTML = A.entete("Techniciens et personnel", "Spécialités, disponibilité, tâche en cours et salaires", '<button class="btn btn-primary" type="button" id="p-nouveau">+ Ajouter une personne</button>') +
      '<div class="card"><h2 class="h-card">Disponibilité par spécialité</h2><div class="chips" style="gap:8px">' +
      Object.keys(specs).map(function (s) { return '<span class="tag ' + (specs[s][0] ? "tag-ok" : "tag-warn") + '" style="font-size:.88rem;padding:6px 12px">' + esc(s) + " : " + specs[s][0] + " / " + specs[s][1] + "</span>"; }).join("") + "</div></div>" +
      '<div class="grid mt-2" style="grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))">' +
      P.map(function (p) {
        var tache = L.filter(function (d) { return d.techId === p.id && d.etape && d.etape !== "termine" && d.statut !== "cloture"; })[0];
        return '<article class="card person' + (p.actif ? "" : " off") + '" data-p="' + p.id + '"><div style="display:flex;gap:12px;align-items:center">' + A.avatar(p, 48) + '<div style="min-width:0;flex:1"><strong>' + esc(p.nom) + '</strong><br><small class="muted">' + esc(p.poste) + "</small></div>" + A.interrupteur("data-p-actif", !!p.actif, "Accès actif pour " + p.nom) + "</div>" +
          '<div class="chips">' + (p.specialites || []).map(function (s) { return '<span class="tag tag-muted">' + esc(s) + "</span>"; }).join("") + "</div>" +
          '<label class="field">Statut<select data-p-statut>' + A.options(STATUTS_TECH, p.statut) + "</select></label>" +
          '<div class="row-item"><span class="muted">Tâche en cours</span>' + (tache ? '<a href="#interventions">' + esc(tache.id) + "</a>" : '<span class="muted">Aucune</span>') + "</div>" +
          '<div class="foot"><span>' + esc(p.telephone) + (p.badge ? " · " + esc(p.badge) : "") + '</span><span class="hero-actions" style="flex-wrap:nowrap"><a class="btn btn-ghost btn-sm" href="document.html?type=badge&pid=' + p.id + '" target="_blank" rel="noopener" title="Imprimer le badge avec QR code">🪪 Badge</a><button class="btn btn-ghost btn-sm" type="button" data-p-acces title="Code pour l’application technicien">📱 ' + (p.pinHash ? "Accès" : "Activer l’accès") + '</button><button class="btn btn-ghost btn-sm" type="button" data-p-edit>Modifier</button></span></div></article>';
      }).join("") + "</div>";
    A.vue.querySelector("#p-nouveau").addEventListener("click", function () { formPerso(null); });
    A.lier("[data-p-acces]", "click", function (e, b) {
      var p = S.liste("personnel").filter(function (x) { return x.id === b.closest("[data-p]").dataset.p; })[0];
      if (!p.badge) { A.toast("Ouvrez d’abord la page Personnel pour générer le badge", "warn"); return; }
      var pin = String(Math.floor(100000 + Math.random() * 900000));
      A.sha256(p.badge.toUpperCase() + ":" + pin).then(function (h) {
        S.modifier("personnel", p.id, { pinHash: h, accesLe: new Date().toISOString() });
        S.log("Accès technicien activé", p.nom + " · " + p.badge);
        var url = location.href.split("/admin")[0] + "/technicien.html", msg = "Bonjour " + p.nom + ",\nVoici votre accès à l’application technicien NextGenIT :\n🔗 " + url + "\n🪪 Badge : " + p.badge + "\n🔑 Code : " + pin + "\nAjoutez la page à l’écran d’accueil de votre téléphone.";
        A.modal({ titre: "Accès technicien · " + p.nom, annuler: "Terminé", corps: '<p>L’application s’ouvre sur le téléphone : interventions du jour, itinéraire, photos avant/après, rapport signé par le client et tickets.</p><div class="row-item block"><small class="muted">Adresse</small><strong>' + esc(url) + '</strong><small class="muted">Badge</small><strong>' + esc(p.badge) + '</strong><small class="muted">Code personnel</small><strong style="font-family:ui-monospace,monospace;font-size:1.3rem">' + pin + '</strong></div><div class="send-row"><a class="btn btn-whatsapp" target="_blank" rel="noopener" href="https://wa.me/' + String(p.telephone || "").replace(/[^\d]/g, "") + "?text=" + encodeURIComponent(msg) + '">Envoyer sur WhatsApp</a></div><p class="muted" style="font-size:.85rem">Un nouveau code remplace l’ancien. Le code n’est plus visible après fermeture.</p>' });
        A.rafraichir();
      });
    });
    A.lier("[data-p-edit]", "click", function (e, b) { formPerso(S.liste("personnel").filter(function (x) { return x.id === b.closest("[data-p]").dataset.p; })[0]); });
    A.lier("[data-p-statut]", "change", function (e, s) { var p = S.modifier("personnel", s.closest("[data-p]").dataset.p, { statut: s.value }); S.log("Statut du technicien", p.nom + " → " + s.value); A.toast(p.nom + " : " + s.value); });
    A.lier("[data-p-actif]", "click", function (e, b) { var p = S.modifier("personnel", b.closest("[data-p]").dataset.p, { actif: b.getAttribute("aria-checked") !== "true" }); S.log(p.actif ? "Personnel réactivé" : "Personnel désactivé", p.nom); A.rafraichir(); });
  };
  function formPerso(p) {
    var n = !p;
    p = p || { nom: "", poste: "", type: "technicien", specialites: [], telephone: "", statut: "Disponible", actif: true, salaire: 0, mode: "M-Pesa", badge: "" };
    A.modal({
      titre: n ? "Nouvelle personne" : "Modifier " + p.nom, valider: "Enregistrer", large: true,
      corps: '<div class="form-grid">' +
        '<label class="field">Nom complet<input name="nom" required value="' + esc(p.nom) + '"></label>' +
        '<label class="field">Poste<input name="poste" required value="' + esc(p.poste) + '"></label>' +
        '<label class="field">Catégorie<select name="type">' + A.options([["technicien", "Technicien IT"], ["formateur", "Formateur"], ["commercial", "Commercial"], ["bureau", "Administratif"]], p.type) + "</select></label>" +
        '<label class="field">Email<input name="email" type="email" value="' + esc(p.email || "") + '"></label>' +
        '<label class="field">Contrat<select name="contrat">' + A.options(["CDI", "CDD", "Stage", "Prestataire"], p.contrat || "CDI") + "</select></label>" +
        '<label class="field">Date d’embauche<input name="embauche" type="date" value="' + esc(p.embauche || "") + '"></label>' +
        '<label class="field">Zone d’intervention<input name="zone" value="' + esc(p.zone || "") + '" placeholder="Ex. Manika, Dilala, sites miniers"></label>' +
        '<label class="field">Rémunération<select name="remu">' + A.options([["fixe", "Salaire fixe"], ["horaire", "À l’heure"], ["mixte", "Fixe + heures"]], p.remu || "fixe") + "</select></label>" +
        '<label class="field">Taux horaire ($)<input name="taux" type="number" min="0" step="0.5" value="' + esc(p.tauxHoraire || 0) + '"></label>' +
        '<label class="field">Commission par intervention ($)<input name="com" type="number" min="0" step="1" value="' + esc(p.commission || 0) + '"></label>' +
        '<label class="field">Téléphone<input name="telephone" type="tel" value="' + esc(p.telephone) + '"></label>' +
        '<label class="field">Numéro de badge<input name="badge" value="' + esc(p.badge || "") + '" placeholder="Généré automatiquement"><small>Laissez vide : le numéro est créé tout seul.</small></label><label class="field">Badge valable jusqu’au<input name="badgeExp" type="date" value="' + esc(p.badgeExpire || "") + '"></label>' +
        '<label class="field">Salaire de base ($)<input name="salaire" type="number" min="0" step="1" value="' + esc(p.salaire) + '"></label>' +
        '<label class="field">Mode de paie<select name="mode">' + A.options(A.MODES_PAIE, p.mode) + "</select></label>" +
        '<label class="field">Photo<input name="photo" type="file" accept="image/*"></label>' +
        '<label class="field">Pièces justificatives (contrat, diplômes, ID)<input name="pieces" type="file" multiple accept=".pdf,image/*,.doc,.docx"><small>' + ((p.pieces || []).length ? "Déjà : " + p.pieces.map(esc).join(", ") : "Gardées dans ce navigateur") + '</small></label>' +
        '<label class="field full">Compétences et certifications<textarea name="competences" style="min-height:70px" placeholder="Ex. CCNA, NSE4 Fortinet, câblage fibre…">' + esc(p.competences || "") + "</textarea></label></div>" +
        '<div><div class="panel-label" style="margin-bottom:8px">Spécialités</div><div class="chips">' + SPECIALITES.map(function (s) { return '<label class="choice chip-choice"><input type="checkbox" name="spec" value="' + s + '"' + (p.specialites.indexOf(s) > -1 ? " checked" : "") + "><span>" + s + "</span></label>"; }).join("") + "</div></div>" +
        (n ? "" : '<button type="button" class="btn btn-ghost btn-sm danger-link" id="p-suppr" style="justify-self:start">Supprimer cette personne</button>'),
      apres: function (f) {
        var b = f.querySelector("#p-suppr");
        if (b) b.addEventListener("click", function () { if (confirm("Supprimer " + p.nom + " ?")) { S.retirer("personnel", p.id); S.log("Personnel supprimé", p.nom); A.fermer(); A.rafraichir(); } });
      },
      onSubmit: function (f) {
        var data = { nom: f.nom.value.trim(), poste: f.poste.value.trim(), type: f.type.value, telephone: f.telephone.value.trim(), badge: f.badge.value.trim().toUpperCase(), salaire: Number(f.salaire.value) || 0, mode: f.mode.value, specialites: Array.prototype.map.call(f.querySelectorAll("[name=spec]:checked"), function (x) { return x.value; }) , email: f.email.value.trim(), contrat: f.contrat.value, embauche: f.embauche.value, zone: f.zone.value.trim(), remu: f.remu.value, tauxHoraire: Number(f.taux.value) || 0, commission: Number(f.com.value) || 0, competences: f.competences.value.trim() };
        var fichiers = Array.prototype.slice.call(f.pieces.files);
        if (fichiers.length) { data.pieces = (p.pieces || []).concat(fichiers.map(function (x) { return x.name; })); fichiers.forEach(function (x) { if (window.NGFichiers) window.NGFichiers.enregistrer("piece-" + (p.id || data.nom) + "-" + x.name, x); }); }
        if (!data.nom || !data.poste) { A.toast("Nom et poste obligatoires", "warn"); return false; }
        var fin = function () {
          if (!data.badge) data.badge = (n ? "" : p.badge) || nouveauBadge(data.type);
          data.badgeExpire = f.badgeExp.value || p.badgeExpire || expiration();
          if (n) { data.statut = "Disponible"; data.actif = true; var nv = S.ajouter("personnel", data, "P-"); S.log("Personnel ajouté", data.nom + " · badge " + data.badge); setTimeout(function () { if (confirm("Badge " + data.badge + " créé pour " + data.nom + ". L’imprimer maintenant ?")) window.open("document.html?type=badge&pid=" + nv.id, "_blank", "noopener"); }, 300); }
          else { S.modifier("personnel", p.id, data); S.log("Personnel modifié", data.nom); }
          A.rafraichir(); A.toast("Enregistré", "ok");
        };
        if (f.photo.files[0]) return (A.recadrer ? A.recadrer(f.photo.files[0], 400) : A.redimensionner(f.photo.files[0], 256)).then(function (u) { if (u) data.photo = u; fin(); });
        fin();
      }
    });
  }
})();
