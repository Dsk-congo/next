/* Administration – Pilotage : tableau de bord, notifications, rapports financiers, historique */
(function () {
  var A = window.NGA, S = A.S, esc = A.esc, argent = A.argent, jour = A.jour;
  var COULEURS = ["#2AA9F0", "#7CC243", "#F5B547", "#A78BFA", "#F87171", "#34D399", "#60A5FA", "#FB923C"];
  var ICO = {
    argent: "M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
    alerte: "M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z",
    doc: "M6 2h9l5 5v15H6zM14 2v6h6",
    projet: "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z",
    ticket: "M4 7h16v4a2 2 0 000 4v4H4v-4a2 2 0 000-4z",
    etudiant: "M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5",
    tech: "M16 20v-2a4 4 0 00-8 0v2M12 11a4 4 0 100-8 4 4 0 000 8z",
    boite: "M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8"
  };
  function ico(n) { return '<span class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + ICO[n] + '"/></svg></span>'; }
  function f() { return A.fin || { encaisse: function () { return 0; }, depense: function () { return 0; }, caParService: function () { return {}; } }; }
  var AUJ = function () { return new Date().toISOString().slice(0, 10); };
  function dans(jours) { return new Date(Date.now() + jours * 864e5).toISOString().slice(0, 10); }
  function wa(tel, msg) { return "https://wa.me/" + String(tel || "").replace(/[^\d]/g, "") + "?text=" + encodeURIComponent(msg); }

  /* =================== Notifications automatiques =================== */
  function notifs() {
    var out = [], auj = AUJ(), demain = dans(1), E = A.C.entreprise;
    var n;
    if (A.rappelsDuJour && (n = A.rappelsDuJour().length)) out.push({ niv: "info", ico: "doc", titre: n + " rappel(s) à envoyer aujourd’hui", detail: "Factures échues, interventions et séances de demain, renouvellements.", lien: "#notifications" });
    if (A.alertesParc && A.autorise("parc") && (n = A.alertesParc().length)) out.push({ niv: "warn", ico: "alerte", titre: n + " garantie(s) ou licence(s) de clients à renouveler", detail: "Proposez le renouvellement avant l’expiration.", lien: "#parc" });
    if (A.autorise("supervision")) S.liste("supervision").filter(function (m) { return m.statut === "panne"; }).forEach(function (m) { out.unshift({ niv: "danger", ico: "alerte", titre: "En panne : " + m.nom, detail: (m.client || "") + " · " + m.url, lien: "#supervision" }); });
    if (A.autorise("messages") && (n = S.liste("messages").filter(function (m) { return (m.statut || "nouveau") === "nouveau"; }).length)) out.unshift({ niv: "warn", ico: "doc", titre: n + " message(s) reçu(s) depuis la page Contact", detail: "Répondez sur WhatsApp ou par email, ou transformez-les en demande de devis.", lien: "#messages" });
    if (A.autorise("recrutement") && (n = S.liste("candidatures").filter(function (c) { return (c.statut || "nouvelle") === "nouvelle"; }).length)) out.push({ niv: "info", ico: "etudiant", titre: n + " nouvelle(s) candidature(s)", detail: "Page Carrières du site.", lien: "#recrutement" });
    if (A.autorise("chat") && (n = S.liste("chats").filter(function (c) { return c.nonLu && c.statut !== "ferme"; }).length)) out.unshift({ niv: "danger", ico: "doc", titre: n + " visiteur(s) attendent une réponse dans le chat", detail: "Répondez vite : ils sont sur le site.", lien: "#chat" });
    if (A.autorise("rendezvous") && (n = S.liste("rendezvous").filter(function (r) { return r.statut === "a_confirmer"; }).length)) out.unshift({ niv: "warn", ico: "doc", titre: n + " rendez-vous à confirmer", detail: "Pris en ligne par des clients.", lien: "#rendezvous" });
    if (A.autorise("partenaires") && (n = S.liste("commandes_partenaires").filter(function (c) { return c.statut === "nouvelle"; }).length)) out.push({ niv: "info", ico: "doc", titre: n + " commande(s) de partenaires", detail: "Portail partenaires.", lien: "#partenaires" });
    if (A.autorise("parrainages") && (n = S.liste("parrainages").filter(function (p) { return p.statut === "nouveau"; }).length)) out.push({ niv: "info", ico: "doc", titre: n + " entreprise(s) recommandée(s) par vos clients", detail: "Contactez-les rapidement.", lien: "#parrainages" });
    if (A.mdpParDefaut && A.mdpParDefaut()) out.push({ niv: "danger", ico: "alerte", titre: "Changez le mot de passe par défaut", detail: "Votre compte utilise encore le mot de passe d’installation : changez-le dans Mon compte.", lien: "#compte" });
    if (A.autorise("demandes") && (n = S.demandes().filter(function (d) { return d.statut === "a_evaluer"; }).length)) out.push({ niv: "info", ico: "doc", titre: n + " demande(s) de devis à évaluer", detail: "Les clients attendent leur devis.", lien: "#demandes" });
    if (A.autorise("inscriptions") && (n = S.liste("inscriptions").filter(function (i) { return i.statut === "en_attente"; }).length)) out.push({ niv: "info", ico: "etudiant", titre: n + " inscription(s) à approuver", detail: "Approuvez pour créer le compte étudiant et envoyer les identifiants.", lien: "#inscriptions" });
    if (A.autorise("tickets")) S.liste("tickets").filter(function (t) { return t.avis && t.avis.note <= 2 && !t.avis.traite; }).forEach(function (t) { out.unshift({ niv: "danger", ico: "ticket", titre: "Avis négatif (" + t.avis.note + "/5) sur " + t.id, detail: t.clientNom + (t.avis.commentaire ? " · « " + t.avis.commentaire.slice(0, 80) + " »" : "") + " · rappelez le client", lien: "#tickets/" + t.id }); });
    if (A.autorise("paiements") && (n = S.liste("paiements_declares").filter(function (x) { return x.statut === "a_verifier"; }).length)) out.unshift({ niv: "warn", ico: "argent", titre: n + " paiement(s) déclaré(s) par des clients à vérifier", detail: "Vérifiez la référence puis confirmez pour créer le reçu.", lien: "#paiements" });
    if (A.autorise("depenses") && (n = S.liste("sorties").filter(function (s) { return s.statut === "demande"; }).length)) out.push({ niv: "warn", ico: "argent", titre: n + " dépense(s) à approuver", detail: "Demandes de sortie d’argent en attente.", lien: "#depenses" });
    if (A.autorise("factures")) {
      S.liste("factures").filter(function (x) { return x.type !== "proforma" && ["emise", "partielle"].indexOf(x.statut) > -1 && x.echeance < auj; }).slice(0, 8).forEach(function (x) {
        out.push({ niv: "danger", ico: "alerte", titre: "Facture " + x.numero + " en retard", detail: x.clientNom + " · reste " + argent(A.fin ? A.fin.reste(x) : x.ttc) + " · échue le " + jour(x.echeance), lien: "#factures/" + x.id, wa: wa(x.telephone, "Bonjour " + (x.contact || x.clientNom) + ",\nPetit rappel : la facture " + x.numero + " (" + argent(A.fin ? A.fin.reste(x) : x.ttc) + ") est arrivée à échéance le " + jour(x.echeance) + ".\n" + (A.fin ? A.fin.instructions(x) : "") + "\nMerci, NextGenIT") });
      });
      S.liste("factures").forEach(function (x) { (x.echeancier || []).forEach(function (e, i) { if (["emise", "partielle"].indexOf(x.statut) > -1 && e.date <= dans(3) && e.date >= auj) out.push({ niv: "warn", ico: "argent", titre: "Échéance " + (i + 1) + " de " + x.numero + " le " + jour(e.date), detail: x.clientNom + " · " + argent(e.montant), lien: "#factures/" + x.id, wa: wa(x.telephone, "Bonjour,\nRappel : échéance de " + argent(e.montant) + " pour la facture " + x.numero + " le " + jour(e.date) + ".\nNextGenIT") }); }); });
      S.liste("abonnements").filter(function (a) { return a.actif && a.prochaine <= dans(10); }).forEach(function (a) {
        out.push({ niv: a.prochaine < auj ? "danger" : "warn", ico: "doc", titre: a.service + " · " + a.clientNom, detail: (a.prochaine < auj ? "Échu le " : "Expire le ") + jour(a.prochaine) + " · " + argent(a.montant), lien: "#factures", wa: wa(a.telephone, "Bonjour,\nVotre « " + a.service + " » arrive à échéance le " + jour(a.prochaine) + ". Pour éviter toute interruption, merci de procéder au renouvellement (" + argent(a.montant) + " HT).\nNextGenIT – " + E.telephone) });
      });
    }
    if (A.autorise("formations")) S.formations().filter(function (x) { return x.debut > auj && x.debut <= dans(7); }).forEach(function (x) {
      var nb = S.liste("comptes_etudiants").filter(function (e) { return e.formationId === x.id; }).length;
      out.push({ niv: "info", ico: "etudiant", titre: "« " + x.titre + " » commence le " + jour(x.debut + "T12:00:00"), detail: nb + " étudiant(s) inscrit(s) à prévenir", lien: "#etudiants" });
    });
    if (A.autorise("interventions")) S.demandes().filter(function (d) { return d.datePrevue === demain && d.statut !== "cloture"; }).forEach(function (d) {
      var t = A.tech ? A.tech(d.techId) : null;
      out.push({ niv: "info", ico: "tech", titre: "Intervention demain : " + d.id, detail: (d.entreprise || d.nom) + (t ? " · " + t.nom : " · technicien à assigner"), lien: "#interventions", wa: wa(d.telephone, "Bonjour " + d.nom + ",\nNous vous confirmons l’intervention NextGenIT prévue demain" + (t ? " avec " + t.nom : "") + " (réf. " + d.id + ").\nÀ demain !") });
    });
    if (A.autorise("tickets")) S.liste("tickets").filter(function (t) { return !t.vuParAdmin && ["resolu", "ferme"].indexOf(t.statut) < 0; }).forEach(function (t) {
      out.unshift({ niv: t.priorite === "critique" ? "danger" : "warn", ico: "ticket", titre: "Nouveau ticket " + t.id + " : " + t.sujet, detail: t.clientNom + " · priorité " + t.priorite + (t.description ? " · « " + t.description.slice(0, 80) + (t.description.length > 80 ? "…" : "") + " »" : ""), lien: "#tickets/" + t.id });
    });
    if (A.autorise("tickets")) S.liste("tickets").filter(function (t) { return ["resolu", "ferme"].indexOf(t.statut) < 0 && A.slaRestant && A.slaRestant(t) < 2 * 3600e3; }).forEach(function (t) {
      var r = A.slaRestant(t);
      out.push({ niv: r < 0 ? "danger" : "warn", ico: "ticket", titre: "Ticket " + t.id + (r < 0 ? " : délai dépassé" : " : délai bientôt atteint"), detail: t.clientNom + " · " + t.sujet, lien: "#tickets" });
    });
    if (A.autorise("suivi") || A.autorise("formations")) {
      var qn = S.liste("questions").filter(function (q) { return !q.reponse; }).length;
      if (qn) out.push({ niv: "info", ico: "etudiant", titre: qn + " question(s) d’étudiants sans réponse", detail: "Répondez dans Présences et évaluations → Travaux et questions.", lien: "#suivi" });
      var tp = 0; S.liste("comptes_etudiants").forEach(function (e) { Object.keys(e.rendus || {}).forEach(function (k) { if (e.rendus[k].note == null) tp++; }); });
      var aAut = S.liste("comptes_etudiants").filter(function (e) {
        if (A.attestationAutorisee && A.attestationAutorisee(e)) return false;
        var fo = S.formations().filter(function (x) { return x.id === e.formationId; })[0]; if (!fo || !A.statsEtudiant) return false;
        var st = A.statsEtudiant(e, fo), L = []; (fo.modules || []).forEach(function (m) { (m.lecons || []).forEach(function (l) { L.push(l); }); });
        return st.eligible && (fo.statut === "terminee" || (L.length && L.every(function (l) { return (e.lecons || {})[l.id]; })));
      }).length;
      if (aAut) out.unshift({ niv: "info", ico: "etudiant", titre: aAut + " attestation(s) à autoriser", detail: "Des étudiants ont terminé leur formation : autorisez leur attestation.", lien: "#suivi" });
      var dv = 0; S.liste("comptes_etudiants").forEach(function (e) { Object.keys(e.devoirs || {}).forEach(function (k) { if (e.devoirs[k].note == null) dv++; }); });
      if (dv) out.push({ niv: "info", ico: "doc", titre: dv + " devoir(s) rendu(s) à corriger", detail: "Publications ciblées → 👁 sur le devoir.", lien: "#ressources" });
      if (tp) out.push({ niv: "info", ico: "doc", titre: tp + " travail(aux) pratique(s) à corriger", detail: "Notez et commentez les TP rendus.", lien: "#suivi" });
      var limite = Date.now() - 7 * 864e5;
      S.liste("comptes_etudiants").filter(function (e) { var fo = S.formations().filter(function (x) { return x.id === e.formationId; })[0]; return e.actif && fo && fo.statut === "encours" && new Date(e.derniereActivite || e.derniereConnexion || e.creeLe).getTime() < limite; }).slice(0, 5).forEach(function (e) {
        out.push({ niv: "warn", ico: "etudiant", titre: e.nom + " n’a pas progressé depuis 7 jours", detail: "Relancez l’étudiant pour éviter l’abandon.", lien: "#etudiants", wa: wa(e.telephone, "Bonjour " + e.nom + ",\nNous n’avons pas vu de progression dans votre formation depuis une semaine. Vos cours vous attendent dans l’espace étudiant NextGenIT. Besoin d’aide ? Répondez à ce message.\nNextGenIT Academy") });
      });
    }
    if (A.autorise("etudiants") || A.autorise("comptesclients")) S.liste("demandes_mdp").filter(function (d) { return d.statut === "en_attente"; }).forEach(function (d) {
      out.unshift({ niv: "warn", ico: "alerte", titre: "Mot de passe oublié : " + (d.nom || d.identifiant), detail: (d.type ? (d.type === "etudiant" ? "Étudiant" : "Client") + " · " : "Compte introuvable · ") + d.identifiant + (d.telephone ? " · " + d.telephone : ""), lien: "#notifications/mdp-" + d.id });
    });
    if (A.autorise("stock")) S.liste("articles").filter(function (a) { return Number(a.quantite) <= Number(a.seuil || 0); }).forEach(function (a) { out.push({ niv: "warn", ico: "boite", titre: "Stock bas : " + a.nom, detail: a.quantite + " restant(s), seuil " + a.seuil, lien: "#stock" }); });
    return out;
  }
  A.notifs = notifs;
  A.compterNotifs = function () { try { return notifs().length; } catch (e) { return 0; } };

  function carteNotif(n) {
    return '<div class="notif-item ' + n.niv + '"><span class="ni">' + '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + ICO[n.ico] + '"/></svg></span><div style="min-width:0"><strong>' + esc(n.titre) + '</strong><br><small class="muted">' + esc(n.detail) + '</small></div><div class="hero-actions" style="flex-wrap:nowrap">' + (n.wa ? '<a class="btn btn-whatsapp btn-sm" href="' + n.wa + '" target="_blank" rel="noopener">WhatsApp</a>' : "") + '<a class="btn btn-ghost btn-sm" href="' + n.lien + '">👁 Ouvrir</a></div></div>';
  }

  function traiterMdp(id) {
    var d = S.liste("demandes_mdp").filter(function (x) { return x.id === id; })[0]; if (!d) return;
    var col = d.type === "etudiant" ? "comptes_etudiants" : "comptes_clients", c = d.compteId ? S.liste(col).filter(function (x) { return x.id === d.compteId; })[0] : null;
    if (!c) { if (confirm("Aucun compte ne correspond à « " + d.identifiant + " ». Classer la demande ?")) { S.modifier("demandes_mdp", id, { statut: "classee" }); A.rafraichir(); } return; }
    var mdp = A.motDePasse();
    A.sha256(String(c.identifiant).toLowerCase() + ":" + mdp).then(function (h) {
      S.modifier(col, c.id, d.type === "etudiant" ? { hash: h, doitChanger: true } : { hash: h });
      S.modifier("demandes_mdp", id, { statut: "traitee", traiteeLe: new Date().toISOString(), par: A.moi().nom });
      S.log("Mot de passe réinitialisé (demande)", c.nom);
      var lien = location.href.split("/admin")[0] + "/connexion.html", msg = "Bonjour " + c.nom + ",\nVoici votre nouveau mot de passe NextGenIT :\n👤 " + c.identifiant + "\n🔑 " + mdp + "\n" + lien + "\nPensez à le changer dans « Mon compte ».";
      A.modal({ titre: "Nouveau mot de passe · " + c.nom, annuler: "Terminé", corps: '<div class="row-item block"><small class="muted">Identifiant</small><strong>' + esc(c.identifiant) + '</strong><small class="muted">Mot de passe</small><strong style="font-family:ui-monospace,monospace">' + esc(mdp) + '</strong></div><div class="send-row"><a class="btn btn-whatsapp" target="_blank" rel="noopener" href="https://wa.me/' + String(d.telephone || c.telephone || "").replace(/[^\d]/g, "") + "?text=" + encodeURIComponent(msg) + '">Envoyer sur WhatsApp</a>' + (c.email ? '<a class="btn btn-ghost" href="mailto:' + esc(c.email) + "?subject=" + encodeURIComponent("Votre nouveau mot de passe NextGenIT") + "&body=" + encodeURIComponent(msg) + '">Email</a>' : "") + "</div>" });
      A.rafraichir();
    });
  }
  /* =================== Rappels automatiques du jour =================== */
  function rappels() {
    var out = [], auj = AUJ(), demain = dans(1), E = A.C.entreprise;
    var ajout = function (cle, nom, tel, msg, type) { if (tel) out.push({ cle: cle + ":" + auj, nom: nom, tel: tel, msg: msg, type: type }); };
    S.liste("factures").filter(function (x) { return x.type !== "proforma" && ["emise", "partielle"].indexOf(x.statut) > -1 && x.echeance < auj; }).forEach(function (x) { ajout("fac-" + x.id, x.clientNom, x.telephone, "Bonjour " + (x.contact || x.clientNom) + ",\nPetit rappel : la facture " + x.numero + " (" + argent(A.fin ? A.fin.reste(x) : x.ttc) + ") est arrivée à échéance le " + jour(x.echeance) + ".\nVous pouvez la régler par Mobile Money, carte ou virement, ou déclarer votre paiement dans votre espace client.\nMerci, NextGenIT", "Facture échue"); });
    S.liste("factures").forEach(function (x) { (x.echeancier || []).forEach(function (e, i) { if (["emise", "partielle"].indexOf(x.statut) > -1 && e.date === dans(2)) ajout("ech-" + x.id + i, x.clientNom, x.telephone, "Bonjour,\nRappel : échéance de " + argent(e.montant) + " pour la facture " + x.numero + " le " + jour(e.date) + ".\nNextGenIT", "Échéance dans 2 jours"); }); });
    S.liste("abonnements").filter(function (a) { return a.actif && a.prochaine >= auj && a.prochaine <= dans(7); }).forEach(function (a) { ajout("abo-" + a.id, a.clientNom, a.telephone, "Bonjour,\nVotre « " + a.service + " » arrive à échéance le " + jour(a.prochaine) + ". Pour éviter toute interruption, pensez au renouvellement (" + argent(a.montant) + ").\nNextGenIT – " + E.telephone, "Renouvellement"); });
    S.demandes().filter(function (d) { return d.datePrevue === demain && d.statut !== "cloture"; }).forEach(function (d) {
      var t = A.tech ? A.tech(d.techId) : null;
      ajout("int-c-" + d.id, d.entreprise || d.nom, d.telephone, "Bonjour " + d.nom + ",\nNous vous confirmons l’intervention NextGenIT prévue demain" + (t ? " avec " + t.nom : "") + " (réf. " + d.id + ").\nÀ demain !", "Intervention demain (client)");
      if (t) ajout("int-t-" + d.id, t.nom, t.telephone, "Bonjour " + t.nom + ",\nRappel : intervention " + d.id + " demain chez " + (d.entreprise || d.nom) + (d.adresse ? " (" + d.adresse + ")" : "") + ". Détails dans l’application technicien.", "Intervention demain (technicien)");
    });
    S.formations().forEach(function (f) {
      var seance = (f.seances || []).filter(function (x) { return x.date === demain; })[0], debut = f.debut === demain;
      if (!seance && !debut) return;
      S.liste("comptes_etudiants").filter(function (e) { return e.formationId === f.id && e.actif; }).forEach(function (e) { ajout("sea-" + f.id + "-" + e.id, e.nom, e.telephone, "Bonjour " + e.nom + ",\n" + (debut ? "Votre formation « " + f.titre + " » commence demain !" : "Rappel : séance « " + (seance.titre || f.titre) + " » demain.") + "\nBon apprentissage, NextGenIT Academy", debut ? "Début de formation" : "Séance demain"); });
    });
    return out;
  }
  function envoyes() { try { return JSON.parse(localStorage.getItem("ng_rappels_envoyes") || "{}"); } catch (e) { return {}; } }
  function marquerEnvoye(cles) { var m = envoyes(); cles.forEach(function (c) { m[c] = new Date().toISOString(); }); Object.keys(m).forEach(function (k) { if (k.slice(-10) < dans(-7)) delete m[k]; }); localStorage.setItem("ng_rappels_envoyes", JSON.stringify(m)); }
  A.rappelsDuJour = function () { var m = envoyes(); return rappels().filter(function (r) { return !m[r.cle]; }); };
  /* Envoi automatique par un service externe (WhatsApp Business, SMS) si une adresse est configurée : window.NG_RAPPELS_URL */
  A.envoiAutoRappels = function () {
    if (!window.NG_RAPPELS_URL || localStorage.getItem("nga_rappels_auto") === AUJ()) return;
    var L = A.rappelsDuJour(); localStorage.setItem("nga_rappels_auto", AUJ()); if (!L.length) return;
    fetch(window.NG_RAPPELS_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ expediteur: "NextGenIT", messages: L.map(function (r) { return { telephone: r.tel, nom: r.nom, message: r.msg, type: r.type }; }) }) })
      .then(function (r) { if (!r.ok) throw new Error(r.status); marquerEnvoye(L.map(function (r) { return r.cle; })); S.log("Rappels envoyés automatiquement", L.length + " message(s)"); })
      .catch(function (e) { localStorage.removeItem("nga_rappels_auto"); console.warn("Rappels automatiques : échec", e); });
  };
  function blocRappels() {
    var L = rappels(), m = envoyes(), reste = L.filter(function (r) { return !m[r.cle]; });
    return '<section class="card rappels"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><h2 class="h-card">📤 Rappels du jour <small class="muted">(' + reste.length + " à envoyer sur " + L.length + ")</small></h2>" + (reste.length ? '<button class="btn btn-whatsapp btn-sm" type="button" id="rap-suivant">Envoyer le suivant</button>' : "") + "</div>" +
      (window.NG_RAPPELS_URL ? '<p class="notice" style="margin:0">✔ Envoi automatique actif : les rappels partent chaque jour par votre service d’envoi.</p>' : '<p class="muted" style="font-size:.86rem;margin:0">Préparés automatiquement chaque jour : un clic pour envoyer sur WhatsApp. Pour un envoi sans clic, reliez un service d’envoi (voir README).</p>') +
      (L.length ? '<div class="stack">' + L.map(function (r) { var ok = m[r.cle]; return '<div class="row-item" data-rap="' + esc(r.cle) + '"' + (ok ? ' style="opacity:.55"' : "") + '><span><strong>' + esc(r.nom) + '</strong> <span class="tag tag-muted">' + esc(r.type) + '</span><br><small class="muted">' + esc(r.msg.split("\n").slice(1, 2).join(" ").slice(0, 110)) + "</small></span>" + (ok ? '<span class="tag tag-ok">✔ Envoyé</span>' : '<a class="btn btn-whatsapp btn-sm" target="_blank" rel="noopener" data-rap-wa href="https://wa.me/' + String(r.tel).replace(/[^\d]/g, "") + "?text=" + encodeURIComponent(r.msg) + '">Envoyer</a>') + "</div>"; }).join("") + "</div>" : '<p class="muted">Aucun rappel aujourd’hui.</p>') + "</section>";
  }
  A.VUES.notifications = function () {
    var N = notifs();
    A.vue.innerHTML = blocRappels() + A.entete("Notifications", "Rappels générés automatiquement : factures, échéances, hébergements, formations, interventions, tickets, stock") +
      (N.length ? '<div class="stack">' + N.map(carteNotif).join("") + "</div>" : '<div class="card empty"><h2 class="h-card">Tout est à jour</h2><p>Aucun rappel pour le moment.</p></div>') +
      '<p class="notice mt-3">Envoi automatique sans clic : il nécessite un serveur relié à un service d’emails, de SMS et à l’API WhatsApp Business. En attendant, chaque rappel est prêt et part en un clic.</p>';
    A.lier("[data-rap-wa]", "click", function (e, b) { marquerEnvoye([b.closest("[data-rap]").dataset.rap]); setTimeout(function () { A.rafraichir(); }, 300); });
    var rs = document.getElementById("rap-suivant"); if (rs) rs.addEventListener("click", function () { var a = A.vue.querySelector("[data-rap-wa]"); if (a) a.click(); });
    var hm = location.hash.split("/")[1];
    if (hm && hm.indexOf("mdp-") === 0) { history.replaceState(null, "", "#notifications"); traiterMdp(hm.slice(4)); }
  };


  /* ---------- Bureau d'accueil : demandes, inscriptions, tickets, commandes ---------- */
  function ilya(iso) { var m = Math.round((Date.now() - new Date(iso)) / 60000); return m < 1 ? "à l’instant" : m < 60 ? "il y a " + m + " min" : m < 1440 ? "il y a " + Math.round(m / 60) + " h" : "il y a " + Math.round(m / 1440) + " j"; }
  function accueil() {
    var cartes = [];
    var carte = function (cls, titre, icone, n, items, lien, action, vide) {
      return '<section class="desk-card ' + cls + '"><header><span class="desk-ico">' + '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + ICO[icone] + '"/></svg></span><div><h2>' + titre + '</h2><small>' + (n ? n + " en attente" : "Tout est traité") + '</small></div><strong class="desk-n" data-count="' + n + '">0</strong></header>' +
        (items.length ? '<ul class="desk-list">' + items.map(function (it) { return '<li><a href="' + it.lien + '"><span><strong>' + esc(it.titre) + "</strong><small>" + esc(it.sous) + "</small></span>" + (it.tag || '<span class="desk-go">' + action + " →</span>") + "</a></li>"; }).join("") + "</ul>" : '<p class="desk-vide">' + vide + "</p>") +
        '<a class="desk-all" href="' + lien + '">Tout voir</a></section>';
    };
    if (A.autorise("demandes")) { var D = S.demandes().filter(function (d) { return d.statut === "a_evaluer"; }); cartes.push(carte("c1", "Demandes de devis", "doc", D.length, D.slice(0, 3).map(function (d) { return { titre: d.entreprise || d.nom, sous: (d.services || []).join(", ") + " · " + ilya(d.creeLe), lien: "#demandes/" + d.id }; }), "#demandes", "Évaluer", "Aucune demande en attente.")); }
    if (A.autorise("inscriptions")) { var I = S.liste("inscriptions").filter(function (i) { return i.statut === "en_attente"; }); cartes.push(carte("c2", "Inscriptions", "etudiant", I.length, I.slice(0, 3).map(function (i) { return { titre: i.nom, sous: i.formation + " · " + ilya(i.creeLe), lien: "#inscriptions" }; }), "#inscriptions", "Approuver", "Aucune inscription à approuver.")); }
    if (A.autorise("tickets")) {
      var T = S.liste("tickets").filter(function (t) { return ["resolu", "ferme"].indexOf(t.statut) < 0; }).sort(function (a, b) { return (A.slaRestant ? A.slaRestant(a) - A.slaRestant(b) : 0); });
      cartes.push(carte("c3", "Tickets clients", "ticket", T.length, T.slice(0, 3).map(function (t) { var r = A.slaRestant ? A.slaRestant(t) : 1; return { titre: t.clientNom, sous: t.sujet + " · " + ilya(t.creeLe), lien: "#tickets", tag: '<span class="tag ' + (r < 0 ? "tag-warn" : t.techId ? "tag-ok" : "tag-accent") + '">' + (r < 0 ? "Hors délai" : t.techId ? "Assigné" : "À assigner") + "</span>" }; }), "#tickets", "Ouvrir", "Aucun ticket ouvert."));
    }
    if (A.autorise("commandes")) { var CO = S.liste("commandes").filter(function (c) { return c.statut === "nouvelle"; }); cartes.push(carte("c4", "Commandes boutique", "boite", CO.length, CO.slice(0, 3).map(function (c) { return { titre: c.entreprise || c.nom, sous: c.lignes.map(function (x) { return x.qte + " × " + x.nom; }).join(", ") + " · " + ilya(c.creeLe), lien: "#commandes" }; }), "#commandes", "Traiter", "Aucune nouvelle commande.")); }
    return cartes.length ? '<div class="desk">' + cartes.join("") + "</div>" : "";
  }
  function activite7j() {
    var jours = [];
    for (var i = 6; i >= 0; i--) jours.push(new Date(Date.now() - i * 864e5).toISOString().slice(0, 10));
    var compte = function (l, champ) { return jours.map(function (j) { return l.filter(function (x) { return (x[champ] || "").slice(0, 10) === j; }).length; }); };
    var series = [
      { nom: "Demandes", c: "#1677E0", v: compte(S.demandes(), "creeLe") },
      { nom: "Inscriptions", c: "#7CC243", v: compte(S.liste("inscriptions"), "creeLe") },
      { nom: "Tickets", c: "#F5B547", v: compte(S.liste("tickets"), "creeLe") },
      { nom: "Commandes", c: "#A78BFA", v: compte(S.liste("commandes"), "creeLe") }
    ];
    var max = Math.max.apply(null, jours.map(function (j, k) { return series.reduce(function (a, s) { return a + s.v[k]; }, 0); }).concat([1]));
    return '<div class="g-legende">' + series.map(function (s) { return '<span><i style="background:' + s.c + '"></i>' + s.nom + "</span>"; }).join("") + '</div><div class="stack-bars">' + jours.map(function (j, k) {
      var tot = series.reduce(function (a, s) { return a + s.v[k]; }, 0);
      return '<div class="sb-col" title="' + esc(new Date(j + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) + " : " + series.map(function (s) { return s.v[k] + " " + s.nom.toLowerCase(); }).join(", ")) + '"><span class="sb-n">' + (tot || "") + '</span><div class="sb-pile" style="height:' + (tot / max * 100) + "%;animation-delay:" + k * 0.06 + 's">' + series.map(function (s) { return s.v[k] ? '<i style="flex:' + s.v[k] + ";background:" + s.c + '"></i>' : ""; }).join("") + '</div><small>' + new Date(j + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short" }) + "</small></div>";
    }).join("") + "</div>";
  }

  /* =================== Tableau de bord =================== */
  A.VUES.tableau = function () {
    if (A.envoiAutoRappels) A.envoiAutoRappels();
    if (A.synchroniserClients) A.synchroniserClients();
    var me = A.moi(), L = S.demandes(), mois = A.moisPrecedents(6), F = f();
    var enLigne = A.enLigne();
    var heureJ = new Date().getHours();
    var salut = heureJ < 12 ? "Bonjour" : heureJ < 18 ? "Bon après-midi" : "Bonsoir";
    var kpis = [];
    if (A.autorise("paiements")) {
      var cm = F.encaisse(A.MOIS), cp = F.encaisse(mois[4]);
      kpis.push('<div class="kpi">' + ico("argent") + '<span>Encaissé ce mois</span><strong data-count="' + cm + '" data-format="argent">0</strong><small class="' + (cm >= cp ? "up" : "down") + '">' + (cp ? (cm >= cp ? "▲ " : "▼ ") + Math.abs(Math.round((cm - cp) / cp * 100)) + " % vs mois dernier" : "Premier mois") + (S.reglages().tauxCDF ? " · ≈ " + Math.round(cm * S.reglages().tauxCDF).toLocaleString("fr-FR") + " CDF" : "") + "</small></div>");
    }
    if (A.autorise("factures")) kpis.push('<div class="kpi">' + ico("alerte") + '<span>Impayés</span><strong data-count="' + (A.compterImpayes ? A.compterImpayes() : 0) + '" data-format="argent">0</strong><small>factures émises non soldées</small></div>');
    if (A.autorise("demandes")) kpis.push('<div class="kpi">' + ico("doc") + '<span>Devis à évaluer</span><strong data-count="' + L.filter(function (d) { return d.statut === "a_evaluer"; }).length + '">0</strong><small>' + L.filter(function (d) { return d.statut === "devis_envoye"; }).length + " en attente de réponse</small></div>");
    if (A.autorise("projets")) kpis.push('<div class="kpi">' + ico("projet") + '<span>Projets en cours</span><strong data-count="' + S.liste("projets").filter(function (p) { return p.statut !== "termine"; }).length + '">0</strong><small>' + S.liste("taches").filter(function (t) { return t.statut !== "termine"; }).length + " tâches ouvertes</small></div>");
    if (A.autorise("tickets")) kpis.push('<div class="kpi">' + ico("ticket") + '<span>Tickets ouverts</span><strong data-count="' + S.liste("tickets").filter(function (t) { return ["resolu", "ferme"].indexOf(t.statut) < 0; }).length + '">0</strong><small>helpdesk</small></div>');
    if (A.autorise("etudiants")) kpis.push('<div class="kpi">' + ico("etudiant") + '<span>Étudiants actifs</span><strong data-count="' + S.liste("comptes_etudiants").filter(function (e) { return e.actif; }).length + '">0</strong><small>' + S.formations().filter(function (x) { return x.statut === "encours"; }).length + " formation(s) en cours</small></div>");
    if (A.autorise("techniciens")) { var tk = S.liste("personnel").filter(function (p) { return p.type === "technicien" && p.actif; }); kpis.push('<div class="kpi">' + ico("tech") + '<span>Techniciens disponibles</span><strong data-count="' + tk.filter(function (t) { return t.statut === "Disponible"; }).length + '">0</strong><small>sur ' + tk.length + "</small></div>"); }

    var blocs = [];
    if (A.autorise("paiements") || A.autorise("rapports")) blocs.push('<div class="card w12"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><h2 class="h-card">Encaissements et dépenses</h2><span class="muted" style="font-size:.85rem">6 derniers mois</span></div>' + A.graphLigne(mois.map(function (m) { return A.nomMois(m, true); }), [{ nom: "Encaissements", valeurs: mois.map(F.encaisse), couleur: "#2AA9F0" }, { nom: "Dépenses", valeurs: mois.map(F.depense), couleur: "#F5B547" }]) + "</div>");
    blocs.push('<div class="card w8"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><h2 class="h-card">Activité des 7 derniers jours</h2><span class="muted" style="font-size:.85rem">demandes, inscriptions, tickets, commandes</span></div>' + activite7j() + "</div>");
    blocs.push('<div class="card w4"><div style="display:flex;justify-content:space-between;align-items:center"><h2 class="h-card">Équipe en ligne</h2><span class="tag tag-ok"><span class="live-dot" style="margin-right:6px"></span>' + enLigne.length + "</span></div>" +
      '<div class="stack">' + enLigne.map(function (a) { return '<div class="row-item" style="padding:10px 12px"><span style="display:flex;gap:10px;align-items:center">' + A.avatar(a, 36, true) + "<span><strong>" + esc(a.nom) + (a.id === me.id ? ' <span class="tag tag-accent">vous</span>' : "") + '</strong><br><small class="muted">' + esc((A.roles()[a.role] || {}).nom || "") + " · " + esc(A.nomModule(a.vue)) + "</small></span></span></div>"; }).join("") + "</div>" +
      '<p class="muted" style="font-size:.82rem">Le point vert qui clignote indique une personne connectée en ce moment.</p></div>');
    if (A.autorise("rapports")) {
      var ca = F.caParService();
      blocs.push('<div class="card w6"><h2 class="h-card">Chiffre d’affaires par service</h2><div class="donut-wrap">' + A.graphAnneau(Object.keys(ca).map(function (k, i) { return { label: k, val: Math.round(ca[k]), couleur: COULEURS[i % COULEURS.length] }; }).concat(Object.keys(ca).length ? [] : [{ label: "Pas encore d’encaissement", val: 0, couleur: "var(--line)" }]), "<strong>" + argent(Object.keys(ca).reduce(function (a, k) { return a + ca[k]; }, 0)) + "</strong>au total") + "</div></div>");
    }
    if (A.autorise("pipeline")) {
      var C = S.liste("clients"), etapes = [["lead", "Prospects"], ["devis", "Devis envoyés"], ["negociation", "Négociation"], ["client", "Clients convertis"]];
      var max = Math.max.apply(null, etapes.map(function (e) { return C.filter(function (c) { return c.etape === e[0]; }).length; }).concat([1]));
      blocs.push('<div class="card w6"><h2 class="h-card">Pipeline commercial</h2><div class="funnel">' + etapes.map(function (e, i) { var n = C.filter(function (c) { return c.etape === e[0]; }).length; return '<div class="funnel-row"><span>' + e[1] + '</span><div class="funnel-bar" style="width:' + Math.max(4, n / max * 100) + "%;animation-delay:" + i * 0.1 + 's"></div><strong>' + n + "</strong></div>"; }).join("") + '</div><a href="#pipeline" class="mt-1" style="font-size:.9rem">Ouvrir le pipeline</a></div>');
    }
    if (A.autorise("formations")) {
      var FO = S.formations().filter(function (x) { return x.statut === "encours"; });
      blocs.push('<div class="card w6"><h2 class="h-card">Formations en cours</h2>' + (FO.length ? A.barres(FO.map(function (x) { return { label: x.titre + " · " + S.liste("comptes_etudiants").filter(function (e) { return e.formationId === x.id; }).length + " étudiant(s)", val: x.avancement }; })).replace(/<strong>(\d+)<\/strong>/g, "<strong>$1 %</strong>") : '<p class="muted">Aucune session en cours.</p>') + "</div>");
    }
    if (A.autorise("techniciens") || A.autorise("interventions")) {
      var T = S.liste("personnel").filter(function (p) { return p.type === "technicien" && p.actif; });
      blocs.push('<div class="card w6"><h2 class="h-card">Techniciens sur le terrain</h2><div class="stack">' + T.slice(0, 6).map(function (t) { var d = L.filter(function (x) { return x.techId === t.id && x.etape && x.etape !== "termine" && x.statut !== "cloture"; })[0]; return '<div class="row-item" style="padding:10px 12px"><span style="display:flex;gap:10px;align-items:center">' + A.avatar(t, 34) + "<span><strong>" + esc(t.nom) + '</strong><br><small class="muted">' + (d ? esc(d.id + " · " + (d.entreprise || d.nom)) : esc((t.specialites || []).join(", "))) + "</small></span></span>" + (A.tagTech ? A.tagTech(t.statut) : esc(t.statut)) + "</div>"; }).join("") + "</div></div>");
    }
    /* Satisfaction des clients (avis après tickets et interventions) */
    var AV = S.liste("tickets").filter(function (t) { return t.avis; }).map(function (t) { return { a: t.avis, tech: t.techId, ref: t.id, client: t.clientNom }; })
      .concat(S.demandes().filter(function (d) { return d.avis; }).map(function (d) { return { a: d.avis, tech: d.techId, ref: d.id, client: d.entreprise || d.nom }; }));
    if (A.autorise("tickets") || A.autorise("interventions")) {
      var moyA = AV.length ? AV.reduce(function (x, v) { return x + v.a.note; }, 0) / AV.length : 0, parTech = {};
      AV.forEach(function (v) { if (!v.tech) return; parTech[v.tech] = parTech[v.tech] || []; parTech[v.tech].push(v.a.note); });
      var techs = Object.keys(parTech).map(function (id) { var p = S.liste("personnel").filter(function (x) { return x.id === id; })[0]; var n = parTech[id]; return { nom: p ? p.nom : id, moy: n.reduce(function (a, b) { return a + b; }, 0) / n.length, n: n.length }; }).sort(function (a, b) { return b.moy - a.moy; });
      blocs.push('<div class="card w6"><h2 class="h-card">Satisfaction des clients</h2>' + (AV.length ? '<div class="satis"><strong>' + moyA.toFixed(1).replace(".", ",") + '<small>/5</small></strong><span class="satis-et">' + "★★★★★".slice(0, Math.round(moyA)) + '<i>' + "★★★★★".slice(Math.round(moyA)) + "</i></span><small>" + AV.length + " avis</small></div>" + (techs.length ? techs.slice(0, 4).map(function (t) { return '<div class="row-item" style="padding:8px 12px"><span>' + esc(t.nom) + '</span><span><b style="color:#f5b301">★ ' + t.moy.toFixed(1).replace(".", ",") + "</b> <small class=\"muted\">(" + t.n + ")</small></span></div>"; }).join("") : "") + AV.filter(function (v) { return v.a.commentaire; }).slice(-2).map(function (v) { return '<p class="muted" style="font-size:.88rem;margin:6px 0 0">« ' + esc(v.a.commentaire) + " » — " + esc(v.client) + " (" + v.a.note + "/5)</p>"; }).join("") : '<p class="muted">Les clients notent chaque intervention et chaque ticket résolu depuis leur espace. Les avis apparaîtront ici.</p>') + "</div>");
    }
    /* Objectif du mois, tickets par statut, meilleurs clients, agenda */
    if (A.autorise("paiements")) {
      var obj = Number(S.reglages().objectifMensuel || 5000), fait = F.encaisse(A.MOIS), pc = obj ? Math.min(100, Math.round(fait / obj * 100)) : 0;
      blocs.push('<div class="card w4"><div style="display:flex;justify-content:space-between;align-items:center"><h2 class="h-card">Objectif du mois</h2><button class="ico-btn" type="button" id="obj-edit" title="Modifier l’objectif" aria-label="Modifier l’objectif">✎</button></div><div class="jauge" style="--p:' + pc + '"><div><strong>' + pc + ' %</strong><span>de ' + argent(obj) + "</span></div></div><p class=\"muted\" style=\"text-align:center\">" + argent(fait) + " encaissés · reste " + argent(Math.max(0, obj - fait)) + "</p></div>");
    }
    if (A.autorise("tickets")) {
      var TK = S.liste("tickets"), sts = [["nouveau", "Nouveaux", "#F59E0B"], ["assigne", "Assignés", "#0B4AA2"], ["encours", "En cours", "#06B6D4"], ["resolu", "Résolus", "#16A34A"], ["ferme", "Fermés", "#94A3B8"]];
      blocs.push('<div class="card w4"><h2 class="h-card">Tickets par statut</h2><div class="donut-wrap">' + A.graphAnneau(sts.map(function (x) { return { label: x[1], val: TK.filter(function (t) { return t.statut === x[0]; }).length, couleur: x[2] }; }).filter(function (x) { return x.val; }).concat(TK.length ? [] : [{ label: "Aucun ticket", val: 0, couleur: "var(--line)" }]), "<strong>" + TK.length + "</strong>tickets") + "</div></div>");
    }
    if (A.autorise("factures")) {
      var parClient = {};
      S.liste("paiements").forEach(function (p) { parClient[p.client || "?"] = (parClient[p.client || "?"] || 0) + Number(p.montant); });
      var top = Object.keys(parClient).sort(function (a, b) { return parClient[b] - parClient[a]; }).slice(0, 5);
      blocs.push('<div class="card w4"><h2 class="h-card">Meilleurs clients</h2>' + (top.length ? '<div class="stack">' + top.map(function (c, i) { return '<div class="row-item" style="padding:10px 12px"><span style="display:flex;gap:10px;align-items:center"><span class="rang">' + (i + 1) + "</span>" + esc(c) + "</span><strong>" + argent(parClient[c]) + "</strong></div>"; }).join("") + "</div>" : '<p class="muted">Aucun paiement enregistré pour le moment.</p>') + "</div>");
    }
    var agenda = [], auj0 = new Date().toISOString().slice(0, 10), fin7 = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
    if (A.autorise("interventions")) S.demandes().filter(function (d) { return d.datePrevue && d.datePrevue >= auj0 && d.datePrevue <= fin7 && d.statut !== "cloture"; }).forEach(function (d) { agenda.push({ date: d.datePrevue, txt: "Intervention " + d.id + " · " + (d.entreprise || d.nom), lien: "#interventions", ico: "🛠" }); });
    if (A.autorise("formations")) S.formations().filter(function (x) { return x.debut >= auj0 && x.debut <= fin7; }).forEach(function (x) { agenda.push({ date: x.debut, txt: "Début de « " + x.titre + " »", lien: "#formations", ico: "🎓" }); });
    if (A.autorise("factures")) S.liste("factures").filter(function (x) { return ["emise", "partielle"].indexOf(x.statut) > -1 && x.echeance >= auj0 && x.echeance <= fin7; }).forEach(function (x) { agenda.push({ date: x.echeance, txt: "Échéance " + x.numero + " · " + x.clientNom, lien: "#factures/" + x.id, ico: "💳" }); });
    if (A.autorise("projets")) S.liste("projets").filter(function (x) { return x.statut !== "termine" && x.fin >= auj0 && x.fin <= fin7; }).forEach(function (x) { agenda.push({ date: x.fin, txt: "Livraison du projet « " + x.nom + " »", lien: "#projets", ico: "📦" }); });
    agenda.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    blocs.push('<div class="card w6"><h2 class="h-card">Agenda des 7 prochains jours</h2>' + (agenda.length ? '<ul class="agenda">' + agenda.slice(0, 8).map(function (x) { var d = new Date(x.date + "T12:00:00"); return '<li><span class="ag-date"><b>' + d.getDate() + "</b>" + d.toLocaleDateString("fr-FR", { month: "short" }) + '</span><span class="ag-ico" aria-hidden="true">' + x.ico + '</span><a href="' + x.lien + '">' + esc(x.txt) + "</a></li>"; }).join("") + "</ul>" : '<p class="muted">Rien de prévu cette semaine.</p>') + "</div>");
    var N = notifs();
    blocs.push('<div class="card w6"><div style="display:flex;justify-content:space-between;align-items:center"><h2 class="h-card">À traiter</h2><a href="#notifications" style="font-size:.9rem">Tout voir (' + N.length + ")</a></div>" + (N.length ? '<div class="stack">' + N.slice(0, 4).map(carteNotif).join("") + "</div>" : '<p class="muted">Rien à traiter. Bravo !</p>') + "</div>");
    if (A.autorise("journal")) blocs.push('<div class="card w12"><h2 class="h-card">Dernières actions de l’équipe</h2><div class="table-wrap"><table class="t"><tbody>' + S.journal().slice(0, 6).map(function (j) { return '<tr><td style="white-space:nowrap" class="muted">' + A.heure(j.quand) + "</td><td>" + esc(j.qui) + "</td><td><strong>" + esc(j.action) + "</strong></td><td>" + esc(j.detail) + '</td><td class="r">' + (j.montant == null ? "" : argent(j.montant)) + "</td></tr>"; }).join("") + "</tbody></table></div></div>");

    var nbAttente = S.demandes().filter(function (d) { return d.statut === "a_evaluer"; }).length + S.liste("inscriptions").filter(function (x) { return x.statut === "en_attente"; }).length + S.liste("tickets").filter(function (t) { return t.statut === "nouveau"; }).length;
    A.vue.innerHTML = '<section class="bienvenue">' + A.avatar(me, 72, true) + '<div style="flex:1;min-width:240px"><div class="date">' + new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) + "</div><h1>" + salut + ", " + esc(me.nom) + ' 👋</h1><p>Vue générale des demandes, clients, interventions, finances et formations · <span style="display:inline-flex;align-items:center;gap:6px"><span class="live-dot"></span>vous êtes en ligne</span></p><div class="actions">' +
      '<a class="btn btn-verre" href="#notifications">' + (nbAttente ? "⏳ " + nbAttente + " élément(s) à traiter" : "✔ Rien en attente") + "</a>" + (A.autorise("demandes") ? '<a class="btn btn-blanc" href="#demandes">＋ Traiter les demandes</a>' : "") + (A.autorise("tickets") ? '<a class="btn btn-verre" href="#tickets">Helpdesk</a>' : "") + "</div></div></section>" +
      accueil() + '<div class="kpis">' + kpis.join("") + '</div><div class="dash">' + blocs.join("") + "</div>";
    var oe = document.getElementById("obj-edit");
    if (oe) oe.addEventListener("click", function () { var v = prompt("Objectif d’encaissement du mois ($) :", S.reglages().objectifMensuel || 5000); if (v === null) return; var R = S.reglages(); R.objectifMensuel = Math.max(0, Number(String(v).replace(/[^\d.]/g, "")) || 0); S.enregistrerReglages(R); S.log("Objectif du mois modifié", argent(R.objectifMensuel)); A.rafraichir(); });
  };

  /* =================== Rapports financiers =================== */
  A.VUES.rapports = function () {
    var F = f(), mois12 = A.moisPrecedents(12);
    var ca = F.caParService(), caM = F.caParService(A.MOIS);
    var charges = {};
    S.liste("sorties").filter(function (s) { return s.statut === "paye" && A.moisDe(s.payeLe || s.creeLe) === A.MOIS; }).forEach(function (s) { charges[s.categorie] = (charges[s.categorie] || 0) + Number(s.montant); });
    var impayes = {};
    S.liste("factures").filter(function (x) { return x.type !== "proforma" && ["emise", "partielle"].indexOf(x.statut) > -1; }).forEach(function (x) { impayes[x.clientNom] = (impayes[x.clientNom] || 0) + (A.fin ? A.fin.reste(x) : x.ttc); });
    var enc = F.encaisse(A.MOIS), dep = F.depense(A.MOIS);
    A.vue.innerHTML = A.entete("Rapports financiers", "Chiffre d’affaires par activité, impayés, charges et résultat · " + A.nomMois(A.MOIS), '<button class="btn btn-ghost" type="button" data-x="demandes">Demandes en PDF</button><button class="btn btn-ghost" type="button" data-x="journal">Historique en PDF</button>') +
      '<div class="kpis"><div class="kpi"><span>Encaissé ce mois</span><strong data-count="' + enc + '" data-format="argent">0</strong></div><div class="kpi"><span>Charges payées</span><strong data-count="' + dep + '" data-format="argent">0</strong></div><div class="kpi"><span>Résultat</span><strong class="' + (enc - dep >= 0 ? "up" : "down") + '" data-count="' + (enc - dep) + '" data-format="argent">0</strong></div><div class="kpi"><span>Impayés</span><strong data-count="' + (A.compterImpayes ? A.compterImpayes() : 0) + '" data-format="argent">0</strong></div></div>' +
      '<div class="dash"><div class="card w12"><h2 class="h-card">Résultat sur 12 mois</h2>' + A.graphLigne(mois12.map(function (m) { return A.nomMois(m, true); }), [{ nom: "Encaissements", valeurs: mois12.map(F.encaisse), couleur: "#2AA9F0" }, { nom: "Dépenses", valeurs: mois12.map(F.depense), couleur: "#F5B547" }, { nom: "Résultat", valeurs: mois12.map(function (m) { return Math.max(0, F.encaisse(m) - F.depense(m)); }), couleur: "#7CC243" }], 240) + "</div>" +
      '<div class="card w6"><h2 class="h-card">Chiffre d’affaires par activité (cumul)</h2>' + (Object.keys(ca).length ? A.barres(Object.keys(ca).sort(function (a, b) { return ca[b] - ca[a]; }).map(function (k, i) { return { label: k, val: ca[k], couleur: COULEURS[i % COULEURS.length] }; }), "argent") : '<p class="muted">Pas encore d’encaissement.</p>') + "</div>" +
      '<div class="card w6"><h2 class="h-card">Ce mois-ci par activité</h2>' + (Object.keys(caM).length ? A.barres(Object.keys(caM).map(function (k, i) { return { label: k, val: caM[k], couleur: COULEURS[i % COULEURS.length] }; }), "argent") : '<p class="muted">Rien ce mois-ci.</p>') + "</div>" +
      '<div class="card w6"><h2 class="h-card">Charges du mois</h2>' + (Object.keys(charges).length ? A.barres(Object.keys(charges).map(function (k) { return { label: k, val: charges[k], couleur: "#F5B547" }; }), "argent") : '<p class="muted">Aucune charge payée.</p>') + "</div>" +
      '<div class="card w6"><h2 class="h-card">Impayés par client</h2>' + (Object.keys(impayes).length ? A.barres(Object.keys(impayes).map(function (k) { return { label: k, val: impayes[k], couleur: "#F87171" }; }), "argent") : '<p class="muted">Aucun impayé.</p>') + "</div>" +
      '<div class="card w12"><h2 class="h-card">Visiteurs du site</h2><p>Pour suivre les visiteurs (pages vues, villes, téléphones ou ordinateurs), ajoutez un outil de statistiques comme Plausible ou Google Analytics : son code se colle dans les pages du site public.</p></div></div>';
    A.lier("[data-x]", "click", function (e, b) {
      if (b.dataset.x === "demandes") A.csv("demandes", [["Numéro", "Date", "Client", "Téléphone", "Services", "Statut"]].concat(S.demandes().map(function (d) { return [d.id, jour(d.creeLe), d.entreprise || d.nom, d.telephone, (d.services || []).join(", "), d.statut]; })));
      else A.csv("historique", [["Date", "Qui", "Action", "Détail", "Montant"]].concat(S.journal().map(function (j) { return [A.heure(j.quand), j.qui, j.action, j.detail, j.montant == null ? "" : Number(j.montant).toFixed(2)]; })));
    });
  };

  /* =================== Historique =================== */
  var rech = "";
  A.VUES.journal = function () {
    var tout = S.journal();
    var J = tout.map(function (j, i) { return Object.assign({ _i: i }, j); }).filter(function (j) { return !rech || (j.action + " " + j.detail + " " + j.qui).toLowerCase().indexOf(rech.toLowerCase()) > -1; });
    var sup = A.moi().role === "super";
    A.vue.innerHTML = A.entete("Historique et traçabilité", "Chaque action est enregistrée : qui, quoi, quand, montant." + (sup ? " En tant que Super admin, vous pouvez ajouter une note, modifier ou supprimer une ligne." : ""), '<button class="btn btn-primary" type="button" id="j-add">＋ Ajouter une note</button><button class="btn btn-ghost" type="button" id="j-csv">Exporter en PDF</button>' + (sup ? '<button class="btn btn-ghost danger-link" type="button" id="j-vider">🗑 Supprimer les lignes affichées</button>' : "")) +
      '<div class="card"><div class="toolbar"><input type="search" id="j-rech" value="' + esc(rech) + '" placeholder="Nom, action, numéro…"><span class="muted" style="font-size:.88rem">' + J.length + " ligne(s)</span></div><div class=\"table-wrap\"><table class=\"t\"><thead><tr><th>Date et heure</th><th>Qui</th><th>Action</th><th>Détail</th><th class=\"r\">Montant</th>" + (sup ? "<th></th>" : "") + "</tr></thead><tbody>" +
      (J.slice(0, 400).map(function (j) { return '<tr data-j="' + j._i + '"><td style="white-space:nowrap">' + A.heure(j.quand) + "</td><td>" + esc(j.qui) + "</td><td><strong>" + esc(j.action) + "</strong></td><td>" + esc(j.detail) + '</td><td class="r">' + (j.montant == null ? "" : argent(j.montant)) + "</td>" + (sup ? '<td class="r"><span class="actions-ligne"><button class="ico-btn" type="button" data-j-edit title="Modifier" aria-label="Modifier la ligne">✎</button><button class="ico-btn danger" type="button" data-j-suppr title="Supprimer" aria-label="Supprimer la ligne">🗑</button></span></td>' : "") + "</tr>"; }).join("") || '<tr><td colspan="6" class="muted">Aucune action.</td></tr>') + "</tbody></table></div></div>";
    var r = document.getElementById("j-rech");
    r.addEventListener("input", function () { rech = r.value; clearTimeout(r._t); r._t = setTimeout(function () { A.VUES.journal(); var n = document.getElementById("j-rech"); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 250); });
    document.getElementById("j-csv").addEventListener("click", function () { A.csv("historique", [["Date", "Qui", "Action", "Détail", "Montant"]].concat(S.journal().map(function (j) { return [A.heure(j.quand), j.qui, j.action, j.detail, j.montant == null ? "" : Number(j.montant).toFixed(2)]; }))); });
    function enregistrer(L) { S.enregistrerListe("journal", L); }
    function formLigne(j, idx) {
      A.modal({ titre: j ? "Modifier la ligne" : "Ajouter une note à l’historique", valider: "Enregistrer",
        corps: '<div class="form-grid"><label class="field">Action<input name="a" required value="' + esc(j ? j.action : "Note") + '"></label><label class="field">Montant ($, facultatif)<input name="m" type="number" step="0.01" value="' + (j && j.montant != null ? j.montant : "") + '"></label><label class="field full">Détail<textarea name="d" style="min-height:90px">' + esc(j ? j.detail : "") + "</textarea></label></div>",
        onSubmit: function (f) {
          if (!f.a.value.trim()) { A.toast("Action obligatoire", "warn"); return false; }
          var L = S.journal(), m = f.m.value === "" ? null : Number(f.m.value);
          if (j) { L[idx] = Object.assign({}, L[idx], { action: f.a.value.trim(), detail: f.d.value.trim(), montant: m, modifiePar: A.moi().nom }); enregistrer(L); }
          else { S.log(f.a.value.trim(), f.d.value.trim(), m); }
          A.toast("Historique mis à jour", "ok"); A.rafraichir();
        } });
    }
    document.getElementById("j-add").addEventListener("click", function () { formLigne(null); });
    A.lier("[data-j-edit]", "click", function (e, b) { var idx = Number(b.closest("[data-j]").dataset.j); formLigne(S.journal()[idx], idx); });
    A.lier("[data-j-suppr]", "click", function (e, b) { var idx = Number(b.closest("[data-j]").dataset.j), L = S.journal(); if (!confirm("Supprimer la ligne « " + L[idx].action + " » ?")) return; L.splice(idx, 1); enregistrer(L); A.toast("Ligne supprimée", "ok"); A.rafraichir(); });
    var v = document.getElementById("j-vider");
    if (v) v.addEventListener("click", function () {
      if (!J.length || !confirm("Supprimer les " + J.length + " ligne(s) affichées" + (rech ? " (filtre « " + rech + " »)" : "") + " ? Cette action est définitive.")) return;
      var retirer = {}; J.forEach(function (j) { retirer[j._i] = 1; });
      enregistrer(S.journal().filter(function (x, i) { return !retirer[i]; }));
      S.log("Historique nettoyé", J.length + " ligne(s) supprimée(s)" + (rech ? " · filtre « " + rech + " »" : ""));
      rech = ""; A.rafraichir();
    });
  };
})();
