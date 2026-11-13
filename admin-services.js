/* Administration – Projets (Kanban, Gantt, jalons, rapports signés), Helpdesk (tickets, SLA), Stock */
(function () {
  var A = window.NGA, S = A.S, esc = A.esc, argent = A.argent, jour = A.jour;
  var AUJ = function () { return new Date().toISOString().slice(0, 10); };
  function personnel() { return S.liste("personnel").filter(function (p) { return p.actif; }); }
  function nomDe(id) { var p = S.liste("personnel").filter(function (x) { return x.id === id; })[0]; return p ? p.nom : "—"; }
  function wa(tel, msg) { window.open("https://wa.me/" + String(tel || "").replace(/[^\d]/g, "") + "?text=" + encodeURIComponent(msg), "_blank", "noopener"); }

  /* =================== Projets =================== */
  var COLS = [["attente", "En attente"], ["encours", "En cours"], ["test", "Test / recette"], ["termine", "Terminé"]];
  var TYPES_P = ["Site web", "Application web", "Réseau et Wi-Fi", "Vidéosurveillance", "Déploiement de parc", "Serveurs et virtualisation", "Cybersécurité", "Hébergement et cloud"];
  var ongletPr = "kanban", filtreProjet = "";
  function avancement(p) { var j = p.jalons || []; return j.length ? Math.round(j.filter(function (x) { return x.fait; }).length / j.length * 100) : 0; }
  A.avancementProjet = avancement;
  A.VUES.projets = function () {
    var P = S.liste("projets");
    var tabs = [["kanban", "Tâches (Kanban)"], ["gantt", "Planning (Gantt)"], ["liste", "Projets et jalons"], ["rapports", "Rapports d’intervention"]];
    A.vue.innerHTML = A.entete("Projets", "Développement web, installations réseau, CCTV et déploiements : tâches, planning, jalons validés par le client", '<button class="btn btn-ghost" type="button" id="t-new">+ Tâche</button><button class="btn btn-primary" type="button" id="pr-new">+ Nouveau projet</button>') +
      '<div class="kpis"><div class="kpi"><span>Projets en cours</span><strong data-count="' + P.filter(function (p) { return p.statut !== "termine"; }).length + '">0</strong></div><div class="kpi"><span>Tâches ouvertes</span><strong data-count="' + S.liste("taches").filter(function (t) { return t.statut !== "termine"; }).length + '">0</strong></div><div class="kpi"><span>Heures passées</span><strong data-count="' + S.liste("taches").reduce(function (a, t) { return a + Number(t.heures || 0); }, 0) + '">0</strong><small>toutes tâches</small></div><div class="kpi"><span>Projets en retard</span><strong style="color:var(--danger)" data-count="' + P.filter(function (p) { return p.statut !== "termine" && p.fin < AUJ(); }).length + '">0</strong></div></div>' +
      '<div class="tabs" role="tablist">' + tabs.map(function (t) { return '<button class="tab" type="button" role="tab" data-opr="' + t[0] + '" aria-selected="' + (ongletPr === t[0]) + '">' + t[1] + "</button>"; }).join("") + '</div><div id="pr-contenu"></div>';
    A.lier("[data-opr]", "click", function (e, b) { ongletPr = b.dataset.opr; A.rafraichir(); });
    document.getElementById("pr-new").addEventListener("click", function () { formProjet(null); });
    document.getElementById("t-new").addEventListener("click", function () { formTache(null); });
    ({ kanban: prKanban, gantt: prGantt, liste: prListe, rapports: prRapports })[ongletPr]();
  };
  function prKanban() {
    var P = S.liste("projets"), T = S.liste("taches").filter(function (t) { return !filtreProjet || t.projetId === filtreProjet; });
    document.getElementById("pr-contenu").innerHTML = '<div class="toolbar"><select id="pr-filtre"><option value="">Tous les projets</option>' + A.options(P.map(function (p) { return [p.id, p.nom]; }), filtreProjet) + '</select><span class="muted" style="font-size:.9rem">Glissez les cartes ou utilisez le menu de chaque carte.</span></div><div class="kanban" id="kb">' +
      COLS.map(function (c) {
        var items = T.filter(function (t) { return t.statut === c[0]; });
        return '<section class="kcol" data-col="' + c[0] + '"><h2>' + c[1] + " <span>" + items.length + "</span></h2>" + items.map(function (t) {
          var p = P.filter(function (x) { return x.id === t.projetId; })[0], retard = t.echeance && t.echeance < AUJ() && t.statut !== "termine";
          return '<article class="kcard" draggable="true" data-id="' + t.id + '"><small class="muted">' + esc(p ? p.nom : "Sans projet") + "</small><strong>" + esc(t.titre) + '</strong><div class="foot"><span>' + esc(nomDe(t.techId)) + " · " + (t.heures || 0) + ' h</span><span class="' + (retard ? "down" : "") + '">' + (t.echeance ? jour(t.echeance + "T12:00:00") : "") + '</span></div><div class="foot"><select class="inline-select" data-move aria-label="Statut" style="width:auto;min-height:32px;padding:2px 6px;font-size:.8rem">' + A.options(COLS, t.statut) + '</select><button class="btn btn-ghost btn-sm" type="button" data-tedit>Modifier</button></div></article>';
        }).join("") + "</section>";
      }).join("") + "</div>";
    document.getElementById("pr-filtre").addEventListener("change", function (e) { filtreProjet = e.target.value; A.rafraichir(); });
    var bouger = function (id, col) { var t = S.modifier("taches", id, { statut: col, termineLe: col === "termine" ? new Date().toISOString() : null }); S.log("Tâche déplacée", t.titre + " → " + COLS.filter(function (c) { return c[0] === col; })[0][1]); A.rafraichir(); };
    A.activerGlisser(document.getElementById("kb"), bouger);
    A.lier("[data-move]", "change", function (e, s) { bouger(s.closest("[data-id]").dataset.id, s.value); });
    A.lier("[data-tedit]", "click", function (e, b) { formTache(S.liste("taches").filter(function (t) { return t.id === b.closest("[data-id]").dataset.id; })[0]); });
  }
  function prGantt() {
    var P = S.liste("projets"), d0 = new Date(); d0.setDate(d0.getDate() - 14); d0.setHours(0, 0, 0, 0);
    var jours = 56, fin = new Date(d0.getTime() + jours * 864e5);
    var pos = function (iso) { return Math.max(0, Math.min(100, (new Date(iso + "T12:00:00") - d0) / (fin - d0) * 100)); };
    var semaines = []; for (var i = 0; i < 8; i++) semaines.push(new Date(d0.getTime() + i * 7 * 864e5).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }));
    document.getElementById("pr-contenu").innerHTML = '<div class="card"><div class="table-wrap"><div class="gantt"><div class="gantt-head"><div></div><div>' + semaines.map(function (s) { return "<span>" + s + "</span>"; }).join("") + "</div></div>" +
      (P.map(function (p, i) { var a = pos(p.debut), b = pos(p.fin); return '<div class="gantt-row"><div><strong>' + esc(p.nom) + '</strong><br><small class="muted">' + esc(p.clientNom) + " · " + avancement(p) + ' %</small></div><div class="gantt-track"><div class="gantt-bar" style="left:' + a + "%;width:" + Math.max(2, b - a) + "%;animation-delay:" + i * 0.08 + 's" title="' + esc(jour(p.debut + "T12:00:00") + " → " + jour(p.fin + "T12:00:00")) + '">' + avancement(p) + ' %</div><div class="gantt-today" style="left:' + pos(AUJ()) + '%" title="Aujourd’hui"></div></div></div>'; }).join("") || '<p class="muted">Aucun projet.</p>') + "</div></div></div>";
  }
  function prListe() {
    var P = S.liste("projets");
    document.getElementById("pr-contenu").innerHTML = '<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(min(100%,360px),1fr))">' + (P.map(function (p) {
      var av = avancement(p), retard = p.statut !== "termine" && p.fin < AUJ();
      return '<article class="card" data-p="' + p.id + '"><div style="display:flex;justify-content:space-between;gap:10px"><span class="tag tag-accent">' + esc(p.type) + '</span><span class="tag ' + (p.statut === "termine" ? "tag-ok" : retard ? "tag-warn" : "tag-muted") + '">' + (p.statut === "termine" ? "Terminé" : retard ? "En retard" : "En cours") + "</span></div><h2 class=\"h-card\">" + esc(p.nom) + '</h2><p>' + esc(p.clientNom) + " · " + jour(p.debut + "T12:00:00") + " → " + jour(p.fin + "T12:00:00") + " · Responsable : " + esc(nomDe(p.responsableId)) + '</p><div style="display:flex;justify-content:space-between;font-size:.9rem"><span class="muted">Avancement (jalons)</span><strong>' + av + ' %</strong></div><div class="progress"><span style="width:' + av + '%"></span></div>' +
        '<ul class="jalons">' + (p.jalons || []).map(function (j) { return '<li><input type="checkbox" data-jalon="' + j.id + '"' + (j.fait ? " checked" : "") + ' aria-label="Jalon ' + esc(j.nom) + ' terminé"><span>' + esc(j.nom) + (j.valideClient ? ' <span class="tag tag-ok">Validé par le client</span>' : "") + "</span><small class=\"muted\">" + (j.date ? jour(j.date + "T12:00:00") : "") + "</small></li>"; }).join("") + "</ul>" +
        '<div class="foot"><span class="hero-actions"><button class="btn btn-ghost btn-sm" type="button" data-p-edit>Modifier</button><button class="btn btn-ghost btn-sm" type="button" data-p-rapport>Rapport signé</button>' + (p.telephone ? '<button class="btn btn-whatsapp btn-sm" type="button" data-p-wa>Informer</button>' : "") + "</span></div></article>";
    }).join("") || '<div class="card empty"><h2 class="h-card">Aucun projet</h2><p>Créez un projet pour suivre un site web, une installation réseau ou un déploiement.</p></div>') + "</div>";
    A.lier("[data-jalon]", "change", function (e, c) {
      var pid = c.closest("[data-p]").dataset.p, p = S.liste("projets").filter(function (x) { return x.id === pid; })[0];
      p.jalons.forEach(function (j) { if (j.id === c.dataset.jalon) { j.fait = c.checked; j.date = c.checked ? AUJ() : ""; } });
      var tout = p.jalons.every(function (j) { return j.fait; });
      S.modifier("projets", pid, { jalons: p.jalons, statut: tout ? "termine" : "en_cours" });
      S.log("Jalon " + (c.checked ? "terminé" : "rouvert"), p.nom + " · " + p.jalons.filter(function (j) { return j.id === c.dataset.jalon; })[0].nom);
      A.rafraichir();
    });
    A.lier("[data-p-edit]", "click", function (e, b) { formProjet(S.liste("projets").filter(function (x) { return x.id === b.closest("[data-p]").dataset.p; })[0]); });
    A.lier("[data-p-rapport]", "click", function (e, b) { rapportSigne(S.liste("projets").filter(function (x) { return x.id === b.closest("[data-p]").dataset.p; })[0]); });
    A.lier("[data-p-wa]", "click", function (e, b) { var p = S.liste("projets").filter(function (x) { return x.id === b.closest("[data-p]").dataset.p; })[0]; wa(p.telephone, "Bonjour,\nAvancement de votre projet « " + p.nom + " » : " + avancement(p) + " %.\n" + (p.jalons || []).map(function (j) { return (j.fait ? "✔ " : "○ ") + j.nom; }).join("\n") + "\n\nSuivez-le en direct dans votre espace client NextGenIT."); });
  }
  function prRapports() {
    var R = S.liste("rapports");
    document.getElementById("pr-contenu").innerHTML = '<div class="card"><div class="table-wrap"><table class="t"><thead><tr><th>Date</th><th>Projet / intervention</th><th>Technicien</th><th>Signé par</th><th></th></tr></thead><tbody>' +
      (R.map(function (r) { return "<tr><td>" + jour(r.creeLe) + "</td><td>" + esc(r.titre) + "</td><td>" + esc(r.technicien) + "</td><td>" + esc(r.signataire) + '</td><td class="r"><a class="btn btn-ghost btn-sm" href="document.html?type=rapport&rid=' + r.id + '" target="_blank" rel="noopener">PDF signé</a></td></tr>'; }).join("") || '<tr><td colspan="5" class="muted">Aucun rapport. Utilisez « Rapport signé » sur un projet ou une intervention.</td></tr>') + "</tbody></table></div></div>";
  }
  function formProjet(p) {
    var n = !p;
    p = p || { nom: "", clientNom: "", telephone: "", type: "Site web", debut: AUJ(), fin: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10), responsableId: "", jalons: [] };
    var modeles = { "Site web": ["Cahier des charges", "Maquette validée", "Développement", "Contenus intégrés", "Mise en ligne"], "Réseau et Wi-Fi": ["Visite et plan", "Câblage", "Configuration", "Tests", "Réception client"], "Vidéosurveillance": ["Repérage", "Pose des caméras", "Configuration NVR", "Accès mobile", "Formation du client"] };
    A.modal({
      titre: n ? "Nouveau projet" : "Modifier " + p.nom, valider: "Enregistrer", large: true,
      corps: '<div class="form-grid"><label class="field">Nom du projet<input name="nom" required value="' + esc(p.nom) + '"></label><label class="field">Type<select name="type">' + A.options(TYPES_P, p.type) + '</select></label><label class="field">Client<input name="client" required value="' + esc(p.clientNom) + '" list="dl-cl"></label><label class="field">Téléphone du client<input name="tel" type="tel" value="' + esc(p.telephone || "") + '"></label><label class="field">Début<input name="debut" type="date" value="' + p.debut + '"></label><label class="field">Fin prévue<input name="fin" type="date" value="' + p.fin + '"></label><label class="field">Responsable<select name="resp"><option value="">—</option>' + A.options(personnel().map(function (x) { return [x.id, x.nom]; }), p.responsableId) + '</select></label></div><label class="field">Jalons (un par ligne)<textarea name="jalons" style="min-height:110px" placeholder="Laissez vide pour utiliser le modèle du type choisi">' + esc((p.jalons || []).map(function (j) { return j.nom; }).join("\n")) + '</textarea></label><datalist id="dl-cl">' + S.liste("clients").map(function (c) { return '<option value="' + esc(c.nom) + '">'; }).join("") + "</datalist>",
      onSubmit: function (f) {
        if (!f.nom.value.trim() || !f.client.value.trim()) { A.toast("Nom et client obligatoires", "warn"); return false; }
        var noms = f.jalons.value.split("\n").map(function (x) { return x.trim(); }).filter(Boolean);
        if (!noms.length) noms = modeles[f.type.value] || ["Lancement", "Réalisation", "Tests", "Livraison"];
        var anciens = p.jalons || [];
        var jalons = noms.map(function (nm, i) { var old = anciens.filter(function (j) { return j.nom === nm; })[0]; return old || { id: "J" + i + Date.now().toString(36), nom: nm, fait: false, valideClient: false }; });
        var cl = S.liste("clients").filter(function (c) { return c.nom === f.client.value.trim(); })[0];
        var data = { nom: f.nom.value.trim(), type: f.type.value, clientNom: f.client.value.trim(), clientId: cl ? cl.id : "", telephone: f.tel.value.trim() || (cl ? cl.telephone : ""), debut: f.debut.value, fin: f.fin.value, responsableId: f.resp.value, jalons: jalons, statut: jalons.every(function (j) { return j.fait; }) ? "termine" : "en_cours" };
        if (n) { S.ajouter("projets", data, "PRJ-"); S.log("Projet créé", data.nom + " · " + data.clientNom); } else { S.modifier("projets", p.id, data); S.log("Projet modifié", data.nom); }
        A.rafraichir(); A.toast("Projet enregistré", "ok");
      }
    });
  }
  function formTache(t) {
    var n = !t, P = S.liste("projets");
    t = t || { titre: "", projetId: filtreProjet || (P[0] ? P[0].id : ""), techId: "", statut: "attente", heures: 0, echeance: "" };
    A.modal({
      titre: n ? "Nouvelle tâche" : "Modifier la tâche", valider: "Enregistrer",
      corps: '<div class="form-grid"><label class="field full">Tâche<input name="titre" required value="' + esc(t.titre) + '"></label><label class="field">Projet<select name="projet"><option value="">Sans projet</option>' + A.options(P.map(function (p) { return [p.id, p.nom]; }), t.projetId) + '</select></label><label class="field">Assignée à<select name="tech"><option value="">—</option>' + A.options(personnel().map(function (x) { return [x.id, x.nom + " · " + (x.specialites || []).join(", ")]; }), t.techId) + '</select></label><label class="field">Statut<select name="statut">' + A.options(COLS, t.statut) + '</select></label><label class="field">Heures passées<input name="heures" type="number" min="0" step="0.5" value="' + (t.heures || 0) + '"></label><label class="field">Échéance<input name="ech" type="date" value="' + esc(t.echeance || "") + '"></label></div>' + (n ? "" : '<button type="button" class="btn btn-ghost btn-sm danger-link" id="t-suppr" style="justify-self:start">Supprimer la tâche</button>'),
      apres: function (f) { var b = f.querySelector("#t-suppr"); if (b) b.addEventListener("click", function () { if (confirm("Supprimer cette tâche ?")) { S.retirer("taches", t.id); S.log("Tâche supprimée", t.titre); A.fermer(); A.rafraichir(); } }); },
      onSubmit: function (f) {
        if (!f.titre.value.trim()) { A.toast("Titre obligatoire", "warn"); return false; }
        var data = { titre: f.titre.value.trim(), projetId: f.projet.value, techId: f.tech.value, statut: f.statut.value, heures: Number(f.heures.value) || 0, echeance: f.ech.value };
        if (n) { S.ajouter("taches", data, "T-"); S.log("Tâche créée", data.titre + " → " + nomDe(data.techId)); } else { S.modifier("taches", t.id, data); S.log("Tâche modifiée", data.titre); }
        A.rafraichir();
      }
    });
  }
  /* Rapport d'intervention signé par le client (signature au doigt ou à la souris) */
  function rapportSigne(p, intervention) {
    var titre = p ? p.nom + " · " + p.clientNom : intervention.id + " · " + (intervention.entreprise || intervention.nom);
    A.modal({
      titre: "Rapport d’intervention", valider: "Enregistrer le rapport signé", large: true,
      corps: "<p><strong>" + esc(titre) + '</strong></p><div class="form-grid"><label class="field">Technicien<select name="tech">' + A.options(personnel().map(function (x) { return x.nom; }), p ? nomDe(p.responsableId) : nomDe(intervention.techId)) + '</select></label><label class="field">Date<input name="date" type="date" value="' + AUJ() + '"></label><label class="field full">Travaux réalisés<textarea name="travaux" required style="min-height:90px"></textarea></label><label class="field full">Matériel utilisé<input name="materiel"></label><label class="field">Nom du client signataire<input name="sign" required></label><label class="field">Heures passées<input name="heures" type="number" min="0" step="0.5" value="1"></label></div><div><div class="panel-label" style="margin-bottom:6px">Signature du client</div><canvas class="sig-pad" id="sig" aria-label="Zone de signature"></canvas><button type="button" class="btn btn-ghost btn-sm mt-1" id="sig-eff">Effacer</button></div>',
      apres: function (f) {
        var cv = f.querySelector("#sig"), ctx, dessine = false, trace = false;
        var taille = function () { var r = cv.getBoundingClientRect(); cv.width = r.width * devicePixelRatio; cv.height = r.height * devicePixelRatio; ctx = cv.getContext("2d"); ctx.scale(devicePixelRatio, devicePixelRatio); ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.strokeStyle = "#0B1033"; };
        setTimeout(taille, 50);
        var pt = function (e) { var r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
        cv.addEventListener("pointerdown", function (e) { dessine = true; trace = true; cv.setPointerCapture(e.pointerId); var q = pt(e); ctx.beginPath(); ctx.moveTo(q[0], q[1]); });
        cv.addEventListener("pointermove", function (e) { if (!dessine) return; var q = pt(e); ctx.lineTo(q[0], q[1]); ctx.stroke(); });
        cv.addEventListener("pointerup", function () { dessine = false; });
        f.querySelector("#sig-eff").addEventListener("click", function () { ctx.clearRect(0, 0, cv.width, cv.height); trace = false; });
        f._signe = function () { return trace; };
      },
      onSubmit: function (f) {
        if (!f.travaux.value.trim() || !f.sign.value.trim() || !f._signe()) { A.toast("Travaux, nom et signature du client obligatoires", "warn"); return false; }
        var r = S.ajouter("rapports", { titre: titre, projetId: p ? p.id : "", demandeId: intervention ? intervention.id : "", technicien: f.tech.value, date: f.date.value, travaux: f.travaux.value.trim(), materiel: f.materiel.value.trim(), heures: Number(f.heures.value) || 0, signataire: f.sign.value.trim(), signature: f.querySelector("#sig").toDataURL("image/png") }, "RAP-");
        S.log("Rapport signé par le client", titre + " · " + r.signataire);
        A.toast("Rapport signé enregistré", "ok");
        window.open("document.html?type=rapport&rid=" + r.id, "_blank", "noopener");
        A.rafraichir();
      }
    });
  }
  A.rapportSigne = rapportSigne;

  /* =================== Helpdesk et tickets =================== */
  var SLA = { critique: 4, haute: 8, normale: 24, basse: 72 };
  var STT = [["nouveau", "Nouveau"], ["assigne", "Assigné"], ["encours", "En cours"], ["resolu", "Résolu"], ["ferme", "Fermé"]];
  function slaRestant(t) { return new Date(t.creeLe).getTime() + (SLA[t.priorite] || 24) * 3600e3 - (t.resoluLe ? new Date(t.resoluLe).getTime() : Date.now()); }
  A.slaRestant = slaRestant;
  function slaTexte(t) {
    var r = slaRestant(t), h = Math.floor(Math.abs(r) / 3600e3), m = Math.floor(Math.abs(r) % 3600e3 / 60e3);
    if (["resolu", "ferme"].indexOf(t.statut) > -1) return '<span class="sla ' + (r >= 0 ? "ok" : "late") + '">' + (r >= 0 ? "Dans les délais" : "Hors délai") + "</span>";
    return '<span class="sla ' + (r < 0 ? "late" : r < 2 * 3600e3 ? "soon" : "ok") + '">' + (r < 0 ? "Dépassé de " : "Reste ") + h + " h " + String(m).padStart(2, "0") + "</span>";
  }
  var filtreT = "ouverts";
  /* Historique d'un ticket : chaque changement de statut, d'assignation ou message y est noté */
  function noterTicket(id, entree, modif) {
    var t = S.liste("tickets").filter(function (x) { return x.id === id; })[0]; if (!t) return null;
    var h = (t.historique || [{ date: t.creeLe, statut: "nouveau", par: t.source === "Espace client" ? t.clientNom : "Équipe NextGenIT", texte: "Ticket créé" }]).slice();
    h.push(Object.assign({ date: new Date().toISOString(), par: A.moi().nom }, entree));
    return S.modifier("tickets", id, Object.assign({ historique: h, vuParAdmin: true }, modif || {}));
  }
  A.noterTicket = noterTicket;
  function libStatut(st) { return (STT.filter(function (x) { return x[0] === st; })[0] || [st, st])[1]; }
  function etapesTicket(t) {
    var ordre = ["nouveau", "assigne", "encours", "resolu", "ferme"], i = ordre.indexOf(t.statut);
    return '<ol class="tk-etapes">' + ordre.map(function (st, k) { return '<li class="' + (k < i ? "fait" : k === i ? "actuel" : "") + '"><span>' + (k < i ? "✓" : k + 1) + "</span>" + libStatut(st) + "</li>"; }).join("") + "</ol>";
  }
  /* Fenêtre « Ouvrir » : description complète, suivi et réponse */
  function ouvrirTicket(id) {
    var t = S.liste("tickets").filter(function (x) { return x.id === id; })[0];
    if (!t) { A.toast("Ticket introuvable", "warn"); return; }
    if (!t.vuParAdmin) t = S.modifier("tickets", t.id, { vuParAdmin: true });
    var h = t.historique || [{ date: t.creeLe, statut: "nouveau", par: t.clientNom, texte: "Ticket créé" }];
    A.modal({
      titre: t.id + " · " + t.sujet, large: true, valider: "Enregistrer", annuler: "Fermer",
      corps: etapesTicket(t) +
        '<div class="tk-desc"><div class="tk-meta"><span class="tag ' + (t.priorite === "critique" ? "tag-warn" : t.priorite === "haute" ? "tag-accent" : "tag-muted") + '">Priorité ' + esc(t.priorite) + "</span>" + slaTexte(t) + '<span class="muted">Ouvert le ' + A.heure(t.creeLe) + " · " + esc(t.source || "") + '</span></div><h3 style="margin:10px 0 6px">Description du client</h3><p style="white-space:pre-line">' + (esc(t.description) || '<span class="muted">Aucune description.</span>') + "</p>" +
        '<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px"><div class="row-item block"><small class="muted">Client</small><strong>' + esc(t.clientNom) + "</strong><span>" + esc(t.telephone || "") + "</span><span>" + esc(t.email || "") + '</span></div><div class="row-item block"><small class="muted">Technicien</small><strong>' + esc(nomDe(t.techId)) + "</strong></div>" + (t.demandeId ? '<div class="row-item block"><small class="muted">Intervention liée</small><strong>' + esc(t.demandeId) + "</strong></div>" : "") + "</div></div>" +
        '<div class="form-grid"><label class="field">Statut<select name="statut">' + A.options(STT, t.statut) + '</select></label><label class="field">Technicien<select name="tech"><option value="">—</option>' + A.options(personnel().filter(function (p) { return p.type === "technicien"; }).map(function (p) { return [p.id, p.nom + " (" + p.statut + ")"]; }), t.techId) + '</select></label><label class="field full">Message (facultatif)<textarea name="msg" style="min-height:70px" placeholder="Ex. Le technicien passe à 14 h. / Problème résolu : câble remplacé."></textarea></label><label style="display:flex;gap:8px;align-items:center;font-size:.9rem"><input type="checkbox" name="visible" checked> Visible par le client dans son espace</label></div>' +
        (t.avis ? '<div class="notice" style="margin:0;' + (t.avis.note <= 2 ? "background:var(--warn-soft);color:var(--warn)" : "") + '"><strong>Avis du client : ' + "★★★★★".slice(0, t.avis.note) + "☆☆☆☆☆".slice(t.avis.note) + " (" + t.avis.note + "/5)</strong>" + (t.avis.commentaire ? "<br>« " + esc(t.avis.commentaire) + " »" : "") + (t.avis.note <= 2 && !t.avis.traite ? ' <button type="button" class="btn btn-ghost btn-sm" id="tk-avis-ok">Marquer comme traité</button>' : "") + "</div>" : "") +
        '<h3 style="margin:6px 0">Suivi du ticket</h3><ul class="tk-histo">' + h.slice().reverse().map(function (x) { return "<li><b>" + A.heure(x.date) + "</b> · " + esc(x.par || "") + (x.statut ? ' · <span class="tag tag-muted">' + esc(libStatut(x.statut)) + "</span>" : "") + (x.texte ? "<br>" + esc(x.texte) : "") + (x.interne ? ' <small class="muted">(interne)</small>' : "") + "</li>"; }).join("") + "</ul>" +
        '<div class="send-row"><button class="btn btn-whatsapp" type="button" id="tk-wa">WhatsApp au client</button>' + (t.demandeId ? "" : '<button class="btn btn-ghost" type="button" id="tk-int">Créer une intervention</button>') + '<button class="btn btn-ghost danger-link" type="button" id="tk-suppr">🗑 Supprimer le ticket</button></div>',
      apres: function (form) {
        form.querySelector("#tk-wa").addEventListener("click", function () { wa(t.telephone, "Bonjour,\nVotre ticket " + t.id + " (« " + t.sujet + " ») est « " + libStatut(t.statut).toLowerCase() + " »" + (t.techId ? ", pris en charge par " + nomDe(t.techId) : "") + ".\nNextGenIT Helpdesk"); });
        var av = form.querySelector("#tk-avis-ok"); if (av) av.addEventListener("click", function () { S.modifier("tickets", t.id, { avis: Object.assign({}, t.avis, { traite: true, traitePar: A.moi().nom }) }); S.log("Avis négatif traité", t.id); av.replaceWith(document.createTextNode(" ✔ traité")); });
        form.querySelector("#tk-suppr").addEventListener("click", function () { supprimerTicket(t, function () { A.fermer(); }); });
        var bi = form.querySelector("#tk-int"); if (bi) bi.addEventListener("click", function () { A.fermer(); convertir(t); });
      },
      onSubmit: function (form) {
        var st = form.statut.value, tech = form.tech.value, msg = form.msg.value.trim();
        if (st === t.statut && tech === (t.techId || "") && !msg) return;
        var modif = { statut: st, techId: tech };
        if ((st === "resolu" || st === "ferme") && !t.resoluLe) modif.resoluLe = new Date().toISOString();
        if (st !== "resolu" && st !== "ferme") modif.resoluLe = null;
        var parts = [];
        if (st !== t.statut) parts.push("Statut : " + libStatut(st));
        if (tech !== (t.techId || "")) parts.push("Technicien : " + nomDe(tech));
        if (msg) parts.push(msg);
        noterTicket(t.id, { statut: st !== t.statut ? st : "", texte: parts.join(" · "), interne: !form.visible.checked }, modif);
        S.log("Ticket mis à jour", t.id + " · " + parts.join(" · "));
        A.toast("Ticket mis à jour", "ok"); A.rafraichir();
      }
    });
  }
  A.ouvrirTicket = ouvrirTicket;
  function supprimerTicket(t, apres) {
    var motif = prompt("Supprimer définitivement le ticket " + t.id + " (« " + t.sujet + " ») ?\nIndiquez la raison (ex. doublon, ouvert par erreur, spam) :", "Doublon");
    if (motif === null) return;
    S.retirer("tickets", t.id);
    S.log("Ticket supprimé", t.id + " · " + t.sujet + " · motif : " + (motif.trim() || "non précisé"));
    A.toast("Ticket supprimé", "ok"); if (apres) apres(); A.rafraichir();
  }
  function convertir(t) {
    var d = S.ajouterDemande({ type: "service", services: ["Dépannage"], description: "Ticket " + t.id + " : " + t.sujet + (t.description ? " – " + t.description : ""), nom: t.clientNom, telephone: t.telephone || "", email: "", adresse: "", canaux: ["WhatsApp"], urgence: t.priorite === "critique" ? "Critique – activité arrêtée" : "Prioritaire – sous 24 h", clientId: t.clientId || "" });
    S.majDemande(d.id, { statut: "accepte", techId: t.techId || "", etape: t.techId ? "assigne" : "" });
    noterTicket(t.id, { statut: t.statut === "nouveau" ? "assigne" : "", texte: "Intervention " + d.id + " créée" }, { demandeId: d.id, statut: t.statut === "nouveau" ? "assigne" : t.statut });
    S.log("Ticket converti en intervention", t.id + " → " + d.id); A.toast("Intervention " + d.id + " créée", "ok"); location.hash = "#interventions";
  }
  A.VUES.tickets = function () {
    var T = S.liste("tickets"), ouverts = T.filter(function (t) { return ["resolu", "ferme"].indexOf(t.statut) < 0; });
    var res = T.filter(function (t) { return t.resoluLe; });
    var moy = res.length ? res.reduce(function (a, t) { return a + (new Date(t.resoluLe) - new Date(t.creeLe)); }, 0) / res.length / 3600e3 : 0;
    var L = T.filter(function (t) { return filtreT === "tous" || (filtreT === "ouverts" ? ["resolu", "ferme"].indexOf(t.statut) < 0 : filtreT === "retard" ? ["resolu", "ferme"].indexOf(t.statut) < 0 && slaRestant(t) < 0 : ["resolu", "ferme"].indexOf(t.statut) > -1); });
    A.vue.innerHTML = A.entete("Helpdesk et tickets", "Les pannes signalées par les clients deviennent des tâches assignées avec un délai de réponse garanti (SLA)", '<button class="btn btn-primary" type="button" id="tk-new">+ Nouveau ticket</button>') +
      '<div class="kpis"><div class="kpi"><span>Tickets ouverts</span><strong data-count="' + ouverts.length + '">0</strong></div><div class="kpi"><span>Hors délai</span><strong style="color:var(--danger)" data-count="' + ouverts.filter(function (t) { return slaRestant(t) < 0; }).length + '">0</strong></div><div class="kpi"><span>Résolus ce mois</span><strong data-count="' + res.filter(function (t) { return A.moisDe(t.resoluLe) === A.MOIS; }).length + '">0</strong></div><div class="kpi"><span>Temps moyen de résolution</span><strong>' + (moy ? moy.toFixed(1).replace(".", ",") + " h" : "—") + "</strong></div></div>" +
      '<p class="muted" style="font-size:.88rem">Délais garantis : critique 4 h · haute 8 h · normale 24 h · basse 72 h.</p>' +
      '<div class="tabs" role="tablist">' + [["ouverts", "Ouverts"], ["retard", "Hors délai"], ["resolus", "Résolus"], ["tous", "Tous"]].map(function (o) { return '<button class="tab" type="button" role="tab" data-ft="' + o[0] + '" aria-selected="' + (filtreT === o[0]) + '">' + o[1] + "</button>"; }).join("") + "</div>" +
      '<div class="card"><div class="table-wrap"><table class="t" style="min-width:1020px"><thead><tr><th>Ticket</th><th>Client</th><th>Priorité</th><th>Délai</th><th>Technicien</th><th>Statut</th><th></th></tr></thead><tbody>' +
      (L.map(function (t) { return '<tr data-tk="' + t.id + '"' + (t.vuParAdmin ? "" : ' class="tk-nouveau"') + '><td><strong>' + t.id + "</strong>" + (t.vuParAdmin ? "" : ' <span class="tag tag-warn">Nouveau</span>') + "<br><small>" + esc(t.sujet) + "</small>" + (t.description ? '<br><small class="muted">' + esc(t.description.slice(0, 70)) + (t.description.length > 70 ? "…" : "") + "</small>" : "") + '<br><small class="muted">' + A.heure(t.creeLe) + " · " + esc(t.source || "") + "</small></td><td>" + esc(t.clientNom) + '<br><small class="muted">' + esc(t.telephone || "") + '</small></td><td><span class="tag ' + (t.priorite === "critique" ? "tag-warn" : t.priorite === "haute" ? "tag-accent" : "tag-muted") + '">' + esc(t.priorite) + "</span></td><td>" + slaTexte(t) + '</td><td><select class="inline-select" data-tk-tech aria-label="Technicien"><option value="">—</option>' + A.options(personnel().filter(function (p) { return p.type === "technicien"; }).map(function (p) { return [p.id, p.nom + " (" + p.statut + ")"]; }), t.techId) + '</select></td><td><select class="inline-select" data-tk-st aria-label="Statut">' + A.options(STT, t.statut) + '</select></td><td class="r" style="white-space:nowrap"><button class="btn btn-primary btn-sm" type="button" data-tk-open>👁 Ouvrir</button> <button class="btn btn-ghost btn-sm" type="button" data-tk-int>Intervention</button> <button class="btn btn-whatsapp btn-sm" type="button" data-tk-wa>WhatsApp</button> <button class="ico-btn danger" type="button" data-tk-suppr title="Supprimer le ticket" aria-label="Supprimer le ticket">🗑</button></td></tr>'; }).join("") || '<tr><td colspan="7" class="muted">Aucun ticket dans cette liste.</td></tr>') + "</tbody></table></div></div>";
    A.lier("[data-ft]", "click", function (e, b) { filtreT = b.dataset.ft; A.rafraichir(); });
    document.getElementById("tk-new").addEventListener("click", function () {
      A.modal({ titre: "Nouveau ticket", valider: "Créer le ticket", corps: '<div class="form-grid"><label class="field">Client<input name="client" required list="dl-tk"></label><label class="field">Téléphone<input name="tel" type="tel"></label><label class="field full">Sujet<input name="sujet" required placeholder="Ex. Internet coupé au bureau"></label><label class="field full">Description<textarea name="desc" style="min-height:80px"></textarea></label><label class="field">Priorité<select name="prio">' + A.options([["normale", "Normale (24 h)"], ["haute", "Haute (8 h)"], ["critique", "Critique (4 h)"], ["basse", "Basse (72 h)"]]) + '</select></label><label class="field">Reçu par<select name="src">' + A.options(["Téléphone", "WhatsApp", "Email", "Sur place"]) + '</select></label></div><datalist id="dl-tk">' + S.liste("clients").map(function (c) { return '<option value="' + esc(c.nom) + '">'; }).join("") + "</datalist>",
        onSubmit: function (f) { if (!f.client.value.trim() || !f.sujet.value.trim()) { A.toast("Client et sujet obligatoires", "warn"); return false; } var cl = S.liste("clients").filter(function (c) { return c.nom === f.client.value.trim(); })[0]; var t = S.ajouter("tickets", { clientNom: f.client.value.trim(), clientId: cl ? cl.id : "", telephone: f.tel.value.trim() || (cl ? cl.telephone : ""), sujet: f.sujet.value.trim(), description: f.desc.value.trim(), priorite: f.prio.value, source: f.src.value, statut: "nouveau", vuParAdmin: true, historique: [{ date: new Date().toISOString(), statut: "nouveau", par: A.moi().nom, texte: "Ticket créé (" + f.src.value + ")" }] }, "TK-" + String(Date.now()).slice(-4) + "-"); S.log("Ticket créé", t.id + " · " + t.sujet); A.rafraichir(); A.toast("Ticket " + t.id + " créé", "ok"); } });
    });
    A.lier("[data-tk-tech]", "change", function (e, s) { var id = s.closest("[data-tk]").dataset.tk, t0 = S.liste("tickets").filter(function (x) { return x.id === id; })[0], st = s.value ? (t0.statut === "nouveau" ? "assigne" : t0.statut) : "nouveau"; noterTicket(id, { statut: st !== t0.statut ? st : "", texte: "Technicien : " + nomDe(s.value) }, { techId: s.value, statut: st }); S.log("Ticket assigné", id + " → " + nomDe(s.value)); A.rafraichir(); });
    A.lier("[data-tk-open]", "click", function (e, b) { ouvrirTicket(b.closest("[data-tk]").dataset.tk); });
    A.lier("[data-tk-suppr]", "click", function (e, b) { supprimerTicket(S.liste("tickets").filter(function (x) { return x.id === b.closest("[data-tk]").dataset.tk; })[0]); });
    A.lier("[data-tk-st]", "change", function (e, s) { var id = s.closest("[data-tk]").dataset.tk, m = { statut: s.value }; if (s.value === "resolu" || s.value === "ferme") m.resoluLe = m.resoluLe || new Date().toISOString(); var t = noterTicket(id, { statut: s.value, texte: "Statut : " + libStatut(s.value) }, m); S.log("Ticket " + s.options[s.selectedIndex].text.toLowerCase(), id + " · " + t.sujet); A.rafraichir(); });
    A.lier("[data-tk-wa]", "click", function (e, b) { var t = S.liste("tickets").filter(function (x) { return x.id === b.closest("[data-tk]").dataset.tk; })[0]; wa(t.telephone, "Bonjour,\nVotre ticket " + t.id + " (« " + t.sujet + " ») est « " + STT.filter(function (x) { return x[0] === t.statut; })[0][1].toLowerCase() + " »" + (t.techId ? ", pris en charge par " + nomDe(t.techId) : "") + ".\nNextGenIT Helpdesk"); });
    A.lier("[data-tk-int]", "click", function (e, b) { convertir(S.liste("tickets").filter(function (x) { return x.id === b.closest("[data-tk]").dataset.tk; })[0]); });
    var ouvrirId = location.hash.split("/")[1];
    if (ouvrirId) { history.replaceState(null, "", "#tickets"); ouvrirTicket(decodeURIComponent(ouvrirId)); }
  };

  /* =================== Stock et matériel =================== */
  var CAT_STOCK = ["Réseau", "Vidéosurveillance", "Postes et serveurs", "Câbles et connectique", "Énergie", "Consommables"];
  A.VUES.stock = function () {
    var AR = S.liste("articles"), M = S.liste("mouvements");
    var valeur = AR.reduce(function (a, x) { return a + Number(x.quantite) * Number(x.prixAchat || 0); }, 0);
    A.vue.innerHTML = A.entete("Stock et matériel", "Routeurs, caméras, câbles, PC : entrées, sorties, affectations aux projets et ventes", '<button class="btn btn-primary" type="button" id="ar-new">+ Article</button>') +
      '<div class="kpis"><div class="kpi"><span>Valeur du stock (achat)</span><strong data-count="' + valeur + '" data-format="argent">0</strong></div><div class="kpi"><span>Articles</span><strong data-count="' + AR.length + '">0</strong></div><div class="kpi"><span>Sous le seuil</span><strong style="color:var(--warn)" data-count="' + AR.filter(function (a) { return Number(a.quantite) <= Number(a.seuil || 0); }).length + '">0</strong></div></div>' +
      '<div class="card"><div class="table-wrap"><table class="t" style="min-width:1000px"><thead><tr><th>Article</th><th>Catégorie</th><th class="r">Quantité</th><th class="r">Prix d’achat</th><th class="r">Prix de vente</th><th>Emplacement</th><th></th></tr></thead><tbody>' +
      (AR.map(function (a) { var bas = Number(a.quantite) <= Number(a.seuil || 0); return '<tr data-ar="' + a.id + '"><td><strong>' + esc(a.nom) + '</strong>' + (a.boutique ? ' <span class="tag tag-ok">Boutique</span>' : "") + '<br><small class="muted">' + esc(a.reference || "") + "</small></td><td>" + esc(a.categorie) + '</td><td class="r"><strong class="' + (bas ? "down" : "") + '">' + a.quantite + '</strong><br><small class="muted">seuil ' + (a.seuil || 0) + '</small></td><td class="r">' + argent(a.prixAchat) + '</td><td class="r">' + argent(a.prixVente) + "</td><td>" + esc(a.emplacement || "") + '</td><td class="r" style="white-space:nowrap"><button class="btn btn-ghost btn-sm" type="button" data-mv="entree">Entrée</button> <button class="btn btn-ghost btn-sm" type="button" data-mv="sortie">Sortie</button> <button class="ico-btn" type="button" data-ar-edit title="Modifier" aria-label="Modifier l’article">✎</button><button class="ico-btn danger" type="button" data-ar-suppr title="Supprimer" aria-label="Supprimer l’article">🗑</button></td></tr>'; }).join("") || '<tr><td colspan="7" class="muted">Aucun article.</td></tr>') + "</tbody></table></div></div>" +
      '<div class="card mt-2"><h2 class="h-card">Mouvements de stock</h2><div class="table-wrap"><table class="t"><thead><tr><th>Date</th><th>Article</th><th>Mouvement</th><th class="r">Qté</th><th>Affectation</th><th>Par</th><th></th></tr></thead><tbody>' +
      (M.slice(0, 80).map(function (m) { var a = AR.filter(function (x) { return x.id === m.articleId; })[0]; return '<tr data-mv="' + m.id + '"><td>' + A.heure(m.creeLe) + "</td><td>" + esc(a ? a.nom : "?") + '</td><td><span class="tag ' + (m.type === "entree" ? "tag-ok" : "tag-warn") + '">' + esc({ entree: "Entrée", sortie: "Sortie", affectation: "Affecté à un projet", vente: "Vendu" }[m.type]) + '</span></td><td class="r">' + m.quantite + "</td><td>" + esc(m.cible || "") + "</td><td>" + esc(m.par) + '</td><td class="r"><button class="ico-btn danger" type="button" data-mv-suppr title="Annuler ce mouvement" aria-label="Annuler ce mouvement">🗑</button></td></tr>'; }).join("") || '<tr><td colspan="7" class="muted">Aucun mouvement.</td></tr>') + "</tbody></table></div></div>";
    document.getElementById("ar-new").addEventListener("click", function () { formArticle(null); });
    A.lier("[data-ar-suppr]", "click", function (e, b) { var a = S.liste("articles").filter(function (x) { return x.id === b.closest("[data-ar]").dataset.ar; })[0]; if (a && confirm("Supprimer l’article « " + a.nom + " » du stock ?")) { S.retirer("articles", a.id); S.log("Article supprimé", a.nom); A.toast("Article supprimé", "ok"); A.rafraichir(); } });
    A.lier("[data-mv-suppr]", "click", function (e, b) {
      var m = S.liste("mouvements").filter(function (x) { return x.id === b.closest("[data-mv]").dataset.mv; })[0], a = S.liste("articles").filter(function (x) { return x.id === m.articleId; })[0];
      if (!confirm("Annuler ce mouvement (" + m.quantite + " × " + (a ? a.nom : "article") + ") ? La quantité en stock sera corrigée.")) return;
      if (a) S.modifier("articles", a.id, { quantite: Number(a.quantite) + (m.type === "entree" ? -m.quantite : m.quantite) });
      S.retirer("mouvements", m.id); S.log("Mouvement de stock annulé", (a ? a.nom : "") + " · " + m.quantite); A.rafraichir();
    });
    A.lier("[data-ar-edit]", "click", function (e, b) { formArticle(S.liste("articles").filter(function (x) { return x.id === b.closest("[data-ar]").dataset.ar; })[0]); });
    A.lier("[data-mv]", "click", function (e, b) {
      var a = S.liste("articles").filter(function (x) { return x.id === b.closest("[data-ar]").dataset.ar; })[0], entree = b.dataset.mv === "entree";
      A.modal({ titre: (entree ? "Entrée en stock · " : "Sortie de stock · ") + a.nom, valider: "Enregistrer",
        corps: '<div class="form-grid"><label class="field">Quantité<input name="q" type="number" min="1" step="1" value="1" required></label>' + (entree ? '<label class="field">Fournisseur / bon de commande<input name="cible"></label>' : '<label class="field">Type de sortie<select name="type">' + A.options([["affectation", "Affecté à un projet"], ["vente", "Vendu à un client"], ["sortie", "Autre sortie"]]) + '</select></label><label class="field full">Projet ou client<input name="cible" list="dl-mv"></label><datalist id="dl-mv">' + S.liste("projets").map(function (p) { return '<option value="' + esc(p.nom) + '">'; }).join("") + S.liste("clients").map(function (c) { return '<option value="' + esc(c.nom) + '">'; }).join("") + "</datalist>") + "</div>",
        onSubmit: function (f) {
          var q = Math.max(1, Number(f.q.value) || 1);
          if (!entree && q > Number(a.quantite)) { A.toast("Stock insuffisant (" + a.quantite + ")", "warn"); return false; }
          S.modifier("articles", a.id, { quantite: Number(a.quantite) + (entree ? q : -q) });
          S.ajouter("mouvements", { articleId: a.id, type: entree ? "entree" : f.type.value, quantite: q, cible: f.cible.value.trim(), par: A.moi().nom }, "MV-");
          S.log(entree ? "Entrée en stock" : "Sortie de stock", a.nom + " · " + q + (f.cible.value ? " · " + f.cible.value.trim() : ""));
          A.rafraichir();
        } });
    });
  };
  function formArticle(a) {
    var n = !a;
    a = a || { nom: "", reference: "", categorie: "Réseau", quantite: 0, seuil: 2, prixAchat: 0, prixVente: 0, emplacement: "Magasin Kolwezi" };
    A.modal({ titre: n ? "Nouvel article" : "Modifier " + a.nom, valider: "Enregistrer",
      corps: '<div class="form-grid"><label class="field full">Désignation<input name="nom" required value="' + esc(a.nom) + '"></label><label class="field">Référence<input name="ref" value="' + esc(a.reference) + '"></label><label class="field">Catégorie<select name="cat">' + A.options(CAT_STOCK, a.categorie) + '</select></label>' + (n ? '<label class="field">Quantité initiale<input name="q" type="number" min="0" value="0"></label>' : "") + '<label class="field">Seuil d’alerte<input name="seuil" type="number" min="0" value="' + a.seuil + '"></label><label class="field">Prix d’achat ($)<input name="pa" type="number" min="0" step="0.01" value="' + a.prixAchat + '"></label><label class="field">Prix de vente ($)<input name="pv" type="number" min="0" step="0.01" value="' + a.prixVente + '"></label><label class="field full">Emplacement<input name="empl" value="' + esc(a.emplacement || "") + '"></label><label class="field full">Description pour la boutique<textarea name="desc" style="min-height:70px" placeholder="Ex. Caméra 4K vision nocturne 30 m, garantie 1 an">' + esc(a.description || "") + '</textarea></label><label class="field">Photo du produit<input name="photo" type="file" accept="image/*"></label><label class="field" style="flex-direction:row;align-items:center;gap:10px"><input type="checkbox" name="boutique"' + (a.boutique ? " checked" : "") + ' style="width:20px;height:20px"> Afficher au catalogue du site (sans prix : le client demande un prix en privé)</label></div>' + (n ? "" : '<button type="button" class="btn btn-ghost btn-sm danger-link" id="ar-suppr" style="justify-self:start">Supprimer l’article</button>'),
      apres: function (f) { var b = f.querySelector("#ar-suppr"); if (b) b.addEventListener("click", function () { if (confirm("Supprimer " + a.nom + " ?")) { S.retirer("articles", a.id); S.log("Article supprimé", a.nom); A.fermer(); A.rafraichir(); } }); },
      onSubmit: function (f) {
        if (!f.nom.value.trim()) { A.toast("Désignation obligatoire", "warn"); return false; }
        var data = { nom: f.nom.value.trim(), reference: f.ref.value.trim(), categorie: f.cat.value, seuil: Number(f.seuil.value) || 0, prixAchat: Number(f.pa.value) || 0, prixVente: Number(f.pv.value) || 0, emplacement: f.empl.value.trim(), description: f.desc.value.trim(), boutique: f.boutique.checked };
        var fin = function () {
          if (n) { data.quantite = Number(f.q.value) || 0; var x = S.ajouter("articles", data, "ART-"); if (data.quantite) S.ajouter("mouvements", { articleId: x.id, type: "entree", quantite: data.quantite, cible: "Stock initial", par: A.moi().nom }, "MV-"); S.log("Article créé", data.nom); }
          else { S.modifier("articles", a.id, data); S.log("Article modifié", data.nom); }
          A.rafraichir();
        };
        if (f.photo.files[0]) return A.redimensionner(f.photo.files[0], 520).then(function (u) { data.photo = u; fin(); });
        fin();
      } });
  }
  /* =================== Calendrier partagé : interventions, séances, projets, échéances =================== */
  var calDebut = null, calVue = "semaine", calTech = "", calTypes = { intervention: 1, seance: 1, projet: 1, echeance: 1 };
  var TYPES_CAL = { intervention: ["🛠", "Interventions", "#0b4aa2"], seance: ["🎓", "Séances de formation", "#0f8a5f"], projet: ["📁", "Projets et tâches", "#7c3aed"], echeance: ["💳", "Échéances", "#d97706"] };
  function iso(d) { return d.toISOString().slice(0, 10); }
  function lundi(d) { d = new Date(d); d.setHours(12, 0, 0, 0); var j = (d.getDay() + 6) % 7; d.setDate(d.getDate() - j); return d; }
  function evenements(d1, d2) {
    var E = [], dans = function (x) { return x && x >= d1 && x <= d2; };
    S.demandes().forEach(function (d) { if (dans(d.datePrevue) && d.statut !== "cloture") E.push({ date: d.datePrevue, type: "intervention", titre: d.id + " · " + (d.entreprise || d.nom), sous: (d.services || []).join(", "), tech: d.techId || "", lien: "#interventions" }); });
    S.formations().forEach(function (f) {
      (f.seances || []).forEach(function (se) { if (dans(se.date)) E.push({ date: se.date, type: "seance", titre: f.titre, sous: se.titre || "Séance", tech: "", lien: "#suivi" }); });
      if (dans(f.debut)) E.push({ date: f.debut, type: "seance", titre: "Début : " + f.titre, sous: f.formateur || "", lien: "#formations" });
      if (dans(f.fin)) E.push({ date: f.fin, type: "seance", titre: "Fin : " + f.titre, sous: "", lien: "#formations" });
    });
    S.liste("taches").forEach(function (t) { if (dans(t.echeance) && t.statut !== "termine") E.push({ date: t.echeance, type: "projet", titre: t.titre, sous: "Tâche", tech: t.techId || "", lien: "#projets" }); });
    S.liste("projets").forEach(function (p) { if (dans(p.fin) && p.statut !== "termine") E.push({ date: p.fin, type: "projet", titre: "Livraison : " + p.nom, sous: p.clientNom, tech: p.responsableId || "", lien: "#projets" }); });
    S.liste("factures").forEach(function (x) { if (dans(x.echeance) && ["emise", "partielle"].indexOf(x.statut) > -1) E.push({ date: x.echeance, type: "echeance", titre: x.numero + " · " + x.clientNom, sous: "Échéance de facture", lien: "#factures/" + x.id }); });
    S.liste("abonnements").forEach(function (a) { if (dans(a.prochaine) && a.actif) E.push({ date: a.prochaine, type: "echeance", titre: a.service, sous: a.clientNom, lien: "#factures" }); });
    return E.filter(function (e) { return calTypes[e.type] && (!calTech || e.tech === calTech); });
  }
  A.VUES.calendrier = function () {
    if (!calDebut) calDebut = calVue === "mois" ? new Date(new Date().getFullYear(), new Date().getMonth(), 1, 12) : lundi(new Date());
    var aujourdhui = iso(new Date()), jours = [];
    if (calVue === "semaine") { for (var k = 0; k < 7; k++) { var d = new Date(calDebut); d.setDate(d.getDate() + k); jours.push(d); } }
    else { var m0 = new Date(calDebut.getFullYear(), calDebut.getMonth(), 1, 12), dep = lundi(m0); for (var k2 = 0; k2 < 42; k2++) { var d2 = new Date(dep); d2.setDate(d2.getDate() + k2); jours.push(d2); } }
    var E = evenements(iso(jours[0]), iso(jours[jours.length - 1]));
    var titre = calVue === "semaine" ? "Semaine du " + calDebut.toLocaleDateString("fr-FR", { day: "numeric", month: "long" }) + " au " + jours[6].toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : calDebut.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    A.vue.innerHTML = A.entete("Calendrier partagé", "Interventions, séances de formation, projets et échéances, pour toute l’équipe") +
      '<div class="card"><div class="cal-barre"><div class="hero-actions"><button class="ico-btn" type="button" data-cal="-1" aria-label="Période précédente">‹</button><button class="btn btn-ghost btn-sm" type="button" data-cal="0">Aujourd’hui</button><button class="ico-btn" type="button" data-cal="1" aria-label="Période suivante">›</button><strong class="cal-titre">' + esc(titre) + '</strong></div><div class="hero-actions"><select id="cal-tech" aria-label="Technicien"><option value="">Toute l’équipe</option>' + A.options(S.liste("personnel").filter(function (p) { return p.actif !== false; }).map(function (p) { return [p.id, p.nom]; }), calTech) + '</select><div class="seg" role="group" aria-label="Affichage"><button type="button" data-cv="semaine" aria-pressed="' + (calVue === "semaine") + '">Semaine</button><button type="button" data-cv="mois" aria-pressed="' + (calVue === "mois") + '">Mois</button></div></div></div>' +
      '<div class="chips filtres">' + Object.keys(TYPES_CAL).map(function (t) { return '<button type="button" class="filtre' + (calTypes[t] ? " on" : "") + '" data-ct="' + t + '" style="' + (calTypes[t] ? "background:" + TYPES_CAL[t][2] + ";border-color:" + TYPES_CAL[t][2] : "") + '">' + TYPES_CAL[t][0] + " " + TYPES_CAL[t][1] + " <b>" + E.filter(function (e) { return e.type === t; }).length + "</b></button>"; }).join("") + "</div>" +
      '<div class="cal-grille ' + calVue + '">' + ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map(function (j) { return '<div class="cal-jtete">' + j + "</div>"; }).join("") +
      jours.map(function (d) {
        var k = iso(d), ev = E.filter(function (e) { return e.date === k; }), hors = calVue === "mois" && d.getMonth() !== calDebut.getMonth();
        return '<div class="cal-jour' + (k === aujourdhui ? " auj" : "") + (hors ? " hors" : "") + '"><div class="cal-num">' + d.getDate() + (calVue === "semaine" ? " " + d.toLocaleDateString("fr-FR", { month: "short" }) : "") + "</div>" + ev.slice(0, calVue === "mois" ? 3 : 20).map(function (e) { var t = TYPES_CAL[e.type]; return '<a class="cal-ev" href="' + e.lien + '" style="--c:' + t[2] + '" title="' + esc(e.titre + (e.sous ? " · " + e.sous : "")) + '"><span>' + t[0] + "</span><span><b>" + esc(e.titre) + "</b>" + (calVue === "semaine" && e.sous ? "<small>" + esc(e.sous) + "</small>" : "") + (calVue === "semaine" && e.tech ? "<small>👷 " + esc(nomDe(e.tech)) + "</small>" : "") + "</span></a>"; }).join("") + (ev.length > 3 && calVue === "mois" ? '<small class="muted">+' + (ev.length - 3) + " autre(s)</small>" : "") + "</div>";
      }).join("") + "</div></div>";
    A.lier("[data-cal]", "click", function (e, b) { var n = Number(b.dataset.cal); if (!n) calDebut = calVue === "mois" ? new Date(new Date().getFullYear(), new Date().getMonth(), 1, 12) : lundi(new Date()); else if (calVue === "mois") calDebut = new Date(calDebut.getFullYear(), calDebut.getMonth() + n, 1, 12); else { calDebut = new Date(calDebut); calDebut.setDate(calDebut.getDate() + 7 * n); } A.rafraichir(); });
    A.lier("[data-cv]", "click", function (e, b) { calVue = b.dataset.cv; calDebut = null; A.rafraichir(); });
    A.lier("[data-ct]", "click", function (e, b) { calTypes[b.dataset.ct] = calTypes[b.dataset.ct] ? 0 : 1; A.rafraichir(); });
    document.getElementById("cal-tech").addEventListener("change", function (e) { calTech = e.target.value; A.rafraichir(); });
  };
})();
