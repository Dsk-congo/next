/* Administration – Commercial : répertoire clients (CRM) et pipeline */
(function () {
  var A = window.NGA, S = A.S, esc = A.esc, argent = A.argent, jour = A.jour;
  var TYPES = ["Entreprise", "Particulier", "École / partenaire", "Administration", "ONG"];
  var ETAPES = [["lead", "Prospects"], ["devis", "Devis envoyé"], ["negociation", "Négociation"], ["client", "Client converti"], ["perdu", "Perdu"]];
  function norm(t) { return String(t || "").replace(/[^\d]/g, ""); }

  /* Crée ou relie automatiquement les clients à partir des demandes reçues */
  function synchroniser() {
    var C = S.liste("clients"), change = false;
    S.demandes().forEach(function (d) {
      var c = C.filter(function (x) { return (d.clientId && x.id === d.clientId) || (norm(x.telephone) && norm(x.telephone) === norm(d.telephone)) || x.nom.toLowerCase() === String(d.entreprise || d.nom).toLowerCase(); })[0];
      var etape = d.statut === "a_evaluer" ? "lead" : d.statut === "devis_envoye" ? "devis" : ["accepte", "paye", "cloture"].indexOf(d.statut) > -1 ? "client" : null;
      if (!c) {
        c = { id: "CL-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 4).toUpperCase(), nom: d.entreprise || d.nom, type: d.entreprise ? "Entreprise" : "Particulier", contact: d.nom, telephone: d.telephone, email: d.email, adresse: d.adresse, etape: etape || "lead", source: "Site web", notes: "", creeLe: d.creeLe };
        C.unshift(c); change = true;
      } else if (etape) {
        var ordre = ["lead", "devis", "negociation", "client"];
        if (c.etape !== "perdu" && ordre.indexOf(etape) > ordre.indexOf(c.etape)) { c.etape = etape; change = true; }
      }
      if (d.clientId !== c.id) S.majDemande(d.id, { clientId: c.id });
    });
    S.liste("comptes_clients").filter(function (k) { return !k.demo; }).forEach(function (k) {
      if (!C.some(function (x) { return (norm(x.telephone) && norm(x.telephone) === norm(k.telephone)) || (k.email && String(x.email || "").toLowerCase() === k.email); })) { C.unshift({ id: "CL-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 4).toUpperCase(), nom: k.entreprise || k.nom, type: k.entreprise ? "Entreprise" : "Particulier", contact: k.nom, telephone: k.telephone, email: k.email, adresse: "", etape: "lead", source: "Compte créé sur le site", notes: "", creeLe: k.creeLe }); change = true; }
    });
    if (change) S.enregistrerListe("clients", C);
    return C;
  }
  A.synchroniserClients = synchroniser;
  function historique(c) {
    var lie = function (x) { return x.clientId === c.id || (norm(x.telephone) && norm(x.telephone) === norm(c.telephone)) || String(x.clientNom || x.entreprise || x.nom || "").toLowerCase() === c.nom.toLowerCase(); };
    var D = S.demandes().filter(lie), F = S.liste("factures").filter(lie), T = S.liste("tickets").filter(lie), AB = S.liste("abonnements").filter(lie), PR = S.liste("projets").filter(lie);
    var paye = F.reduce(function (a, f) { return a + (A.fin ? A.fin.paye(f) : 0); }, 0);
    var du = F.filter(function (f) { return f.type !== "proforma" && f.statut !== "annulee"; }).reduce(function (a, f) { return a + (A.fin ? A.fin.reste(f) : 0); }, 0);
    return { D: D, F: F, T: T, AB: AB, PR: PR, paye: paye, du: du };
  }

  /* =================== Répertoire clients =================== */
  var filtreType = "", rech = "";
  A.VUES.clients = function () {
    var C = synchroniser().filter(function (c) { return (!filtreType || c.type === filtreType) && (!rech || (c.nom + " " + (c.contact || "") + " " + (c.telephone || "") + " " + (c.email || "")).toLowerCase().indexOf(rech.toLowerCase()) > -1); });
    var tous = S.liste("clients");
    A.vue.innerHTML = A.entete("Clients (CRM)", "Répertoire unifié : entreprises, particuliers, écoles et partenaires, avec tout leur historique", '<button class="btn btn-primary" type="button" id="cl-new">+ Nouveau client</button>') +
      '<div class="kpis">' + TYPES.map(function (t) { return '<div class="kpi"><span>' + t + '</span><strong data-count="' + tous.filter(function (c) { return c.type === t; }).length + '">0</strong></div>'; }).join("") + "</div>" +
      '<div class="card"><div class="toolbar"><input type="search" id="cl-rech" placeholder="Nom, téléphone, email…" value="' + esc(rech) + '"><select id="cl-type"><option value="">Tous les types</option>' + A.options(TYPES, filtreType) + '</select><button class="btn btn-ghost btn-sm" type="button" id="cl-csv">Exporter en PDF</button></div>' +
      '<div class="table-wrap"><table class="t" style="min-width:900px"><thead><tr><th>Client</th><th>Type</th><th>Contact</th><th>Étape</th><th class="r">Payé</th><th class="r">Reste dû</th><th></th></tr></thead><tbody>' +
      (C.map(function (c) { var h = historique(c), e = ETAPES.filter(function (x) { return x[0] === c.etape; })[0] || ETAPES[0]; return '<tr data-cl="' + c.id + '"><td><strong>' + esc(c.nom) + '</strong><br><small class="muted">' + esc(c.adresse || "") + "</small></td><td>" + esc(c.type) + "</td><td>" + esc(c.contact || "") + '<br><small class="muted">' + esc(c.telephone || "") + "</small></td><td><span class=\"tag " + (c.etape === "client" ? "tag-ok" : c.etape === "perdu" ? "tag-muted" : "tag-accent") + '">' + e[1] + '</span></td><td class="r">' + argent(h.paye) + '</td><td class="r ' + (h.du > 0 ? "down" : "") + '">' + argent(h.du) + '</td><td class="r"><button class="btn btn-ghost btn-sm" type="button" data-cl-open>Fiche</button></td></tr>'; }).join("") || '<tr><td colspan="7" class="muted">Aucun client.</td></tr>') + "</tbody></table></div></div>";
    var r = document.getElementById("cl-rech");
    r.addEventListener("input", function () { rech = r.value; clearTimeout(r._t); r._t = setTimeout(function () { A.VUES.clients(); var n = document.getElementById("cl-rech"); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 250); });
    document.getElementById("cl-type").addEventListener("change", function (e) { filtreType = e.target.value; A.rafraichir(); });
    document.getElementById("cl-new").addEventListener("click", function () { formClient(null); });
    document.getElementById("cl-csv").addEventListener("click", function () { A.csv("clients", [["Nom", "Type", "Contact", "Téléphone", "Email", "Adresse", "Étape", "Payé", "Reste dû"]].concat(S.liste("clients").map(function (c) { var h = historique(c); return [c.nom, c.type, c.contact, c.telephone, c.email, c.adresse, c.etape, h.paye.toFixed(2), h.du.toFixed(2)]; }))); });
    A.lier("[data-cl-open]", "click", function (e, b) { fiche(S.liste("clients").filter(function (c) { return c.id === b.closest("[data-cl]").dataset.cl; })[0]); });
  };
  function formClient(c, etape) {
    var n = !c;
    c = c || { nom: "", type: "Entreprise", contact: "", telephone: "", email: "", adresse: "", etape: etape || "lead", source: "Recommandation", valeur: 0, notes: "" };
    A.modal({
      titre: n ? "Nouveau client" : "Modifier " + c.nom, valider: "Enregistrer", large: true,
      corps: '<div class="form-grid"><label class="field">Nom ou raison sociale<input name="nom" required value="' + esc(c.nom) + '"></label><label class="field">Type<select name="type">' + A.options(TYPES, c.type) + '</select></label><label class="field">Personne de contact<input name="contact" value="' + esc(c.contact || "") + '"></label><label class="field">Téléphone / WhatsApp<input name="tel" type="tel" value="' + esc(c.telephone || "") + '"></label><label class="field">Email<input name="email" type="email" value="' + esc(c.email || "") + '"></label><label class="field">Adresse<input name="adresse" value="' + esc(c.adresse || "") + '"></label><label class="field">Étape commerciale<select name="etape">' + A.options(ETAPES, c.etape) + '</select></label><label class="field">Source<select name="source">' + A.options(["Site web", "Recommandation", "Prospection", "Salon / événement", "Réseaux sociaux", "Appel entrant"], c.source) + '</select></label><label class="field">Valeur estimée ($)<input name="valeur" type="number" min="0" value="' + esc(c.valeur || 0) + '"></label><label class="field full">Notes<textarea name="notes" style="min-height:80px">' + esc(c.notes || "") + "</textarea></label></div>",
      onSubmit: function (f) {
        var data = { nom: f.nom.value.trim(), type: f.type.value, contact: f.contact.value.trim(), telephone: f.tel.value.trim(), email: f.email.value.trim(), adresse: f.adresse.value.trim(), etape: f.etape.value, source: f.source.value, valeur: Number(f.valeur.value) || 0, notes: f.notes.value.trim() };
        if (!data.nom) { A.toast("Nom obligatoire", "warn"); return false; }
        if (n) { S.ajouter("clients", data, "CL-"); S.log("Client créé", data.nom); } else { S.modifier("clients", c.id, data); S.log("Client modifié", data.nom); }
        A.rafraichir(); A.toast("Enregistré", "ok");
      }
    });
  }
  function fiche(c) {
    var h = historique(c);
    var ligne = function (g, d, t) { return '<div class="row-item" style="padding:10px 12px"><span>' + g + "</span><span>" + d + "</span>" + (t || "") + "</div>"; };
    A.modal({
      titre: c.nom, large: true, annuler: "Fermer",
      corps: '<div class="stat-line" style="display:flex;gap:8px;flex-wrap:wrap"><span class="tag tag-accent">' + esc(c.type) + '</span><span class="tag tag-muted">Client depuis ' + jour(c.creeLe) + '</span><span class="tag tag-ok">Payé ' + argent(h.paye) + "</span>" + (h.du > 0 ? '<span class="tag tag-warn">Reste dû ' + argent(h.du) + "</span>" : "") + "</div>" +
        '<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr))"><div class="row-item block"><small class="muted">Contact</small><strong>' + esc(c.contact || "—") + "</strong><span>" + esc(c.telephone || "") + "</span><span>" + esc(c.email || "") + '</span></div><div class="row-item block"><small class="muted">Adresse</small><span>' + esc(c.adresse || "—") + '</span></div><div class="row-item block"><small class="muted">Notes</small><span>' + esc(c.notes || "—") + "</span></div></div>" +
        "<div><strong>Demandes et devis (" + h.D.length + ")</strong>" + h.D.map(function (d) { return ligne(d.id + " · " + esc((d.services || []).join(", ")), jour(d.creeLe), '<a href="#demandes/' + d.id + '" data-close>Ouvrir</a>'); }).join("") + "</div>" +
        "<div><strong>Factures (" + h.F.length + ")</strong>" + h.F.map(function (x) { return ligne(esc(x.numero) + " · " + esc(x.objet), argent(x.ttc) + " · " + ({ payee: "payée", partielle: "partielle", emise: "à payer", annulee: "annulée", proforma: "pro-forma" }[x.statut] || ""), '<a href="#factures/' + x.id + '" data-close>Ouvrir</a>'); }).join("") + "</div>" +
        (h.AB.length ? "<div><strong>Abonnements</strong>" + h.AB.map(function (a) { return ligne(esc(a.service), "prochaine échéance " + jour(a.prochaine)); }).join("") + "</div>" : "") +
        (h.PR.length ? "<div><strong>Projets</strong>" + h.PR.map(function (p) { return ligne(esc(p.nom), esc(p.statut)); }).join("") + "</div>" : "") +
        (h.T.length ? "<div><strong>Tickets</strong>" + h.T.map(function (t) { return ligne(t.id + " · " + esc(t.sujet), esc(t.statut)); }).join("") + "</div>" : "") +
        '<div class="send-row">' + (c.telephone ? '<a class="btn btn-whatsapp" href="https://wa.me/' + c.telephone.replace(/[^\d]/g, "") + '" target="_blank" rel="noopener">WhatsApp</a><a class="btn btn-ghost" href="tel:' + esc(c.telephone.replace(/\s/g, "")) + '">Appeler</a>' : "") + (c.email ? '<a class="btn btn-ghost" href="mailto:' + esc(c.email) + '">Email</a>' : "") + '<button class="btn btn-ghost" type="button" id="cl-devis">Nouveau devis</button><button class="btn btn-ghost" type="button" id="cl-edit">Modifier</button></div>',
      apres: function (form) {
        form.querySelector("#cl-edit").addEventListener("click", function () { formClient(c); });
        form.querySelector("#cl-devis").addEventListener("click", function () {
          var d = S.ajouterDemande({ type: "service", services: ["À préciser"], description: "Devis créé depuis la fiche client.", nom: c.contact || c.nom, entreprise: c.type === "Particulier" ? "" : c.nom, telephone: c.telephone || "", email: c.email || "", adresse: c.adresse || "", canaux: ["WhatsApp"], clientId: c.id });
          S.log("Devis créé depuis le CRM", d.id + " · " + c.nom); A.fermer(); location.hash = "#demandes/" + d.id;
        });
      }
    });
  }

  /* =================== Pipeline commercial (glisser-déposer) =================== */
  A.VUES.pipeline = function () {
    var C = synchroniser();
    A.vue.innerHTML = A.entete("Pipeline commercial", "Glissez une carte d’une colonne à l’autre : prospect → devis envoyé → négociation → client converti", '<button class="btn btn-primary" type="button" id="pl-new">+ Nouveau prospect</button>') +
      '<div class="kpis"><div class="kpi"><span>Valeur en négociation</span><strong data-count="' + C.filter(function (c) { return c.etape === "negociation" || c.etape === "devis"; }).reduce(function (a, c) { return a + Number(c.valeur || 0); }, 0) + '" data-format="argent">0</strong></div><div class="kpi"><span>Taux de conversion</span><strong data-count="' + (C.length ? Math.round(C.filter(function (c) { return c.etape === "client"; }).length / C.length * 100) : 0) + '" data-format="pc">0</strong></div></div>' +
      '<div class="kanban" id="pipeline">' + ETAPES.map(function (e) {
        var items = C.filter(function (c) { return c.etape === e[0]; });
        return '<section class="kcol" data-col="' + e[0] + '"><h2>' + e[1] + " <span>" + items.length + "</span></h2>" + items.map(function (c) {
          return '<article class="kcard" draggable="true" data-id="' + c.id + '"><strong>' + esc(c.nom) + '</strong><span class="muted" style="font-size:.85rem">' + esc(c.contact || "") + " · " + esc(c.type) + '</span><div class="foot"><span>' + (c.valeur ? argent(c.valeur) : esc(c.source || "")) + '</span><select class="inline-select" data-move aria-label="Déplacer ' + esc(c.nom) + '" style="width:auto;min-height:32px;padding:2px 6px;font-size:.8rem">' + A.options(ETAPES, c.etape) + "</select></div></article>";
        }).join("") + "</section>";
      }).join("") + "</div>";
    document.getElementById("pl-new").addEventListener("click", function () { formClient(null, "lead"); });
    activerGlisser(document.getElementById("pipeline"), function (id, col) {
      var c = S.modifier("clients", id, { etape: col });
      S.log("Pipeline", c.nom + " → " + ETAPES.filter(function (x) { return x[0] === col; })[0][1]);
      A.rafraichir();
    });
    A.lier("[data-move]", "change", function (e, s) { var id = s.closest("[data-id]").dataset.id; var c = S.modifier("clients", id, { etape: s.value }); S.log("Pipeline", c.nom + " → " + s.options[s.selectedIndex].text); A.rafraichir(); });
    A.lier(".kcard", "dblclick", function (e, el) { fiche(S.liste("clients").filter(function (c) { return c.id === el.dataset.id; })[0]); });
  };


  /* =================== Commandes de la boutique =================== */
  var LIBC = { nouvelle: ["Nouvelle", "tag-warn"], devis: ["Devis en cours", "tag-accent"], payee: ["Payée", "tag-ok"], livree: ["Livrée", "tag-ok"], annulee: ["Annulée", "tag-muted"] };
  var filtreC = "nouvelle";
  A.VUES.commandes = function () {
    var L = S.liste("commandes"), AR = S.liste("articles");
    var liste = L.filter(function (c) { return filtreC === "tous" || c.statut === filtreC; });
    A.vue.innerHTML = A.entete("Commandes de la boutique", "Équipements commandés par les clients sur le site : préparez le devis, encaissez, livrez (le stock se met à jour)", '<a class="btn btn-ghost" href="boutique.html" target="_blank" rel="noopener">Voir la boutique</a><a class="btn btn-ghost" href="#stock">Gérer les produits</a>') +
      '<div class="kpis"><div class="kpi"><span>Nouvelles commandes</span><strong style="color:var(--warn)" data-count="' + L.filter(function (c) { return c.statut === "nouvelle"; }).length + '">0</strong></div><div class="kpi"><span>Devis en cours</span><strong data-count="' + L.filter(function (c) { return c.statut === "devis"; }).length + '">0</strong></div><div class="kpi"><span>Livrées ce mois</span><strong data-count="' + L.filter(function (c) { return c.statut === "livree" && A.moisDe(c.livreeLe) === A.MOIS; }).length + '">0</strong></div><div class="kpi"><span>Produits en boutique</span><strong data-count="' + AR.filter(function (a) { return a.boutique; }).length + '">0</strong></div></div>' +
      '<div class="tabs" role="tablist">' + [["nouvelle", "Nouvelles"], ["devis", "Devis en cours"], ["payee", "Payées"], ["livree", "Livrées"], ["tous", "Toutes"]].map(function (o) { return '<button class="tab" type="button" role="tab" data-fc="' + o[0] + '" aria-selected="' + (filtreC === o[0]) + '">' + o[1] + " (" + (o[0] === "tous" ? L.length : L.filter(function (c) { return c.statut === o[0]; }).length) + ")</button>"; }).join("") + "</div>" +
      (liste.length ? '<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(min(100%,360px),1fr))">' + liste.map(function (c) {
        var l = LIBC[c.statut] || LIBC.nouvelle;
        return '<article class="card" data-c="' + c.id + '"><div style="display:flex;justify-content:space-between;gap:10px"><small class="muted">' + c.id + " · " + A.heure(c.creeLe) + '</small><span class="tag ' + l[1] + '">' + l[0] + '</span></div><h2 class="h-card">' + esc(c.entreprise || c.nom) + '</h2><p>' + esc(c.telephone) + (c.email ? " · " + esc(c.email) : "") + (c.adresse ? "<br>" + esc(c.adresse) : "") + '</p><div class="stack" style="gap:6px">' + c.lignes.map(function (x) { var a = AR.filter(function (y) { return y.id === x.articleId; })[0]; return '<div class="row-item" style="padding:9px 12px"><span>' + x.qte + " × " + esc(x.nom) + '</span><small class="muted">' + (a ? "stock " + a.quantite : "") + "</small></div>"; }).join("") + "</div>" + (c.message ? '<p class="notice neutral">' + esc(c.message) + "</p>" : "") +
          '<div class="foot"><span class="hero-actions">' + (c.statut === "nouvelle" ? '<button class="btn btn-primary btn-sm" type="button" data-c-devis>Préparer le devis</button>' : "") + (c.demandeId ? '<a class="btn btn-ghost btn-sm" href="#demandes/' + c.demandeId + '">Ouvrir le devis</a>' : "") + (c.statut === "devis" || c.statut === "payee" ? '<button class="btn btn-ghost btn-sm" type="button" data-c-livrer>Marquer livrée</button>' : "") + (c.telephone ? '<a class="btn btn-whatsapp btn-sm" href="https://wa.me/' + c.telephone.replace(/[^\d]/g, "") + '" target="_blank" rel="noopener">WhatsApp</a>' : "") + (["nouvelle", "devis"].indexOf(c.statut) > -1 ? '<button class="btn btn-ghost btn-sm danger-link" type="button" data-c-annuler>Annuler</button>' : "") + "</span></div></article>";
      }).join("") + "</div>" : '<div class="card empty"><h2 class="h-card">Aucune commande ici</h2><p>Les commandes passées sur la page Boutique du site arrivent dans « Nouvelles ».</p></div>');
    A.lier("[data-fc]", "click", function (e, b) { filtreC = b.dataset.fc; A.rafraichir(); });
    var get = function (b) { return S.liste("commandes").filter(function (x) { return x.id === b.closest("[data-c]").dataset.c; })[0]; };
    A.lier("[data-c-devis]", "click", function (e, b) {
      var c = get(b), AR2 = S.liste("articles");
      var d = S.ajouterDemande({ type: "boutique", services: ["Équipements (commande " + c.id + ")"], description: "Commande boutique : " + c.lignes.map(function (x) { return x.qte + " × " + x.nom; }).join(", ") + (c.message ? ". " + c.message : ""), nom: c.nom, entreprise: c.entreprise || "", telephone: c.telephone, email: c.email || "", adresse: c.adresse || "", canaux: c.canaux || ["WhatsApp"], commandeId: c.id });
      S.majDemande(d.id, { lignes: c.lignes.map(function (x) { var a = AR2.filter(function (y) { return y.id === x.articleId; })[0]; return { designation: x.nom + (c.installation ? " – fourniture et installation" : ""), qte: x.qte, pu: a ? Number(a.prixVente || 0) : 0 }; }) });
      S.modifier("commandes", c.id, { statut: "devis", demandeId: d.id });
      S.log("Commande transformée en devis", c.id + " → " + d.id);
      A.toast("Devis prérempli avec les prix de vente : vérifiez puis envoyez", "ok"); location.hash = "#demandes/" + d.id;
    });
    A.lier("[data-c-livrer]", "click", function (e, b) {
      var c = get(b);
      if (!confirm("Confirmer la livraison ? Le stock sera diminué.")) return;
      c.lignes.forEach(function (x) { var a = S.liste("articles").filter(function (y) { return y.id === x.articleId; })[0]; if (a) { S.modifier("articles", a.id, { quantite: Math.max(0, Number(a.quantite) - x.qte) }); S.ajouter("mouvements", { articleId: a.id, type: "vente", quantite: x.qte, cible: (c.entreprise || c.nom) + " · " + c.id, par: A.moi().nom }, "MV-"); } });
      S.modifier("commandes", c.id, { statut: "livree", livreeLe: new Date().toISOString() });
      S.log("Commande livrée", c.id + " · " + (c.entreprise || c.nom)); A.rafraichir();
    });
    A.lier("[data-c-annuler]", "click", function (e, b) { var c = get(b); if (confirm("Annuler la commande " + c.id + " ?")) { S.modifier("commandes", c.id, { statut: "annulee" }); S.log("Commande annulée", c.id); A.rafraichir(); } });
  };

  /* Glisser-déposer réutilisable (pipeline, projets) */
  function activerGlisser(conteneur, surDepot) {
    var glisse = null;
    conteneur.addEventListener("dragstart", function (e) { var c = e.target.closest("[draggable]"); if (!c) return; glisse = c; c.classList.add("dragging"); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", c.dataset.id); });
    conteneur.addEventListener("dragend", function () { if (glisse) glisse.classList.remove("dragging"); conteneur.querySelectorAll(".kcol").forEach(function (k) { k.classList.remove("over"); }); glisse = null; });
    conteneur.addEventListener("dragover", function (e) { var col = e.target.closest(".kcol"); if (!col) return; e.preventDefault(); conteneur.querySelectorAll(".kcol").forEach(function (k) { k.classList.toggle("over", k === col); }); });
    conteneur.addEventListener("drop", function (e) { var col = e.target.closest(".kcol"); if (!col) return; e.preventDefault(); var id = e.dataTransfer.getData("text/plain"); if (id) surDepot(id, col.dataset.col); });
  }
  A.activerGlisser = activerGlisser;

  /* =================== Comptes clients (créés sur le site) =================== */
  function activiteClient(c) {
    var t = norm(c.telephone), em = String(c.email || "").toLowerCase(), nm = String(c.nom || "").toLowerCase(), ent = String(c.entreprise || "").toLowerCase();
    var lie = function (x) { return (t && norm(x.telephone) === t) || (em && String(x.email || "").toLowerCase() === em) || [x.nom, x.entreprise, x.clientNom, x.contact].some(function (n) { n = String(n || "").toLowerCase(); return n && (n === nm || (ent && n === ent)); }); };
    var D = S.demandes().filter(lie), ids = D.map(function (d) { return d.clientId; }).filter(Boolean);
    var lie2 = function (x) { return lie(x) || (x.clientId && ids.indexOf(x.clientId) > -1) || (x.demandeId && D.some(function (d) { return d.id === x.demandeId; })); };
    var F = S.liste("factures").filter(lie2).filter(function (x) { return x.type !== "proforma" && x.statut !== "annulee"; });
    var fact = F.reduce(function (a, x) { return a + x.ttc; }, 0), pay = F.reduce(function (a, x) { return a + (A.fin ? Math.min(x.ttc, A.fin.paye(x)) : 0); }, 0);
    return { D: D, F: F, T: S.liste("tickets").filter(lie2), PR: S.liste("projets").filter(lie2), AB: S.liste("abonnements").filter(lie2), facture: fact, paye: pay, reste: Math.max(0, fact - pay) };
  }
  var vueC = "cartes", filtreC = "tous", rechC = "";
  A.VUES.comptesclients = function () {
    var tous = S.liste("comptes_clients").map(function (c) { return { c: c, a: activiteClient(c) }; });
    var test = { tous: function () { return true; }, impayes: function (x) { return x.a.reste > 0; }, tickets: function (x) { return x.a.T.some(function (t) { return ["resolu", "ferme"].indexOf(t.statut) < 0; }); }, nouveaux: function (x) { return A.moisDe(x.c.creeLe) === A.MOIS; }, inactifs: function (x) { return x.c.actif === false || !!x.c.suspendu; } };
    var L = tous.filter(function (x) { return test[filtreC](x) && (!rechC || (x.c.nom + " " + (x.c.entreprise || "") + " " + (x.c.telephone || "") + " " + (x.c.email || "")).toLowerCase().indexOf(rechC.toLowerCase()) > -1); });
    var total = tous.reduce(function (a, x) { return a + x.a.facture; }, 0), reste = tous.reduce(function (a, x) { return a + x.a.reste; }, 0);
    A.vue.innerHTML = A.entete("Comptes clients", "Chaque client qui crée son compte sur le site apparaît ici avec sa photo, ses demandes, ses factures, ses tickets et ses projets", '<a class="btn btn-ghost" href="#clients">Fichier CRM</a><button class="btn btn-ghost" type="button" id="cc-pdf">Exporter en PDF</button>') +
      '<div class="kpis"><div class="kpi"><span>Comptes clients</span><strong data-count="' + tous.length + '">0</strong><small>' + tous.filter(test.nouveaux).length + " créé(s) ce mois</small></div><div class=\"kpi\"><span>Facturé</span><strong data-count=\"" + total + '" data-format="argent">0</strong><small>à ces clients</small></div><div class="kpi"><span>Reste à encaisser</span><strong data-count="' + reste + '" data-format="argent">0</strong><small>' + tous.filter(test.impayes).length + ' client(s)</small></div><div class="kpi"><span>Tickets ouverts</span><strong data-count="' + tous.reduce(function (a, x) { return a + x.a.T.filter(function (t) { return ["resolu", "ferme"].indexOf(t.statut) < 0; }).length; }, 0) + '">0</strong><small>' + tous.filter(test.tickets).length + " client(s)</small></div></div>" +
      '<div class="card"><div class="toolbar"><input type="search" id="cc-rech" placeholder="Nom, entreprise, téléphone, email…" value="' + esc(rechC) + '"><div class="seg" role="group" aria-label="Affichage"><button type="button" data-vue="cartes" aria-pressed="' + (vueC === "cartes") + '">▦ Cartes</button><button type="button" data-vue="tableau" aria-pressed="' + (vueC === "tableau") + '">☰ Tableau</button></div></div>' +
      '<div class="chips filtres">' + [["tous", "Tous"], ["impayes", "Avec impayés"], ["tickets", "Tickets ouverts"], ["nouveaux", "Nouveaux ce mois"], ["inactifs", "Suspendus ou désactivés"]].map(function (o) { return '<button type="button" class="filtre' + (filtreC === o[0] ? " on" : "") + '" data-fc="' + o[0] + '">' + o[1] + " <b>" + tous.filter(test[o[0]]).length + "</b></button>"; }).join("") + "</div>" +
      (vueC === "cartes" ? '<div class="pers-grille">' + (L.map(function (x) {
        var c = x.c, a = x.a, tOuv = a.T.filter(function (t) { return ["resolu", "ferme"].indexOf(t.statut) < 0; }).length;
        return '<article class="pers-carte" data-cc="' + c.id + '"><div class="pers-haut"><span class="tag ' + (c.suspendu ? "tag-warn" : c.actif === false ? "tag-muted" : a.reste > 0 ? "tag-warn" : "tag-ok") + '" title="' + esc(c.motifSuspension || c.motifDesactivation || "") + '">' + (c.suspendu ? "⏳ Suspendu" : c.actif === false ? "⛔ Désactivé" : a.reste > 0 ? "Impayé" : "À jour") + "</span>" + A.interrupteur("data-cc-actif", c.actif !== false, "Compte actif " + c.nom) + '</div><div class="pers-id" data-cc-fiche>' + A.avatar(c, 72) + "<div><strong>" + esc(c.nom) + " " + ({ en: "🇬🇧", sw: "🇹🇿" }[c.langue] || "") + "</strong><small>" + esc(c.entreprise || "Particulier") + "</small><small>" + esc(c.telephone || c.email || "") + "</small></div></div>" +
          '<div class="pers-stats"><div><span>' + a.D.length + "</span><small>demandes</small></div><div><span>" + A.argent(a.paye).replace(",00", "") + "</span><small>payé</small></div><div><span" + (a.reste > 0 ? ' class="down"' : "") + ">" + A.argent(a.reste).replace(",00", "") + '</span><small>reste</small></div></div><div class="progress"><span style="width:' + (a.facture ? Math.round(a.paye / a.facture * 100) : 0) + '%"></span></div>' +
          '<p class="pers-meta">🎫 ' + tOuv + " ticket(s) ouvert(s) · 📁 " + a.PR.length + " projet(s) · vu " + (c.derniereConnexion ? A.jour(c.derniereConnexion) : "jamais") + "</p>" +
          '<div class="pers-actions"><button class="btn btn-primary btn-sm" type="button" data-cc-fiche>👁 Fiche client</button><button class="ico-btn" type="button" data-cc-mdp title="Nouveau mot de passe" aria-label="Nouveau mot de passe">🔑</button><a class="ico-btn" target="_blank" rel="noopener" href="https://wa.me/' + norm(c.telephone) + '" title="WhatsApp" aria-label="WhatsApp">💬</a><button class="ico-btn" type="button" data-cc-gerer title="Suspendre, désactiver, supprimer…" aria-label="Gérer le compte">⚙</button></div></article>';
      }).join("") || '<p class="muted">Aucun client dans cette sélection.</p>') + "</div>"
      : '<div class="table-wrap"><table class="t" style="min-width:980px"><thead><tr><th>Client</th><th>Contact</th><th class="r">Demandes</th><th class="r">Payé</th><th class="r">Reste</th><th>Créé le</th><th>Actif</th><th></th></tr></thead><tbody>' +
        (L.map(function (x) { var c = x.c, a = x.a; return '<tr data-cc="' + c.id + '"><td><div style="display:flex;gap:10px;align-items:center">' + A.avatar(c, 38) + "<span><strong>" + esc(c.nom) + '</strong><br><small class="muted">' + esc(c.entreprise || "Particulier") + "</small></span></div></td><td>" + esc(c.telephone || "") + '<br><small class="muted">' + esc(c.email || "") + '</small></td><td class="r">' + a.D.length + '</td><td class="r">' + A.argent(a.paye) + '</td><td class="r ' + (a.reste > 0 ? "down" : "") + '">' + A.argent(a.reste) + "</td><td>" + jour(c.creeLe) + "</td><td>" + A.interrupteur("data-cc-actif", c.actif !== false, "Compte actif " + c.nom) + '</td><td class="r"><span class="actions-ligne"><button class="ico-btn" type="button" data-cc-fiche title="Fiche" aria-label="Fiche">👁</button><button class="ico-btn" type="button" data-cc-mdp title="Nouveau mot de passe" aria-label="Nouveau mot de passe">🔑</button><button class="ico-btn" type="button" data-cc-gerer title="Gérer le compte" aria-label="Gérer le compte">⚙</button></span></td></tr>'; }).join("") || '<tr><td colspan="8" class="muted">Aucun client.</td></tr>') + "</tbody></table></div>") + "</div>";
    var r = document.getElementById("cc-rech");
    r.addEventListener("input", function () { rechC = r.value; clearTimeout(r._t); r._t = setTimeout(function () { A.VUES.comptesclients(); var n = document.getElementById("cc-rech"); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 250); });
    A.lier("[data-vue]", "click", function (e, b) { vueC = b.dataset.vue; A.rafraichir(); });
    A.lier("[data-fc]", "click", function (e, b) { filtreC = b.dataset.fc; A.rafraichir(); });
    document.getElementById("cc-pdf").addEventListener("click", function () { A.csv("comptes-clients", [["Client", "Entreprise", "Téléphone", "Email", "Demandes", "Facturé", "Payé", "Reste", "Actif"]].concat(tous.map(function (x) { return [x.c.nom, x.c.entreprise || "", x.c.telephone || "", x.c.email || "", x.a.D.length, A.argent(x.a.facture), A.argent(x.a.paye), A.argent(x.a.reste), x.c.actif === false ? "non" : "oui"]; }))); });
    var trouver = function (b) { return S.liste("comptes_clients").filter(function (x) { return x.id === b.closest("[data-cc]").dataset.cc; })[0]; };
    A.lier("[data-cc-fiche]", "click", function (e, b) { ficheCompteClient(trouver(b)); });
    A.lier("[data-cc-actif]", "click", function (e, b) { var c = trouver(b); A.gererCompte("client", c, c.actif === false || c.suspendu ? "reactiver" : "suspendre"); });
    A.lier("[data-cc-gerer]", "click", function (e, b) { A.gererCompte("client", trouver(b)); });
    A.lier("[data-cc-mdp]", "click", function (e, b) { nouveauMdpClient(trouver(b)); });
  };
  function nouveauMdpClient(c) {
    var mdp = A.motDePasse();
    A.sha256(String(c.identifiant).toLowerCase() + ":" + mdp).then(function (h) {
      S.modifier("comptes_clients", c.id, { hash: h }); S.log("Mot de passe client réinitialisé", c.nom);
      var msg = "Bonjour " + c.nom + ",\nVoici votre nouveau mot de passe pour l’espace client NextGenIT :\n👤 " + c.identifiant + "\n🔑 " + mdp + "\n" + location.href.split("/admin")[0] + "/connexion.html";
      A.modal({ titre: "Nouveau mot de passe · " + c.nom, annuler: "Terminé", corps: '<div class="row-item block"><small class="muted">Identifiant</small><strong>' + esc(c.identifiant) + '</strong><small class="muted">Mot de passe</small><strong style="font-family:ui-monospace,monospace">' + esc(mdp) + '</strong></div><div class="send-row"><a class="btn btn-whatsapp" target="_blank" rel="noopener" href="https://wa.me/' + norm(c.telephone) + "?text=" + encodeURIComponent(msg) + '">WhatsApp</a>' + (c.email ? '<a class="btn btn-ghost" href="mailto:' + esc(c.email) + "?subject=" + encodeURIComponent("Votre accès NextGenIT") + "&body=" + encodeURIComponent(msg) + '">Email</a>' : "") + "</div>" });
    });
  }
  function ficheCompteClient(c) {
    var a = activiteClient(c), lg = function (g, d, lien) { return '<div class="row-item" style="padding:10px 12px"><span>' + g + "</span><span>" + d + (lien ? ' <a href="' + lien + '" data-close>Ouvrir</a>' : "") + "</span></div>"; };
    A.modal({ titre: "Fiche client", large: true, annuler: "Fermer",
      corps: '<div class="fiche-tete">' + A.avatar(c, 84) + "<div><h3>" + esc(c.nom) + "</h3><p>" + esc(c.entreprise || "Particulier") + " · " + esc(c.telephone || "") + (c.email ? " · " + esc(c.email) : "") + "</p><p class=\"muted\">Compte créé le " + jour(c.creeLe) + " · dernière connexion " + (c.derniereConnexion ? A.heure(c.derniereConnexion) : "jamais") + (c.adresse ? " · " + esc(c.adresse) : "") + "</p></div></div>" +
        '<div class="kpis" style="margin:0"><div class="kpi"><span>Facturé</span><strong>' + A.argent(a.facture) + '</strong></div><div class="kpi"><span>Payé</span><strong class="up">' + A.argent(a.paye) + '</strong></div><div class="kpi"><span>Reste</span><strong class="' + (a.reste > 0 ? "down" : "") + '">' + A.argent(a.reste) + '</strong></div><div class="kpi"><span>Tickets</span><strong>' + a.T.length + "</strong></div></div>" +
        "<div><strong>Demandes et devis (" + a.D.length + ")</strong>" + (a.D.map(function (d) { return lg(esc(d.id) + " · " + esc((d.services || []).join(", ")), jour(d.creeLe), "#demandes/" + d.id); }).join("") || '<p class="muted">Aucune.</p>') + "</div>" +
        "<div><strong>Factures (" + a.F.length + ")</strong>" + (a.F.map(function (x) { return lg(esc(x.numero) + " · " + esc(x.objet), A.argent(x.ttc) + " · " + ({ payee: "payée", partielle: "partielle", emise: "à payer" }[x.statut] || x.statut), "#factures/" + x.id); }).join("") || '<p class="muted">Aucune.</p>') + "</div>" +
        "<div><strong>Tickets (" + a.T.length + ")</strong>" + (a.T.map(function (t) { return lg(esc(t.id) + " · " + esc(t.sujet), esc(t.statut), "#tickets/" + t.id); }).join("") || '<p class="muted">Aucun.</p>') + "</div>" +
        (a.PR.length ? "<div><strong>Projets</strong>" + a.PR.map(function (p) { return lg(esc(p.nom), (A.avancementProjet ? A.avancementProjet(p) : 0) + " %", "#projets"); }).join("") + "</div>" : "") +
        '<div class="send-row"><a class="btn btn-whatsapp" target="_blank" rel="noopener" href="https://wa.me/' + norm(c.telephone) + '">WhatsApp</a>' + (c.email ? '<a class="btn btn-ghost" href="mailto:' + esc(c.email) + '">Email</a>' : "") + '<button class="btn btn-ghost" type="button" id="fc-mdp">🔑 Nouveau mot de passe</button><button class="btn btn-ghost" type="button" id="fc-devis">＋ Nouveau devis</button><button class="btn btn-ghost" type="button" id="fc-gerer">⚙ Suspendre / supprimer</button></div>' +
        '<label class="field" style="max-width:320px">Langue du client (espace, devis, factures)<select id="fc-langue"><option value="fr">Français</option><option value="en">English</option><option value="sw">Kiswahili</option></select></label>',
      apres: function (form) {
        form.querySelector("#fc-mdp").addEventListener("click", function () { A.fermer(); nouveauMdpClient(c); });
        var sl = form.querySelector("#fc-langue"); sl.value = c.langue || "fr"; sl.addEventListener("change", function () { S.modifier("comptes_clients", c.id, { langue: sl.value }); S.log("Langue du client modifiée", c.nom + " → " + sl.value); A.toast("Langue enregistrée : ses documents sortiront dans cette langue", "ok"); });
        form.querySelector("#fc-gerer").addEventListener("click", function () { A.fermer(); A.gererCompte("client", c); });
        form.querySelector("#fc-devis").addEventListener("click", function () { var d = S.ajouterDemande({ type: "service", services: ["À préciser"], description: "Devis créé depuis la fiche du compte client.", nom: c.nom, entreprise: c.entreprise || "", telephone: c.telephone || "", email: c.email || "", adresse: c.adresse || "", canaux: ["WhatsApp"] }); S.log("Devis créé depuis un compte client", d.id + " · " + c.nom); A.fermer(); location.hash = "#demandes/" + d.id; });
      }
    });
  }
  /* =================== Gérer un compte (étudiant ou client) : suspendre, désactiver, réactiver, supprimer, avec motif =================== */
  var MOTIFS = ["Impayé", "Comportement inapproprié", "Partage du compte ou fraude", "Absences répétées", "Fin de formation ou de contrat", "Demande de la personne", "Compte en double", "Autre"];
  A.gererCompte = function (type, c, actionInitiale, apres) {
    var col = type === "etudiant" ? "comptes_etudiants" : "comptes_clients", lib = type === "etudiant" ? "étudiant" : "client";
    var suspendu = c.suspendu && (!c.suspenduJusqua || c.suspenduJusqua >= new Date().toISOString().slice(0, 10));
    var actif = type === "etudiant" ? !!c.actif : c.actif !== false;
    var actions = [["suspendre", "⏳ Suspendre", "Accès bloqué temporairement, avec une date de fin si vous le souhaitez."], ["desactiver", "⛔ Désactiver", "Accès bloqué jusqu’à réactivation."], ["reactiver", "✅ Réactiver", "Rendre l’accès."], ["supprimer", "🗑 Supprimer", "Suppression définitive du compte (l’historique, les factures et les demandes sont conservés)."]].filter(function (a) { return a[0] === "reactiver" ? !actif || suspendu : a[0] === "supprimer" || actif; });
    var init = actions.some(function (a) { return a[0] === actionInitiale; }) ? actionInitiale : actions[0][0];
    A.modal({ titre: "Gérer le compte " + lib + " · " + c.nom, valider: "Appliquer",
      corps: '<div class="fiche-tete">' + A.avatar(c, 64) + "<div><h3>" + esc(c.nom) + "</h3><p>" + esc(c.identifiant || "") + " · " + esc(c.telephone || "") + "</p><p>" + (suspendu ? "⏳ Suspendu" + (c.motifSuspension ? " · " + esc(c.motifSuspension) : "") + (c.suspenduJusqua ? " jusqu’au " + jour(c.suspenduJusqua + "T12:00:00") : "") : actif ? "✅ Compte actif" : "⛔ Compte inactif" + (c.motifDesactivation ? " · " + esc(c.motifDesactivation) : "")) + "</p></div></div>" +
        '<div class="actions-compte">' + actions.map(function (a) { return '<label class="action-compte' + (a[0] === "supprimer" ? " danger" : "") + '"><input type="radio" name="action" value="' + a[0] + '"' + (a[0] === init ? " checked" : "") + "><span><strong>" + a[1] + "</strong><small>" + a[2] + "</small></span></label>"; }).join("") + "</div>" +
        '<div class="form-grid" data-zone="motif"><label class="field">Motif<select name="motif">' + A.options(MOTIFS) + '</select></label><label class="field" data-zone="fin">Suspendu jusqu’au (facultatif)<input name="fin" type="date"></label><label class="field full">Commentaire interne<textarea name="com" style="min-height:70px" placeholder="Précisez la raison (gardé dans l’historique)"></textarea></label></div>' +
        '<label style="display:flex;gap:8px;align-items:center"><input type="checkbox" name="prevenir"' + (c.telephone ? " checked" : " disabled") + "> Prévenir la personne par WhatsApp</label>" +
        '<p class="notice" data-zone="conf" hidden style="background:color-mix(in srgb,var(--danger) 10%,transparent);color:var(--danger)">Pour confirmer la suppression, tapez <strong>SUPPRIMER</strong> : <input name="conf" style="min-height:36px;border-radius:8px;border:1px solid var(--line-2);padding:0 8px" autocomplete="off"></p>',
      apres: function (form) {
        var maj = function () { var a = form.querySelector("[name=action]:checked").value; form.querySelector('[data-zone="motif"]').hidden = a === "reactiver"; form.querySelector('[data-zone="fin"]').hidden = a !== "suspendre"; form.querySelector('[data-zone="conf"]').hidden = a !== "supprimer"; };
        form.addEventListener("change", maj); maj();
      },
      onSubmit: function (form) {
        var a = form.querySelector("[name=action]:checked").value, motif = form.motif.value, com = form.com.value.trim(), qui = A.moi().nom, now = new Date().toISOString();
        var raison = motif + (com ? " – " + com : ""), msg = "";
        if (a === "supprimer") {
          if (form.conf.value.trim().toUpperCase() !== "SUPPRIMER") { A.toast("Tapez SUPPRIMER pour confirmer", "warn"); return false; }
          S.ajouter("comptes_supprimes", { type: type, compteId: c.id, nom: c.nom, identifiant: c.identifiant || "", telephone: c.telephone || "", email: c.email || "", motif: raison, par: qui }, "DEL-");
          S.retirer(col, c.id);
          S.log("Compte " + lib + " supprimé", c.nom + " · motif : " + raison);
          msg = "Bonjour " + c.nom + ",\nVotre compte NextGenIT a été fermé (" + motif.toLowerCase() + "). Pour toute question, contactez-nous.\nNextGenIT";
        } else if (a === "suspendre") {
          S.modifier(col, c.id, { actif: false, suspendu: true, suspenduJusqua: form.fin.value || "", motifSuspension: motif, commentaireStatut: com, statutPar: qui, statutLe: now });
          S.log("Compte " + lib + " suspendu", c.nom + " · " + raison + (form.fin.value ? " · jusqu’au " + form.fin.value : ""));
          msg = "Bonjour " + c.nom + ",\nVotre accès à l’espace NextGenIT est suspendu" + (form.fin.value ? " jusqu’au " + jour(form.fin.value + "T12:00:00") : "") + " (motif : " + motif.toLowerCase() + "). Contactez-nous pour en parler.\nNextGenIT";
        } else if (a === "desactiver") {
          S.modifier(col, c.id, { actif: false, suspendu: false, motifDesactivation: motif, commentaireStatut: com, statutPar: qui, statutLe: now });
          S.log("Compte " + lib + " désactivé", c.nom + " · " + raison);
          msg = "Bonjour " + c.nom + ",\nVotre compte NextGenIT est désactivé (motif : " + motif.toLowerCase() + "). Contactez-nous pour le réactiver.\nNextGenIT";
        } else {
          S.modifier(col, c.id, { actif: true, suspendu: false, suspenduJusqua: "", motifSuspension: "", motifDesactivation: "", enAttenteApprobation: false, statutPar: qui, statutLe: now });
          S.log("Compte " + lib + " réactivé", c.nom);
          msg = "Bonjour " + c.nom + ",\nBonne nouvelle : votre accès à l’espace NextGenIT est de nouveau ouvert.\nNextGenIT";
        }
        if (form.prevenir.checked && c.telephone) window.open("https://wa.me/" + norm(c.telephone) + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
        A.toast({ supprimer: "Compte supprimé", suspendre: "Compte suspendu", desactiver: "Compte désactivé", reactiver: "Compte réactivé" }[a], "ok");
        if (apres) apres(); A.rafraichir();
      }
    });
  };
})();
