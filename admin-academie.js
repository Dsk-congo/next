/* Administration – Académie : formations et cours, inscriptions, comptes étudiants, présences, notes, attestations */
(function () {
  var A = window.NGA, S = A.S, esc = A.esc, argent = A.argent, jour = A.jour;
  var NIVEAUX = ["Débutant", "Intermédiaire", "Avancé", "Tous niveaux", "Entreprises"];
  var MODES = ["Présentiel", "En ligne", "Présentiel + en ligne", "Pratique terrain", "Dans vos locaux"];
  var TYPES_L = [["video", "Vidéo (fichier)"], ["youtube", "Vidéo (lien YouTube ou autre)"], ["pdf", "Support PDF"], ["doc", "Document (Word, PowerPoint, ZIP…)"], ["texte", "Leçon écrite"], ["quiz", "Quiz"], ["examen", "Examen chronométré (questions tirées au hasard)"], ["tp", "Travail pratique à rendre"], ["lien", "Document en ligne (lien PDF, Google Drive, site…)"]];
  var ABR = { video: "MP4", youtube: "VID", pdf: "PDF", doc: "DOC", texte: "TXT", quiz: "QCM", examen: "EXAM", tp: "TP", lien: "LIEN" };

  function formations() { return S.formations(); }
  function blocages() { try { return JSON.parse(localStorage.getItem("ng_blocage_comptes") || "{}"); } catch (e) { return {}; } }
  function bloque(cle) { var x = blocages()[cle]; return !!(x && x.jusqua && x.jusqua > Date.now()); }
  function formation(id) { return formations().filter(function (f) { return f.id === id; })[0]; }
  function majFormation(id, modif) { S.enregistrerFormations(formations().map(function (f) { return f.id === id ? Object.assign({}, f, modif) : f; })); }
  function comptes(fid) { return S.liste("comptes_etudiants").filter(function (e) { return !fid || e.formationId === fid; }); }
  function lecons(f) { var out = []; (f.modules || []).forEach(function (m) { (m.lecons || []).forEach(function (l) { out.push(l); }); }); return out; }
  function stats(e, f) {
    f = f || formation(e.formationId) || {};
    var se = f.seances || [], L = lecons(f);
    var pres = se.length ? Math.round(se.filter(function (s) { return (s.presents || []).indexOf(e.id) > -1; }).length / se.length * 100) : null;
    var notes = (f.evaluations || []).map(function (ev) { return (e.notes || {})[ev.id]; }).filter(function (n) { return n !== undefined && n !== null && n !== ""; }).map(Number);
    var quiz = Object.keys(e.quiz || {}).map(function (k) { return Number(e.quiz[k]); });
    Object.keys(e.rendus || {}).forEach(function (k) { if (e.rendus[k].note != null) notes.push(Number(e.rendus[k].note)); });
    Object.keys(e.devoirs || {}).forEach(function (k) { if (e.devoirs[k].note != null) notes.push(Number(e.devoirs[k].note)); });
    var all = notes.length ? notes : quiz;
    var moy = all.length ? Math.round(all.reduce(function (a, b) { return a + b; }, 0) / all.length) : null;
    var prog = L.length ? Math.round(L.filter(function (l) { return (e.lecons || {})[l.id]; }).length / L.length * 100) : 0;
    return { presence: pres, moyenne: moy, progression: prog, eligible: pres !== null && pres >= 80 && moy !== null && moy >= 50 };
  }
  A.statsEtudiant = stats;
  function lien(f) { return location.href.split("/admin")[0] + "/connexion.html?etudiant"; }
  function msgBienvenue(e, f, mdp, tarif) {
    return "Bonjour " + e.nom + ",\n\nBienvenue à la NextGenIT Academy ! 🎓\nVotre inscription à la formation « " + f.titre + " » est confirmée.\n📅 " + f.periode + " · " + f.duree + " · " + f.mode + "\n\nVos accès à l’espace étudiant :\n🔗 " + lien(f) + "\n👤 Identifiant : " + e.identifiant + "\n🔑 Mot de passe : " + mdp + "\n(Changez-le à votre première connexion.)\n\nVous y trouverez les cours, les vidéos, les supports PDF, les quiz et vos notes." + (tarif ? "\n\n💳 Frais de formation : " + argent(tarif) + ". Paiement par M-Pesa, Orange Money, Airtel Money, carte ou virement." : "") + "\n\nBonne formation !\nL’équipe NextGenIT";
  }
  function envoyer(canal, e, msg, sujet) {
    var tel = String(e.telephone || "").replace(/[^\d]/g, "");
    var url = canal === "wa" ? "https://wa.me/" + tel + "?text=" + encodeURIComponent(msg) : canal === "mail" ? "mailto:" + encodeURIComponent(e.email || "") + "?subject=" + encodeURIComponent(sujet) + "&body=" + encodeURIComponent(msg) : "sms:" + tel + "?body=" + encodeURIComponent(msg);
    window.open(url, "_blank", "noopener");
  }
  function creerCompte(data) {
    var mdp = A.motDePasse();
    var ident = (data.email || "").toLowerCase() || ("ng-etu-" + String(Date.now()).slice(-5));
    if (S.liste("comptes_etudiants").some(function (x) { return x.identifiant === ident; })) ident = ident.replace("@", "+" + String(Date.now()).slice(-3) + "@");
    return A.sha256(ident.toLowerCase() + ":" + mdp).then(function (h) {
      var e = S.ajouter("comptes_etudiants", Object.assign({ identifiant: ident, hash: h, actif: true, lecons: {}, quiz: {}, notes: {}, doitChanger: true }, data), "ETU-");
      return { e: e, mdp: mdp };
    });
  }

  /* =================== Formations et cours =================== */
  A.VUES.formations = function () {
    var F = formations(), E = comptes();
    var att = S.journal().filter(function (j) { return j.action === "Attestation délivrée"; }).length;
    A.vue.innerHTML = A.entete("Formations et cours", "Créez les formations, leurs modules et leçons (vidéos, PDF, quiz) et les évaluations", '<button class="btn btn-primary" type="button" id="fo-new">+ Nouvelle formation</button>') +
      '<div class="kpis"><div class="kpi"><span>Formations publiées</span><strong data-count="' + F.filter(function (f) { return f.publie !== false; }).length + '">0</strong></div><div class="kpi"><span>En cours</span><strong data-count="' + F.filter(function (f) { return f.statut === "encours"; }).length + '">0</strong></div><div class="kpi"><span>Étudiants actifs</span><strong data-count="' + E.filter(function (e) { return e.actif; }).length + '">0</strong></div><div class="kpi"><span>Attestations délivrées</span><strong data-count="' + att + '">0</strong></div></div>' +
      '<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(min(100%,340px),1fr))">' + F.map(function (f, i) {
        var n = comptes(f.id).length, L = lecons(f);
        var tag = f.statut === "ouverte" ? '<span class="tag tag-ok">À venir</span>' : f.statut === "encours" ? '<span class="tag tag-accent">En cours</span>' : '<span class="tag tag-muted">Terminée</span>';
        return '<article class="card course-card" data-f="' + f.id + '"><div class="cover"' + (f.image ? ' style="background:url(' + "'" + esc(f.image) + "'" + ') center/cover"' : ' style="filter:hue-rotate(' + (i * 37 % 120) + 'deg)"') + '></div><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap">' + tag + '<span class="muted" style="font-size:.85rem">' + esc(f.mode) + "</span></div><h2 class=\"h-card\">" + esc(f.titre) + '</h2><p>' + esc(f.periode) + " · " + esc(f.duree) + " · " + esc(f.formateur || "Formateur à définir") + '</p>' +
          '<div style="display:flex;justify-content:space-between;font-size:.88rem"><span class="muted">Avancement de la session</span><strong>' + f.avancement + ' %</strong></div><div class="progress"><span style="width:' + f.avancement + '%"></span></div>' +
          '<div class="chips"><span class="tag tag-muted">' + n + " / " + (f.places || "∞") + ' inscrits</span><span class="tag tag-muted">' + (f.modules || []).length + " modules · " + L.length + ' leçons</span><span class="tag tag-muted">' + (f.evaluations || []).length + ' évaluations</span><span class="tag tag-accent">' + esc(S.domaineFormation(f)) + "</span></div>" +
          '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:.9rem"><span>Publiée sur le site</span>' + A.interrupteur("data-pub", f.publie !== false, "Publier " + f.titre) + '</div><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:.9rem"><span>Inscriptions ouvertes</span>' + A.interrupteur("data-ins", f.inscriptionsOuvertes !== false, "Inscriptions " + f.titre) + "</div>" +
          '<div class="foot"><button class="btn btn-primary btn-sm" type="button" data-cours>Contenu du cours</button><button class="btn btn-ghost btn-sm" type="button" data-fedit>Modifier</button></div></article>';
      }).join("") + "</div>";
    document.getElementById("fo-new").addEventListener("click", function () { formFormation(null); });
    A.lier("[data-fedit]", "click", function (e, b) { formFormation(formation(b.closest("[data-f]").dataset.f)); });
    A.lier("[data-cours]", "click", function (e, b) { editeurCours(b.closest("[data-f]").dataset.f); });
    A.lier("[data-pub]", "click", function (e, b) { var id = b.closest("[data-f]").dataset.f, v = b.getAttribute("aria-checked") !== "true"; majFormation(id, { publie: v }); S.log(v ? "Formation publiée" : "Formation retirée du site", formation(id).titre); A.rafraichir(); });
    A.lier("[data-ins]", "click", function (e, b) { var id = b.closest("[data-f]").dataset.f, v = b.getAttribute("aria-checked") !== "true"; majFormation(id, { inscriptionsOuvertes: v }); S.log(v ? "Inscriptions ouvertes" : "Inscriptions fermées", formation(id).titre); A.rafraichir(); });
  };
  function formFormation(f) {
    var n = !f;
    f = f || { titre: "", texte: "", debut: "", fin: "", duree: "", niveau: "Intermédiaire", mode: "Présentiel", places: 15, formateur: "", programme: [] };
    var formateurs = S.liste("personnel").filter(function (p) { return p.actif; }).map(function (p) { return p.nom; });
    A.modal({
      titre: n ? "Nouvelle formation" : "Modifier la formation", valider: "Enregistrer", large: true,
      corps: '<div class="form-grid"><label class="field full">Titre<input name="titre" required value="' + esc(f.titre) + '"></label><label class="field full">Description<textarea name="texte" style="min-height:80px">' + esc(f.texte) + '</textarea></label><label class="field">Début<input name="debut" type="date" required value="' + esc(f.debut) + '"></label><label class="field">Fin<input name="fin" type="date" required value="' + esc(f.fin) + '"></label><label class="field">Durée<input name="duree" value="' + esc(f.duree) + '" placeholder="Ex. 48 h"></label><label class="field">Places<input name="places" type="number" min="1" value="' + esc(f.places) + '"></label><label class="field">Domaine (pour cibler les contenus)<select name="domaine">' + A.options(S.DOMAINES, S.domaineFormation(f.titre ? f : { titre: "" })) + '</select></label><label class="field">Niveau<select name="niveau">' + A.options(NIVEAUX, f.niveau) + '</select></label><label class="field">Mode<select name="mode">' + A.options(MODES, f.mode) + '</select></label><label class="field">Formateur<select name="formateur"><option value="">—</option>' + A.options(formateurs, f.formateur) + '</select></label><label class="field">Tarif indicatif ($, interne)<input name="tarif" type="number" min="0" value="' + esc(f.tarif || "") + '"><small>Jamais affiché sur le site public.</small></label><label class="field full">Programme (un module par ligne)<textarea name="prog" style="min-height:110px">' + esc((f.programme || []).join("\n")) + '</textarea></label>' +
        '<div class="field full"><span>Image d’affichage (couverture de la formation)</span><div class="img-couv" id="img-couv">' + (f.image ? '<img src="' + esc(f.image) + '" alt="">' : "<span>Aucune image : un dégradé aux couleurs NextGenIT est utilisé</span>") + '</div><div class="hero-actions"><label class="btn btn-ghost btn-sm" style="cursor:pointer">🖼 Choisir une image<input type="file" name="image" accept="image/*" class="sr-only"></label>' + (f.image ? '<label style="display:flex;gap:6px;align-items:center;font-size:.9rem"><input type="checkbox" name="sansImage"> Retirer l’image</label>' : "") + '</div><small class="muted">Format paysage conseillé (ex. 1200 × 600). Elle apparaît sur le site, dans l’espace étudiant et dans l’administration.</small></div></div>' + (n ? "" : '<button type="button" class="btn btn-ghost btn-sm danger-link" id="fo-suppr" style="justify-self:start">Supprimer la formation</button>'),
      apres: function (form) { form.image.addEventListener("change", function () { var fi = form.image.files[0]; if (fi) { var u = URL.createObjectURL(fi); document.getElementById("img-couv").innerHTML = '<img src="' + u + '" alt="">'; } }); var b = form.querySelector("#fo-suppr"); if (b) b.addEventListener("click", function () { if (confirm("Supprimer « " + f.titre + " » ?")) { S.enregistrerFormations(formations().filter(function (x) { return x.id !== f.id; })); S.log("Formation supprimée", f.titre); A.fermer(); A.rafraichir(); } }); },
      onSubmit: function (form) {
        if (!form.titre.value.trim() || !form.debut.value || !form.fin.value) { A.toast("Titre et dates obligatoires", "warn"); return false; }
        if (form.fin.value < form.debut.value) { A.toast("La fin doit être après le début", "warn"); return false; }
        var prog = form.prog.value.split("\n").map(function (x) { return x.trim(); }).filter(Boolean);
        var data = { titre: form.titre.value.trim(), texte: form.texte.value.trim(), debut: form.debut.value, fin: form.fin.value, duree: form.duree.value.trim(), places: Number(form.places.value) || 0, niveau: form.niveau.value, domaine: form.domaine.value, mode: form.mode.value, formateur: form.formateur.value, tarif: Number(form.tarif.value) || 0, programme: prog };
        var mods = (f.modules || []).slice();
        prog.forEach(function (p, i) { if (!mods.some(function (m) { return m.titre === p; })) mods.push({ id: "M" + i + Date.now().toString(36), titre: p, lecons: [] }); });
        data.modules = mods;
        var fic = form.image.files[0];
        if (fic) return A.redimensionner(fic, 800).then(function (u) { data.image = u; enregistrerF(data); });
        if (form.sansImage && form.sansImage.checked) data.image = "";
        enregistrerF(data);
      }
    });
    function enregistrerF(data) {
        if (n) { var L = formations(); data.id = "F-" + Date.now().toString(36).toUpperCase(); data.publie = true; data.inscriptionsOuvertes = true; data.seances = []; data.evaluations = [{ id: "EV1", titre: "Examen final", sur: 100 }]; L.push(data); S.enregistrerFormations(L); S.log("Formation créée", data.titre); }
        else { majFormation(f.id, data); S.log("Formation modifiée", data.titre); }
        A.rafraichir(); A.toast("Formation enregistrée", "ok");
    }
  }
  /* Éditeur de cours : modules, leçons (fichiers, liens, textes, quiz) et évaluations */
  function editeurCours(fid) {
    var mb0 = document.getElementById("modal-body"), y0 = mb0 && document.querySelector("dialog[open]") ? mb0.scrollTop : 0;
    var f = formation(fid);
    var mods = f.modules || [];
    A.modal({
      titre: "Contenu · " + f.titre, large: true, annuler: "Fermer",
      corps: '<p class="muted">Ajoutez des vidéos tutoriels, des supports PDF, des documents, des leçons écrites et des quiz. Les étudiants inscrits les voient dans leur espace.</p>' +
        mods.map(function (m, mi) {
          return '<div class="module-box" data-m="' + m.id + '"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><strong>Module ' + (mi + 1) + " · " + esc(m.titre) + '</strong><span class="hero-actions"><button type="button" class="btn btn-primary btn-sm" data-add-l>＋ Leçon</button><label class="btn btn-ghost btn-sm" style="cursor:pointer" title="Ajouter plusieurs PDF ou tutos vidéo d’un coup">📎 Importer PDF / tutos<input type="file" multiple accept=".pdf,video/*,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,image/*" data-import-l class="sr-only"></label><button type="button" class="ico-btn" data-ren-m title="Renommer" aria-label="Renommer le module">✎</button><button type="button" class="ico-btn danger" data-del-m title="Supprimer" aria-label="Supprimer le module">🗑</button></span></div>' + ((m.lecons || []).length ? "" : '<p class="muted" style="margin:0">Aucune leçon : ajoutez une vidéo, un PDF, un tuto, un quiz…</p>') +
            (m.lecons || []).map(function (l) { return '<div class="lecon" data-l="' + l.id + '"><span class="t">' + ABR[l.type] + "</span><span><strong>" + esc(l.titre) + "</strong>" + (l.cible ? ' <span class="tag tag-accent">' + (l.cible.etudiants ? l.cible.etudiants.length + " étudiant(s)" : l.cible.mode === "en_ligne" ? "En ligne" : "Présentiel") + "</span>" : "") + (l.disponibleLe ? ' <span class="tag tag-muted">dès le ' + esc(A.jour(l.disponibleLe + "T12:00:00")) + "</span>" : "") + '<br><small class="muted">' + esc(l.fichierNom ? l.fichierNom + " · " + window.NGFichiers.taille(l.taille) : l.url || (l.type === "quiz" ? (l.questions || []).length + " questions" : (l.contenu || "").slice(0, 60))) + '</small></span><span class="hero-actions" style="flex-wrap:nowrap">' + (l.fichierCle ? '<span class="tag ' + (l.enLigne ? "tag-ok" : "tag-warn") + '" title="' + (l.enLigne ? "Visible sur tous les appareils" : "Fichier gardé sur cet appareil : utilisez un lien pour le partager") + '">' + (l.enLigne ? "☁ en ligne" : "💾 cet appareil") + '</span><button type="button" class="ico-btn" data-open-l title="Ouvrir" aria-label="Ouvrir">👁</button>' : "") + '<button type="button" class="ico-btn" data-up-l title="Monter" aria-label="Monter">↑</button><button type="button" class="ico-btn" data-down-l title="Descendre" aria-label="Descendre">↓</button><button type="button" class="ico-btn" data-edit-l title="Modifier" aria-label="Modifier la leçon">✎</button><button type="button" class="ico-btn danger" data-del-l title="Supprimer" aria-label="Supprimer la leçon">🗑</button></span></div>'; }).join("") + "</div>";
        }).join("") +
        '<div class="hero-actions"><input id="nv-mod" placeholder="Titre du nouveau module" style="flex:1;min-height:44px;padding:0 12px;border-radius:10px;border:1px solid var(--line-2);background:var(--bg);color:var(--text)"><button type="button" class="btn btn-ghost" id="add-mod">+ Module</button></div>' +
        '<div class="module-box"><strong>Évaluations notées</strong>' + (f.evaluations || []).map(function (ev) { return '<div class="lecon"><span class="t">NOTE</span><span>' + esc(ev.titre) + ' <small class="muted">/ ' + (ev.sur || 100) + '</small></span><button type="button" class="icon-btn" data-del-ev="' + ev.id + '" aria-label="Supprimer">×</button></div>'; }).join("") + '<div class="hero-actions"><input id="nv-ev" placeholder="Ex. TP noté, examen pratique" style="flex:1;min-height:44px;padding:0 12px;border-radius:10px;border:1px solid var(--line-2);background:var(--bg);color:var(--text)"><button type="button" class="btn btn-ghost" id="add-ev">+ Évaluation</button></div></div>',
      apres: function (form) {
        setTimeout(function () { var mb = document.getElementById("modal-body"); if (mb) mb.scrollTop = y0; if (y0 && document.activeElement) document.activeElement.blur(); }, 0);
        var save = function (m2) { majFormation(fid, { modules: m2 }); };
        form.querySelector("#add-mod").addEventListener("click", function () { var t = form.querySelector("#nv-mod").value.trim(); if (!t) return; mods.push({ id: "M" + Date.now().toString(36), titre: t, lecons: [] }); save(mods); S.log("Module ajouté", f.titre + " · " + t); editeurCours(fid); });
        form.querySelector("#add-ev").addEventListener("click", function () { var t = form.querySelector("#nv-ev").value.trim(); if (!t) return; var evs = (f.evaluations || []).concat([{ id: "EV" + Date.now().toString(36), titre: t, sur: 100 }]); majFormation(fid, { evaluations: evs }); S.log("Évaluation ajoutée", f.titre + " · " + t); editeurCours(fid); });
        form.querySelectorAll("[data-del-ev]").forEach(function (b) { b.addEventListener("click", function () { majFormation(fid, { evaluations: (f.evaluations || []).filter(function (x) { return x.id !== b.dataset.delEv; }) }); editeurCours(fid); }); });
        form.querySelectorAll("[data-del-m]").forEach(function (b) { b.addEventListener("click", function () { if (!confirm("Supprimer ce module et ses leçons ?")) return; save(mods.filter(function (m) { return m.id !== b.closest("[data-m]").dataset.m; })); editeurCours(fid); }); });
        form.querySelectorAll("[data-del-l]").forEach(function (b) { b.addEventListener("click", function () { var mid = b.closest("[data-m]").dataset.m, lid = b.closest("[data-l]").dataset.l; mods.forEach(function (m) { if (m.id === mid) { var l = m.lecons.filter(function (x) { return x.id === lid; })[0]; if (l && l.fichierCle) window.NGFichiers.supprimer(l.fichierCle); m.lecons = m.lecons.filter(function (x) { return x.id !== lid; }); } }); save(mods); editeurCours(fid); }); });
        form.querySelectorAll("[data-open-l]").forEach(function (b) { b.addEventListener("click", function () { var lid = b.closest("[data-l]").dataset.l; lecons(f).forEach(function (l) { if (l.id === lid) window.NGFichiers.ouvrir(l.fichierCle, l.fichierNom); }); }); });
        form.querySelectorAll("[data-import-l]").forEach(function (inp) {
          inp.addEventListener("change", function () {
            var mid = inp.closest("[data-m]").dataset.m, fichiers = Array.prototype.slice.call(inp.files); if (!fichiers.length) return;
            var nouvelles = fichiers.map(function (fi, k) {
              var t = /pdf$/i.test(fi.type) || /\.pdf$/i.test(fi.name) ? "pdf" : /^video\//.test(fi.type) ? "video" : "doc";
              return { id: "L" + Date.now().toString(36) + k, titre: fi.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim(), type: t, fichierCle: "lecon-" + Date.now().toString(36) + "-" + k, fichierNom: fi.name, taille: fi.size, mime: fi.type, enLigne: window.NGFichiers.enLigne(fi.size), _f: fi };
            });
            A.toast("Import de " + nouvelles.length + " fichier(s)…");
            Promise.all(nouvelles.map(function (l) { return window.NGFichiers.enregistrer(l.fichierCle, l._f); })).then(function () {
              var fo = formation(fid), M = fo.modules || [];
              M.forEach(function (m) { if (m.id === mid) m.lecons = (m.lecons || []).concat(nouvelles.map(function (l) { var c = Object.assign({}, l); delete c._f; return c; })); });
              majFormation(fid, { modules: M });
              S.log("Leçons importées", fo.titre + " · " + nouvelles.length + " fichier(s)");
              var lourds = nouvelles.filter(function (l) { return !l.enLigne; }).length;
              A.toast(nouvelles.length + " leçon(s) ajoutée(s)" + (lourds ? " · " + lourds + " fichier(s) trop lourd(s) pour être partagés : mettez-les sur YouTube ou Google Drive" : ""), lourds ? "warn" : "ok");
              editeurCours(fid);
            }).catch(function (er) { A.toast("Import impossible : " + er.message, "warn"); });
          });
        });
        form.querySelectorAll("[data-add-l]").forEach(function (b) { b.addEventListener("click", function () { ajouterLecon(fid, b.closest("[data-m]").dataset.m); }); });
        var trouverL = function (b) { var mid = b.closest("[data-m]").dataset.m, lid = b.closest("[data-l]").dataset.l, m = mods.filter(function (x) { return x.id === mid; })[0]; return { m: m, i: m.lecons.map(function (x) { return x.id; }).indexOf(lid) }; };
        form.querySelectorAll("[data-edit-l]").forEach(function (b) { b.addEventListener("click", function () { var r = trouverL(b); ajouterLecon(fid, r.m.id, r.m.lecons[r.i]); }); });
        form.querySelectorAll("[data-up-l], [data-down-l]").forEach(function (b) { b.addEventListener("click", function () { var r = trouverL(b), d = b.hasAttribute("data-up-l") ? -1 : 1, j = r.i + d; if (j < 0 || j >= r.m.lecons.length) return; var t = r.m.lecons[r.i]; r.m.lecons[r.i] = r.m.lecons[j]; r.m.lecons[j] = t; save(mods); editeurCours(fid); }); });
        form.querySelectorAll("[data-ren-m]").forEach(function (b) { b.addEventListener("click", function () { var m = mods.filter(function (x) { return x.id === b.closest("[data-m]").dataset.m; })[0], t = prompt("Nouveau titre du module :", m.titre); if (!t || !t.trim()) return; m.titre = t.trim(); save(mods); editeurCours(fid); }); });
      }
    });
  }
  function ajouterLecon(fid, mid, ex) {
    var n = !ex; ex = ex || { type: "pdf", titre: "" };
    var cib = ex.cible ? (ex.cible.etudiants ? "choisis" : ex.cible.mode) : "tous";
    A.modal({
      titre: n ? "Nouvelle leçon" : "Modifier la leçon", valider: n ? "Ajouter la leçon" : "Enregistrer", large: true,
      corps: '<div class="form-grid"><label class="field full">Titre<input name="titre" required value="' + esc(ex.titre) + '" placeholder="Ex. Configurer un VLAN"></label><label class="field full">Type<select name="type">' + A.options(TYPES_L, ex.type) + '</select></label></div>' +
        '<label class="field" data-zone="fichier">Fichier (PDF, tuto vidéo MP4, Word, PowerPoint, ZIP…)<input name="fichier" type="file"><small>' + (ex.fichierNom ? "Actuel : " + esc(ex.fichierNom) + " — laissez vide pour le garder. " : "") + "Moins de 700 Ko : visible sur tous les appareils. Au-delà, mettez la vidéo sur YouTube ou le PDF sur Google Drive et choisissez un type « lien ».</small></label>" +
        '<label class="field" data-zone="url" hidden>Lien (YouTube, Google Drive, PDF en ligne…)<input name="url" type="url" value="' + esc(ex.url || "") + '" placeholder="https://…"></label>' +
        '<label class="field" data-zone="texte" hidden>Contenu / consignes<textarea name="contenu" style="min-height:140px">' + esc(ex.contenu || "") + "</textarea></label>" +
        '<div class="form-grid"><label class="field">Visible pour<select name="vis">' + A.options([["tous", "Tous les étudiants de la formation"], ["en_ligne", "Étudiants en ligne seulement"], ["presentiel", "Étudiants en présentiel seulement"], ["choisis", "Étudiants choisis"]], cib) + '</select></label><label class="field">Disponible à partir du<input name="dispo" type="date" value="' + esc(ex.disponibleLe || "") + '"><small>Vide = tout de suite.</small></label></div>' +
        '<div class="perm-grid" data-zone="choisis" hidden>' + (comptes(fid).map(function (e) { return '<label><input type="checkbox" name="etu" value="' + e.id + '"' + (ex.cible && (ex.cible.etudiants || []).indexOf(e.id) > -1 ? " checked" : "") + "> " + esc(e.nom) + "</label>"; }).join("") || '<p class="muted">Aucun étudiant inscrit pour le moment.</p>') + "</div>" +
        '<label class="field" data-zone="quiz" hidden>Questions (une par ligne : question | bonne réponse | mauvaise | mauvaise)<textarea name="quiz" style="min-height:140px" placeholder="Quel est le masque d’un /24 ? | 255.255.255.0 | 255.255.0.0 | 255.0.0.0">' + esc((ex.questions || []).map(function (q) { return [q.q].concat(q.choix).join(" | "); }).join("\n")) + "</textarea></label>" +
        '<div class="form-grid" data-zone="examen" hidden><label class="field">Durée (minutes)<input name="duree" type="number" min="5" max="240" value="' + (ex.duree || 30) + '"></label><label class="field">Questions tirées au hasard<input name="nbq" type="number" min="1" max="200" value="' + (ex.nbQuestions || 20) + '"><small>Parmi la banque de questions ci-dessus. Chaque étudiant reçoit un tirage différent.</small></label><label class="field">Tentatives autorisées<input name="tent" type="number" min="1" max="5" value="' + (ex.tentatives || 1) + '"></label></div>',
      apres: function (form) {
        var maj = function () { var t = form.type.value; form.querySelector('[data-zone="fichier"]').hidden = ["video", "pdf", "doc"].indexOf(t) < 0; form.querySelector('[data-zone="url"]').hidden = t !== "youtube" && t !== "lien"; form.querySelector('[data-zone="texte"]').hidden = t !== "texte" && t !== "tp"; form.querySelector('[data-zone="quiz"]').hidden = t !== "quiz" && t !== "examen"; form.querySelector('[data-zone="examen"]').hidden = t !== "examen"; };
        form.type.addEventListener("change", maj); maj();
        var majV = function () { form.querySelector('[data-zone="choisis"]').hidden = form.vis.value !== "choisis"; };
        form.vis.addEventListener("change", majV); majV();
      },
      onSubmit: function (form) {
        var t = form.type.value, titre = form.titre.value.trim();
        if (!titre) { A.toast("Titre obligatoire", "warn"); return false; }
        var l = n ? { id: "L" + Date.now().toString(36) } : { id: ex.id, fichierCle: ex.fichierCle, fichierNom: ex.fichierNom, taille: ex.taille, mime: ex.mime, enLigne: ex.enLigne };
        l.titre = titre; l.type = t;
        if (form.vis.value !== "tous") l.cible = form.vis.value === "choisis" ? { etudiants: Array.prototype.map.call(form.querySelectorAll("[name=etu]:checked"), function (x) { return x.value; }) } : { tous: true, mode: form.vis.value };
        if (form.dispo.value) l.disponibleLe = form.dispo.value;
        if (t === "youtube" || t === "lien") { if (!form.url.value.trim()) { A.toast("Lien obligatoire", "warn"); return false; } l.url = form.url.value.trim(); }
        if (t === "texte" || t === "tp") l.contenu = form.contenu.value.trim();
        if (t === "quiz" || t === "examen") {
          if (t === "examen") { l.duree = Number(form.duree.value) || 30; l.nbQuestions = Number(form.nbq.value) || 20; l.tentatives = Number(form.tent.value) || 1; }
          l.questions = form.quiz.value.split("\n").map(function (x) { return x.split("|").map(function (y) { return y.trim(); }); }).filter(function (x) { return x.length >= 3 && x[0]; }).map(function (x) { return { q: x[0], bonne: x[1], choix: x.slice(1) }; });
          if (!l.questions.length) { A.toast("Ajoutez au moins une question au bon format", "warn"); return false; }
        }
        var fin = function () {
          var f = formation(fid), mods = f.modules || [];
          mods.forEach(function (m) { if (m.id === mid) { if (n) m.lecons = (m.lecons || []).concat([l]); else m.lecons = m.lecons.map(function (x) { return x.id === l.id ? l : x; }); } });
          majFormation(fid, { modules: mods });
          S.log(n ? "Leçon ajoutée" : "Leçon modifiée", f.titre + " · " + titre);
          A.toast(n ? "Leçon ajoutée" : "Leçon modifiée", "ok"); editeurCours(fid);
        };
        var fic = form.fichier.files[0];
        if (["video", "pdf", "doc"].indexOf(t) > -1 && (fic || !l.fichierCle)) {
          if (!fic) { A.toast("Choisissez un fichier", "warn"); return false; }
          l.fichierCle = "lecon-" + l.id + "-" + Date.now().toString(36); l.fichierNom = fic.name; l.taille = fic.size; l.mime = fic.type; l.enLigne = window.NGFichiers.enLigne(fic.size);
          return window.NGFichiers.enregistrer(l.fichierCle, fic).then(function () { fin(); return false; }).catch(function (er) { A.toast("Fichier non enregistré : " + er.message, "warn"); return false; });
        }
        fin(); return false;
      }
    });
  }

  /* =================== Inscriptions =================== */
  var filtreI = "en_attente";
  A.VUES.inscriptions = function () {
    var I = S.liste("inscriptions");
    var L = I.filter(function (i) { return i.statut === filtreI; });
    A.vue.innerHTML = A.entete("Inscriptions aux formations", "Approuvez une inscription : le compte étudiant est créé et le message de bienvenue avec les identifiants part par WhatsApp, email ou SMS", '<button class="btn btn-ghost" type="button" id="in-new">+ Inscrire quelqu’un</button>') +
      '<div class="tabs" role="tablist">' + [["en_attente", "À approuver"], ["approuvee", "Approuvées"], ["refusee", "Refusées"]].map(function (o) { return '<button class="tab" type="button" role="tab" data-fi="' + o[0] + '" aria-selected="' + (filtreI === o[0]) + '">' + o[1] + " (" + I.filter(function (i) { return i.statut === o[0]; }).length + ")</button>"; }).join("") + "</div>" +
      (L.length ? '<div class="stack">' + L.map(function (i) {
        var f = formation(i.formationId), n = f ? comptes(f.id).length : 0;
        return '<article class="card" data-i="' + i.id + '"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap"><div style="display:flex;gap:12px;align-items:center">' + A.avatar({ nom: i.nom }, 46) + "<div><strong>" + esc(i.nom) + '</strong><br><small class="muted">' + esc(i.telephone) + (i.email ? " · " + esc(i.email) : "") + " · " + esc(i.profil || "") + '</small></div></div><span class="muted" style="font-size:.85rem">' + A.heure(i.creeLe) + "</span></div>" +
          '<div class="row-item"><span><strong>' + esc(i.formation) + "</strong><br><small class=\"muted\">" + (f ? esc(f.periode) + " · " + n + " / " + (f.places || "∞") + " places prises" : "Formation supprimée") + "</small></span>" + (i.statut === "approuvee" ? '<span class="tag tag-ok">Compte créé</span>' : i.statut === "refusee" ? '<span class="tag tag-muted">Refusée</span>' : '<span class="tag tag-warn">À approuver</span>') + "</div>" +
          (i.message ? '<p class="notice neutral">' + esc(i.message) + "</p>" : "") +
          (i.statut === "en_attente" ? '<div class="hero-actions"><button class="btn btn-primary" type="button" data-approuver>Approuver et envoyer les identifiants</button><button class="btn btn-ghost" type="button" data-refuser>Refuser</button><button class="ico-btn danger" type="button" data-i-suppr title="Supprimer la demande" aria-label="Supprimer la demande">🗑</button></div>' : '<div class="hero-actions"><button class="ico-btn danger" type="button" data-i-suppr title="Supprimer de la liste" aria-label="Supprimer de la liste">🗑</button></div>') + "</article>";
      }).join("") + "</div>" : '<div class="card empty"><h2 class="h-card">Aucune inscription ici</h2><p>Les demandes faites sur la page Formations du site apparaissent dans « À approuver ».</p></div>');
    A.lier("[data-fi]", "click", function (e, b) { filtreI = b.dataset.fi; A.rafraichir(); });
    A.lier("[data-i-suppr]", "click", function (e, b) { var i = I.filter(function (x) { return x.id === b.closest("[data-i]").dataset.i; })[0]; if (!confirm("Supprimer l’inscription de " + i.nom + " ?" + (i.compteId && i.statut === "en_attente" ? "\nLe compte en attente créé sur le site sera aussi supprimé." : ""))) return; if (i.compteId && i.statut === "en_attente") S.retirer("comptes_etudiants", i.compteId); S.retirer("inscriptions", i.id); S.log("Inscription supprimée", i.nom + " · " + i.formation); A.rafraichir(); });
    A.lier("[data-approuver]", "click", function (e, b) { approuver(I.filter(function (x) { return x.id === b.closest("[data-i]").dataset.i; })[0]); });
    A.lier("[data-refuser]", "click", function (e, b) {
      var i = I.filter(function (x) { return x.id === b.closest("[data-i]").dataset.i; })[0];
      A.modal({ titre: "Refuser l’inscription de " + i.nom, valider: "Refuser et prévenir", corps: '<label class="field">Message pour la personne<textarea name="m" style="min-height:100px">Bonjour ' + esc(i.nom) + ",\nMerci pour votre intérêt pour la formation « " + esc(i.formation) + " ». La session est complète ; nous vous prévenons dès l’ouverture de la prochaine.\nNextGenIT Academy</textarea></label>",
        onSubmit: function (f) { S.modifier("inscriptions", i.id, { statut: "refusee", traiteLe: new Date().toISOString(), traitePar: A.moi().nom }); if (i.compteId) S.modifier("comptes_etudiants", i.compteId, { actif: false, enAttenteApprobation: false, refuse: true }); S.log("Inscription refusée", i.nom + " · " + i.formation); envoyer("wa", i, f.m.value, ""); A.rafraichir(); } });
    });
    document.getElementById("in-new").addEventListener("click", function () {
      var F = formations().filter(function (f) { return f.statut !== "terminee"; });
      A.modal({ titre: "Inscrire une personne", valider: "Créer la demande", corps: '<div class="form-grid"><label class="field">Nom complet<input name="nom" required></label><label class="field">Téléphone / WhatsApp<input name="tel" type="tel" required></label><label class="field">Email<input name="email" type="email"></label><label class="field">Formation<select name="f">' + A.options(F.map(function (f) { return [f.id, f.titre]; })) + "</select></label></div>",
        onSubmit: function (form) { if (!form.nom.value.trim() || !form.tel.value.trim()) { A.toast("Nom et téléphone obligatoires", "warn"); return false; } var f = formation(form.f.value); var i = S.ajouter("inscriptions", { formationId: f.id, formation: f.titre, nom: form.nom.value.trim(), telephone: form.tel.value.trim(), email: form.email.value.trim(), profil: "Inscrit par l’équipe", statut: "en_attente" }, "INS-"); filtreI = "en_attente"; A.rafraichir(); approuver(i); } });
    });
  };
  function approuver(i) {
    var f = formation(i.formationId);
    if (!f) { A.toast("Formation introuvable", "warn"); return; }
    A.modal({
      titre: "Approuver l’inscription de " + i.nom, valider: "Approuver et envoyer",
      corps: "<p>Formation : <strong>" + esc(f.titre) + "</strong> · " + esc(f.periode) + '</p><div class="form-grid"><label class="field">Frais de formation ($)<input name="tarif" type="number" min="0" step="1" value="' + (f.tarif || "") + '"><small>Une facture est créée si un montant est indiqué.</small></label><label class="field">Envoyer les identifiants par<select name="canal">' + A.options([["wa", "WhatsApp"], ["mail", "Email"], ["sms", "SMS"]], i.email ? "mail" : "wa") + "</select></label></div>" +
        '<div class="form-grid"><label class="field">Code promo<select name="promo"><option value="">Aucun</option>' + A.options((S.reglages().promos || []).map(function (p) { return [p.code, p.code + " (−" + p.pc + " %)"]; })) + '</select></label><label class="field">Accès aux cours<select name="acces">' + A.options([["immediat", "Ouvert tout de suite"], ["paiement", "Débloqué automatiquement après paiement"]], "immediat") + "</select></label></div>" +
        (i.compteId ? '<p class="notice">L’étudiant a déjà créé son compte sur le site (' + esc(i.modeSuivi || "") + '). En approuvant, son compte est <strong>activé</strong> et il accède à son espace avec le mot de passe qu’il a choisi.</p>' : '<p class="notice">Un compte étudiant est créé avec un mot de passe aléatoire. Le message de bienvenue contient le lien de l’espace étudiant, l’identifiant et le mot de passe.</p>'),
      onSubmit: function (form) {
        var tarif = Number(form.tarif.value) || 0, canal = form.canal.value, promo = (S.reglages().promos || []).filter(function (p) { return p.code === form.promo.value; })[0];
        if (promo && tarif) tarif = Math.round(tarif * (100 - promo.pc)) / 100;
        var apresPaiement = form.acces.value === "paiement" && tarif > 0;
        var existant = i.compteId ? comptes().filter(function (c) { return c.id === i.compteId; })[0] : null;
        var etape = existant ? Promise.resolve({ e: S.modifier("comptes_etudiants", existant.id, { actif: !apresPaiement, enAttenteApprobation: false, enAttentePaiement: apresPaiement, formationId: f.id, inscriptionId: i.id, valideLe: new Date().toISOString(), validePar: A.moi().nom }), mdp: null }) : creerCompte({ nom: i.nom, telephone: i.telephone, email: i.email, formationId: f.id, inscriptionId: i.id, actif: !apresPaiement, enAttentePaiement: apresPaiement, modeSuivi: i.modeSuivi || "" });
        return etape.then(function (r) {
          S.modifier("inscriptions", i.id, { statut: "approuvee", compteId: r.e.id, traiteLe: new Date().toISOString(), traitePar: A.moi().nom, tarif: tarif });
          if (tarif && A.fin) { var fac = A.fin.creerFacture({ nom: i.nom, telephone: i.telephone, email: i.email, services: ["Formation " + f.titre], lignes: [{ designation: "Formation « " + f.titre + " » – " + f.periode + (promo ? " (code " + promo.code + " : −" + promo.pc + " %)" : ""), qte: 1, pu: tarif }] }, "facture"); S.modifier("comptes_etudiants", r.e.id, { factureAcces: fac.id }); }
          var msg = (r.mdp ? msgBienvenue(r.e, f, r.mdp, tarif) : "Bonjour " + r.e.nom + ",\n\nBienvenue à la NextGenIT Academy ! 🎓\nVotre compte étudiant est validé pour la formation « " + f.titre + " » (" + f.periode + ", " + (r.e.modeSuivi || f.mode) + ").\n\nConnectez-vous à votre espace étudiant :\n🔗 " + lien(f) + "\n👤 Identifiant : " + r.e.identifiant + "\n🔑 Le mot de passe que vous avez choisi lors de l’inscription." + (tarif ? "\n\n💳 Frais de formation : " + argent(tarif) + "." : "") + "\n\nBonne formation !\nL’équipe NextGenIT") + (apresPaiement ? "\n\n🔓 Vos cours s’ouvrent automatiquement dès réception de votre paiement." : "");
          S.log("Inscription approuvée", i.nom + " · " + f.titre + " · identifiants envoyés (" + { wa: "WhatsApp", mail: "email", sms: "SMS" }[canal] + ")", tarif || null);
          envoyer(canal, r.e, msg, "Bienvenue à la NextGenIT Academy – vos accès");
          A.fermer();
          A.modal({ titre: r.mdp ? "Compte étudiant créé" : "Compte étudiant validé", annuler: "Terminé", corps: '<p class="notice">Le message de bienvenue est prêt dans ' + { wa: "WhatsApp", mail: "votre messagerie", sms: "les SMS" }[canal] + '. Vous pouvez aussi le renvoyer par un autre canal :</p><div class="row-item block"><small class="muted">Identifiant</small><strong>' + esc(r.e.identifiant) + "</strong>" + (r.mdp ? '<small class="muted">Mot de passe provisoire</small><strong style="font-family:ui-monospace,monospace">' + esc(r.mdp) + "</strong>" : '<small class="muted">Mot de passe</small><span>choisi par l’étudiant</span>') + '</div><div class="send-row"><button class="btn btn-whatsapp" type="button" data-c="wa">WhatsApp</button><button class="btn btn-ghost" type="button" data-c="mail"' + (r.e.email ? "" : " disabled") + '>Email</button><button class="btn btn-ghost" type="button" data-c="sms">SMS</button></div><p class="muted" style="font-size:.85rem">Le mot de passe n’est plus affiché après la fermeture de cette fenêtre.</p>',
            apres: function (fm) { fm.querySelectorAll("[data-c]").forEach(function (b) { b.addEventListener("click", function () { envoyer(b.dataset.c, r.e, msg, "Bienvenue à la NextGenIT Academy – vos accès"); }); }); } });
          filtreI = "approuvee"; A.rafraichir();
          return false;
        });
      }
    });
  }

  /* =================== Comptes étudiants =================== */
  var filtreE = "";
  var vueE = "cartes", statutE = "tous", rechE = "";
  function etatEtudiant(e, f, st) {
    var jours = e.derniereActivite || e.derniereConnexion ? Math.floor((Date.now() - new Date(e.derniereActivite || e.derniereConnexion)) / 864e5) : null;
    if (e.suspendu) return ["suspendu", "⏳ Suspendu", "tag-warn"];
    if (e.enAttenteApprobation) return ["avalider", "À valider", "tag-warn"];
    if (!e.actif) return ["inactif", e.enAttentePaiement ? "Attend le paiement" : "Désactivé", "tag-muted"];
    if (f && f.statut === "encours" && (jours === null || jours >= 7 || st.progression < (f.avancement || 0) - 20 || (st.moyenne !== null && st.moyenne < 50))) return ["risque", "À surveiller", "tag-warn"];
    if (st.eligible) return ["reussite", "Attestation possible", "tag-ok"];
    return ["actif", "Actif", "tag-ok"];
  }
  A.VUES.etudiants = function () {
    var F = formations(), tous = comptes();
    var infos = tous.map(function (e) { var f = formation(e.formationId), st = stats(e, f); return { e: e, f: f, st: st, etat: etatEtudiant(e, f, st) }; });
    var compte = function (k) { return infos.filter(function (x) { return k === "tous" || x.etat[0] === k; }).length; };
    var L = infos.filter(function (x) { return (!filtreE || x.e.formationId === filtreE) && (statutE === "tous" || x.etat[0] === statutE) && (!rechE || (x.e.nom + " " + x.e.identifiant + " " + (x.e.telephone || "")).toLowerCase().indexOf(rechE.toLowerCase()) > -1); });
    var moyP = infos.length ? Math.round(infos.reduce(function (a, x) { return a + x.st.progression; }, 0) / infos.length) : 0;
    A.vue.innerHTML = A.entete("Comptes étudiants", "Validez, accompagnez et suivez chaque étudiant : progression, présence, notes et alertes", '<a class="btn btn-ghost" href="#inscriptions">Inscriptions à valider</a><button class="btn btn-ghost" type="button" id="e-csv">Exporter en PDF</button>') +
      '<div class="kpis"><div class="kpi"><span>Étudiants</span><strong data-count="' + infos.length + '">0</strong><small>' + compte("actif") + " actifs</small></div><div class=\"kpi\"><span>À valider</span><strong data-count=\"" + compte("avalider") + '">0</strong><small>comptes créés sur le site</small></div><div class="kpi"><span>À surveiller</span><strong data-count="' + compte("risque") + '">0</strong><small>inactifs, en retard ou en difficulté</small></div><div class="kpi"><span>Progression moyenne</span><strong data-count="' + moyP + '" data-format="pc">0</strong><small>' + compte("reussite") + " attestation(s) possible(s)</small></div></div>" +
      '<div class="card"><div class="toolbar"><input type="search" id="e-rech" placeholder="Rechercher un nom, un téléphone…" value="' + esc(rechE) + '"><select id="e-f" aria-label="Formation"><option value="">Toutes les formations</option>' + A.options(F.map(function (f) { return [f.id, f.titre]; }), filtreE) + '</select><div class="seg" role="group" aria-label="Affichage"><button type="button" data-vue="cartes" aria-pressed="' + (vueE === "cartes") + '">▦ Cartes</button><button type="button" data-vue="tableau" aria-pressed="' + (vueE === "tableau") + '">☰ Tableau</button></div></div>' +
      '<div class="chips filtres">' + [["tous", "Tous"], ["avalider", "À valider"], ["risque", "À surveiller"], ["actif", "Actifs"], ["reussite", "Attestation possible"], ["suspendu", "Suspendus"], ["inactif", "Inactifs"]].map(function (o) { return '<button type="button" class="filtre' + (statutE === o[0] ? " on" : "") + '" data-st="' + o[0] + '">' + o[1] + " <b>" + compte(o[0]) + "</b></button>"; }).join("") + "</div>" +
      (vueE === "cartes" ? '<div class="pers-grille">' + (L.map(function (x) {
        var e = x.e, st = x.st, jours = e.derniereActivite || e.derniereConnexion ? Math.floor((Date.now() - new Date(e.derniereActivite || e.derniereConnexion)) / 864e5) : null;
        return '<article class="pers-carte" data-e="' + e.id + '"><div class="pers-haut"><span class="tag ' + x.etat[2] + '">' + x.etat[1] + "</span>" + A.interrupteur("data-e-actif", !!e.actif, "Compte actif " + e.nom) + '</div><div class="pers-id">' + A.avatar(e, 72) + "<div><strong>" + esc(e.nom) + "</strong><small>" + esc(x.f ? x.f.titre : "—") + "</small><small>" + esc(e.modeSuivi || (x.f ? x.f.mode : "")) + "</small></div></div>" +
          '<div class="pers-stats"><div><span>' + st.progression + " %</span><small>progression</small></div><div><span>" + (st.presence === null ? "—" : st.presence + " %") + "</span><small>présence</small></div><div><span>" + (st.moyenne === null ? "—" : st.moyenne) + '</span><small>moyenne</small></div></div><div class="progress"><span style="width:' + st.progression + '%"></span></div>' +
          '<p class="pers-meta">📱 ' + esc(e.telephone || "—") + " · " + (jours === null ? "jamais connecté" : jours === 0 ? "actif aujourd’hui" : "vu il y a " + jours + " j") + "</p>" +
          '<div class="pers-actions">' + (e.enAttenteApprobation ? '<a class="btn btn-primary btn-sm" href="#inscriptions">Valider</a>' : '<button class="btn btn-primary btn-sm" type="button" data-e-fiche>📊 Suivi</button>') + (bloque("etudiant:" + e.id) ? '<button class="btn btn-ghost btn-sm" type="button" data-e-debloquer>🔓</button>' : "") + '<button class="ico-btn" type="button" data-e-mdp title="Nouveaux identifiants" aria-label="Nouveaux identifiants">🔑</button><a class="ico-btn" target="_blank" rel="noopener" href="https://wa.me/' + String(e.telephone || "").replace(/[^\d]/g, "") + '" title="WhatsApp" aria-label="WhatsApp">💬</a><button class="ico-btn" type="button" data-e-gerer title="Suspendre, désactiver, supprimer…" aria-label="Gérer le compte">⚙</button></div></article>';
      }).join("") || '<p class="muted">Aucun étudiant dans cette sélection.</p>') + "</div>"
      : '<div class="table-wrap"><table class="t" style="min-width:1080px"><thead><tr><th>Étudiant</th><th>Formation</th><th>Progression</th><th class="r">Présence</th><th class="r">Moyenne</th><th>État</th><th>Actif</th><th></th></tr></thead><tbody>' +
        (L.map(function (x) { var e = x.e, st = x.st; return '<tr data-e="' + e.id + '"><td><div style="display:flex;gap:10px;align-items:center">' + A.avatar(e, 38) + "<span><strong>" + esc(e.nom) + '</strong><br><small class="muted">' + esc(e.identifiant) + "</small></span></div></td><td>" + esc(x.f ? x.f.titre : "—") + '</td><td style="min-width:140px"><div class="progress"><span style="width:' + st.progression + '%"></span></div><small>' + st.progression + ' %</small></td><td class="r">' + (st.presence === null ? "—" : st.presence + " %") + '</td><td class="r">' + (st.moyenne === null ? "—" : st.moyenne + "/100") + '</td><td><span class="tag ' + x.etat[2] + '">' + x.etat[1] + "</span></td><td>" + A.interrupteur("data-e-actif", !!e.actif, "Compte actif " + e.nom) + '</td><td class="r"><span class="actions-ligne"><button class="ico-btn" type="button" data-e-fiche title="Suivi" aria-label="Suivi">📊</button><button class="ico-btn" type="button" data-e-mdp title="Nouveaux identifiants" aria-label="Nouveaux identifiants">🔑</button><button class="ico-btn" type="button" data-e-gerer title="Gérer le compte" aria-label="Gérer le compte">⚙</button></span></td></tr>'; }).join("") || '<tr><td colspan="8" class="muted">Aucun étudiant.</td></tr>') + "</tbody></table></div>") + "</div>";
    var r = document.getElementById("e-rech");
    r.addEventListener("input", function () { rechE = r.value; clearTimeout(r._t); r._t = setTimeout(function () { A.VUES.etudiants(); var n = document.getElementById("e-rech"); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 250); });
    document.getElementById("e-f").addEventListener("change", function (e) { filtreE = e.target.value; A.rafraichir(); });
    A.lier("[data-vue]", "click", function (e, b) { vueE = b.dataset.vue; A.rafraichir(); });
    A.lier("[data-st]", "click", function (e, b) { statutE = b.dataset.st; A.rafraichir(); });
    A.lier(".pers-carte .pers-id", "click", function (e, el) { var c = el.closest("[data-e]"); if (!c.querySelector("[data-e-fiche]")) return; ficheEtudiant(c.dataset.e); });
    document.getElementById("e-csv").addEventListener("click", function () { A.csv("etudiants", [["Nom", "Identifiant", "Téléphone", "Email", "Formation", "Progression %", "Présence %", "Moyenne", "État"]].concat(infos.map(function (x) { return [x.e.nom, x.e.identifiant, x.e.telephone, x.e.email, x.f ? x.f.titre : "", x.st.progression, x.st.presence, x.st.moyenne, x.etat[1]]; }))); });
    var trouverE = function (b) { return comptes().filter(function (x) { return x.id === b.closest("[data-e]").dataset.e; })[0]; };
    A.lier("[data-e-actif]", "click", function (ev, b) { var e = trouverE(b); A.gererCompte("etudiant", e, !e.actif || e.suspendu ? "reactiver" : "suspendre"); });
    A.lier("[data-e-gerer]", "click", function (ev, b) { A.gererCompte("etudiant", trouverE(b)); });
    A.lier("[data-e-suppr]", "click", function (ev, b) { var e = comptes().filter(function (x) { return x.id === b.closest("[data-e]").dataset.e; })[0]; if (confirm("Supprimer le compte de " + e.nom + " ?")) { S.retirer("comptes_etudiants", e.id); S.log("Compte étudiant supprimé", e.nom); A.rafraichir(); } });
    A.lier("[data-e-fiche]", "click", function (ev, b) { ficheEtudiant(b.closest("[data-e]").dataset.e); });
    A.lier("[data-e-debloquer]", "click", function (ev, b) { var id = b.closest("[data-e]").dataset.e, B = blocages(); delete B["etudiant:" + id]; localStorage.setItem("ng_blocage_comptes", JSON.stringify(B)); S.log("Compte étudiant débloqué", id); A.toast("Compte débloqué", "ok"); A.rafraichir(); });
    A.lier("[data-e-mdp]", "click", function (ev, b) {
      var e = comptes().filter(function (x) { return x.id === b.closest("[data-e]").dataset.e; })[0], f = formation(e.formationId), mdp = A.motDePasse();
      A.sha256(e.identifiant.toLowerCase() + ":" + mdp).then(function (h) {
        S.modifier("comptes_etudiants", e.id, { hash: h, doitChanger: true });
        S.log("Identifiants étudiant renvoyés", e.nom);
        var msg = "Bonjour " + e.nom + ",\nVoici vos nouveaux accès à l’espace étudiant NextGenIT :\n🔗 " + lien(f) + "\n👤 " + e.identifiant + "\n🔑 " + mdp + "\nNextGenIT Academy";
        A.modal({ titre: "Nouveaux identifiants · " + e.nom, annuler: "Terminé", corps: '<div class="row-item block"><small class="muted">Identifiant</small><strong>' + esc(e.identifiant) + '</strong><small class="muted">Nouveau mot de passe</small><strong style="font-family:ui-monospace,monospace">' + esc(mdp) + '</strong></div><div class="send-row"><button class="btn btn-whatsapp" type="button" data-c="wa">WhatsApp</button><button class="btn btn-ghost" type="button" data-c="mail"' + (e.email ? "" : " disabled") + '>Email</button><button class="btn btn-ghost" type="button" data-c="sms">SMS</button></div>',
          apres: function (fm) { fm.querySelectorAll("[data-c]").forEach(function (x) { x.addEventListener("click", function () { envoyer(x.dataset.c, e, msg, "Vos accès NextGenIT Academy"); }); }); } });
      });
    });
  };

  /* =================== Publications ciblées =================== */
  var TYPES_P = [["annonce", "📢 Annonce"], ["cours", "📘 Cours / leçon écrite"], ["document", "📄 Document (PDF, support…)"], ["video", "▶ Vidéo"], ["devoir", "📝 Devoir à rendre"]];
  function resumeCible(c) {
    c = c || { tous: true };
    var p = [];
    if (c.tous) p.push("Tous les étudiants");
    if ((c.domaines || []).length) p.push("Domaine : " + c.domaines.join(", "));
    if ((c.formations || []).length) p.push(c.formations.map(function (id) { var f = formation(id); return f ? f.titre : id; }).join(", "));
    if ((c.etudiants || []).length) p.push(c.etudiants.length + " étudiant(s) choisi(s)");
    if (c.mode && c.mode !== "tous") p.push(c.mode === "en_ligne" ? "en ligne seulement" : "présentiel seulement");
    return p.join(" · ") || "Personne";
  }
  function atteints(c) { return comptes().filter(function (e) { return e.actif && S.visiblePour(c, e); }); }
  function cibleHtml(c) {
    c = c || { tous: true };
    var qui = c.tous ? "tous" : (c.etudiants || []).length && !(c.domaines || []).length && !(c.formations || []).length ? "choisis" : (c.formations || []).length ? "formations" : "domaines";
    return '<fieldset class="cible"><legend>Qui verra cette publication ?</legend>' +
      '<div class="cible-qui">' + [["tous", "Tous les étudiants"], ["domaines", "Par domaine"], ["formations", "Par formation"], ["choisis", "Étudiants choisis"]].map(function (o) { return '<label class="chip-choice"><input type="radio" name="qui" value="' + o[0] + '"' + (qui === o[0] ? " checked" : "") + "> " + o[1] + "</label>"; }).join("") + "</div>" +
      '<div class="perm-grid" data-qui="domaines">' + S.DOMAINES.map(function (d) { return '<label><input type="checkbox" name="dom" value="' + esc(d) + '"' + ((c.domaines || []).indexOf(d) > -1 ? " checked" : "") + "> " + esc(d) + "</label>"; }).join("") + "</div>" +
      '<div class="perm-grid" data-qui="formations">' + formations().map(function (f) { return '<label><input type="checkbox" name="form" value="' + f.id + '"' + ((c.formations || []).indexOf(f.id) > -1 ? " checked" : "") + "> " + esc(f.titre) + "</label>"; }).join("") + "</div>" +
      '<div data-qui="choisis"><input type="search" class="cible-rech" placeholder="Rechercher un étudiant…" aria-label="Rechercher un étudiant"><div class="perm-grid">' + (comptes().map(function (e) { var f = formation(e.formationId); return '<label data-nom="' + esc((e.nom + " " + (f ? f.titre : "")).toLowerCase()) + '"><input type="checkbox" name="etu" value="' + e.id + '"' + ((c.etudiants || []).indexOf(e.id) > -1 ? " checked" : "") + "> " + esc(e.nom) + ' <small class="muted">' + esc(f ? f.titre : "") + "</small></label>"; }).join("") || '<p class="muted">Aucun étudiant.</p>') + "</div></div>" +
      '<label class="field">Mode de suivi<select name="modeC">' + A.options([["tous", "En ligne et en présentiel"], ["en_ligne", "En ligne seulement"], ["presentiel", "Présentiel seulement"]], c.mode || "tous") + "</select></label>" +
      '<p class="cible-total" aria-live="polite"></p></fieldset>';
  }
  function lireCible(form) {
    var qui = (form.querySelector("[name=qui]:checked") || {}).value || "tous";
    var val = function (n) { return Array.prototype.map.call(form.querySelectorAll("[name=" + n + "]:checked"), function (x) { return x.value; }); };
    return { tous: qui === "tous", domaines: qui === "domaines" ? val("dom") : [], formations: qui === "formations" ? val("form") : [], etudiants: qui === "choisis" ? val("etu") : [], mode: form.modeC.value };
  }
  function brancherCible(form) {
    var maj = function () {
      var qui = (form.querySelector("[name=qui]:checked") || {}).value;
      form.querySelectorAll("[data-qui]").forEach(function (z) { z.hidden = z.dataset.qui !== qui; });
      var n = atteints(lireCible(form));
      form.querySelector(".cible-total").innerHTML = "→ <strong>" + n.length + " étudiant(s)</strong> verront cette publication" + (n.length ? " : " + n.slice(0, 6).map(function (e) { return esc(e.nom); }).join(", ") + (n.length > 6 ? "…" : "") : "");
    };
    form.addEventListener("change", maj);
    var r = form.querySelector(".cible-rech");
    if (r) r.addEventListener("input", function () { var q = r.value.toLowerCase(); form.querySelectorAll("[data-qui=choisis] label[data-nom]").forEach(function (l) { l.hidden = q && l.dataset.nom.indexOf(q) < 0; }); });
    maj();
  }
  A.cibleHtml = cibleHtml; A.lireCible = lireCible; A.brancherCible = brancherCible;

  A.VUES.ressources = function () {
    var P = S.liste("publications"), E = comptes();
    A.vue.innerHTML = A.entete("Publications ciblées", "Annonces, cours, documents, vidéos et devoirs : choisissez qui les voit (un domaine comme la cybersécurité, une formation, des étudiants précis, en ligne ou en présentiel)", '<button class="btn btn-primary" type="button" id="pub-new">＋ Nouvelle publication</button>') +
      '<div class="kpis"><div class="kpi"><span>Publications</span><strong data-count="' + P.length + '">0</strong></div><div class="kpi"><span>Devoirs en cours</span><strong data-count="' + P.filter(function (p) { return p.type === "devoir" && (!p.dateLimite || p.dateLimite >= new Date().toISOString().slice(0, 10)); }).length + '">0</strong></div><div class="kpi"><span>Devoirs à corriger</span><strong data-count="' + E.reduce(function (a, e) { return a + Object.keys(e.devoirs || {}).filter(function (k) { return e.devoirs[k].note == null; }).length; }, 0) + '">0</strong></div></div>' +
      (P.length ? '<div class="stack">' + P.map(function (p) {
        var cib = atteints(p.cible), vus = cib.filter(function (e) { return (e.vus || {})[p.id]; }).length, rendus = cib.filter(function (e) { return (e.devoirs || {})[p.id]; }).length;
        var prog = p.publierLe && p.publierLe > new Date().toISOString().slice(0, 10);
        return '<article class="card pub-carte" data-p="' + p.id + '"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center"><span class="tag tag-accent">' + (TYPES_P.filter(function (t) { return t[0] === p.type; })[0] || ["", p.type])[1] + "</span>" + (p.epingle ? '<span class="tag tag-warn">📌 Épinglé</span>' : "") + (prog ? '<span class="tag tag-muted">Programmé le ' + A.jour(p.publierLe + "T12:00:00") + "</span>" : "") + '<span class="actions-ligne" style="margin-left:auto"><button class="ico-btn" type="button" data-pub-voir title="Qui l’a vu" aria-label="Qui l’a vu">👁</button><button class="ico-btn" type="button" data-pub-edit title="Modifier" aria-label="Modifier">✎</button><button class="ico-btn danger" type="button" data-pub-suppr title="Supprimer" aria-label="Supprimer">🗑</button></span></div>' +
          '<h2 class="h-card">' + esc(p.titre) + "</h2>" + (p.texte ? '<p style="white-space:pre-line">' + esc(p.texte.length > 220 ? p.texte.slice(0, 220) + "…" : p.texte) + "</p>" : "") +
          '<div class="pub-cible">🎯 ' + esc(resumeCible(p.cible)) + "</div>" +
          '<div class="foot"><span>' + cib.length + " étudiant(s) ciblé(s) · vu par " + vus + (p.type === "devoir" ? " · " + rendus + " rendu(s)" + (p.dateLimite ? " · à rendre avant le " + A.jour(p.dateLimite + "T12:00:00") : "") : "") + "</span><span>" + A.jour(p.creeLe) + "</span></div></article>";
      }).join("") + "</div>" : '<div class="card empty"><h2 class="h-card">Aucune publication</h2><p>Publiez une annonce, un cours, un document ou un devoir, et choisissez précisément qui le voit.</p></div>');
    document.getElementById("pub-new").addEventListener("click", function () { formPublication(null); });
    var trouver = function (b) { return S.liste("publications").filter(function (x) { return x.id === b.closest("[data-p]").dataset.p; })[0]; };
    A.lier("[data-pub-edit]", "click", function (e, b) { formPublication(trouver(b)); });
    A.lier("[data-pub-suppr]", "click", function (e, b) { var p = trouver(b); if (confirm("Supprimer « " + p.titre + " » ? Elle disparaît de l’espace des étudiants.")) { S.retirer("publications", p.id); S.log("Publication supprimée", p.titre); A.rafraichir(); } });
    A.lier("[data-pub-voir]", "click", function (e, b) { suiviPublication(trouver(b)); });
  };
  function formPublication(p) {
    var n = !p;
    p = p || { type: "annonce", titre: "", texte: "", lien: "", publierLe: "", dateLimite: "", epingle: false, cible: { tous: true } };
    A.modal({
      titre: n ? "Nouvelle publication" : "Modifier la publication", valider: n ? "Publier" : "Enregistrer", large: true,
      corps: '<div class="form-grid"><label class="field">Type<select name="type">' + A.options(TYPES_P, p.type) + '</select></label><label class="field">Titre<input name="titre" required value="' + esc(p.titre) + '" placeholder="ex. Nouvelle règle de pare-feu à connaître"></label><label class="field full">Texte<textarea name="texte" style="min-height:120px" placeholder="Le contenu, les consignes, le message…">' + esc(p.texte) + '</textarea></label><label class="field full">Lien (vidéo YouTube, PDF sur Google Drive, page web…)<input name="lien" type="url" value="' + esc(p.lien || "") + '" placeholder="https://…"><small>Conseil : déposez vos PDF et vidéos sur Google Drive ou YouTube et collez le lien ; ils seront visibles sur tous les appareils.</small></label><label class="field full">… ou joindre un fichier (PDF, tuto, image)<input name="fichier" type="file" accept=".pdf,video/*,image/*,.doc,.docx,.ppt,.pptx,.zip"><small>' + (p.fichierNom ? "Actuel : " + esc(p.fichierNom) + " — laissez vide pour le garder. " : "") + "Moins de 700 Ko : visible partout.</small></label>" +
        '<label class="field">Publier le<input name="publierLe" type="date" value="' + esc(p.publierLe || "") + '"><small>Vide = tout de suite.</small></label><label class="field" data-z="devoir">À rendre avant le<input name="dateLimite" type="date" value="' + esc(p.dateLimite || "") + '"></label><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" name="epingle"' + (p.epingle ? " checked" : "") + "> 📌 Épingler en haut de l’espace étudiant</label></div>" + cibleHtml(p.cible),
      apres: function (form) {
        var majT = function () { form.querySelector('[data-z="devoir"]').hidden = form.type.value !== "devoir"; };
        form.type.addEventListener("change", majT); majT(); brancherCible(form);
      },
      onSubmit: function (form) {
        if (!form.titre.value.trim()) { A.toast("Titre obligatoire", "warn"); return false; }
        var c = lireCible(form);
        if (!c.tous && !c.domaines.length && !c.formations.length && !c.etudiants.length) { A.toast("Choisissez qui verra la publication", "warn"); return false; }
        var data = { type: form.type.value, titre: form.titre.value.trim(), texte: form.texte.value.trim(), lien: form.lien.value.trim(), publierLe: form.publierLe.value, dateLimite: form.type.value === "devoir" ? form.dateLimite.value : "", epingle: form.epingle.checked, cible: c, auteur: A.moi().nom };
        var fin = function () {
          if (n) { S.ajouter("publications", data, "PUB-"); S.log("Publication ciblée", data.titre + " → " + resumeCible(c)); }
          else { S.modifier("publications", p.id, data); S.log("Publication modifiée", data.titre); }
          A.toast(n ? "Publié pour " + atteints(c).length + " étudiant(s)" : "Publication modifiée", "ok"); A.rafraichir();
        };
        var fi = form.fichier.files[0];
        if (fi) { data.fichierCle = "pub-" + Date.now().toString(36); data.fichierNom = fi.name; data.mime = fi.type; data.taille = fi.size; return window.NGFichiers.enregistrer(data.fichierCle, fi).then(function () { fin(); }); }
        fin();
      }
    });
  }
  function suiviPublication(p) {
    var cib = atteints(p.cible);
    A.modal({ titre: p.titre, large: true, annuler: "Fermer",
      corps: '<p class="pub-cible">🎯 ' + esc(resumeCible(p.cible)) + "</p>" + '<div class="table-wrap"><table class="t"><thead><tr><th>Étudiant</th><th>Formation</th><th>Vu le</th>' + (p.type === "devoir" ? "<th>Devoir rendu</th><th>Note</th>" : "") + "</tr></thead><tbody>" +
        (cib.map(function (e) { var f = formation(e.formationId), v = (e.vus || {})[p.id], d = (e.devoirs || {})[p.id]; return '<tr data-e="' + e.id + '"><td>' + esc(e.nom) + "</td><td>" + esc(f ? f.titre : "") + "</td><td>" + (v ? A.heure(v) : '<span class="muted">pas encore</span>') + "</td>" + (p.type === "devoir" ? "<td>" + (d ? '<button class="lien-btn" type="button" data-ouvrir-dev>' + esc(d.nom) + "</button><br><small class=\"muted\">" + A.heure(d.date) + "</small>" : '<span class="muted">—</span>') + "</td><td>" + (d ? '<input type="number" min="0" max="100" data-note-dev value="' + (d.note == null ? "" : d.note) + '" style="width:90px" aria-label="Note sur 100">' : "") + "</td>" : "") + "</tr>"; }).join("") || '<tr><td colspan="5" class="muted">Aucun étudiant ciblé.</td></tr>') + "</tbody></table></div>",
      apres: function (form) {
        form.querySelectorAll("[data-ouvrir-dev]").forEach(function (b) { b.addEventListener("click", function () { var e = comptes().filter(function (x) { return x.id === b.closest("[data-e]").dataset.e; })[0], d = e.devoirs[p.id]; window.NGFichiers.ouvrir(d.cle, d.nom); }); });
        form.querySelectorAll("[data-note-dev]").forEach(function (inp) { inp.addEventListener("change", function () { var e = comptes().filter(function (x) { return x.id === inp.closest("[data-e]").dataset.e; })[0], dv = Object.assign({}, e.devoirs || {}); dv[p.id] = Object.assign({}, dv[p.id], { note: inp.value === "" ? null : Math.max(0, Math.min(100, Number(inp.value))) }); S.modifier("comptes_etudiants", e.id, { devoirs: dv }); S.log("Devoir noté", e.nom + " · " + p.titre); A.toast("Note enregistrée", "ok"); }); });
      }
    });
  }

  /* Fiche de suivi de l'apprentissage d'un étudiant, avec analyse automatique */
  function ficheEtudiant(id) {
    var e = comptes().filter(function (x) { return x.id === id; })[0]; if (!e) return;
    var f = formation(e.formationId) || { modules: [], titre: "—", evaluations: [] }, st = stats(e, f);
    var jours = e.derniereActivite || e.derniereConnexion ? Math.floor((Date.now() - new Date(e.derniereActivite || e.derniereConnexion)) / 864e5) : null;
    var attendu = f.avancement || 0, ecart = st.progression - attendu;
    var alertes = [];
    if (e.enAttenteApprobation) alertes.push(["warn", "Compte en attente de validation : l’étudiant ne peut pas encore accéder aux cours."]);
    if (jours === null) alertes.push(["warn", "L’étudiant ne s’est jamais connecté à son espace."]);
    else if (jours >= 7) alertes.push(["warn", "Aucune activité depuis " + jours + " jours : risque d’abandon, relancez-le."]);
    if (ecart <= -20 && f.statut === "encours") alertes.push(["warn", "En retard de " + Math.abs(ecart) + " points sur l’avancement de la session (" + attendu + " %)."]);
    if (st.presence !== null && st.presence < 80) alertes.push(["warn", "Présence de " + st.presence + " % : l’attestation demande 80 %."]);
    if (st.moyenne !== null && st.moyenne < 50) alertes.push(["warn", "Moyenne de " + st.moyenne + "/100 : proposez une séance de rattrapage."]);
    if (!alertes.length) alertes.push(["ok", st.eligible ? "Tout est en ordre : l’attestation peut être délivrée." : "Bonne progression, rien à signaler."]);
    var qs = S.liste("questions").filter(function (q) { return q.etudiantId === e.id; });
    A.modal({ titre: "Suivi de " + e.nom, large: true, annuler: "Fermer",
      corps: '<div class="fiche-tete">' + A.avatar(e, 84) + '<div><h3>' + esc(e.nom) + "</h3><p>" + esc(e.identifiant) + " · " + esc(e.telephone || "") + '</p></div></div><div class="stat-line" style="display:flex;gap:8px;flex-wrap:wrap"><span class="tag tag-accent">' + esc(f.titre) + '</span><span class="tag tag-muted">' + esc(e.modeSuivi || f.mode || "") + '</span><span class="tag ' + (e.actif ? "tag-ok" : "tag-warn") + '">' + (e.actif ? "Compte actif" : e.enAttenteApprobation ? "À valider" : "Inactif") + '</span><span class="tag tag-muted">Dernière activité : ' + (jours === null ? "jamais" : jours === 0 ? "aujourd’hui" : "il y a " + jours + " j") + "</span></div>" +
        '<div class="kpis" style="margin:0"><div class="kpi"><span>Progression</span><strong>' + st.progression + ' %</strong><small>session : ' + attendu + ' %</small></div><div class="kpi"><span>Présence</span><strong>' + (st.presence === null ? "—" : st.presence + " %") + '</strong></div><div class="kpi"><span>Moyenne</span><strong>' + (st.moyenne === null ? "—" : st.moyenne + "/100") + '</strong></div><div class="kpi"><span>Questions posées</span><strong>' + qs.length + "</strong></div></div>" +
        '<div class="stack">' + alertes.map(function (a) { return '<div class="notice" style="margin:0;' + (a[0] === "warn" ? "background:var(--warn-soft);color:var(--warn)" : "") + '">' + (a[0] === "warn" ? "⚠ " : "✔ ") + esc(a[1]) + "</div>"; }).join("") + "</div>" +
        "<div><strong>Progression par module</strong>" + ((f.modules || []).map(function (m) { var L = m.lecons || [], n = L.filter(function (l) { return (e.lecons || {})[l.id]; }).length, pc = L.length ? Math.round(n / L.length * 100) : 0; return '<div style="margin-top:8px"><div style="display:flex;justify-content:space-between;font-size:.9rem"><span>' + esc(m.titre) + "</span><span>" + n + "/" + L.length + '</span></div><div class="progress"><span style="width:' + pc + '%"></span></div></div>'; }).join("") || '<p class="muted">Aucun module.</p>') + "</div>" +
        "<div><strong>Quiz et travaux</strong>" + (Object.keys(e.quiz || {}).concat(Object.keys(e.rendus || {})).length ? Object.keys(e.quiz || {}).map(function (k) { return '<div class="row-item mt-1"><span>Quiz ' + esc(k) + "</span><strong>" + e.quiz[k] + " %</strong></div>"; }).join("") + Object.keys(e.rendus || {}).map(function (k) { var r = e.rendus[k]; return '<div class="row-item mt-1"><span>TP · ' + esc(r.nom) + "</span><strong>" + (r.note == null ? "à corriger" : r.note + "/100") + "</strong></div>"; }).join("") : '<p class="muted">Pas encore de quiz ni de TP.</p>') + "</div>" +
        '<div class="send-row">' + (e.enAttenteApprobation ? '<a class="btn btn-primary" href="#inscriptions" data-close>Valider le compte</a>' : "") + '<button class="btn btn-whatsapp" type="button" id="fe-wa">Relancer sur WhatsApp</button><a class="btn btn-ghost" href="document.html?type=frequentation&eid=' + e.id + '" target="_blank" rel="noopener">Fiche de fréquentation</a><button class="btn btn-ghost" type="button" id="fe-gerer">⚙ Suspendre / supprimer</button></div>',
      apres: function (form) { form.querySelector("#fe-gerer").addEventListener("click", function () { A.fermer(); A.gererCompte("etudiant", e); }); form.querySelector("#fe-wa").addEventListener("click", function () { envoyer("wa", e, "Bonjour " + e.nom + ",\nVotre progression dans « " + f.titre + " » est de " + st.progression + " %. Continuez dans votre espace étudiant : " + lien(f) + "\nBesoin d’aide ? Répondez à ce message.\nNextGenIT Academy", ""); S.log("Étudiant relancé", e.nom); }); }
    });
  }

  /* =================== Présences, évaluations et attestations =================== */
  var fSuivi = "", ongletS = "presences";
  A.VUES.suivi = function () {
    var F = formations();
    if (!fSuivi || !formation(fSuivi)) { var enc = F.filter(function (f) { return f.statut === "encours"; })[0]; fSuivi = (enc || F[0] || {}).id || ""; }
    var f = formation(fSuivi);
    A.vue.innerHTML = A.entete("Présences et évaluations", "Suivez l’évolution de chaque formation, notez les étudiants et délivrez la fiche de fréquentation") +
      '<div class="toolbar"><select id="s-f" aria-label="Formation">' + A.options(F.map(function (x) { return [x.id, x.titre + " · " + x.periode]; }), fSuivi) + "</select></div>" +
      (f ? '<div class="tabs" role="tablist">' + [["presences", "Présences"], ["notes", "Notes"], ["progression", "Progression des cours"], ["travaux", "Travaux et questions"], ["attestations", "Fréquentation et attestations"]].map(function (o) { return '<button class="tab" type="button" role="tab" data-os="' + o[0] + '" aria-selected="' + (ongletS === o[0]) + '">' + o[1] + "</button>"; }).join("") + '</div><div id="s-contenu"></div>' : '<div class="card empty"><p>Créez d’abord une formation.</p></div>');
    document.getElementById("s-f").addEventListener("change", function (e) { fSuivi = e.target.value; A.rafraichir(); });
    A.lier("[data-os]", "click", function (e, b) { ongletS = b.dataset.os; A.rafraichir(); });
    if (f) ({ presences: sPresences, notes: sNotes, progression: sProgression, travaux: sTravaux, attestations: sAttestations })[ongletS](f);
  };
  function sPresences(f) {
    var E = comptes(f.id), se = (f.seances || []).slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    document.getElementById("s-contenu").innerHTML = '<div class="card"><div class="toolbar"><input type="date" id="se-date" value="' + new Date().toISOString().slice(0, 10) + '" style="min-height:42px;border-radius:10px;border:1px solid var(--line-2);background:var(--surface);color:var(--text);padding:0 10px"><input id="se-titre" placeholder="Thème de la séance" style="flex:1;min-height:42px;border-radius:10px;border:1px solid var(--line-2);background:var(--surface);color:var(--text);padding:0 12px"><input type="time" id="se-heure" value="09:00" aria-label="Heure" style="min-height:42px;border-radius:10px;border:1px solid var(--line-2);background:var(--surface);color:var(--text);padding:0 10px"><input id="se-lien" type="url" placeholder="Lien de classe virtuelle (Meet, Zoom, Teams…) – facultatif" style="flex:1;min-width:220px;min-height:42px;border-radius:10px;border:1px solid var(--line-2);background:var(--surface);color:var(--text);padding:0 12px"><button class="btn btn-primary" type="button" id="se-add">+ Séance</button></div><p class="muted" style="font-size:.85rem;margin:0 0 10px">Avec un lien de classe virtuelle, l’étudiant clique « Rejoindre » le jour de la séance : sa présence est notée automatiquement.</p>' + (se.filter(function (x) { return x.lien; }).length ? '<div class="stack" style="margin-bottom:12px">' + se.filter(function (x) { return x.lien && x.date >= new Date().toISOString().slice(0, 10); }).map(function (x) { return '<div class="row-item"><span>🎥 ' + esc(A.jour(x.date + "T12:00:00")) + (x.heure ? " à " + esc(x.heure) : "") + " · " + esc(x.titre || "Séance") + '</span><a class="btn btn-ghost btn-sm" href="' + esc(x.lien) + '" target="_blank" rel="noopener">Ouvrir la classe</a></div>'; }).join("") + "</div>" : "") +
      (E.length && se.length ? '<div class="table-wrap"><table class="t" style="min-width:' + (300 + se.length * 90) + 'px"><thead><tr><th>Étudiant</th>' + se.map(function (s) { return '<th style="text-align:center">' + new Date(s.date + "T12:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }) + "<br><small>" + esc(s.titre || "") + "</small></th>"; }).join("") + '<th class="r">Présence</th></tr></thead><tbody>' +
        E.map(function (e) { var st = stats(e, f); return "<tr><td><strong>" + esc(e.nom) + "</strong></td>" + se.map(function (s) { return '<td style="text-align:center"><input type="checkbox" style="width:22px;height:22px" data-pres="' + s.id + '" data-etu="' + e.id + '"' + ((s.presents || []).indexOf(e.id) > -1 ? " checked" : "") + ' aria-label="Présence ' + esc(e.nom) + " " + s.date + '"></td>'; }).join("") + '<td class="r"><strong class="' + (st.presence !== null && st.presence < 80 ? "down" : "up") + '">' + (st.presence === null ? "—" : st.presence + " %") + "</strong></td></tr>"; }).join("") + "</tbody></table></div>"
        : '<p class="muted">' + (E.length ? "Ajoutez une première séance pour faire l’appel." : "Aucun étudiant inscrit à cette formation.") + "</p>") + "</div>";
    document.getElementById("se-add").addEventListener("click", function () { var d = document.getElementById("se-date").value; if (!d) return; var s = (f.seances || []).concat([{ id: "SE" + Date.now().toString(36), date: d, titre: document.getElementById("se-titre").value.trim(), heure: document.getElementById("se-heure").value, lien: document.getElementById("se-lien").value.trim(), presents: [] }]); majFormation(f.id, { seances: s }); S.log("Séance ajoutée", f.titre + " · " + d); A.rafraichir(); });
    A.lier("[data-pres]", "change", function (ev, c) {
      var s = (formation(f.id).seances || []).map(function (x) { if (x.id === c.dataset.pres) { var p = (x.presents || []).filter(function (i) { return i !== c.dataset.etu; }); if (c.checked) p.push(c.dataset.etu); x.presents = p; } return x; });
      majFormation(f.id, { seances: s }); A.rafraichir();
    });
  }
  function sNotes(f) {
    var E = comptes(f.id), EV = f.evaluations || [];
    document.getElementById("s-contenu").innerHTML = '<div class="card"><p>Les évaluations se créent dans « Contenu du cours ». Les résultats des quiz en ligne s’ajoutent automatiquement.</p>' + (E.length ? '<div class="table-wrap"><table class="t"><thead><tr><th>Étudiant</th>' + EV.map(function (ev) { return '<th style="width:130px">' + esc(ev.titre) + " /" + (ev.sur || 100) + "</th>"; }).join("") + '<th class="r">Quiz</th><th class="r">Moyenne</th></tr></thead><tbody>' +
      E.map(function (e) { var q = Object.keys(e.quiz || {}).map(function (k) { return e.quiz[k]; }), st = stats(e, f); return "<tr><td><strong>" + esc(e.nom) + "</strong></td>" + EV.map(function (ev) { var v = (e.notes || {})[ev.id]; return '<td><input type="number" min="0" max="' + (ev.sur || 100) + '" data-note="' + ev.id + '" data-etu="' + e.id + '" value="' + (v == null ? "" : v) + '" aria-label="' + esc(ev.titre + " " + e.nom) + '"></td>'; }).join("") + '<td class="r">' + (q.length ? Math.round(q.reduce(function (a, b) { return a + b; }, 0) / q.length) + " %" : "—") + '</td><td class="r"><strong class="' + (st.moyenne !== null && st.moyenne < 50 ? "down" : "up") + '">' + (st.moyenne === null ? "—" : st.moyenne + " / 100") + "</strong></td></tr>"; }).join("") + "</tbody></table></div>" : '<p class="muted">Aucun étudiant.</p>') + "</div>";
    A.lier("[data-note]", "change", function (ev, inp) { var e = comptes().filter(function (x) { return x.id === inp.dataset.etu; })[0]; var n = Object.assign({}, e.notes || {}); n[inp.dataset.note] = inp.value === "" ? null : Math.max(0, Math.min(100, Number(inp.value))); S.modifier("comptes_etudiants", e.id, { notes: n }); S.log("Note saisie", e.nom + " · " + f.titre); A.rafraichir(); });
  }
  function sProgression(f) {
    var E = comptes(f.id), L = lecons(f);
    document.getElementById("s-contenu").innerHTML = '<div class="card"><h2 class="h-card">Taux de complétion des modules</h2>' + (E.length ? A.barres(E.map(function (e) { return { label: e.nom, val: stats(e, f).progression }; })).replace(/<strong>(\d+)<\/strong>/g, "<strong>$1 %</strong>") : '<p class="muted">Aucun étudiant.</p>') + '</div><div class="card mt-2"><h2 class="h-card">Détail par leçon</h2>' + (L.length && E.length ? '<div class="table-wrap"><table class="t" style="min-width:' + (260 + L.length * 70) + 'px"><thead><tr><th>Étudiant</th>' + L.map(function (l) { return '<th style="text-align:center" title="' + esc(l.titre) + '">' + ABR[l.type] + "</th>"; }).join("") + "</tr></thead><tbody>" + E.map(function (e) { return "<tr><td>" + esc(e.nom) + "</td>" + L.map(function (l) { var ok = (e.lecons || {})[l.id]; return '<td style="text-align:center">' + (ok ? '<span class="up">✓</span>' : '<span class="muted">·</span>') + (l.type === "quiz" && (e.quiz || {})[l.id] != null ? "<br><small>" + e.quiz[l.id] + " %</small>" : "") + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div>" : '<p class="muted">Ajoutez des leçons dans « Contenu du cours ».</p>') + "</div>";
  }
  function sTravaux(f) {
    var E = comptes(f.id), L = lecons(f), rendus = [];
    E.forEach(function (e) { Object.keys(e.rendus || {}).forEach(function (lid) { var l = L.filter(function (x) { return x.id === lid; })[0]; rendus.push({ e: e, lid: lid, l: l, r: e.rendus[lid] }); }); });
    var Q = S.liste("questions").filter(function (q) { return q.formationId === f.id; });
    document.getElementById("s-contenu").innerHTML = '<div class="split-2"><div class="card"><h2 class="h-card">Travaux pratiques rendus (' + rendus.length + ')</h2>' +
      (rendus.map(function (x, k) { return '<div class="module-box" data-k="' + k + '"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><strong>' + esc(x.e.nom) + '</strong><small class="muted">' + A.jour(x.r.date) + '</small></div><small class="muted">' + esc(x.l ? x.l.titre : "TP") + " · " + esc(x.r.nom) + '</small><div class="hero-actions"><button class="btn btn-ghost btn-sm" type="button" data-tp-ouvrir>Ouvrir le fichier</button><input type="number" min="0" max="100" placeholder="Note /100" data-tp-note value="' + (x.r.note == null ? "" : x.r.note) + '" style="width:110px;min-height:38px;border-radius:10px;border:1px solid var(--line-2);background:var(--bg);color:var(--text);padding:0 10px" aria-label="Note"></div><textarea data-tp-com placeholder="Commentaire pour l’étudiant" style="min-height:60px;border-radius:10px;border:1px solid var(--line-2);background:var(--bg);color:var(--text);padding:8px 10px;font:inherit">' + esc(x.r.commentaire || "") + '</textarea><button class="btn btn-primary btn-sm" type="button" data-tp-save style="justify-self:start">Enregistrer la correction</button></div>'; }).join("") || '<p class="muted">Aucun travail rendu. Ajoutez une leçon « Travail pratique à rendre » dans le contenu du cours.</p>') + "</div>" +
      '<div class="card"><h2 class="h-card">Questions des étudiants (' + Q.filter(function (q) { return !q.reponse; }).length + " sans réponse)</h2>" +
      (Q.map(function (q) { return '<div class="module-box" data-q="' + q.id + '"><small class="muted">' + esc(q.auteur) + " · " + esc(q.lecon) + " · " + A.jour(q.creeLe) + "</small><div>" + esc(q.texte) + "</div>" + (q.reponse ? '<div class="notice" style="margin:0">' + esc(q.reponse) + "</div>" : '<textarea data-q-rep placeholder="Votre réponse" style="min-height:60px;border-radius:10px;border:1px solid var(--line-2);background:var(--bg);color:var(--text);padding:8px 10px;font:inherit"></textarea><button class="btn btn-primary btn-sm" type="button" data-q-send style="justify-self:start">Répondre</button>') + "</div>"; }).join("") || '<p class="muted">Aucune question pour le moment.</p>') + "</div></div>";
    A.lier("[data-tp-ouvrir]", "click", function (ev, b) { var x = rendus[Number(b.closest("[data-k]").dataset.k)]; window.NGFichiers.ouvrir(x.r.cle, x.r.nom); });
    A.lier("[data-tp-save]", "click", function (ev, b) {
      var box = b.closest("[data-k]"), x = rendus[Number(box.dataset.k)], e = comptes().filter(function (y) { return y.id === x.e.id; })[0];
      var rs = Object.assign({}, e.rendus || {}); var n = box.querySelector("[data-tp-note]").value;
      rs[x.lid] = Object.assign({}, rs[x.lid], { note: n === "" ? null : Math.max(0, Math.min(100, Number(n))), commentaire: box.querySelector("[data-tp-com]").value.trim(), corrigePar: A.moi().nom });
      S.modifier("comptes_etudiants", e.id, { rendus: rs }); S.log("TP corrigé", e.nom + " · " + (x.l ? x.l.titre : "")); A.toast("Correction enregistrée", "ok"); A.rafraichir();
    });
    A.lier("[data-q-send]", "click", function (ev, b) { var box = b.closest("[data-q]"), t = box.querySelector("[data-q-rep]").value.trim(); if (!t) return; S.modifier("questions", box.dataset.q, { reponse: t, repondPar: A.moi().nom, reponduLe: new Date().toISOString() }); S.log("Réponse à un étudiant", t.slice(0, 60)); A.toast("Réponse publiée", "ok"); A.rafraichir(); });
  }
  function autorisee(e) { return !!(e.attestationAutorisee || (e.attestation && e.attestationAutorisee !== false)); }
  A.attestationAutorisee = autorisee;
  function sAttestations(f) {
    var E = comptes(f.id), L = lecons(f);
    var fini = function (e) { return f.statut === "terminee" || (L.length && L.every(function (l) { return (e.lecons || {})[l.id]; })); };
    var aAut = E.filter(function (e) { return !autorisee(e) && stats(e, f).eligible && fini(e); }).length;
    document.getElementById("s-contenu").innerHTML = '<div class="card"><p>L’attestation et la fiche de fréquentation n’apparaissent dans l’espace de l’étudiant <strong>qu’après votre autorisation</strong>. Conditions conseillées : formation terminée, 80 % de présence et 50/100 de moyenne.</p>' + (aAut ? '<p class="notice">✔ ' + aAut + " étudiant(s) remplissent toutes les conditions : autorisez leur attestation.</p>" : "") + '<div class="table-wrap"><table class="t" style="min-width:980px"><thead><tr><th>Étudiant</th><th class="r">Présence</th><th class="r">Moyenne</th><th class="r">Progression</th><th>Attestation</th><th>Fiche de fréquentation et attestation</th></tr></thead><tbody>' +
      (E.map(function (e) {
        var s = stats(e, f), aut = autorisee(e), etat = aut ? '<span class="tag tag-ok">✔ Autorisée · ' + esc(e.attestation || "") + "</span>" : s.eligible && fini(e) ? '<span class="tag tag-warn">À autoriser</span>' : s.eligible ? '<span class="tag tag-accent">Conditions remplies · cours en cours</span>' : '<span class="tag tag-muted">' + (s.presence === null || s.moyenne === null ? "En cours" : s.presence < 80 ? "Présence insuffisante" : "Moyenne insuffisante") + "</span>";
        return '<tr data-e="' + e.id + '"><td><div style="display:flex;gap:10px;align-items:center">' + A.avatar(e, 34) + "<strong>" + esc(e.nom) + '</strong></div></td><td class="r">' + (s.presence === null ? "—" : s.presence + " %") + '</td><td class="r">' + (s.moyenne === null ? "—" : s.moyenne + " / 100") + '</td><td class="r">' + s.progression + " %</td><td>" + etat + '</td><td class="r" style="white-space:nowrap"><a class="ico-btn" href="document.html?type=frequentation&eid=' + e.id + '" target="_blank" rel="noopener" title="Voir la fiche de fréquentation" aria-label="Voir la fiche de fréquentation">📋</a> ' + (e.frequentationAutorisee ? '<button class="btn btn-ghost btn-sm" type="button" data-freq="0" title="La fiche est visible par l’étudiant">📋 Fiche publiée ↩</button> ' : '<button class="btn btn-ghost btn-sm" type="button" data-freq="1">📋 Publier la fiche</button> ') +
          (aut ? '<a class="btn btn-ghost btn-sm" href="document.html?type=attestation&eid=' + e.id + '" target="_blank" rel="noopener">📄 Voir</a> <button class="btn btn-whatsapp btn-sm" type="button" data-att-wa>Prévenir</button> <button class="ico-btn danger" type="button" data-att-retirer title="Retirer l’autorisation" aria-label="Retirer l’autorisation">↩</button>' : '<button class="btn btn-primary btn-sm" type="button" data-att-ok>✅ Autoriser</button>') + "</td></tr>";
      }).join("") || '<tr><td colspan="6" class="muted">Aucun étudiant.</td></tr>') + "</tbody></table></div></div>";
    var trouver = function (b) { return comptes().filter(function (x) { return x.id === b.closest("[data-e]").dataset.e; })[0]; };
    A.lier("[data-att-ok]", "click", function (ev, b) {
      var e = trouver(b), s = stats(e, f);
      if (!(s.eligible && fini(e)) && !confirm(e.nom + " ne remplit pas toutes les conditions (" + (fini(e) ? "" : "cours non terminé, ") + "présence " + (s.presence === null ? "—" : s.presence + " %") + ", moyenne " + (s.moyenne === null ? "—" : s.moyenne) + "). Autoriser quand même l’attestation ?")) return;
      S.modifier("comptes_etudiants", e.id, { attestationAutorisee: true, attestation: e.attestation || "ATT-" + new Date().getFullYear() + "-" + String(Date.now()).slice(-5), attestationLe: new Date().toISOString(), attestationPar: A.moi().nom });
      S.log("Attestation autorisée", e.nom + " · " + f.titre); A.toast("Attestation autorisée : elle apparaît dans l’espace de " + e.nom, "ok"); A.rafraichir();
    });
    A.lier("[data-freq]", "click", function (ev, b) { var e = trouver(b), v = b.dataset.freq === "1"; S.modifier("comptes_etudiants", e.id, { frequentationAutorisee: v, frequentationLe: v ? new Date().toISOString() : "" }); S.log(v ? "Fiche de fréquentation publiée" : "Fiche de fréquentation retirée", e.nom + " · " + f.titre); A.toast(v ? "La fiche est visible dans l’espace de " + e.nom : "Fiche retirée de l’espace de " + e.nom, "ok"); A.rafraichir(); });
    A.lier("[data-att-retirer]", "click", function (ev, b) { var e = trouver(b); if (!confirm("Retirer l’attestation de " + e.nom + " ? Elle disparaît de son espace.")) return; S.modifier("comptes_etudiants", e.id, { attestationAutorisee: false }); S.log("Attestation retirée", e.nom + " · " + f.titre); A.rafraichir(); });
    A.lier("[data-att-wa]", "click", function (ev, b) { var e = trouver(b); envoyer("wa", e, "Félicitations " + e.nom + " ! 🎉\nVotre attestation de la formation « " + f.titre + " » est disponible dans votre espace étudiant (menu Attestation) :\n" + lien(f) + "\nNextGenIT Academy", ""); });
  }

})();
