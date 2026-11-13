/* Administration – Finances : factures, pro-forma, abonnements, paiements, caisse, dépenses, budgets, paie */
(function () {
  var A = window.NGA, S = A.S, esc = A.esc, argent = A.argent, jour = A.jour;
  var AUJ = function () { return new Date().toISOString().slice(0, 10); };

  /* Moyens d'encaissement : chaque mode alimente un compte */
  var MODES = [
    ["M-Pesa", "M-Pesa"], ["Orange Money", "Orange Money"], ["Airtel Money", "Airtel Money"],
    ["Carte Visa / Mastercard", "Banque"], ["Virement EquityBCDC", "Banque"], ["Virement autre banque", "Banque"],
    ["Chèque", "Banque"], ["Espèces (caisse)", "Caisse"]
  ];
  var COMPTE_DE = {}; MODES.forEach(function (m) { COMPTE_DE[m[0]] = m[1]; });
  var COMPTES = ["Banque", "M-Pesa", "Orange Money", "Airtel Money", "Caisse"];
  var MODES_PAIE = ["M-Pesa", "Orange Money", "Airtel Money", "Banque", "Espèces (caisse)"];
  var CATEGORIES = ["Paie", "Avances sur salaire", "Matériel et stock", "Carburant et déplacements", "Loyer et électricité", "Internet et licences", "Marketing", "Formation", "Divers"];
  var COULEURS = ["#2AA9F0", "#7CC243", "#F5B547", "#A78BFA", "#F87171", "#34D399", "#60A5FA", "#FB923C"];
  A.MODES_PAIE = MODES_PAIE;

  /* ---------- Factures ---------- */
  function compteur(cle, base) { var n = Number(localStorage.getItem(cle) || base) + 1; localStorage.setItem(cle, n); return n; }
  function calcul(lignes, tva) {
    var ht = (lignes || []).reduce(function (a, l) { return a + (Number(l.qte) || 0) * (Number(l.pu) || 0); }, 0);
    return { ht: ht, tva: ht * tva / 100, ttc: ht * (1 + tva / 100) };
  }
  function paye(f) { return S.liste("paiements").filter(function (p) { return p.factureId === f.id; }).reduce(function (a, p) { return a + Number(p.montant); }, 0); }
  function reste(f) { return Math.max(0, f.ttc - paye(f)); }
  function majStatut(fid) {
    var f = S.liste("factures").filter(function (x) { return x.id === fid; })[0];
    if (!f || f.statut === "annulee" || f.type === "proforma") return f;
    var p = paye(f);
    var st = p >= f.ttc - 0.009 ? "payee" : p > 0 ? "partielle" : "emise";
    f = S.modifier("factures", fid, { statut: st, payeeLe: st === "payee" ? (f.payeeLe || new Date().toISOString()) : null });
    if (f.demandeId && st === "payee") {
      var d = S.demandes().filter(function (x) { return x.id === f.demandeId; })[0];
      if (d && d.statut !== "cloture") S.majDemande(d.id, { statut: d.etape === "termine" ? "cloture" : "paye" });
    }
    return f;
  }
  function creerFacture(d, type, pourcent) {
    var tva = S.reglages().tva, an = new Date().getFullYear();
    type = type || "facture";
    var lignes = (d.lignes || []).map(function (l) { return { designation: l.designation, qte: l.qte, pu: l.pu }; });
    if (type === "acompte") {
      var tot = calcul(lignes, 0).ht;
      lignes = [{ designation: "Acompte de " + pourcent + " % sur le devis " + d.id + " (" + (d.services || []).join(", ") + ")", qte: 1, pu: Math.round(tot * pourcent) / 100 }];
    }
    var c = calcul(lignes, tva);
    var num = (type === "proforma" ? "PRO-" : "FAC-") + an + "-" + String(compteur(type === "proforma" ? "ng_cpt_pro" : "ng_cpt_fac", 0)).padStart(4, "0");
    var echeance = new Date(Date.now() + (S.reglages().delaiPaiement || 15) * 864e5).toISOString().slice(0, 10);
    var f = S.ajouter("factures", {
      numero: num, type: type === "acompte" ? "facture" : type, acompte: type === "acompte" ? pourcent : 0, demandeId: d.id || "", clientId: d.clientId || "",
      clientNom: d.entreprise || d.nom, contact: d.nom, telephone: d.telephone, email: d.email, adresse: d.adresse,
      objet: (d.services || []).join(", ") || d.objet || "", lignes: lignes, tauxTva: tva, ht: c.ht, tva: c.tva, ttc: c.ttc,
      emiseLe: new Date().toISOString(), echeance: echeance, statut: type === "proforma" ? "proforma" : "emise", note: d.note || ""
    }, "F-");
    S.log(type === "proforma" ? "Pro-forma générée" : type === "acompte" ? "Facture d’acompte générée" : "Facture générée", num + " · " + f.clientNom, f.ttc);
    return f;
  }
  function encaisse(mois) { return S.liste("paiements").filter(function (p) { return !mois || A.moisDe(p.date) === mois; }).reduce(function (a, p) { return a + Number(p.montant); }, 0); }
  function depense(mois) { return S.liste("sorties").filter(function (s) { return s.statut === "paye" && (!mois || A.moisDe(s.payeLe || s.creeLe) === mois); }).reduce(function (a, s) { return a + Number(s.montant); }, 0); }
  function soldes() {
    var init = S.reglages().soldesInitiaux || {};
    var caisseMvts = S.liste("caisse");
    return COMPTES.map(function (c) {
      var e = S.liste("paiements").filter(function (p) { return (p.compte || COMPTE_DE[p.mode] || "Caisse") === c; }).reduce(function (a, p) { return a + Number(p.montant); }, 0);
      var s = S.liste("sorties").filter(function (x) { return x.statut === "paye" && x.compte === c; }).reduce(function (a, x) { return a + Number(x.montant); }, 0);
      if (c === "Caisse") caisseMvts.forEach(function (m) { if (m.sens === "entree") e += Number(m.montant); else s += Number(m.montant); });
      return { compte: c, init: Number(init[c] || 0), entrees: e, sorties: s, solde: Number(init[c] || 0) + e - s };
    });
  }
  function serviceDe(f) {
    var o = (f.objet || "").toLowerCase();
    if (/formation|inscription/.test(o)) return "Formations";
    if (/maintenance|contrat/.test(o)) return "Maintenance";
    if (/h[ée]bergement|cloud|email|domaine|vps|365|workspace/.test(o)) return "Hébergement et cloud";
    if (/web|site|application|logiciel/.test(o)) return "Développement web";
    if (/s[ée]curit|pare-feu|vpn|audit/.test(o)) return "Cybersécurité";
    if (/cam|cctv|vid[ée]o/.test(o)) return "Vidéosurveillance";
    if (/r[ée]seau|wi-fi|lan|wan|c[âa]blage/.test(o)) return "Réseaux";
    return "Installation et matériel";
  }
  function caParService(mois) {
    var r = {};
    S.liste("paiements").filter(function (p) { return !mois || A.moisDe(p.date) === mois; }).forEach(function (p) {
      var f = S.liste("factures").filter(function (x) { return x.id === p.factureId; })[0];
      var k = f ? serviceDe(f) : "Autres";
      r[k] = (r[k] || 0) + Number(p.montant);
    });
    return r;
  }
  function envoyer(type, cible, msg, sujet) {
    var tel = (cible.telephone || "").replace(/[^\d]/g, "");
    var url = type === "wa" ? "https://wa.me/" + tel + "?text=" + encodeURIComponent(msg) : type === "mail" ? "mailto:" + encodeURIComponent(cible.email || "") + "?subject=" + encodeURIComponent(sujet || "NextGenIT") + "&body=" + encodeURIComponent(msg) : "sms:" + tel + "?body=" + encodeURIComponent(msg);
    window.open(url, "_blank", "noopener");
  }
  function instructions(f) {
    var R = S.reglages();
    return "Montant : " + argent(reste(f)) + " (référence " + f.numero + ")\n" +
      "• M-Pesa / Orange Money / Airtel Money : " + (R.mobileMoney || "") + "\n" +
      "• Virement : " + (R.banque || "") + "\n" +
      (R.lienCarte ? "• Carte Visa / Mastercard : " + R.lienCarte + "\n" : "") +
      "• Espèces : au bureau NextGenIT, reçu remis immédiatement.";
  }
  A.fin = { auto: auto, editerArticles: editerArticles, creerFacture: creerFacture, paye: paye, reste: reste, majStatut: majStatut, encaisse: encaisse, depense: depense, soldes: soldes, caParService: caParService, MODES: MODES, COMPTES: COMPTES, envoyer: envoyer, instructions: instructions, calcul: calcul };
  A.compterImpayes = function () { return S.liste("factures").filter(function (f) { return f.type !== "proforma" && ["emise", "partielle"].indexOf(f.statut) > -1; }).reduce(function (a, f) { return a + reste(f); }, 0); };

  var LIBF = { emise: ["À payer", "tag-warn"], partielle: ["Partiellement payée", "tag-accent"], payee: ["Payée", "tag-ok"], annulee: ["Annulée", "tag-muted"], proforma: ["Pro-forma", "tag-accent"] };

  /* =================== Factures et devis =================== */
  var ongletF = "factures", rechF = "";
  A.VUES.factures = function () {
    var F = S.liste("factures");
    var factures = F.filter(function (f) { return f.type !== "proforma"; });
    var auj = AUJ();
    var enRetard = factures.filter(function (f) { return ["emise", "partielle"].indexOf(f.statut) > -1 && f.echeance < auj; });
    var tabs = [["factures", "Factures"], ["proforma", "Pro-forma"], ["devis", "Devis"], ["abonnements", "Abonnements récurrents"]];
    A.vue.innerHTML = A.entete("Factures et devis", "Devis, pro-forma, factures, acomptes et abonnements récurrents, avec votre logo, votre signature et votre sceau",
      '<button class="btn btn-ghost" type="button" id="f-manuelle">+ Facture manuelle</button><a class="btn btn-ghost" href="#parametres">Logo, signature, sceau</a>') +
      '<div class="kpis">' +
      '<div class="kpi"><span>Facturé ce mois</span><strong data-count="' + factures.filter(function (f) { return A.moisDe(f.emiseLe) === A.MOIS && f.statut !== "annulee"; }).reduce(function (a, f) { return a + f.ttc; }, 0) + '" data-format="argent">0</strong></div>' +
      '<div class="kpi"><span>Reste à encaisser</span><strong data-count="' + A.compterImpayes() + '" data-format="argent">0</strong></div>' +
      '<div class="kpi"><span>Factures en retard</span><strong style="color:var(--danger)" data-count="' + enRetard.length + '">0</strong><small>' + argent(enRetard.reduce(function (a, f) { return a + reste(f); }, 0)) + "</small></div>" +
      '<div class="kpi"><span>Abonnements actifs</span><strong data-count="' + S.liste("abonnements").filter(function (x) { return x.actif; }).length + '">0</strong></div></div>' +
      '<div class="tabs" role="tablist">' + tabs.map(function (t) { return '<button class="tab" type="button" role="tab" data-of="' + t[0] + '" aria-selected="' + (ongletF === t[0]) + '">' + t[1] + "</button>"; }).join("") + "</div>" +
      '<div id="f-contenu"></div>';
    A.lier("[data-of]", "click", function (e, b) { ongletF = b.dataset.of; A.rafraichir(); });
    A.vue.querySelector("#f-manuelle").addEventListener("click", factureManuelle);
    ({ factures: listeFactures, proforma: listeProforma, devis: listeDevis, abonnements: listeAbonnements })[ongletF]();
    var fid = location.hash.split("/")[1];
    if (fid) { var f0 = S.liste("factures").filter(function (x) { return x.id === fid; })[0]; if (f0) { history.replaceState(null, "", "#factures"); detailFacture(f0); } }
  };
  function ligneFacture(f) {
    var st = LIBF[f.statut] || LIBF.emise, auj = AUJ(), retard = ["emise", "partielle"].indexOf(f.statut) > -1 && f.echeance < auj;
    return '<tr data-fid="' + f.id + '"><td><strong>' + esc(f.numero) + "</strong>" + (f.acompte ? '<br><small class="muted">Acompte ' + f.acompte + " %</small>" : "") + "</td><td>" + esc(f.clientNom) + '<br><small class="muted">' + esc(f.objet) + "</small></td><td>" + jour(f.emiseLe) + '</td><td class="' + (retard ? "down" : "") + '">' + jour(f.echeance) + (retard ? "<br><small>en retard</small>" : "") + '</td><td class="r">' + argent(f.ttc) + '</td><td class="r">' + argent(paye(f)) + '</td><td><span class="tag ' + st[1] + '">' + st[0] + '</span></td><td class="r">' + actionsLigne(f) + "</td></tr>";
  }
  function actionsLigne(f) {
    return '<span class="actions-ligne"><button class="ico-btn" type="button" data-fopen title="Ouvrir" aria-label="Ouvrir ' + esc(f.numero) + '">👁</button><a class="ico-btn" href="document.html?type=' + (f.type === "proforma" ? "proforma" : "facture") + "&fid=" + f.id + '" target="_blank" rel="noopener" title="Voir le PDF" aria-label="PDF ' + esc(f.numero) + '">📄</a><button class="ico-btn" type="button" data-fedit title="Modifier" aria-label="Modifier ' + esc(f.numero) + '">✎</button><button class="ico-btn danger" type="button" data-fsuppr title="Supprimer" aria-label="Supprimer ' + esc(f.numero) + '">🗑</button></span>';
  }
  /* Supprimer une facture (et ses paiements, après confirmation) */
  function supprimerFacture(f, apres) {
    var P = S.liste("paiements").filter(function (p) { return p.factureId === f.id; });
    if (!confirm("Supprimer définitivement la facture " + f.numero + " (" + argent(f.ttc) + ") ?" + (P.length ? "\n\n⚠ " + P.length + " paiement(s) liés (" + argent(paye(f)) + ") seront aussi supprimés." : ""))) return;
    P.forEach(function (p) { S.retirer("paiements", p.id); });
    S.retirer("factures", f.id);
    if (f.demandeId) S.majDemande(f.demandeId, { factureAuto: "supprimee" });
    S.log("Facture supprimée", f.numero + " · " + f.clientNom + (P.length ? " · " + P.length + " paiement(s) supprimé(s)" : ""), -f.ttc);
    A.toast("Facture " + f.numero + " supprimée", "ok");
    if (apres) apres(); A.rafraichir();
  }
  function listeFactures() {
    var F = S.liste("factures").filter(function (f) { return f.type !== "proforma" && (!rechF || (f.numero + f.clientNom + f.objet).toLowerCase().indexOf(rechF.toLowerCase()) > -1); });
    document.getElementById("f-contenu").innerHTML = '<div class="card"><div class="toolbar"><input type="search" id="f-rech" placeholder="Rechercher un numéro, un client…" value="' + esc(rechF) + '"><button class="btn btn-ghost btn-sm" type="button" id="f-csv">Exporter en PDF</button></div><div class="table-wrap"><table class="t" style="min-width:920px"><thead><tr><th>Numéro</th><th>Client et objet</th><th>Émise le</th><th>Échéance</th><th class="r">Total</th><th class="r">Payé</th><th>Statut</th><th></th></tr></thead><tbody>' +
      (F.map(ligneFacture).join("") || '<tr><td colspan="8" class="muted">Aucune facture. Une facture se génère depuis un devis accepté (Demandes et devis) ou manuellement.</td></tr>') + "</tbody></table></div></div>";
    brancherListe();
    var r = document.getElementById("f-rech");
    r.addEventListener("input", function () { rechF = r.value; clearTimeout(r._t); r._t = setTimeout(function () { listeFactures(); var n = document.getElementById("f-rech"); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 250); });
    document.getElementById("f-csv").addEventListener("click", function () { A.csv("factures", [["Numéro", "Client", "Objet", "Émise", "Échéance", "Total", "Payé", "Statut"]].concat(S.liste("factures").map(function (f) { return [f.numero, f.clientNom, f.objet, jour(f.emiseLe), jour(f.echeance), argent(f.ttc), argent(paye(f)), (LIBF[f.statut] || ["", ""])[0]]; }))); });
  }
  function listeProforma() {
    var F = S.liste("factures").filter(function (f) { return f.type === "proforma"; });
    document.getElementById("f-contenu").innerHTML = '<div class="card"><p>Une facture pro-forma sert au client pour obtenir un bon de commande ou un financement. Elle se convertit en facture en un clic.</p><div class="table-wrap"><table class="t"><thead><tr><th>Numéro</th><th>Client et objet</th><th>Émise le</th><th class="r">Total</th><th>Statut</th><th></th></tr></thead><tbody>' +
      (F.map(function (f) { return '<tr data-fid="' + f.id + '"><td><strong>' + esc(f.numero) + "</strong></td><td>" + esc(f.clientNom) + '<br><small class="muted">' + esc(f.objet) + "</small></td><td>" + jour(f.emiseLe) + '</td><td class="r">' + argent(f.ttc) + '</td><td><span class="tag ' + (f.convertieEn ? "tag-ok" : "tag-accent") + '">' + (f.convertieEn ? "Convertie" : "Pro-forma") + '</span></td><td class="r">' + actionsLigne(f) + "</td></tr>"; }).join("") || '<tr><td colspan="6" class="muted">Aucune pro-forma. Générez-en une depuis « Devis ».</td></tr>') + "</tbody></table></div></div>";
    brancherListe();
  }
  function listeDevis() {
    var L = S.demandes().filter(function (d) { return d.lignes && d.lignes.length; });
    document.getElementById("f-contenu").innerHTML = '<div class="card"><p>Après validation d’un devis par le client, générez la facture complète, une facture d’acompte ou une pro-forma.</p><div class="table-wrap"><table class="t" style="min-width:900px"><thead><tr><th>Devis</th><th>Client</th><th class="r">Total</th><th>Statut</th><th>Facture</th><th></th></tr></thead><tbody>' +
      (L.map(function (d) {
        var t = calcul(d.lignes, S.reglages().tva), fac = A.factureDe ? A.factureDe(d) : null, l = A.LIB ? A.LIB[d.statut] : [d.statut, "tag-muted"];
        return '<tr data-did="' + d.id + '"><td><strong>' + d.id + "</strong><br><small class=\"muted\">" + esc((d.services || []).join(", ")) + "</small></td><td>" + esc(d.entreprise || d.nom) + '</td><td class="r">' + argent(t.ttc) + '</td><td><span class="tag ' + l[1] + '">' + l[0] + "</span></td><td>" + (fac ? '<a href="#factures/' + fac.id + '">' + esc(fac.numero) + "</a>" : '<span class="muted">—</span>') + '</td><td class="r" style="white-space:nowrap"><a class="btn btn-ghost btn-sm" href="document.html?type=devis&id=' + d.id + '" target="_blank" rel="noopener">Devis PDF</a> <button class="btn btn-ghost btn-sm" type="button" data-gen="proforma">Pro-forma</button> ' + (["accepte", "paye", "cloture"].indexOf(d.statut) > -1 ? '<button class="btn btn-ghost btn-sm" type="button" data-gen="acompte">Acompte</button> ' + (fac ? "" : '<button class="btn btn-primary btn-sm" type="button" data-gen="facture">Générer la facture</button>') : "") + "</td></tr>";
      }).join("") || '<tr><td colspan="6" class="muted">Aucun devis évalué.</td></tr>') + "</tbody></table></div></div>";
    A.lier("[data-gen]", "click", function (e, b) {
      var d = S.demandes().filter(function (x) { return x.id === b.closest("[data-did]").dataset.did; })[0], type = b.dataset.gen;
      if (type === "acompte") {
        A.modal({ titre: "Facture d’acompte · " + d.id, valider: "Générer", corps: '<label class="field">Pourcentage d’acompte<select name="pc">' + A.options([["30", "30 %"], ["40", "40 %"], ["50", "50 %"], ["60", "60 %"]], String(d.acompte || 50)) + "</select></label>",
          onSubmit: function (f) { var x = creerFacture(d, "acompte", Number(f.pc.value)); A.toast("Facture " + x.numero + " générée", "ok"); detailFacture(x); return false; } });
        return;
      }
      var f = creerFacture(d, type);
      A.toast((type === "proforma" ? "Pro-forma " : "Facture ") + f.numero + " générée", "ok");
      A.rafraichir(); detailFacture(f);
    });
  }
  function listeAbonnements() {
    var L = S.liste("abonnements"), auj = AUJ();
    var dus = L.filter(function (a) { return a.actif && a.prochaine <= auj; });
    document.getElementById("f-contenu").innerHTML = '<div class="card"><div class="toolbar"><p style="flex:1">Contrats de maintenance, hébergement, noms de domaine (.cd), messagerie : une facture est préparée à chaque échéance.</p><button class="btn btn-ghost" type="button" id="ab-new">+ Nouvel abonnement</button>' + (dus.length ? '<button class="btn btn-primary" type="button" id="ab-gen">Générer ' + dus.length + " facture(s) échue(s)</button>" : "") + '</div><div class="table-wrap"><table class="t" style="min-width:860px"><thead><tr><th>Client</th><th>Service</th><th>Périodicité</th><th class="r">Montant HT</th><th>Prochaine échéance</th><th>Actif</th><th></th></tr></thead><tbody>' +
      (L.map(function (a) { var proche = a.prochaine <= auj; return '<tr data-ab="' + a.id + '"><td><strong>' + esc(a.clientNom) + '</strong><br><small class="muted">' + esc(a.telephone || "") + "</small></td><td>" + esc(a.service) + (a.maintenance ? '<br><small class="muted">🗓 ' + (a.visitesParMois || 0) + " visite(s)/mois" + (a.heuresIncluses ? " · ⏱ " + (A.heuresContrat ? A.heuresContrat(a, A.MOIS) : 0) + " h / " + a.heuresIncluses + " h ce mois" : "") + "</small>" : "") + "</td><td>" + esc(a.periodicite) + '</td><td class="r">' + argent(a.montant) + '</td><td class="' + (proche && a.actif ? "down" : "") + '">' + jour(a.prochaine) + "</td><td>" + A.interrupteur("data-ab-actif", !!a.actif, "Abonnement actif") + '</td><td class="r"><a class="ico-btn" target="_blank" rel="noopener" href="document.html?type=rapportmensuel&ab=' + a.id + "&mois=" + A.MOIS + '" title="Rapport mensuel du client" aria-label="Rapport mensuel">📊</a><button class="ico-btn" type="button" data-ab-edit title="Modifier" aria-label="Modifier l’abonnement">✎</button><button class="ico-btn danger" type="button" data-ab-suppr title="Supprimer" aria-label="Supprimer l’abonnement">🗑</button></td></tr>'; }).join("") || '<tr><td colspan="7" class="muted">Aucun abonnement.</td></tr>') + "</tbody></table></div></div>";
    A.vue.querySelector("#ab-new").addEventListener("click", function () {
      var a0 = { maintenance: true };
      A.modal({ titre: "Nouvel abonnement récurrent", valider: "Créer", corps: '<div class="form-grid"><label class="field">Client<input name="client" required list="dl-clients"></label><label class="field">Téléphone<input name="tel" type="tel"></label><label class="field">Email<input name="email" type="email"></label><label class="field">Service<select name="service">' + A.options(["Contrat de maintenance Essentiel", "Contrat de maintenance Pro", "Contrat de maintenance Entreprise", "Hébergement web", "Nom de domaine .cd", "Messagerie professionnelle", "Serveur virtuel (VPS)", "Supervision 24/7"]) + '</select></label><label class="field">Périodicité<select name="per">' + A.options(["Mensuel", "Trimestriel", "Annuel"]) + '</select></label><label class="field">Montant HT ($)<input name="montant" type="number" min="0" step="0.01" required></label><label class="field">Première échéance<input name="date" type="date" value="' + auj + '"></label><fieldset class="cible" style="grid-column:1/-1"><legend>Contrat de maintenance</legend><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" name="maint"' + (a0.maintenance ? " checked" : "") + '> Planifier automatiquement les visites préventives dans le calendrier</label><div class="form-grid"><label class="field">Visites par mois<input name="vis" type="number" min="0" max="8" value="' + (a0.visitesParMois || 1) + '"></label><label class="field">Jour de la 1re visite<input name="jv" type="number" min="1" max="28" value="' + (a0.jourVisite || 5) + '"></label><label class="field">Heures incluses / mois<input name="hi" type="number" min="0" step="0.5" value="' + (a0.heuresIncluses || 0) + '"></label><label class="field">Technicien attitré<select name="tech"><option value="">—</option>' + A.options(S.liste("personnel").filter(function (p) { return p.type === "technicien"; }).map(function (p) { return [p.id, p.nom]; }), a0.techId) + '</select></label><label class="field">Adresse des visites<input name="adr" value="' + esc(a0.adresse || "") + '"></label></div></fieldset></div>' + datalistClients(),
        onSubmit: function (f) {
          if (!f.client.value.trim() || !(Number(f.montant.value) > 0)) { A.toast("Client et montant obligatoires", "warn"); return false; }
          S.ajouter("abonnements", { clientNom: f.client.value.trim(), telephone: f.tel.value.trim(), email: f.email.value.trim(), service: f.service.value, periodicite: f.per.value, montant: Number(f.montant.value), prochaine: f.date.value || auj, actif: true, maintenance: f.maint.checked && /maintenance/i.test(f.service.value), visitesParMois: Number(f.vis.value) || 0, jourVisite: Number(f.jv.value) || 5, heuresIncluses: Number(f.hi.value) || 0, techId: f.tech.value, adresse: f.adr.value.trim() }, "AB-"); if (A.genererVisites) A.genererVisites();
          S.log("Abonnement créé", f.client.value.trim() + " · " + f.service.value, Number(f.montant.value)); A.rafraichir(); A.toast("Abonnement créé", "ok");
        } });
    });
    var g = A.vue.querySelector("#ab-gen");
    if (g) g.addEventListener("click", function () {
      dus.forEach(function (a) {
        var mois = { Mensuel: 1, Trimestriel: 3, Annuel: 12 }[a.periodicite] || 1;
        creerFacture({ nom: a.clientNom, telephone: a.telephone, email: a.email, services: [a.service + " – " + a.periodicite.toLowerCase()], lignes: [{ designation: a.service + " (" + a.periodicite.toLowerCase() + ", échéance du " + jour(a.prochaine) + ")", qte: 1, pu: a.montant }] }, "facture");
        var d = new Date(a.prochaine + "T12:00:00"); d.setMonth(d.getMonth() + mois);
        S.modifier("abonnements", a.id, { prochaine: d.toISOString().slice(0, 10) });
      });
      A.toast(dus.length + " facture(s) générée(s)", "ok"); ongletF = "factures"; A.rafraichir();
    });
    A.lier("[data-ab-actif]", "click", function (e, b) { var a = S.modifier("abonnements", b.closest("[data-ab]").dataset.ab, { actif: b.getAttribute("aria-checked") !== "true" }); S.log(a.actif ? "Abonnement réactivé" : "Abonnement suspendu", a.clientNom); A.rafraichir(); });
    A.lier("[data-ab-edit]", "click", function (e, b) {
      var a = S.liste("abonnements").filter(function (x) { return x.id === b.closest("[data-ab]").dataset.ab; })[0], a0 = a;
      A.modal({ titre: "Modifier l’abonnement", valider: "Enregistrer", corps: '<div class="form-grid"><label class="field">Client<input name="client" value="' + esc(a.clientNom) + '"></label><label class="field">Téléphone<input name="tel" value="' + esc(a.telephone || "") + '"></label><label class="field">Service<input name="service" value="' + esc(a.service) + '"></label><label class="field">Périodicité<select name="per">' + A.options(["Mensuel", "Trimestriel", "Annuel"], a.periodicite) + '</select></label><label class="field">Montant HT ($)<input name="m" type="number" min="0" step="0.01" value="' + a.montant + '"></label><label class="field">Prochaine échéance<input name="d" type="date" value="' + a.prochaine + '"></label><fieldset class="cible" style="grid-column:1/-1"><legend>Contrat de maintenance</legend><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" name="maint"' + (a0.maintenance ? " checked" : "") + '> Planifier automatiquement les visites préventives dans le calendrier</label><div class="form-grid"><label class="field">Visites par mois<input name="vis" type="number" min="0" max="8" value="' + (a0.visitesParMois || 1) + '"></label><label class="field">Jour de la 1re visite<input name="jv" type="number" min="1" max="28" value="' + (a0.jourVisite || 5) + '"></label><label class="field">Heures incluses / mois<input name="hi" type="number" min="0" step="0.5" value="' + (a0.heuresIncluses || 0) + '"></label><label class="field">Technicien attitré<select name="tech"><option value="">—</option>' + A.options(S.liste("personnel").filter(function (p) { return p.type === "technicien"; }).map(function (p) { return [p.id, p.nom]; }), a0.techId) + '</select></label><label class="field">Adresse des visites<input name="adr" value="' + esc(a0.adresse || "") + '"></label></div></fieldset></div>',
        onSubmit: function (f) { S.modifier("abonnements", a.id, { clientNom: f.client.value.trim(), telephone: f.tel.value.trim(), service: f.service.value.trim(), periodicite: f.per.value, montant: Number(f.m.value) || 0, prochaine: f.d.value || a.prochaine, maintenance: f.maint.checked, visitesParMois: Number(f.vis.value) || 0, jourVisite: Number(f.jv.value) || 5, heuresIncluses: Number(f.hi.value) || 0, techId: f.tech.value, adresse: f.adr.value.trim() }); if (A.genererVisites) A.genererVisites(); S.log("Abonnement modifié", f.client.value.trim()); A.rafraichir(); } });
    });
    A.lier("[data-ab-suppr]", "click", function (e, b) { if (confirm("Supprimer cet abonnement ?")) { S.retirer("abonnements", b.closest("[data-ab]").dataset.ab); S.log("Abonnement supprimé", ""); A.rafraichir(); } });
  }
  function datalistClients() {
    var noms = {};
    S.liste("clients").forEach(function (c) { noms[c.nom] = 1; });
    S.demandes().forEach(function (d) { noms[d.entreprise || d.nom] = 1; });
    return '<datalist id="dl-clients">' + Object.keys(noms).map(function (n) { return '<option value="' + esc(n) + '">'; }).join("") + "</datalist>";
  }
  function brancherListe() {
    var trouver = function (b) { return S.liste("factures").filter(function (x) { return x.id === b.closest("[data-fid]").dataset.fid; })[0]; };
    A.lier("[data-fopen]", "click", function (e, b) { detailFacture(trouver(b)); });
    A.lier("[data-fedit]", "click", function (e, b) { editerArticles(trouver(b)); });
    A.lier("[data-fsuppr]", "click", function (e, b) { supprimerFacture(trouver(b)); });
  }

  function detailFacture(f) {
    f = majStatut(f.id) || f;
    var P = S.liste("paiements").filter(function (p) { return p.factureId === f.id; });
    var st = LIBF[f.statut] || LIBF.emise, pro = f.type === "proforma";
    var ech = f.echeancier || [];
    A.modal({
      titre: f.numero + " · " + f.clientNom, large: true, annuler: "Fermer",
      corps: '<div class="stat-line" style="display:flex;gap:8px;flex-wrap:wrap"><span class="tag ' + st[1] + '">' + st[0] + '</span><span class="tag tag-muted">Émise le ' + jour(f.emiseLe) + '</span><span class="tag tag-muted">Échéance ' + jour(f.echeance) + "</span></div>" +
        '<div class="table-wrap"><table class="t" style="min-width:520px"><thead><tr><th>Désignation</th><th class="r">Qté</th><th class="r">P.U.</th><th class="r">Montant</th></tr></thead><tbody>' + f.lignes.map(function (l) { return "<tr><td>" + esc(l.designation) + '</td><td class="r">' + l.qte + '</td><td class="r">' + argent(l.pu) + '</td><td class="r">' + argent(l.qte * l.pu) + "</td></tr>"; }).join("") + "</tbody></table></div>" +
        '<div class="row-item total-row"><span>Total</span><strong>' + argent(f.ttc) + "</strong></div>" +
        (pro ? "" : '<div class="row-item"><span>Payé ' + argent(paye(f)) + '</span><strong class="' + (reste(f) > 0 ? "down" : "up") + '">Reste ' + argent(reste(f)) + "</strong></div>") +
        (P.length ? "<div><strong>Paiements reçus</strong>" + P.map(function (p) { return '<div class="row-item mt-1"><span>' + jour(p.date) + " · " + esc(p.mode) + (p.ref ? " · " + esc(p.ref) : "") + "</span><span><strong>" + argent(p.montant) + '</strong> <a href="document.html?type=recu&pid=' + p.id + '" target="_blank" rel="noopener">Reçu</a></span></div>'; }).join("") + "</div>" : "") +
        (ech.length ? "<div><strong>Échéancier</strong>" + ech.map(function (x, i) { return '<div class="row-item mt-1"><span>Échéance ' + (i + 1) + " · " + jour(x.date) + "</span><strong>" + argent(x.montant) + "</strong></div>"; }).join("") + "</div>" : "") +
        '<div class="send-row">' +
        (f.statut !== "annulee" ? '<button class="btn btn-primary" type="button" data-x="articles">✎ Modifier la facture</button>' : "") +
        '<a class="btn btn-ghost" href="document.html?type=' + (pro ? "proforma" : "facture") + "&fid=" + f.id + '&imprimer=1" target="_blank" rel="noopener">🖨 Imprimer</a>' +
        '<a class="btn btn-ghost" href="document.html?type=' + (pro ? "proforma" : "facture") + "&fid=" + f.id + '" target="_blank" rel="noopener">PDF</a>' +
        '<button class="btn btn-whatsapp" type="button" data-x="wa">WhatsApp</button>' +
        '<button class="btn btn-ghost" type="button" data-x="mail"' + (f.email ? "" : " disabled") + ">Email</button>" +
        '<button class="btn btn-ghost" type="button" data-x="sms">SMS</button>' +
        (pro ? (f.convertieEn ? "" : '<button class="btn btn-primary" type="button" data-x="convertir">Convertir en facture</button>') :
          (reste(f) > 0 && f.statut !== "annulee" ? '<a class="btn btn-primary" href="#paiements/' + f.id + '">Encaisser</a><button class="btn btn-ghost" type="button" data-x="echeancier">Échéancier</button>' : "") +
          (f.statut !== "annulee" && !P.length ? '<button class="btn btn-ghost danger-link" type="button" data-x="annuler">Annuler (avoir)</button>' : "")) + '<button class="btn btn-ghost danger-link" type="button" data-x="supprimer">🗑 Supprimer</button></div>',
      apres: function (form) {
        form.querySelectorAll("[data-x]").forEach(function (b) {
          b.addEventListener("click", function () {
            var x = b.dataset.x;
            if (x === "wa" || x === "mail" || x === "sms") {
              var msg = "Bonjour " + (f.contact || f.clientNom) + ",\n\n" + (pro ? "Voici votre facture pro-forma " : "Voici votre facture ") + f.numero + " pour " + f.objet + ".\nTotal : " + argent(f.ttc) + "\n" + (pro ? "" : "\nPour payer :\n" + instructions(f) + "\n") + "\nNextGenIT – " + A.C.entreprise.telephone;
              envoyer(x, f, msg, (pro ? "Pro-forma " : "Facture ") + f.numero);
              S.log("Facture envoyée (" + b.textContent.trim() + ")", f.numero);
            }
            if (x === "convertir") { var d = { nom: f.contact, entreprise: f.clientNom, telephone: f.telephone, email: f.email, adresse: f.adresse, services: [f.objet], lignes: f.lignes, id: f.demandeId }; var nf = creerFacture(d, "facture"); S.modifier("factures", f.id, { convertieEn: nf.numero }); A.fermer(); A.rafraichir(); detailFacture(nf); }
            if (x === "annuler") { if (confirm("Annuler la facture " + f.numero + " ? Un avoir est enregistré dans l’historique.")) { S.modifier("factures", f.id, { statut: "annulee", annuleeLe: new Date().toISOString() }); S.log("Facture annulée (avoir)", f.numero, -f.ttc); A.fermer(); A.rafraichir(); } }
            if (x === "echeancier") echeancier(f);
            if (x === "articles") editerArticles(f);
            if (x === "supprimer") supprimerFacture(f, function () { A.fermer(); });
          });
        });
      }
    });
  }
  /* Modifier les articles d'une facture : articles du stock ou lignes libres */
  function editerArticles(f) {
    var lignes = (f.lignes || []).map(function (l) { return { designation: l.designation, qte: l.qte, pu: l.pu }; });
    var AR = S.liste("articles");
    function ligneHtml(l, i) { return '<tr data-i="' + i + '"><td><input data-k="designation" value="' + esc(l.designation) + '" aria-label="Désignation"></td><td><input data-k="qte" type="number" min="0" step="1" value="' + l.qte + '" aria-label="Quantité"></td><td><input data-k="pu" type="number" min="0" step="0.01" value="' + l.pu + '" aria-label="Prix unitaire"></td><td class="r" data-tot>' + argent(l.qte * l.pu) + '</td><td><button type="button" class="icon-btn" data-sup aria-label="Retirer la ligne">×</button></td></tr>'; }
    A.modal({
      titre: "Modifier " + f.numero, valider: "Enregistrer la facture", large: true,
      corps: (paye(f) > 0 ? '<p class="notice" style="background:var(--warn-soft);color:var(--warn)">Cette facture a déjà reçu ' + argent(paye(f)) + " de paiement : le reste à payer sera recalculé.</p>" : "") +
        '<div class="form-grid"><label class="field">Client<input name="client" value="' + esc(f.clientNom) + '" required></label><label class="field">Contact<input name="contact" value="' + esc(f.contact || "") + '"></label><label class="field">Téléphone<input name="tel" type="tel" value="' + esc(f.telephone || "") + '"></label><label class="field">Email<input name="email" type="email" value="' + esc(f.email || "") + '"></label><label class="field full">Objet<input name="objet" value="' + esc(f.objet || "") + '"></label><label class="field">Date d’émission<input name="emise" type="date" value="' + String(f.emiseLe || "").slice(0, 10) + '"></label><label class="field">Échéance<input name="echeance" type="date" value="' + esc(f.echeance || "") + '"></label><label class="field">Mode de paiement (imprimé sur la facture)<select name="modePaie"><option value="">— Choisir —</option>' + A.options(MODES.map(function (m) { return m[0]; }), f.modePaiement || "") + '</select></label><input type="hidden" name="tva" value="0"><label class="field">Note (imprimée sur la facture)<input name="note" value="' + esc(f.note || "") + '"></label></div>' +
        '<div class="hero-actions"><select id="fa-art" style="flex:1;min-height:44px;border-radius:12px;border:1px solid var(--line-2);background:var(--surface);color:var(--text);padding:0 10px" aria-label="Article du stock"><option value="">➕ Ajouter un article du stock…</option>' + AR.map(function (a) { return '<option value="' + a.id + '">' + esc(a.nom) + " · " + argent(a.prixVente) + " · stock " + a.quantite + "</option>"; }).join("") + '</select><button type="button" class="btn btn-ghost" id="fa-libre">＋ Ligne libre</button></div>' +
        '<div class="table-wrap"><table class="t" style="min-width:620px"><thead><tr><th>Désignation</th><th style="width:90px">Qté</th><th style="width:130px">Prix unit. ($)</th><th class="r" style="width:120px">Montant</th><th style="width:50px"></th></tr></thead><tbody id="fa-lignes"></tbody></table></div><div class="row-item total-row" id="fa-tot"></div>',
      apres: function (form) {
        var tb = form.querySelector("#fa-lignes");
        function rendre() { tb.innerHTML = lignes.map(ligneHtml).join("") || '<tr><td colspan="5" class="muted">Ajoutez un article.</td></tr>'; total(); }
        function total() { var t = Number(form.tva.value) || 0, c = calcul(lignes, t); form.querySelector("#fa-tot").innerHTML = "<span>Total</span><strong>" + argent(c.ttc) + "</strong>"; }
        tb.addEventListener("input", function (e) { var tr = e.target.closest("[data-i]"); if (!tr) return; var l = lignes[Number(tr.dataset.i)], k = e.target.dataset.k; l[k] = k === "designation" ? e.target.value : Number(e.target.value) || 0; tr.querySelector("[data-tot]").textContent = argent(l.qte * l.pu); total(); });
        tb.addEventListener("click", function (e) { var b = e.target.closest("[data-sup]"); if (!b) return; lignes.splice(Number(b.closest("[data-i]").dataset.i), 1); rendre(); });
        form.querySelector("#fa-art").addEventListener("change", function (e) { var a = AR.filter(function (x) { return x.id === e.target.value; })[0]; if (a) { lignes.push({ designation: a.nom + (a.reference ? " (" + a.reference + ")" : ""), qte: 1, pu: Number(a.prixVente) || 0, articleId: a.id }); rendre(); } e.target.value = ""; });
        form.tva.addEventListener("input", total);
        form.querySelector("#fa-libre").addEventListener("click", function () { lignes.push({ designation: "", qte: 1, pu: 0 }); rendre(); var ins = tb.querySelectorAll("[data-k=designation]"); if (ins.length) ins[ins.length - 1].focus(); });
        rendre();
      },
      onSubmit: function (form) {
        var L = lignes.filter(function (l) { return String(l.designation).trim() && l.qte > 0; });
        if (!L.length) { A.toast("Ajoutez au moins un article avec une quantité", "warn"); return false; }
        if (!form.client.value.trim()) { A.toast("Nom du client obligatoire", "warn"); return false; }
        var tva = Number(form.tva.value) || 0, c = calcul(L, tva);
        var nf = S.modifier("factures", f.id, { clientNom: form.client.value.trim(), contact: form.contact.value.trim(), telephone: form.tel.value.trim(), email: form.email.value.trim(), objet: form.objet.value.trim(), emiseLe: form.emise.value ? new Date(form.emise.value + "T12:00:00").toISOString() : f.emiseLe, echeance: form.echeance.value || f.echeance, note: form.note.value.trim(), modePaiement: form.modePaie.value, tauxTva: tva, lignes: L, ht: c.ht, tva: c.tva, ttc: c.ttc, modifieeLe: new Date().toISOString() });
        nf = majStatut(f.id) || nf;
        S.log("Articles de facture modifiés", f.numero + " · " + L.length + " ligne(s)", c.ttc);
        A.toast("Facture mise à jour", "ok"); A.rafraichir(); setTimeout(function () { detailFacture(nf); }, 50);
      }
    });
  }
  /* Facture générée automatiquement dès qu'un devis est accepté */
  function auto() {
    var crees = [];
    S.demandes().forEach(function (d) {
      if (["accepte", "paye", "cloture"].indexOf(d.statut) > -1 && d.lignes && d.lignes.length && !d.factureAuto && !S.liste("factures").some(function (x) { return x.demandeId === d.id && x.type !== "proforma" && x.statut !== "annulee"; })) {
        var x = creerFacture(d, "facture");
        S.majDemande(d.id, { factureAuto: x.id });
        S.log("Facture générée automatiquement", x.numero + " · devis " + d.id + " accepté", x.ttc);
        crees.push(x.numero);
      }
    });
    if (crees.length) A.toast("Facture générée automatiquement : " + crees.join(", "), "ok");
    return crees;
  }
  function echeancier(f) {
    A.modal({
      titre: "Échéancier · " + f.numero, valider: "Créer l’échéancier",
      corps: '<p>Le client paie le reste (' + argent(reste(f)) + ") en plusieurs fois. Un rappel apparaît dans les notifications à chaque date.</p><div class=\"form-grid\"><label class=\"field\">Nombre d’échéances<select name=\"n\">" + A.options(["2", "3", "4", "6"], "3") + '</select></label><label class="field">Première date<input name="d" type="date" value="' + AUJ() + '"></label><label class="field">Intervalle<select name="i">' + A.options([["1", "Chaque mois"], ["0.5", "Toutes les 2 semaines"]], "1") + "</select></label></div>",
      onSubmit: function (form) {
        var n = Number(form.n.value), r = reste(f), part = Math.floor(r / n * 100) / 100, out = [];
        for (var i = 0; i < n; i++) { var d = new Date(form.d.value + "T12:00:00"); if (form.i.value === "1") d.setMonth(d.getMonth() + i); else d.setDate(d.getDate() + 14 * i); out.push({ date: d.toISOString().slice(0, 10), montant: i === n - 1 ? Math.round((r - part * (n - 1)) * 100) / 100 : part }); }
        S.modifier("factures", f.id, { echeancier: out, echeance: out[out.length - 1].date });
        S.log("Échéancier créé", f.numero + " · " + n + " échéances", r); A.toast("Échéancier créé", "ok"); A.rafraichir();
      }
    });
  }
  function factureManuelle() {
    A.modal({
      titre: "Nouvelle facture", valider: "Générer la facture", large: true,
      corps: '<div class="form-grid"><label class="field">Client<input name="client" required list="dl-clients"></label><label class="field">Téléphone<input name="tel" type="tel"></label><label class="field">Email<input name="email" type="email"></label><label class="field">Type<select name="type">' + A.options([["facture", "Facture"], ["proforma", "Pro-forma"]]) + '</select></label><label class="field full">Objet<input name="objet" placeholder="Ex. Formation Linux – 1 inscription"></label></div>' +
        '<div class="table-wrap"><table class="t" style="min-width:520px"><thead><tr><th>Désignation</th><th style="width:90px">Qté</th><th style="width:140px">P.U. ($)</th></tr></thead><tbody id="m-lignes">' + [0, 1, 2].map(function () { return '<tr><td><input data-m="d"></td><td><input data-m="q" type="number" min="0" value="1"></td><td><input data-m="p" type="number" min="0" step="0.01"></td></tr>'; }).join("") + "</tbody></table></div>" + datalistClients(),
      onSubmit: function (f) {
        var lignes = Array.prototype.map.call(f.querySelectorAll("#m-lignes tr"), function (tr) { return { designation: tr.querySelector("[data-m=d]").value.trim(), qte: Number(tr.querySelector("[data-m=q]").value) || 0, pu: Number(tr.querySelector("[data-m=p]").value) || 0 }; }).filter(function (l) { return l.designation && l.pu; });
        if (!f.client.value.trim() || !lignes.length) { A.toast("Client et au moins une ligne avec un prix", "warn"); return false; }
        var x = creerFacture({ nom: f.client.value.trim(), telephone: f.tel.value.trim(), email: f.email.value.trim(), services: [f.objet.value.trim() || lignes[0].designation], lignes: lignes }, f.type.value);
        A.toast(x.numero + " générée", "ok"); ongletF = f.type.value === "proforma" ? "proforma" : "factures"; A.rafraichir();
      }
    });
  }

  /* =================== Paiements et caisse =================== */
  var ongletP = "encaisser";
  A.VUES.paiements = function () {
    var pre = location.hash.split("/")[1] || "";
    if (pre) ongletP = "encaisser";
    var P = S.liste("paiements");
    var parMode = {};
    P.filter(function (p) { return A.moisDe(p.date) === A.MOIS; }).forEach(function (p) { parMode[p.mode] = (parMode[p.mode] || 0) + Number(p.montant); });
    var caisse = soldes().filter(function (s) { return s.compte === "Caisse"; })[0];
    var DP = S.liste("paiements_declares").filter(function (x) { return x.statut === "a_verifier"; });
    if (DP.length && !pre && ongletP === "encaisser" && !A._dpVu) { ongletP = "declares"; A._dpVu = true; }
    var tabs = [["declares", "Déclarés par les clients" + (DP.length ? " (" + DP.length + ")" : "")], ["encaisser", "Encaisser"], ["historique", "Historique et reçus"], ["caisse", "Caisse du bureau"], ["comptes", "Comptes et soldes"], ["moyens", "Moyens de paiement"]];
    A.vue.innerHTML = A.entete("Paiements et caisse", "Mobile Money, carte, virement, chèque et espèces : chaque encaissement produit un reçu") +
      '<div class="dash"><div class="card w8"><h2 class="h-card">Encaissements de ' + A.nomMois(A.MOIS) + '</h2><div class="donut-wrap">' +
      A.graphAnneau(Object.keys(parMode).map(function (k, i) { return { label: k, val: Math.round(parMode[k]), couleur: COULEURS[i % COULEURS.length] }; }).concat(Object.keys(parMode).length ? [] : [{ label: "Aucun encaissement", val: 0, couleur: "var(--line)" }]), "<strong>" + argent(encaisse(A.MOIS)) + "</strong>encaissé") + "</div></div>" +
      '<div class="w4 stack"><div class="kpi"><span>Reste à encaisser</span><strong data-count="' + A.compterImpayes() + '" data-format="argent">0</strong></div><div class="kpi"><span>Solde de la caisse</span><strong data-count="' + caisse.solde + '" data-format="argent">0</strong></div></div></div>' +
      '<div class="tabs mt-2" role="tablist">' + tabs.map(function (t) { return '<button class="tab" type="button" role="tab" data-op="' + t[0] + '" aria-selected="' + (ongletP === t[0]) + '">' + t[1] + "</button>"; }).join("") + "</div><div id=\"p-contenu\"></div>";
    A.lier("[data-op]", "click", function (e, b) { ongletP = b.dataset.op; history.replaceState(null, "", "#paiements"); A.rafraichir(); });
    ({ declares: pDeclares, encaisser: function () { pEncaisser(pre); }, historique: pHistorique, caisse: pCaisse, comptes: pComptes, moyens: pMoyens })[ongletP]();
  };
  function pEncaisser(pre) {
    var F = S.liste("factures").filter(function (f) { return f.type !== "proforma" && ["emise", "partielle"].indexOf(f.statut) > -1; });
    var f0 = F.filter(function (f) { return f.id === pre; })[0] || F[0];
    document.getElementById("p-contenu").innerHTML = F.length ? '<form class="card" id="form-enc"><h2 class="h-card">Enregistrer un paiement</h2><div class="form-grid">' +
      '<label class="field full">Facture<select name="fid">' + F.map(function (f) { return '<option value="' + f.id + '"' + (f0 && f.id === f0.id ? " selected" : "") + ">" + esc(f.numero) + " · " + esc(f.clientNom) + " · reste " + argent(reste(f)) + "</option>"; }).join("") + "</select></label>" +
      '<label class="field">Montant reçu ($)<input name="montant" type="number" min="0.01" step="0.01" required value="' + (f0 ? reste(f0).toFixed(2) : "") + '"></label>' +
      '<label class="field">Mode de paiement<select name="mode">' + A.options(MODES.map(function (m) { return m[0]; }), "M-Pesa") + "</select></label>" +
      '<label class="field">Référence de la transaction<input name="ref" placeholder="Code M-Pesa, n° de virement, n° de chèque…"></label>' +
      '<label class="field">Date<input name="date" type="date" value="' + AUJ() + '"></label></div>' +
      '<div class="hero-actions"><button class="btn btn-primary" type="submit">Enregistrer et générer le reçu</button><button class="btn btn-ghost" type="button" id="enc-instr">Envoyer les instructions de paiement (WhatsApp)</button></div></form>'
      : '<div class="card empty"><h2 class="h-card">Aucune facture à encaisser</h2><p>Générez d’abord une facture depuis un devis accepté.</p><a class="btn btn-primary" href="#factures">Aller aux factures</a></div>';
    var form = document.getElementById("form-enc");
    if (!form) return;
    form.fid.addEventListener("change", function () { var f = S.liste("factures").filter(function (x) { return x.id === form.fid.value; })[0]; form.montant.value = reste(f).toFixed(2); });
    document.getElementById("enc-instr").addEventListener("click", function () { var f = S.liste("factures").filter(function (x) { return x.id === form.fid.value; })[0]; envoyer("wa", f, "Bonjour " + (f.contact || f.clientNom) + ",\nVoici comment régler la facture " + f.numero + " :\n" + instructions(f) + "\n\nMerci, NextGenIT", ""); S.log("Instructions de paiement envoyées", f.numero); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = S.liste("factures").filter(function (x) { return x.id === form.fid.value; })[0], m = Number(form.montant.value);
      if (!(m > 0)) { A.toast("Indiquez un montant", "warn"); return; }
      if (m > reste(f) + 0.009 && !confirm("Le montant dépasse le reste à payer (" + argent(reste(f)) + "). Continuer ?")) return;
      var p = S.ajouter("paiements", { factureId: f.id, facture: f.numero, client: f.clientNom, telephone: f.telephone, email: f.email, montant: m, mode: form.mode.value, compte: COMPTE_DE[form.mode.value], ref: form.ref.value.trim(), date: new Date(form.date.value + "T12:00:00").toISOString(), par: A.moi().nom, numero: "REC-" + new Date().getFullYear() + "-" + String(compteur("ng_cpt_rec", 0)).padStart(4, "0") }, "PAY-");
      var nf = majStatut(f.id);
      if (nf.statut === "payee") S.liste("comptes_etudiants").filter(function (e) { return e.factureAcces === f.id && !e.actif; }).forEach(function (e) {
        S.modifier("comptes_etudiants", e.id, { actif: true, enAttentePaiement: false, debloqueLe: new Date().toISOString() });
        S.log("Cours débloqués après paiement", e.nom + " · " + f.numero);
        A.toast("Paiement reçu : les cours de " + e.nom + " sont débloqués", "ok");
        if (e.telephone) setTimeout(function () { envoyer("wa", e, "Bonjour " + e.nom + ",\nNous avons bien reçu votre paiement (" + f.numero + "). 🎉 Vos cours NextGenIT Academy sont maintenant ouverts dans votre espace étudiant.\nBonne formation !", ""); }, 400);
      });
      S.log("Paiement reçu", f.numero + " · " + form.mode.value + (p.ref ? " · réf. " + p.ref : ""), m);
      A.toast(nf.statut === "payee" ? "Facture soldée : reçu " + p.numero : "Paiement partiel enregistré : reçu " + p.numero, "ok");
      ongletP = "historique"; history.replaceState(null, "", "#paiements"); A.rafraichir();
    });
  }
  /* Paiements déclarés par les clients depuis leur espace : à vérifier puis confirmer */
  function pDeclares() {
    var L = S.liste("paiements_declares");
    var att = L.filter(function (x) { return x.statut === "a_verifier"; }), autres = L.filter(function (x) { return x.statut !== "a_verifier"; }).slice(0, 15);
    document.getElementById("p-contenu").innerHTML = '<div class="card"><p>Les clients déclarent ici les paiements faits par Mobile Money, carte ou virement. Vérifiez la référence sur votre relevé, puis confirmez : le reçu est créé et la facture se met à jour.</p>' +
      (att.length ? '<div class="stack">' + att.map(function (x) { return '<div class="row-item" data-dp="' + x.id + '" style="flex-wrap:wrap"><span><strong>' + esc(x.facture) + " · " + esc(x.client) + '</strong><br><small class="muted">' + esc(x.mode) + " · réf. <b>" + esc(x.ref) + "</b> · le " + jour(x.date + "T12:00:00") + " · déclaré par " + esc(x.par || "") + '</small></span><span class="hero-actions" style="flex-wrap:nowrap"><strong style="font-size:1.1rem">' + argent(x.montant) + '</strong><button class="btn btn-primary btn-sm" type="button" data-dp-ok>✅ Confirmer</button><button class="btn btn-ghost btn-sm" type="button" data-dp-non>Rejeter</button></span></div>'; }).join("") + "</div>" : '<p class="muted">Aucun paiement à vérifier.</p>') +
      (autres.length ? '<h3 style="margin-top:16px">Déjà traités</h3>' + autres.map(function (x) { return '<div class="row-item"><span>' + esc(x.facture) + " · " + esc(x.client) + " · réf. " + esc(x.ref) + '</span><span class="tag ' + (x.statut === "confirme" ? "tag-ok" : "tag-muted") + '">' + (x.statut === "confirme" ? "Confirmé" : "Rejeté" + (x.motif ? " · " + esc(x.motif) : "")) + "</span></div>"; }).join("") : "") + "</div>";
    var trouver = function (b) { return S.liste("paiements_declares").filter(function (x) { return x.id === b.closest("[data-dp]").dataset.dp; })[0]; };
    A.lier("[data-dp-ok]", "click", function (e, b) {
      var x = trouver(b), f = S.liste("factures").filter(function (y) { return y.id === x.factureId; })[0];
      if (!f) { A.toast("Facture introuvable", "warn"); return; }
      var mode = COMPTE_DE[x.mode] ? x.mode : "M-Pesa";
      var p = S.ajouter("paiements", { factureId: f.id, facture: f.numero, client: f.clientNom, telephone: f.telephone, email: f.email, montant: Number(x.montant), mode: mode, compte: COMPTE_DE[mode], ref: x.ref, date: new Date((x.date || new Date().toISOString().slice(0, 10)) + "T12:00:00").toISOString(), par: A.moi().nom, numero: "REC-" + new Date().getFullYear() + "-" + String(compteur("ng_cpt_rec", 0)).padStart(4, "0"), declare: x.id }, "PAY-");
      majStatut(f.id);
      S.modifier("paiements_declares", x.id, { statut: "confirme", confirmeLe: new Date().toISOString(), confirmePar: A.moi().nom, paiementId: p.id });
      S.log("Paiement déclaré confirmé", f.numero + " · " + x.mode + " · réf. " + x.ref, Number(x.montant));
      A.toast("Paiement confirmé : reçu " + p.numero, "ok");
      if (x.telephone) envoyer("wa", x, "Bonjour,\nNous confirmons la réception de votre paiement de " + argent(x.montant) + " (" + x.mode + ", réf. " + x.ref + ") pour la facture " + f.numero + ". Votre reçu est disponible dans votre espace client.\nMerci, NextGenIT", "");
      A.rafraichir();
    });
    A.lier("[data-dp-non]", "click", function (e, b) { var x = trouver(b), m = prompt("Raison du rejet (ex. référence introuvable, montant différent) :", "Référence introuvable sur notre relevé"); if (m === null) return; S.modifier("paiements_declares", x.id, { statut: "rejete", motif: m.trim(), traiteLe: new Date().toISOString() }); S.log("Paiement déclaré rejeté", x.facture + " · " + m); if (x.telephone) envoyer("wa", x, "Bonjour,\nNous n’avons pas pu confirmer votre paiement (réf. " + x.ref + ") pour la facture " + x.facture + " : " + m + ". Merci de nous contacter.\nNextGenIT", ""); A.rafraichir(); });
  }
  function pHistorique() {
    var P = S.liste("paiements");
    document.getElementById("p-contenu").innerHTML = '<div class="card"><div class="toolbar"><span style="flex:1"></span><button class="btn btn-ghost btn-sm" type="button" id="p-csv">Exporter en PDF</button></div><div class="table-wrap"><table class="t" style="min-width:900px"><thead><tr><th>Date</th><th>Reçu</th><th>Facture</th><th>Client</th><th>Mode</th><th>Référence</th><th class="r">Montant</th><th>Saisi par</th><th></th></tr></thead><tbody>' +
      (P.map(function (p) { return '<tr data-pid="' + p.id + '"><td>' + jour(p.date) + "</td><td>" + esc(p.numero || "—") + "</td><td>" + esc(p.facture || "") + "</td><td>" + esc(p.client) + "</td><td>" + esc(p.mode) + "</td><td>" + esc(p.ref || "—") + '</td><td class="r"><strong>' + argent(p.montant) + "</strong></td><td>" + esc(p.par) + '</td><td class="r" style="white-space:nowrap"><a class="btn btn-ghost btn-sm" href="document.html?type=recu&pid=' + p.id + '" target="_blank" rel="noopener">Reçu PDF</a> <button class="btn btn-ghost btn-sm" type="button" data-recu-wa>WhatsApp</button> <button class="ico-btn" type="button" data-p-edit title="Modifier" aria-label="Modifier le paiement">✎</button><button class="ico-btn danger" type="button" data-p-suppr title="Supprimer" aria-label="Supprimer le paiement">🗑</button></td></tr>'; }).join("") || '<tr><td colspan="9" class="muted">Aucun paiement.</td></tr>') + "</tbody></table></div></div>";
    document.getElementById("p-csv").addEventListener("click", function () { A.csv("paiements", [["Date", "Reçu", "Facture", "Client", "Mode", "Compte", "Référence", "Montant", "Saisi par"]].concat(P.map(function (p) { return [jour(p.date), p.numero, p.facture, p.client, p.mode, p.compte, p.ref, Number(p.montant).toFixed(2), p.par]; }))); });
    A.lier("[data-p-suppr]", "click", function (e, b) {
      var p = S.liste("paiements").filter(function (x) { return x.id === b.closest("[data-pid]").dataset.pid; })[0];
      if (!confirm("Supprimer le paiement de " + argent(p.montant) + " (" + p.mode + ") sur " + p.facture + " ?\nLa facture redeviendra à payer.")) return;
      S.retirer("paiements", p.id); majStatut(p.factureId); S.log("Paiement supprimé", (p.numero || "") + " · " + p.facture + " · " + p.mode, -Number(p.montant)); A.toast("Paiement supprimé", "ok"); A.rafraichir();
    });
    A.lier("[data-p-edit]", "click", function (e, b) {
      var p = S.liste("paiements").filter(function (x) { return x.id === b.closest("[data-pid]").dataset.pid; })[0];
      A.modal({ titre: "Modifier le paiement " + (p.numero || ""), valider: "Enregistrer",
        corps: '<div class="form-grid"><label class="field">Montant ($)<input name="m" type="number" min="0.01" step="0.01" value="' + p.montant + '" required></label><label class="field">Mode<select name="mode">' + A.options(MODES.map(function (m) { return m[0]; }), p.mode) + '</select></label><label class="field">Référence<input name="ref" value="' + esc(p.ref || "") + '"></label><label class="field">Date<input name="date" type="date" value="' + String(p.date).slice(0, 10) + '"></label></div>',
        onSubmit: function (f) { var m = Number(f.m.value); if (!(m > 0)) { A.toast("Montant invalide", "warn"); return false; } S.modifier("paiements", p.id, { montant: m, mode: f.mode.value, compte: COMPTE_DE[f.mode.value], ref: f.ref.value.trim(), date: new Date(f.date.value + "T12:00:00").toISOString() }); majStatut(p.factureId); S.log("Paiement modifié", (p.numero || "") + " · " + p.facture, m); A.toast("Paiement modifié", "ok"); A.rafraichir(); } });
    });
    A.lier("[data-recu-wa]", "click", function (e, b) { var p = P.filter(function (x) { return x.id === b.closest("[data-pid]").dataset.pid; })[0]; envoyer("wa", p, "Bonjour,\nNous confirmons la réception de " + argent(p.montant) + " (" + p.mode + ") pour la facture " + p.facture + ".\nReçu n° " + p.numero + ".\nMerci pour votre confiance, NextGenIT", ""); });
  }
  function pCaisse() {
    var M = [];
    S.liste("paiements").filter(function (p) { return (p.compte || COMPTE_DE[p.mode]) === "Caisse"; }).forEach(function (p) { M.push({ date: p.date, libelle: "Paiement " + p.facture + " · " + p.client, entree: Number(p.montant), sortie: 0, par: p.par }); });
    S.liste("sorties").filter(function (s) { return s.statut === "paye" && s.compte === "Caisse"; }).forEach(function (s) { M.push({ date: s.payeLe || s.creeLe, libelle: s.libelle, entree: 0, sortie: Number(s.montant), par: s.approuvePar || s.demandePar }); });
    S.liste("caisse").forEach(function (c) { M.push({ cid: c.id, date: c.creeLe, libelle: c.libelle, entree: c.sens === "entree" ? Number(c.montant) : 0, sortie: c.sens === "sortie" ? Number(c.montant) : 0, par: c.par }); });
    M.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    var solde = soldes().filter(function (s) { return s.compte === "Caisse"; })[0];
    var clotures = S.liste("clotures");
    document.getElementById("p-contenu").innerHTML = '<div class="split-2"><div class="card"><h2 class="h-card">Solde théorique de la caisse</h2><strong style="font-family:var(--font-display);font-size:2rem" data-count="' + solde.solde + '" data-format="argent">0</strong><div class="hero-actions"><button class="btn btn-ghost" type="button" id="c-mvt">+ Mouvement de caisse</button><button class="btn btn-primary" type="button" id="c-clore">Clôturer la journée</button></div>' +
      (clotures.length ? "<div><strong>Dernières clôtures</strong>" + clotures.slice(0, 5).map(function (c) { return '<div class="row-item mt-1"><span>' + jour(c.creeLe) + " · " + esc(c.par) + '</span><span>Compté ' + argent(c.compte) + ' · <strong class="' + (Math.abs(c.ecart) < 0.01 ? "up" : "down") + '">écart ' + argent(c.ecart) + "</strong></span></div>"; }).join("") + "</div>" : "") + '</div><div class="card"><h2 class="h-card">Journal de caisse</h2><div class="table-wrap"><table class="t" style="min-width:520px"><thead><tr><th>Date</th><th>Libellé</th><th class="r">Entrée</th><th class="r">Sortie</th></tr></thead><tbody>' +
      (M.slice(0, 60).map(function (m) { return "<tr><td>" + jour(m.date) + "</td><td>" + esc(m.libelle) + '<br><small class="muted">' + esc(m.par || "") + '</small></td><td class="r up">' + (m.entree ? argent(m.entree) : "") + '</td><td class="r down">' + (m.sortie ? argent(m.sortie) : "") + (m.cid ? ' <button class="ico-btn danger" type="button" data-c-suppr="' + m.cid + '" title="Supprimer ce mouvement" aria-label="Supprimer ce mouvement">🗑</button>' : "") + "</td></tr>"; }).join("") || '<tr><td colspan="4" class="muted">Aucun mouvement.</td></tr>') + "</tbody></table></div></div></div>";
    A.lier("[data-c-suppr]", "click", function (e, b) { var c = S.liste("caisse").filter(function (x) { return x.id === b.dataset.cSuppr; })[0]; if (c && confirm("Supprimer le mouvement « " + c.libelle + " » (" + argent(c.montant) + ") ?")) { S.retirer("caisse", c.id); S.log("Mouvement de caisse supprimé", c.libelle, -Number(c.montant)); A.rafraichir(); } });
    document.getElementById("c-mvt").addEventListener("click", function () {
      A.modal({ titre: "Mouvement de caisse", valider: "Enregistrer", corps: '<div class="form-grid"><label class="field">Type<select name="sens">' + A.options([["entree", "Entrée (apport, vente comptoir)"], ["sortie", "Sortie (petite dépense, dépôt en banque)"]]) + '</select></label><label class="field">Montant ($)<input name="m" type="number" min="0.01" step="0.01" required></label><label class="field full">Libellé<input name="l" required></label></div>',
        onSubmit: function (f) { if (!(Number(f.m.value) > 0) || !f.l.value.trim()) { A.toast("Montant et libellé obligatoires", "warn"); return false; } S.ajouter("caisse", { sens: f.sens.value, montant: Number(f.m.value), libelle: f.l.value.trim(), par: A.moi().nom }, "CA-"); S.log("Mouvement de caisse (" + f.sens.value + ")", f.l.value.trim(), Number(f.m.value)); A.rafraichir(); } });
    });
    document.getElementById("c-clore").addEventListener("click", function () {
      A.modal({ titre: "Clôture de caisse du " + jour(new Date().toISOString()), valider: "Clôturer", corps: "<p>Solde théorique : <strong>" + argent(solde.solde) + '</strong>. Comptez les billets et indiquez le montant réel.</p><label class="field">Montant compté ($)<input name="c" type="number" step="0.01" required></label>',
        onSubmit: function (f) { var c = Number(f.c.value) || 0, ecart = c - solde.solde; S.ajouter("clotures", { compte: c, theorique: solde.solde, ecart: ecart, par: A.moi().nom }, "CL-"); S.log("Clôture de caisse", "Compté " + argent(c) + " · écart " + argent(ecart), c); A.toast(Math.abs(ecart) < 0.01 ? "Caisse juste" : "Écart de " + argent(ecart) + " enregistré", Math.abs(ecart) < 0.01 ? "ok" : "warn"); A.rafraichir(); } });
    });
  }
  function pComptes() {
    var L = soldes(), tot = L.reduce(function (a, s) { return a + s.solde; }, 0);
    document.getElementById("p-contenu").innerHTML = '<form class="card" id="form-soldes"><h2 class="h-card">Trésorerie totale : ' + argent(tot) + '</h2><div class="table-wrap"><table class="t"><thead><tr><th>Compte</th><th style="width:170px">Solde de départ ($)</th><th class="r">Entrées</th><th class="r">Sorties</th><th class="r">Solde</th></tr></thead><tbody>' +
      L.map(function (s) { return "<tr><td><strong>" + s.compte + '</strong></td><td><input type="number" step="0.01" name="' + s.compte + '" value="' + s.init + '"></td><td class="r up">+ ' + argent(s.entrees) + '</td><td class="r down">− ' + argent(s.sorties) + '</td><td class="r"><strong>' + argent(s.solde) + "</strong></td></tr>"; }).join("") + '</tbody></table></div><button class="btn btn-ghost" type="submit" style="align-self:flex-start">Enregistrer les soldes de départ</button></form>';
    document.getElementById("form-soldes").addEventListener("submit", function (e) { e.preventDefault(); var R = S.reglages(); R.soldesInitiaux = {}; Array.prototype.forEach.call(e.target.elements, function (el) { if (el.name) R.soldesInitiaux[el.name] = Number(el.value) || 0; }); S.enregistrerReglages(R); S.log("Soldes de départ modifiés", ""); A.toast("Enregistré", "ok"); A.rafraichir(); });
  }
  function pMoyens() {
    var R = S.reglages();
    document.getElementById("p-contenu").innerHTML = '<form class="card" id="form-moyens"><h2 class="h-card">Moyens de paiement proposés aux clients</h2><p>Ces informations apparaissent sur les factures, les reçus, les messages de paiement et l’espace client.</p><div class="form-grid">' +
      '<label class="field full">Numéros Mobile Money<input name="mobileMoney" value="' + esc(R.mobileMoney) + '" placeholder="M-Pesa : … · Orange Money : … · Airtel Money : …"></label>' +
      '<label class="field full">Banque et numéro de compte<input name="banque" value="' + esc(R.banque) + '" placeholder="EquityBCDC · compte n° … · SWIFT …"></label>' +
      '<label class="field full">Lien de paiement par carte (fourni par votre agrégateur de paiement)<input name="lienCarte" type="url" value="' + esc(R.lienCarte || "") + '" placeholder="https://…"></label>' +
      '<label class="field">Délai de paiement (jours)<input name="delaiPaiement" type="number" min="0" value="' + esc(R.delaiPaiement || 15) + '"></label>' +
      '<label class="field">Acompte par défaut (%)<input name="acompteDefaut" type="number" min="0" max="100" value="' + esc(R.acompteDefaut || 50) + '"></label></div>' +
      '<div class="notice">Paiement en ligne automatique : pour que M-Pesa, Orange Money, Airtel Money et la carte se confirment tout seuls, il faut un contrat avec un agrégateur de paiement opérant en RDC et un serveur. En attendant, l’équipe enregistre chaque paiement ici avec sa référence.</div>' +
      '<button class="btn btn-primary" type="submit" style="align-self:flex-start">Enregistrer</button></form>';
    document.getElementById("form-moyens").addEventListener("submit", function (e) { e.preventDefault(); var R2 = S.reglages(); Array.prototype.forEach.call(e.target.elements, function (el) { if (el.name) R2[el.name] = el.type === "number" ? Number(el.value) || 0 : el.value.trim(); }); S.enregistrerReglages(R2); S.log("Moyens de paiement modifiés", ""); A.toast("Enregistré", "ok"); });
  }

  /* =================== Dépenses, budgets et paie =================== */
  var ongletD = "depenses";
  A.VUES.depenses = function () {
    var tabs = [["depenses", "Dépenses"], ["budgets", "Budgets du mois"], ["paie", "Paie des agents"], ["avances", "Avances sur salaire"], ["historique", "Historique de paie"]];
    var aApprouver = S.liste("sorties").filter(function (s) { return s.statut === "demande"; });
    var mois = A.moisPrecedents(6);
    A.vue.innerHTML = A.entete("Dépenses et paie", "Chaque sortie d’argent est demandée, approuvée puis payée. La paie calcule fixe, heures, commissions, primes et avances.") +
      '<div class="dash"><div class="card w8"><h2 class="h-card">Entrées et sorties sur 6 mois</h2>' + A.graphLigne(mois.map(function (m) { return A.nomMois(m, true); }), [{ nom: "Encaissements", valeurs: mois.map(encaisse), couleur: "#2AA9F0" }, { nom: "Dépenses", valeurs: mois.map(depense), couleur: "#F5B547" }]) + "</div>" +
      '<div class="w4 stack"><div class="kpi"><span>Dépenses payées ce mois</span><strong data-count="' + depense(A.MOIS) + '" data-format="argent">0</strong></div><div class="kpi"><span>À approuver</span><strong style="color:var(--warn)" data-count="' + aApprouver.length + '">0</strong><small>' + argent(aApprouver.reduce(function (a, s) { return a + Number(s.montant); }, 0)) + '</small></div><div class="kpi"><span>Résultat du mois</span><strong data-count="' + (encaisse(A.MOIS) - depense(A.MOIS)) + '" data-format="argent">0</strong></div></div></div>' +
      '<div class="tabs mt-2" role="tablist">' + tabs.map(function (t) { return '<button class="tab" type="button" role="tab" data-od="' + t[0] + '" aria-selected="' + (ongletD === t[0]) + '">' + t[1] + "</button>"; }).join("") + '</div><div id="d-contenu"></div>';
    A.lier("[data-od]", "click", function (e, b) { ongletD = b.dataset.od; A.rafraichir(); });
    ({ depenses: dDepenses, budgets: dBudgets, paie: dPaie, avances: dAvances, historique: dHistorique })[ongletD]();
  };
  function dDepenses() {
    var D = S.liste("sorties");
    var lib = { demande: ["À approuver", "tag-warn"], approuve: ["Approuvée", "tag-accent"], paye: ["Payée", "tag-ok"], refuse: ["Refusée", "tag-muted"] };
    document.getElementById("d-contenu").innerHTML = '<div class="card"><div class="toolbar"><button class="btn btn-primary" type="button" id="dep-new">+ Demande de dépense</button><span style="flex:1"></span><button class="btn btn-ghost btn-sm" type="button" id="dep-csv">Exporter en PDF</button></div><div class="table-wrap"><table class="t" style="min-width:1000px"><thead><tr><th>Date</th><th>Libellé</th><th>Catégorie</th><th>Compte</th><th class="r">Montant</th><th>Demandé par</th><th>Statut</th><th></th></tr></thead><tbody>' +
      (D.map(function (s) { return '<tr data-s="' + s.id + '"><td>' + jour(s.creeLe) + "</td><td>" + esc(s.libelle) + (s.justif ? '<br><small class="muted">Pièce : ' + esc(s.justif) + "</small>" : "") + "</td><td>" + esc(s.categorie) + "</td><td>" + esc(s.compte) + '</td><td class="r"><strong>' + argent(s.montant) + "</strong></td><td>" + esc(s.demandePar) + (s.approuvePar ? '<br><small class="muted">Approuvée : ' + esc(s.approuvePar) + "</small>" : "") + '</td><td><span class="tag ' + lib[s.statut][1] + '">' + lib[s.statut][0] + '</span></td><td class="r" style="white-space:nowrap">' + (s.statut === "demande" ? '<button class="btn btn-primary btn-sm" type="button" data-act="approuve">Approuver</button> <button class="btn btn-ghost btn-sm" type="button" data-act="refuse">Refuser</button>' : s.statut === "approuve" ? '<button class="btn btn-primary btn-sm" type="button" data-act="paye">Payer</button>' : "") + ' <button class="ico-btn" type="button" data-s-edit title="Modifier" aria-label="Modifier la dépense">✎</button><button class="ico-btn danger" type="button" data-s-suppr title="Supprimer" aria-label="Supprimer la dépense">🗑</button></td></tr>'; }).join("") || '<tr><td colspan="8" class="muted">Aucune dépense.</td></tr>') + "</tbody></table></div></div>";
    document.getElementById("dep-new").addEventListener("click", function () {
      A.modal({ titre: "Nouvelle demande de dépense", valider: "Soumettre pour approbation", corps: '<div class="form-grid"><label class="field">Catégorie<select name="cat">' + A.options(CATEGORIES.filter(function (c) { return c !== "Paie" && c !== "Avances sur salaire"; }), "Matériel et stock") + '</select></label><label class="field">Montant ($)<input name="m" type="number" min="0.01" step="0.01" required></label><label class="field full">Libellé<input name="l" required placeholder="Ex. 8 caméras IP pour le projet NG-1042"></label><label class="field">Payé depuis<select name="c">' + A.options(COMPTES, "Caisse") + '</select></label><label class="field">Justificatif<input name="j" type="file" accept="image/*,.pdf"></label></div>',
        onSubmit: function (f) {
          if (!(Number(f.m.value) > 0) || !f.l.value.trim()) { A.toast("Libellé et montant obligatoires", "warn"); return false; }
          var fic = f.j.files[0];
          var s = S.ajouter("sorties", { categorie: f.cat.value, libelle: f.l.value.trim(), montant: Number(f.m.value), compte: f.c.value, demandePar: A.moi().nom, statut: "demande", justif: fic ? fic.name : "" }, "SRT-");
          if (fic && window.NGFichiers) window.NGFichiers.enregistrer("justif-" + s.id, fic);
          S.log("Demande de dépense", s.libelle, s.montant); A.toast("Demande soumise", "ok"); A.rafraichir();
        } });
    });
    document.getElementById("dep-csv").addEventListener("click", function () { A.csv("depenses", [["Date", "Libellé", "Catégorie", "Compte", "Montant", "Demandé par", "Approuvé par", "Statut"]].concat(D.map(function (s) { return [jour(s.creeLe), s.libelle, s.categorie, s.compte, Number(s.montant).toFixed(2), s.demandePar, s.approuvePar || "", s.statut]; }))); });
    A.lier("[data-s-suppr]", "click", function (e, b) {
      var x = S.liste("sorties").filter(function (y) { return y.id === b.closest("[data-s]").dataset.s; })[0];
      if (!confirm("Supprimer la dépense « " + x.libelle + " » (" + argent(x.montant) + ") ?" + (x.statut === "paye" ? "\nElle est déjà payée : le solde du compte " + x.compte + " sera recalculé." : ""))) return;
      S.retirer("sorties", x.id); S.log("Dépense supprimée", x.libelle + " · " + x.compte, -Number(x.montant)); A.toast("Dépense supprimée", "ok"); A.rafraichir();
    });
    A.lier("[data-s-edit]", "click", function (e, b) {
      var x = S.liste("sorties").filter(function (y) { return y.id === b.closest("[data-s]").dataset.s; })[0];
      A.modal({ titre: "Modifier la dépense", valider: "Enregistrer",
        corps: '<div class="form-grid"><label class="field full">Libellé<input name="l" value="' + esc(x.libelle) + '" required></label><label class="field">Catégorie<select name="cat">' + A.options(CATEGORIES, x.categorie) + '</select></label><label class="field">Montant ($)<input name="m" type="number" min="0.01" step="0.01" value="' + x.montant + '"></label><label class="field">Compte<select name="c">' + A.options(COMPTES, x.compte) + '</select></label><label class="field">Statut<select name="st">' + A.options([["demande", "À approuver"], ["approuve", "Approuvée"], ["paye", "Payée"], ["refuse", "Refusée"]], x.statut) + "</select></label></div>",
        onSubmit: function (f) { if (!f.l.value.trim() || !(Number(f.m.value) > 0)) { A.toast("Libellé et montant obligatoires", "warn"); return false; } S.modifier("sorties", x.id, { libelle: f.l.value.trim(), categorie: f.cat.value, montant: Number(f.m.value), compte: f.c.value, statut: f.st.value, payeLe: f.st.value === "paye" ? (x.payeLe || new Date().toISOString()) : x.payeLe }); S.log("Dépense modifiée", f.l.value.trim(), Number(f.m.value)); A.toast("Dépense modifiée", "ok"); A.rafraichir(); } });
    });
    A.lier("[data-act]", "click", function (e, b) {
      var id = b.closest("[data-s]").dataset.s, act = b.dataset.act, m = { statut: act };
      if (act === "approuve") m.approuvePar = A.moi().nom;
      if (act === "paye") m.payeLe = new Date().toISOString();
      var s = S.modifier("sorties", id, m);
      var bud = (S.reglages().budgets || {})[s.categorie];
      if (act === "approuve" && bud) { var conso = S.liste("sorties").filter(function (x) { return x.categorie === s.categorie && ["approuve", "paye"].indexOf(x.statut) > -1 && A.moisDe(x.creeLe) === A.MOIS; }).reduce(function (a, x) { return a + Number(x.montant); }, 0); if (conso > bud) A.toast("Attention : budget « " + s.categorie + " » dépassé", "warn"); }
      S.log(act === "approuve" ? "Dépense approuvée" : act === "paye" ? "Dépense payée" : "Dépense refusée", s.libelle + " · " + s.compte, s.montant);
      A.rafraichir();
    });
  }
  function dBudgets() {
    var B = S.reglages().budgets || {};
    var conso = {};
    S.liste("sorties").filter(function (s) { return ["approuve", "paye"].indexOf(s.statut) > -1 && A.moisDe(s.payeLe || s.creeLe) === A.MOIS; }).forEach(function (s) { conso[s.categorie] = (conso[s.categorie] || 0) + Number(s.montant); });
    document.getElementById("d-contenu").innerHTML = '<form class="card" id="form-budgets"><h2 class="h-card">Budgets de ' + A.nomMois(A.MOIS) + '</h2><p>Fixez un plafond par catégorie : une alerte s’affiche dès qu’il est dépassé.</p><div class="stack" style="gap:16px">' +
      CATEGORIES.map(function (c, i) { var b = Number(B[c] || 0), u = conso[c] || 0, pc = b ? Math.min(100, Math.round(u / b * 100)) : 0; return '<div style="display:grid;grid-template-columns:minmax(0,1fr) 150px;gap:14px;align-items:center"><div><div style="display:flex;justify-content:space-between;gap:10px;font-size:.92rem"><span>' + c + '</span><span class="' + (b && u > b ? "down" : "") + '"><strong>' + argent(u) + "</strong>" + (b ? " / " + argent(b) : "") + '</span></div><div class="progress mt-1"><span style="width:' + (b ? pc : 0) + "%;animation-delay:" + i * 0.06 + "s" + (b && u > b ? ";background:var(--danger)" : "") + '"></span></div></div><input type="number" min="0" step="1" name="' + esc(c) + '" value="' + (b || "") + '" placeholder="Budget $" aria-label="Budget ' + esc(c) + '" style="min-height:42px;border-radius:10px;border:1px solid var(--line-2);background:var(--bg);color:var(--text);padding:0 10px"></div>'; }).join("") +
      '</div><button class="btn btn-primary" type="submit" style="align-self:flex-start">Enregistrer les budgets</button></form>';
    document.getElementById("form-budgets").addEventListener("submit", function (e) { e.preventDefault(); var R = S.reglages(); R.budgets = {}; Array.prototype.forEach.call(e.target.elements, function (el) { if (el.name && Number(el.value) > 0) R.budgets[el.name] = Number(el.value); }); S.enregistrerReglages(R); S.log("Budgets modifiés", A.nomMois(A.MOIS)); A.toast("Budgets enregistrés", "ok"); A.rafraichir(); });
  }
  function calculPaie(p, e) {
    var interv = S.demandes().filter(function (d) { return d.techId === p.id && (d.etape === "termine" || d.statut === "cloture") && A.moisDe(d.cloreLe || d.evalueLe || d.creeLe) === A.MOIS; }).length;
    var fixe = p.remu === "horaire" ? 0 : Number(p.salaire || 0);
    var heures = (p.remu === "horaire" || p.remu === "mixte") ? Number(e.heures || 0) * Number(p.tauxHoraire || 0) : 0;
    var com = interv * Number(p.commission || 0);
    var avances = S.liste("avances").filter(function (a) { return a.personnelId === p.id && !a.deduitLe; }).reduce(function (s, a) { return s + Number(a.montant); }, 0);
    var brut = fixe + heures + com + Number(e.primes || 0);
    return { fixe: fixe, heures: heures, interv: interv, com: com, primes: Number(e.primes || 0), avances: avances, retenues: Number(e.retenues || 0), brut: brut, net: brut - avances - Number(e.retenues || 0) };
  }
  function dPaie() {
    var cle = "paie_" + A.MOIS, etat = S.liste(cle); if (Array.isArray(etat)) etat = {};
    var P = S.liste("personnel").filter(function (p) { return p.actif; }), total = 0;
    document.getElementById("d-contenu").innerHTML = '<div class="card"><h2 class="h-card">Paie de ' + A.nomMois(A.MOIS) + '</h2><p>Fixe + heures prestées × taux + commissions par intervention terminée + primes − avances − retenues. Le type de rémunération se règle dans la fiche de chaque agent.</p><div class="table-wrap"><table class="t" style="min-width:1180px"><thead><tr><th>Agent</th><th class="r">Fixe</th><th style="width:90px">Heures</th><th class="r">Interv. × com.</th><th style="width:100px">Primes</th><th class="r">Avances</th><th style="width:100px">Retenues</th><th class="r">Net</th><th>Statut</th><th></th></tr></thead><tbody>' +
      P.map(function (p) {
        var e = etat[p.id] || {}, c = e.payeLe ? e.calcul : calculPaie(p, e); total += c.net;
        var lien = "document.html?type=paie&pid=" + p.id + "&mois=" + A.MOIS;
        var dis = e.payeLe ? " disabled" : "";
        return '<tr data-ag="' + p.id + '"><td><strong>' + esc(p.nom) + '</strong><br><small class="muted">' + esc(p.poste) + " · " + esc({ fixe: "Fixe", horaire: "À l’heure", mixte: "Fixe + heures" }[p.remu || "fixe"]) + '</small></td><td class="r">' + argent(c.fixe) + '</td><td><input type="number" min="0" step="0.5" data-k="heures" value="' + (e.heures || 0) + '"' + dis + (p.remu === "horaire" || p.remu === "mixte" ? "" : " disabled") + ' aria-label="Heures"></td><td class="r">' + c.interv + " × " + argent(p.commission || 0) + "<br><strong>" + argent(c.com) + '</strong></td><td><input type="number" min="0" step="1" data-k="primes" value="' + (e.primes || 0) + '"' + dis + ' aria-label="Primes"></td><td class="r down">− ' + argent(c.avances) + '</td><td><input type="number" min="0" step="1" data-k="retenues" value="' + (e.retenues || 0) + '"' + dis + ' aria-label="Retenues"></td><td class="r"><strong>' + argent(c.net) + "</strong></td><td>" + (e.payeLe ? '<span class="tag tag-ok">Payé ' + jour(e.payeLe) + "</span>" : '<span class="tag tag-warn">À payer</span>') + '</td><td class="r" style="white-space:nowrap">' + (e.payeLe ? "" : '<button class="btn btn-primary btn-sm" type="button" data-payer>Payer</button> ') + '<a class="btn btn-ghost btn-sm" href="' + lien + '" target="_blank" rel="noopener">Bulletin</a></td></tr>';
      }).join("") + '</tbody></table></div><div class="row-item total-row"><span>Masse salariale nette</span><strong style="font-size:1.2rem">' + argent(total) + "</strong></div></div>";
    A.lier("[data-k]", "change", function (ev, inp) { var id = inp.closest("[data-ag]").dataset.ag; etat[id] = Object.assign({}, etat[id] || {}); etat[id][inp.dataset.k] = Math.max(0, Number(inp.value) || 0); S.enregistrerListe(cle, etat); A.rafraichir(); });
    A.lier("[data-payer]", "click", function (ev, b) {
      var p = P.filter(function (x) { return x.id === b.closest("[data-ag]").dataset.ag; })[0], e = etat[p.id] || {}, c = calculPaie(p, e);
      if (!confirm("Payer " + argent(c.net) + " à " + p.nom + " par " + p.mode + " ?")) return;
      e.payeLe = new Date().toISOString(); e.calcul = c; etat[p.id] = e; S.enregistrerListe(cle, etat);
      S.ajouter("sorties", { categorie: "Paie", libelle: "Salaire " + p.nom + " – " + A.nomMois(A.MOIS), montant: c.net, compte: { "Espèces (caisse)": "Caisse" }[p.mode] || p.mode, demandePar: A.moi().nom, statut: "paye", approuvePar: A.moi().nom, payeLe: e.payeLe, personnelId: p.id, mois: A.MOIS }, "SRT-");
      S.liste("avances").filter(function (a) { return a.personnelId === p.id && !a.deduitLe; }).forEach(function (a) { S.modifier("avances", a.id, { deduitLe: e.payeLe }); });
      S.log("Salaire payé", p.nom + " · " + A.nomMois(A.MOIS) + " · " + p.mode, c.net);
      A.toast("Salaire payé, bulletin disponible", "ok"); A.rafraichir();
    });
  }
  function dAvances() {
    var L = S.liste("avances"), P = S.liste("personnel");
    document.getElementById("d-contenu").innerHTML = '<div class="card"><div class="toolbar"><button class="btn btn-primary" type="button" id="av-new">+ Accorder une avance</button><p style="flex:1">Une avance est payée tout de suite et déduite automatiquement du prochain salaire.</p></div><div class="table-wrap"><table class="t"><thead><tr><th>Date</th><th>Agent</th><th>Motif</th><th class="r">Montant</th><th>Statut</th></tr></thead><tbody>' +
      (L.map(function (a) { var p = P.filter(function (x) { return x.id === a.personnelId; })[0]; return '<tr data-av="' + a.id + '"><td>' + jour(a.creeLe) + "</td><td>" + esc(p ? p.nom : "?") + "</td><td>" + esc(a.motif || "") + '</td><td class="r">' + argent(a.montant) + "</td><td>" + (a.deduitLe ? '<span class="tag tag-ok">Déduite ' + jour(a.deduitLe) + "</span>" : '<span class="tag tag-warn">À déduire</span>') + (a.deduitLe ? "" : ' <button class="ico-btn danger" type="button" data-av-suppr title="Supprimer l’avance" aria-label="Supprimer l’avance">🗑</button>') + "</td></tr>"; }).join("") || '<tr><td colspan="5" class="muted">Aucune avance.</td></tr>') + "</tbody></table></div></div>";
    A.lier("[data-av-suppr]", "click", function (e, b) { var a = S.liste("avances").filter(function (x) { return x.id === b.closest("[data-av]").dataset.av; })[0]; if (a && confirm("Supprimer cette avance de " + argent(a.montant) + " ? Elle ne sera plus déduite du salaire.")) { S.retirer("avances", a.id); S.log("Avance supprimée", a.motif || "", -Number(a.montant)); A.rafraichir(); } });
    document.getElementById("av-new").addEventListener("click", function () {
      A.modal({ titre: "Avance sur salaire", valider: "Accorder et payer", corps: '<div class="form-grid"><label class="field">Agent<select name="p">' + A.options(P.filter(function (p) { return p.actif; }).map(function (p) { return [p.id, p.nom]; })) + '</select></label><label class="field">Montant ($)<input name="m" type="number" min="1" step="1" required></label><label class="field">Payée depuis<select name="c">' + A.options(COMPTES, "Caisse") + '</select></label><label class="field full">Motif<input name="motif"></label></div>',
        onSubmit: function (f) { var m = Number(f.m.value); if (!(m > 0)) { A.toast("Montant obligatoire", "warn"); return false; } var p = P.filter(function (x) { return x.id === f.p.value; })[0]; S.ajouter("avances", { personnelId: p.id, montant: m, motif: f.motif.value.trim() }, "AV-"); S.ajouter("sorties", { categorie: "Avances sur salaire", libelle: "Avance " + p.nom + (f.motif.value ? " – " + f.motif.value.trim() : ""), montant: m, compte: f.c.value, demandePar: A.moi().nom, statut: "paye", approuvePar: A.moi().nom, payeLe: new Date().toISOString() }, "SRT-"); S.log("Avance accordée", p.nom, m); A.toast("Avance enregistrée", "ok"); A.rafraichir(); } });
    });
  }
  function dHistorique() {
    var L = S.liste("sorties").filter(function (s) { return s.categorie === "Paie"; });
    var parMois = {};
    L.forEach(function (s) { var m = s.mois || A.moisDe(s.payeLe || s.creeLe); parMois[m] = (parMois[m] || 0) + Number(s.montant); });
    document.getElementById("d-contenu").innerHTML = '<div class="card"><h2 class="h-card">Masse salariale par mois</h2>' + A.barres(Object.keys(parMois).sort().reverse().map(function (m) { return { label: A.nomMois(m), val: parMois[m] }; }), "argent") + '</div><div class="card mt-2"><div class="table-wrap"><table class="t"><thead><tr><th>Payé le</th><th>Libellé</th><th>Compte</th><th class="r">Montant</th><th>Par</th><th></th></tr></thead><tbody>' +
      (L.map(function (s) { return "<tr><td>" + jour(s.payeLe) + "</td><td>" + esc(s.libelle) + "</td><td>" + esc(s.compte) + '</td><td class="r">' + argent(s.montant) + "</td><td>" + esc(s.approuvePar || "") + '</td><td class="r">' + (s.personnelId ? '<a class="btn btn-ghost btn-sm" href="document.html?type=paie&pid=' + s.personnelId + "&mois=" + (s.mois || A.moisDe(s.payeLe)) + '" target="_blank" rel="noopener">Bulletin</a>' : "") + "</td></tr>"; }).join("") || '<tr><td colspan="6" class="muted">Aucun salaire payé.</td></tr>') + "</tbody></table></div></div>";
  }
})();
