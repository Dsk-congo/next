/* Administration – Équipe : administrateurs et droits, mon compte, site public, apparence, paramètres */
(function () {
  var A = window.NGA, S = A.S, esc = A.esc, T = A.T;
  var LIBS = { actif: ["Actif", "tag-ok"], desactive: ["Désactivé", "tag-muted"], suspendu: ["Suspendu", "tag-warn"] };
  function lienAdmin() { return location.href.split("#")[0]; }
  function envoyer(canal, a, msg, sujet) {
    var tel = String(a.telephone || "").replace(/[^\d]/g, "");
    window.open(canal === "wa" ? "https://wa.me/" + tel + "?text=" + encodeURIComponent(msg) : "mailto:" + encodeURIComponent(a.email) + "?subject=" + encodeURIComponent(sujet) + "&body=" + encodeURIComponent(msg), "_blank", "noopener");
  }
  function grilleDroits(actifs, desactive) {
    return '<div class="stack" style="gap:14px">' + A.GROUPES.map(function (g) {
      return '<div><div class="panel-label" style="margin-bottom:6px">' + g[0] + '</div><div class="perm-grid">' + g[1].map(function (m) { return '<label><input type="checkbox" name="mod" value="' + m[0] + '"' + (actifs.indexOf(m[0]) > -1 ? " checked" : "") + (desactive ? " disabled" : "") + "> " + m[1] + "</label>"; }).join("") + "</div></div>";
    }).join("") + "</div>";
  }
  function identifiants(a, mdp) {
    return "Bonjour " + a.nom + ",\n\nVotre accès à l’administration NextGenIT est prêt.\n🔗 " + lienAdmin() + "\n👤 " + a.email + "\n🔑 " + mdp + "\nRôle : " + ((A.roles()[a.role] || {}).nom || a.role) + "\n\nChangez votre mot de passe dans « Mon compte » dès la première connexion.";
  }
  function montrerIdentifiants(a, mdp) {
    var msg = identifiants(a, mdp);
    A.modal({ titre: "Identifiants de " + a.nom, annuler: "Terminé", corps: '<div class="row-item block"><small class="muted">Adresse de connexion</small><strong>' + esc(lienAdmin()) + '</strong><small class="muted">Email</small><strong>' + esc(a.email) + '</strong><small class="muted">Mot de passe provisoire</small><strong style="font-family:ui-monospace,monospace">' + esc(mdp) + '</strong></div><div class="send-row"><button class="btn btn-whatsapp" type="button" data-c="wa"' + (a.telephone ? "" : " disabled") + '>WhatsApp</button><button class="btn btn-ghost" type="button" data-c="mail">Email</button></div><p class="muted" style="font-size:.85rem">Le mot de passe n’est plus visible après la fermeture.</p>',
      apres: function (f) { f.querySelectorAll("[data-c]").forEach(function (b) { b.addEventListener("click", function () { envoyer(b.dataset.c, a, msg, "Vos accès à l’administration NextGenIT"); }); }); } });
  }

  /* =================== Administrateurs et droits =================== */
  A.VUES.admins = function () {
    var L = A.admins(), R = A.roles(), me = A.moi(), en = A.enLigne().map(function (x) { return x.id; });
    A.vue.innerHTML = A.entete("Administrateurs et droits", "Créez les comptes, activez-les ou suspendez-les, et choisissez exactement ce que chacun voit dans son tableau de bord", '<button class="btn btn-primary" type="button" id="ad-new">+ Nouvel administrateur</button>') +
      '<div class="kpis"><div class="kpi"><span>Administrateurs</span><strong data-count="' + L.length + '">0</strong></div><div class="kpi"><span>En ligne maintenant</span><strong class="up" data-count="' + en.length + '">0</strong></div><div class="kpi"><span>Comptes actifs</span><strong data-count="' + L.filter(function (a) { return a.statut === "actif"; }).length + '">0</strong></div><div class="kpi"><span>Suspendus ou désactivés</span><strong data-count="' + L.filter(function (a) { return a.statut !== "actif"; }).length + '">0</strong></div></div>' +
      '<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(min(100%,330px),1fr))">' + L.map(function (a) {
        var moi = a.id === me.id, st = LIBS[a.statut] || LIBS.actif, mods = A.modulesDe(a);
        return '<article class="card person' + (a.statut === "actif" ? "" : " off") + '" data-a="' + a.id + '"><div style="display:flex;gap:12px;align-items:center">' + A.avatar(a, 54, en.indexOf(a.id) > -1) + '<div style="min-width:0;flex:1"><strong>' + esc(a.nom) + (moi ? ' <span class="tag tag-accent">vous</span>' : "") + '</strong><br><small class="muted">' + esc(a.email) + '</small><br><small class="muted">' + esc(a.poste || "") + '</small></div></div><div class="chips"><span class="tag tag-accent">' + esc((R[a.role] || {}).nom || a.role) + '</span><span class="tag ' + st[1] + '">' + st[0] + "</span>" + (en.indexOf(a.id) > -1 ? '<span class="tag tag-ok"><span class="live-dot" style="margin-right:6px"></span>En ligne</span>' : "") + (a.modules && a.modules.length && a.role !== "super" ? '<span class="tag tag-muted">Droits personnalisés</span>' : "") + "</div>" +
          '<p style="font-size:.88rem">Voit ' + mods.length + " module(s) sur " + A.TOUS.length + " · dernière connexion " + A.heure(a.derniereConnexion) + "</p>" +
          (moi ? "" : '<div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:.9rem">Compte activé</span>' + A.interrupteur("data-a-actif", a.statut === "actif", "Compte activé " + a.nom) + "</div>") +
          '<div class="foot"><span class="hero-actions"><button class="btn btn-ghost btn-sm" type="button" data-a-edit>Modifier et droits</button>' + (moi ? "" : '<button class="btn btn-ghost btn-sm" type="button" data-a-susp>' + (a.statut === "suspendu" ? "Lever la suspension" : "Suspendre") + '</button><button class="btn btn-ghost btn-sm" type="button" data-a-mdp>Nouveau mot de passe</button>') + "</span></div></article>";
      }).join("") + "</div>" +
      '<form class="card mt-3" id="form-roles"><h2 class="h-card">Droits par défaut de chaque rôle</h2><p>Un administrateur sans droits personnalisés voit les modules cochés pour son rôle. Le Super admin voit tout.</p><div class="table-wrap"><table class="t" style="min-width:820px"><thead><tr><th>Module</th>' + Object.keys(R).map(function (k) { return '<th style="text-align:center">' + esc(R[k].nom) + "</th>"; }).join("") + "</tr></thead><tbody>" +
      A.MODULES.map(function (m) { return "<tr><td>" + m[1] + "</td>" + Object.keys(R).map(function (k) { return '<td style="text-align:center"><input type="checkbox" style="width:20px;height:20px" name="' + k + '" value="' + m[0] + '"' + (R[k].modules.indexOf(m[0]) > -1 ? " checked" : "") + (k === "super" ? " disabled" : "") + ' aria-label="' + esc(R[k].nom + " : " + m[1]) + '"></td>'; }).join("") + "</tr>"; }).join("") +
      '</tbody></table></div><button class="btn btn-primary" type="submit" style="align-self:flex-start">Enregistrer les droits des rôles</button></form>';
    document.getElementById("ad-new").addEventListener("click", function () { formAdmin(null); });
    A.lier("[data-a-edit]", "click", function (e, b) { formAdmin(A.admins().filter(function (x) { return x.id === b.closest("[data-a]").dataset.a; })[0]); });
    A.lier("[data-a-actif]", "click", function (e, b) { var id = b.closest("[data-a]").dataset.a, a = A.admins().filter(function (x) { return x.id === id; })[0], st = a.statut === "actif" ? "desactive" : "actif"; S.modifier("admins", id, { statut: st }); S.log(st === "actif" ? "Administrateur activé" : "Administrateur désactivé", a.nom); A.toast(a.nom + (st === "actif" ? " activé" : " désactivé"), st === "actif" ? "ok" : "warn"); A.rafraichir(); });
    A.lier("[data-a-susp]", "click", function (e, b) { var id = b.closest("[data-a]").dataset.a, a = A.admins().filter(function (x) { return x.id === id; })[0], st = a.statut === "suspendu" ? "actif" : "suspendu"; S.modifier("admins", id, { statut: st }); S.log(st === "suspendu" ? "Administrateur suspendu" : "Suspension levée", a.nom); A.rafraichir(); });
    A.lier("[data-a-mdp]", "click", function (e, b) { var a = A.admins().filter(function (x) { return x.id === b.closest("[data-a]").dataset.a; })[0], mdp = A.motDePasse(); A.sha256(a.email.toLowerCase() + ":" + mdp).then(function (h) { S.modifier("admins", a.id, { hash: h }); S.log("Mot de passe réinitialisé", a.nom); montrerIdentifiants(a, mdp); }); });
    document.getElementById("form-roles").addEventListener("submit", function (e) {
      e.preventDefault();
      var R2 = A.roles();
      Object.keys(R2).forEach(function (k) { if (k !== "super") R2[k].modules = Array.prototype.map.call(e.target.querySelectorAll('[name="' + k + '"]:checked'), function (x) { return x.value; }); });
      S.enregistrerListe("roles", R2); S.log("Droits des rôles modifiés", ""); A.toast("Droits enregistrés", "ok"); A.rafraichir();
    });
  };
  function formAdmin(a) {
    var n = !a, R = A.roles(), me = A.moi();
    a = a || { nom: "", email: "", telephone: "", poste: "", role: "support", modules: null };
    var perso = !!(a.modules && a.modules.length);
    A.modal({
      titre: n ? "Nouvel administrateur" : "Modifier " + a.nom, valider: n ? "Créer et générer les identifiants" : "Enregistrer", large: true,
      corps: '<div class="form-grid"><label class="field">Nom complet<input name="nom" required value="' + esc(a.nom) + '"></label><label class="field">Email de connexion<input name="email" type="email" required value="' + esc(a.email) + '"' + (n ? "" : " disabled") + '></label><label class="field">Téléphone / WhatsApp<input name="tel" type="tel" value="' + esc(a.telephone || "") + '"></label><label class="field">Poste<input name="poste" value="' + esc(a.poste || "") + '"></label><label class="field">Rôle<select name="role"' + (a.id === me.id ? " disabled" : "") + ">" + A.options(Object.keys(R).map(function (k) { return [k, R[k].nom]; }), a.role) + "</select></label></div>" +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div><strong>Droits personnalisés</strong><br><small class="muted">Sinon, les droits du rôle s’appliquent.</small></div>' + A.interrupteur('id="perso"', perso, "Droits personnalisés") + "</div>" +
        (a.totpActif && a.id !== me.id ? '<div class="row-item"><span>Double authentification activée</span><button type="button" class="btn btn-ghost btn-sm" id="reset-2fa">Désactiver (téléphone perdu)</button></div>' : "") +
        '<div id="zone-droits">' + grilleDroits(perso ? a.modules : (R[a.role] || {}).modules || [], !perso) + "</div>",
      apres: function (f) {
        var sw = f.querySelector("#perso");
        var maj = function () { var on = sw.getAttribute("aria-checked") === "true"; var base = on ? (a.modules && a.modules.length ? a.modules : (R[f.role.value] || {}).modules || []) : (R[f.role.value] || {}).modules || []; f.querySelector("#zone-droits").innerHTML = grilleDroits(base, !on); };
        var r2 = f.querySelector("#reset-2fa");
        if (r2) r2.addEventListener("click", function () { S.modifier("admins", a.id, { totpActif: false, totpSecret: "" }); S.log("Double authentification réinitialisée", a.nom); r2.closest(".row-item").innerHTML = "<span>Double authentification désactivée. La personne pourra la réactiver dans « Mon compte ».</span>"; });
        sw.addEventListener("click", function () { sw.setAttribute("aria-checked", String(sw.getAttribute("aria-checked") !== "true")); maj(); });
        f.role.addEventListener("change", maj);
      },
      onSubmit: function (f) {
        var perso2 = f.querySelector("#perso").getAttribute("aria-checked") === "true";
        var mods = perso2 ? Array.prototype.map.call(f.querySelectorAll("[name=mod]:checked"), function (x) { return x.value; }) : null;
        if (mods && mods.indexOf("compte") < 0) mods.push("compte");
        var data = { nom: f.nom.value.trim(), telephone: f.tel.value.trim(), poste: f.poste.value.trim(), role: a.id === me.id ? a.role : f.role.value, modules: mods };
        if (!data.nom) { A.toast("Nom obligatoire", "warn"); return false; }
        if (n) {
          var email = f.email.value.trim().toLowerCase();
          if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { A.toast("Email invalide", "warn"); return false; }
          if (A.admins().some(function (x) { return x.email.toLowerCase() === email; })) { A.toast("Cet email a déjà un compte", "warn"); return false; }
          var mdp = A.motDePasse();
          return A.sha256(email + ":" + mdp).then(function (h) {
            var x = S.ajouter("admins", Object.assign(data, { email: email, statut: "actif", hash: h }), "A-");
            S.log("Administrateur créé", x.nom + " · " + (R[x.role] || {}).nom + (mods ? " · droits personnalisés" : ""));
            A.fermer(); A.rafraichir(); montrerIdentifiants(x, mdp); return false;
          });
        }
        S.modifier("admins", a.id, data);
        S.log("Administrateur modifié", data.nom + (mods ? " · droits personnalisés (" + mods.length + " modules)" : " · droits du rôle"));
        if (a.id === me.id) A.majProfil();
        A.rafraichir(); A.toast("Enregistré", "ok");
      }
    });
  }

  /* =================== Mon compte =================== */
  A.VUES.compte = function () {
    var a = A.moi(), R = A.roles();
    var mes = S.journal().filter(function (j) { return j.qui === a.nom && /^Connexion/.test(j.action); }).slice(0, 6);
    A.vue.innerHTML = A.entete("Mon compte", "Votre photo, votre identité, votre mot de passe") +
      '<div class="card"><div class="profile-head"><div class="photo-edit">' + A.avatar(a, 96, true) + '<label title="Changer la photo"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7h4l2-3h6l2 3h4v13H3zM12 17a4 4 0 100-8 4 4 0 000 8z"/></svg><input type="file" accept="image/*" id="photo" class="sr-only" aria-label="Changer ma photo"></label></div><div style="flex:1;min-width:220px"><h2 style="font-size:1.6rem">' + esc(a.nom) + '</h2><p>' + esc(a.poste || "") + " · " + esc((R[a.role] || {}).nom || a.role) + '</p><p style="display:flex;align-items:center;gap:8px;margin-top:6px"><span class="live-dot"></span><strong class="up">En ligne</strong> <span class="muted">· ' + A.modulesDe(a).length + " modules accessibles</span></p></div>" + (a.photo ? '<span class="hero-actions"><button class="btn btn-ghost btn-sm" type="button" id="photo-recadrer">✂ Recadrer / redimensionner</button><button class="btn btn-ghost btn-sm" type="button" id="photo-suppr">Retirer la photo</button></span>' : "") + "</div></div>" +
      '<div class="split-2 mt-2"><form class="card" id="form-id"><h2 class="h-card">Mon identité</h2><div class="form-grid"><label class="field">Nom complet<input name="nom" required value="' + esc(a.nom) + '"></label><label class="field">Poste<input name="poste" value="' + esc(a.poste || "") + '"></label><label class="field">Téléphone / WhatsApp<input name="tel" type="tel" value="' + esc(a.telephone || "") + '"></label><label class="field">Email de connexion<input name="email" type="email" value="' + esc(a.email) + '"></label><label class="field full">Mot de passe actuel<input name="mdp" type="password" autocomplete="current-password"><small>Obligatoire seulement pour changer l’email.</small></label></div><button class="btn btn-primary" type="submit" style="align-self:flex-start">Enregistrer</button></form>' +
      '<form class="card" id="form-mdp"><h2 class="h-card">Mot de passe</h2><label class="field">Mot de passe actuel<input name="actuel" type="password" required autocomplete="current-password"></label><label class="field">Nouveau mot de passe<input name="mdp" type="password" minlength="10" required autocomplete="new-password"><small>10 caractères minimum, avec chiffres et lettres.</small></label><label class="field">Confirmer<input name="mdp2" type="password" required autocomplete="new-password"></label><button class="btn btn-primary" type="submit" style="align-self:flex-start">Changer le mot de passe</button></form></div>' +
      '<div class="card mt-2" id="carte-2fa"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><div><h2 class="h-card">Double authentification</h2><p>' + (a.totpActif ? "Activée : un code de votre application est demandé à chaque connexion." : "Protégez votre compte : en plus du mot de passe, un code à 6 chiffres de votre téléphone est demandé.") + '</p></div><span class="tag ' + (a.totpActif ? "tag-ok" : "tag-warn") + '">' + (a.totpActif ? "Activée" : "Désactivée") + '</span></div><div id="zone-2fa"></div><button class="btn ' + (a.totpActif ? "btn-ghost" : "btn-primary") + '" type="button" id="btn-2fa" style="align-self:flex-start">' + (a.totpActif ? "Désactiver" : "Activer la double authentification") + "</button></div>" +
      '<div class="card mt-2"><h2 class="h-card">Mes dernières connexions</h2>' + (mes.map(function (j) { return '<div class="row-item"><span>' + esc(j.action) + '</span><span class="muted">' + A.heure(j.quand) + "</span></div>"; }).join("") || '<p class="muted">Aucune.</p>') + "</div>";
    document.getElementById("btn-2fa").addEventListener("click", function () {
      var zone = document.getElementById("zone-2fa"), btn = this;
      if (a.totpActif) {
        zone.innerHTML = '<form class="stack" id="f-off" style="gap:10px;max-width:360px"><label class="field">Code actuel de votre application<input name="code" inputmode="numeric" maxlength="6" class="code-input" placeholder="ex. 482 913" required></label><button class="btn btn-ghost" type="submit">Confirmer la désactivation</button></form>';
        btn.hidden = true;
        zone.querySelector("#f-off").addEventListener("submit", function (ev) { ev.preventDefault(); A.verifierTotp(a.totpSecret, ev.target.code.value).then(function (ok) { if (!ok) { A.toast("Code incorrect", "warn"); return; } S.modifier("admins", a.id, { totpActif: false, totpSecret: "" }); S.log("Double authentification désactivée", a.nom); A.toast("Double authentification désactivée", "warn"); A.rafraichir(); }); });
        return;
      }
      var secret = A.secretTotp(), uri = "otpauth://totp/NextGenIT:" + encodeURIComponent(a.email) + "?secret=" + secret + "&issuer=NextGenIT&digits=6&period=30";
      btn.hidden = true;
      zone.innerHTML = '<div class="split-2 mt-1"><div class="stack" style="gap:10px"><p><strong>1.</strong> Installez Google Authenticator ou Microsoft Authenticator sur votre téléphone.</p><p><strong>2.</strong> Scannez le QR code, ou saisissez la clé :</p><div class="row-item block"><small class="muted">Clé secrète</small><strong style="font-family:ui-monospace,monospace;letter-spacing:.08em;word-break:break-all">' + secret.replace(/(.{4})/g, "$1 ").trim() + '</strong></div><a class="btn btn-ghost btn-sm" href="' + uri + '" style="align-self:flex-start">Ouvrir dans l’application (sur téléphone)</a></div><div class="stack" style="gap:10px;justify-items:start"><div id="qr-2fa" class="qr-box" aria-label="QR code de configuration"></div><form class="stack" id="f-on" style="gap:10px;width:100%"><label class="field"><strong>3.</strong> Code affiché par l’application<input name="code" inputmode="numeric" maxlength="6" class="code-input" placeholder="ex. 482 913" required autocomplete="one-time-code"></label><button class="btn btn-primary" type="submit">Vérifier et activer</button></form></div></div>';
      var dessiner = function () { try { new window.QRCode(document.getElementById("qr-2fa"), { text: uri, width: 180, height: 180 }); } catch (er) {} };
      if (window.QRCode) dessiner();
      else { var sc = document.createElement("script"); sc.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"; sc.onload = dessiner; sc.onerror = function () { document.getElementById("qr-2fa").innerHTML = '<small class="muted">QR code indisponible hors ligne : utilisez la clé.</small>'; }; document.head.appendChild(sc); }
      zone.querySelector("#f-on").addEventListener("submit", function (ev) {
        ev.preventDefault();
        A.verifierTotp(secret, ev.target.code.value).then(function (ok) {
          if (!ok) { A.toast("Code incorrect : vérifiez l’heure du téléphone et réessayez", "warn"); return; }
          S.modifier("admins", a.id, { totpActif: true, totpSecret: secret }); S.log("Double authentification activée", a.nom); A.toast("Double authentification activée", "ok"); A.rafraichir();
        });
      });
    });
    document.getElementById("photo").addEventListener("change", function (e) {
      var fi = e.target.files[0]; if (!fi) return;
      A.recadrer(fi, 400).then(function (u) { if (!u) return; S.modifier("admins", a.id, { photo: u }); S.log("Photo de profil modifiée", a.nom); A.majProfil(); A.toast("Photo mise à jour", "ok"); A.rafraichir(); }).catch(function () { A.toast("Image illisible", "warn"); });
    });
    var rc = document.getElementById("photo-recadrer");
    if (rc) rc.addEventListener("click", function () { A.recadrer(a.photo, 400).then(function (u) { if (!u) return; S.modifier("admins", a.id, { photo: u }); S.log("Photo de profil recadrée", a.nom); A.majProfil(); A.toast("Photo mise à jour", "ok"); A.rafraichir(); }); });
    var ps = document.getElementById("photo-suppr");
    if (ps) ps.addEventListener("click", function () { S.modifier("admins", a.id, { photo: "" }); A.majProfil(); A.rafraichir(); });
    document.getElementById("form-id").addEventListener("submit", function (e) {
      e.preventDefault();
      var f = e.target, email = f.email.value.trim().toLowerCase(), data = { nom: f.nom.value.trim(), poste: f.poste.value.trim(), telephone: f.tel.value.trim() };
      if (!data.nom) { A.toast("Nom obligatoire", "warn"); return; }
      var fin = function () { S.modifier("admins", a.id, data); sessionStorage.setItem("ng_admin_nom", data.nom); S.log("Identité modifiée", data.nom); A.majProfil(); A.toast("Enregistré", "ok"); A.rafraichir(); };
      if (email === a.email.toLowerCase()) { fin(); return; }
      if (A.admins().some(function (x) { return x.id !== a.id && x.email.toLowerCase() === email; })) { A.toast("Cet email est déjà utilisé", "warn"); return; }
      A.sha256(a.email.toLowerCase() + ":" + f.mdp.value).then(function (h) {
        if (h !== a.hash) { A.toast("Mot de passe actuel incorrect", "warn"); return; }
        A.sha256(email + ":" + f.mdp.value).then(function (h2) { data.email = email; data.hash = h2; fin(); });
      });
    });
    document.getElementById("form-mdp").addEventListener("submit", function (e) {
      e.preventDefault();
      var f = e.target;
      if (f.mdp.value.length < 10 || f.mdp.value !== f.mdp2.value || !/\d/.test(f.mdp.value) || !/[a-z]/i.test(f.mdp.value)) { A.toast("10 caractères minimum, chiffres et lettres, identiques dans les deux champs", "warn"); return; }
      A.sha256(a.email.toLowerCase() + ":" + f.actuel.value).then(function (h) {
        if (h !== a.hash) { A.toast("Mot de passe actuel incorrect", "warn"); return; }
        A.sha256(a.email.toLowerCase() + ":" + f.mdp.value).then(function (h2) { S.modifier("admins", a.id, { hash: h2 }); S.log("Mot de passe changé", a.nom); f.reset(); A.toast("Mot de passe changé", "ok"); });
      });
    });
  };

  /* =================== Site public =================== */
  var SECTIONS = [["solutions", "Solutions par secteur"], ["equipements", "Équipements"], ["fonctionnement", "Comment ça marche"], ["contrats", "Contrats de maintenance"], ["recruter", "Recruter un informaticien"], ["boutique-apercu", "Boutique"], ["espace-client", "Espace client"], ["formations", "Formations"], ["verifier", "Vérifier un badge"], ["avis", "Avis clients"], ["actualites", "Actualités"], ["faq", "Questions fréquentes"]];
  var ongletSite = "textes";
  A.VUES.site = function () {
    A.vue.innerHTML = A.entete("Site public", "Textes, bannière d’annonce, sections affichées et actualités", '<a class="btn btn-ghost" href="index.html" target="_blank" rel="noopener">Voir le site</a>') +
      '<div class="tabs" role="tablist">' + [["textes", "Textes et coordonnées"], ["banniere", "Bannière d’annonce"], ["sections", "Sections de l’accueil"], ["actualites", "Actualités"]].map(function (t) { return '<button class="tab" type="button" role="tab" data-os="' + t[0] + '" aria-selected="' + (ongletSite === t[0]) + '">' + t[1] + "</button>"; }).join("") + '</div><div id="site-c"></div>';
    A.lier("[data-os]", "click", function (e, b) { ongletSite = b.dataset.os; A.rafraichir(); });
    ({ textes: siteTextes, banniere: siteBanniere, sections: siteSections, actualites: siteActus })[ongletSite]();
  };
  function majPerso(modif) { S.enregistrerContenuPerso(Object.assign({}, S.contenuPerso(), modif)); }
  function siteTextes() {
    var P = S.contenuPerso(), C = A.C;
    var Ac = Object.assign({}, C.accueil, P.accueil || {}), En = Object.assign({}, C.entreprise, P.entreprise || {});
    document.getElementById("site-c").innerHTML = '<form class="stack" id="form-site" style="gap:18px"><div class="card"><h2 class="h-card">Accueil</h2><div class="form-grid"><label class="field full">Badge<input name="badge" value="' + esc(Ac.badge) + '"></label><label class="field full">Titre principal<textarea name="titre" style="min-height:80px">' + esc(Ac.titre) + '</textarea></label><label class="field full">Introduction<textarea name="texte">' + esc(Ac.texte) + '</textarea></label><label class="field full">Points forts (un par ligne)<textarea name="points" style="min-height:90px">' + esc((Ac.points || []).join("\n")) + "</textarea></label></div></div>" +
      '<div class="card"><h2 class="h-card">Coordonnées</h2><div class="form-grid"><label class="field">Téléphone<input name="telephone" value="' + esc(En.telephone) + '"></label><label class="field">WhatsApp (chiffres)<input name="whatsapp" inputmode="numeric" value="' + esc(En.whatsapp) + '"></label><label class="field">Email<input name="email" type="email" value="' + esc(En.email) + '"></label><label class="field">Horaires<input name="horaires" value="' + esc(En.horaires) + '"></label><label class="field full">Adresse<input name="adresse" value="' + esc(En.adresse) + '"></label></div></div>' +
      '<div class="hero-actions"><button class="btn btn-primary" type="submit">Enregistrer</button><button class="btn btn-ghost" type="button" id="site-reset">Revenir aux textes d’origine</button></div></form>';
    var f = document.getElementById("form-site");
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      majPerso({ accueil: { badge: f.badge.value.trim(), titre: f.titre.value.trim(), texte: f.texte.value.trim(), points: f.points.value.split("\n").map(function (x) { return x.trim(); }).filter(Boolean) }, entreprise: { telephone: f.telephone.value.trim(), whatsapp: f.whatsapp.value.replace(/[^\d]/g, ""), email: f.email.value.trim(), horaires: f.horaires.value.trim(), adresse: f.adresse.value.trim() } });
      S.log("Textes du site modifiés", ""); A.toast("Enregistré", "ok");
    });
    document.getElementById("site-reset").addEventListener("click", function () { if (confirm("Revenir aux textes d’origine ?")) { var P2 = S.contenuPerso(); delete P2.accueil; delete P2.entreprise; S.enregistrerContenuPerso(P2); S.log("Textes du site réinitialisés", ""); A.rafraichir(); } });
  }
  function siteBanniere() {
    var B = S.contenuPerso().banniere || { actif: false, texte: "", lien: "", lienTexte: "" };
    document.getElementById("site-c").innerHTML = '<form class="card" id="form-ban"><h2 class="h-card">Bannière en haut de toutes les pages</h2><div style="display:flex;justify-content:space-between;align-items:center"><span>Afficher la bannière</span>' + A.interrupteur('id="ban-on"', !!B.actif, "Afficher la bannière") + '</div><div class="form-grid"><label class="field full">Message<input name="texte" value="' + esc(B.texte) + '" placeholder="ex. Inscriptions ouvertes : formation Virtualisation en janvier"></label><label class="field">Lien (facultatif)<input name="lien" value="' + esc(B.lien) + '" placeholder="ex. formations.html"></label><label class="field">Texte du lien<input name="lienTexte" value="' + esc(B.lienTexte || "") + '" placeholder="ex. S’inscrire"></label></div><div class="annonce" style="border-radius:12px" id="ban-apercu"></div><button class="btn btn-primary" type="submit" style="align-self:flex-start">Publier</button></form>';
    var f = document.getElementById("form-ban"), sw = document.getElementById("ban-on");
    var apercu = function () { document.getElementById("ban-apercu").innerHTML = esc(f.texte.value || "Aperçu de votre message") + (f.lien.value ? ' <a href="#">' + esc(f.lienTexte.value || "En savoir plus") + "</a>" : ""); };
    apercu(); f.addEventListener("input", apercu);
    sw.addEventListener("click", function () { sw.setAttribute("aria-checked", String(sw.getAttribute("aria-checked") !== "true")); });
    f.addEventListener("submit", function (e) { e.preventDefault(); majPerso({ banniere: { actif: sw.getAttribute("aria-checked") === "true", texte: f.texte.value.trim(), lien: f.lien.value.trim(), lienTexte: f.lienTexte.value.trim() } }); S.log("Bannière du site modifiée", f.texte.value.trim()); A.toast("Bannière publiée", "ok"); });
  }
  function siteSections() {
    var M = S.contenuPerso().masquer || [];
    document.getElementById("site-c").innerHTML = '<div class="card"><h2 class="h-card">Sections affichées sur l’accueil</h2><p>Masquez une section le temps de la préparer, sans rien supprimer.</p><div class="stack">' + SECTIONS.map(function (x) { return '<div class="row-item"><span>' + x[1] + "</span>" + A.interrupteur('data-sec="' + x[0] + '"', M.indexOf(x[0]) < 0, "Afficher " + x[1]) + "</div>"; }).join("") + "</div></div>";
    A.lier("[data-sec]", "click", function (e, b) { var M2 = (S.contenuPerso().masquer || []).filter(function (id) { return id !== b.dataset.sec; }); if (b.getAttribute("aria-checked") === "true") M2.push(b.dataset.sec); majPerso({ masquer: M2 }); S.log("Section de l’accueil " + (M2.indexOf(b.dataset.sec) > -1 ? "masquée" : "affichée"), b.dataset.sec); A.rafraichir(); });
  }
  function siteActus() {
    var L = S.liste("actualites");
    document.getElementById("site-c").innerHTML = '<div class="card"><div class="toolbar"><button class="btn btn-primary" type="button" id="act-new">+ Nouvelle actualité</button></div><div class="stack">' +
      (L.map(function (a) { return '<div class="row-item" data-a="' + a.id + '"><span style="display:flex;gap:12px;align-items:center">' + (a.image ? '<img src="' + esc(a.image) + '" alt="" style="width:64px;height:44px;object-fit:cover;border-radius:8px">' : "") + "<span><strong>" + (a.epingle ? "📌 " : "") + esc(a.titre) + '</strong><br><small class="muted">' + esc(a.categorie) + " · " + A.jour(a.date + "T12:00:00") + " · " + (a.vues || 0) + ' lecture(s) · <a href="actualites.html?id=' + a.id + '" target="_blank" rel="noopener">voir sur le site</a></small></span></span><span class="hero-actions" style="flex-wrap:nowrap">' + A.interrupteur("data-act-pub", !!a.publie, "Publier " + a.titre) + '<button class="btn btn-ghost btn-sm" type="button" data-act-edit>Modifier</button></span></div>'; }).join("") || '<p class="muted">Aucune actualité.</p>') + "</div></div>";
    document.getElementById("act-new").addEventListener("click", function () { formActu(null); });
    A.lier("[data-act-edit]", "click", function (e, b) { formActu(S.liste("actualites").filter(function (x) { return x.id === b.closest("[data-a]").dataset.a; })[0]); });
    A.lier("[data-act-pub]", "click", function (e, b) { var a = S.modifier("actualites", b.closest("[data-a]").dataset.a, { publie: b.getAttribute("aria-checked") !== "true" }); S.log(a.publie ? "Actualité publiée" : "Actualité retirée", a.titre); A.rafraichir(); });
  }
  function formActu(a) {
    var n = !a;
    a = a || { titre: "", categorie: "Nouveauté", texte: "", contenu: "", date: new Date().toISOString().slice(0, 10), publie: true, image: "" };
    A.modal({ titre: n ? "Nouvelle actualité" : "Modifier l’actualité", valider: n ? "Publier" : "Enregistrer", large: true,
      corps: '<div class="form-grid"><label class="field full">Titre<input name="titre" required value="' + esc(a.titre) + '"></label><label class="field">Catégorie<select name="cat">' + A.options(["Nouveauté", "Formation", "Alerte sécurité", "Réalisation", "Conseil", "Événement", "Recrutement"], a.categorie) + '</select></label><label class="field">Date<input name="date" type="date" value="' + esc(a.date) + '"></label>' +
        '<label class="field full">Résumé (affiché sur les cartes)<textarea name="texte" style="min-height:80px" maxlength="320">' + esc(a.texte) + '</textarea></label><label class="field full">Article complet (facultatif)<textarea name="contenu" style="min-height:200px" placeholder="Le texte complet. Laissez une ligne vide entre les paragraphes.">' + esc(a.contenu || "") + "</textarea></label>" +
        '<div class="field full"><span>Image</span><div class="img-couv" id="act-img">' + (a.image ? '<img src="' + esc(a.image) + '" alt="">' : "<span>Aucune image</span>") + '</div><div class="hero-actions"><label class="btn btn-ghost btn-sm" style="cursor:pointer">🖼 Choisir une image<input type="file" name="image" accept="image/*" class="sr-only"></label>' + (a.image ? '<label style="display:flex;gap:6px;align-items:center;font-size:.9rem"><input type="checkbox" name="sansImage"> Retirer l’image</label>' : "") + "</div></div>" +
        '<label style="display:flex;gap:8px;align-items:center"><input type="checkbox" name="epingle"' + (a.epingle ? " checked" : "") + "> 📌 Épingler en tête de la page Actualités</label></div>" + (n ? "" : '<button type="button" class="btn btn-ghost btn-sm danger-link" id="act-suppr" style="justify-self:start">Supprimer</button>'),
      apres: function (f) {
        f.image.addEventListener("change", function () { var fi = f.image.files[0]; if (fi) document.getElementById("act-img").innerHTML = '<img src="' + URL.createObjectURL(fi) + '" alt="">'; });
        var b = f.querySelector("#act-suppr"); if (b) b.addEventListener("click", function () { if (confirm("Supprimer cette actualité ?")) { S.retirer("actualites", a.id); S.log("Actualité supprimée", a.titre); A.fermer(); A.rafraichir(); } });
      },
      onSubmit: function (f) {
        if (!f.titre.value.trim()) { A.toast("Titre obligatoire", "warn"); return false; }
        var d = { titre: f.titre.value.trim(), categorie: f.cat.value, date: f.date.value, texte: f.texte.value.trim(), contenu: f.contenu.value.trim(), epingle: f.epingle.checked };
        var fin = function () { if (n) { d.publie = true; d.vues = 0; S.ajouter("actualites", d, "ACT-"); S.log("Actualité publiée", d.titre); } else { S.modifier("actualites", a.id, d); S.log("Actualité modifiée", d.titre); } A.toast("Visible sur la page Actualités du site", "ok"); A.rafraichir(); };
        var fi = f.image.files[0];
        if (fi) return A.redimensionner(fi, 900).then(function (u) { d.image = u; fin(); });
        if (f.sansImage && f.sansImage.checked) d.image = "";
        fin();
      } });
  }

  /* =================== Apparence =================== */
  A.VUES.apparence = function () {
    var r = T.reglages();
    A.vue.innerHTML = A.entete("Apparence", "Le thème choisi s’applique au site public et à l’administration") +
      '<div class="card"><h2 class="h-card">Couleurs</h2><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">' + T.THEMES.map(function (t) { var c = t.couleurs; return '<button type="button" class="theme-card" data-th="' + t.id + '" aria-pressed="' + (r.theme === t.id) + '"><span class="theme-prev" style="background:' + c[0] + '"><i style="background:' + c[1] + '"></i><b style="background:' + c[1] + ';opacity:.35"></b><b style="background:' + c[1] + ';opacity:.2;width:40%"></b></span><strong>' + t.nom + "</strong><small>" + t.texte + "</small></button>"; }).join("") + "</div></div>" +
      '<div class="split-2 mt-2"><div class="card"><h2 class="h-card">Police</h2><div class="stack">' + T.POLICES.map(function (p) { return '<button type="button" class="row-item theme-opt" data-po="' + p.id + '" aria-pressed="' + (r.font === p.id) + '"><span><strong>' + p.nom + '</strong><br><small class="muted">' + p.texte + "</small></span><span>" + (r.font === p.id ? "✓" : "") + "</span></button>"; }).join("") + '</div></div><div class="card"><h2 class="h-card">Taille du texte</h2><div class="stack">' + T.TAILLES.map(function (p) { return '<button type="button" class="row-item theme-opt" data-ta="' + p.id + '" aria-pressed="' + (r.size === p.id) + '"><strong>' + p.nom + "</strong><span>" + (r.size === p.id ? "✓" : "") + "</span></button>"; }).join("") + '</div><a class="btn btn-ghost mt-2" href="index.html" target="_blank" rel="noopener">Voir le résultat sur le site</a></div></div>';
    var ch = function (k, v) { var x = T.reglages(); x[k] = v; T.enregistrer(x); S.log("Apparence modifiée", k + " = " + v); A.toast("Appliqué au site et à l’administration", "ok"); A.rafraichir(); };
    A.lier("[data-th]", "click", function (e, b) { ch("theme", b.dataset.th); });
    A.lier("[data-po]", "click", function (e, b) { ch("font", b.dataset.po); });
    A.lier("[data-ta]", "click", function (e, b) { ch("size", b.dataset.ta); });
  };

  /* =================== Paramètres et documents =================== */
  A.VUES.parametres = function () {
    var R = S.reglages();
    var img = function (cle, nom) { return '<div class="card"><h3>' + nom + '</h3><div class="preview-img"><img src="' + esc(A.img(R[cle])) + '" alt="' + nom + '"></div><label class="btn btn-ghost btn-sm" style="cursor:pointer">Remplacer l’image<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" data-img="' + cle + '" class="sr-only"></label>' + (/^data:/.test(R[cle]) ? '<button class="btn btn-ghost btn-sm" type="button" data-defaut="' + cle + '">Revenir à l’image fournie</button>' : "") + "</div>"; };
    A.vue.innerHTML = A.entete("Paramètres et documents", "Logo, signature, sceau et mentions légales des devis, factures, reçus, bulletins et attestations", '<a class="btn btn-ghost" href="document.html?type=attestation&nom=Exemple&formation=Formation%20test&periode=1er%20au%2010%20d%C3%A9cembre&duree=30%20h&presence=95" target="_blank" rel="noopener">Aperçu d’une attestation</a>') +
      '<div class="grid">' + img("logo", "Logo") + img("signature", "Signature du directeur") + img("sceau", "Sceau officiel") + "</div>" +
      '<div class="card mt-2"><h2 class="h-card">Codes promo des formations</h2><p>Utilisables lors de l’approbation d’une inscription.</p><div class="chips" id="promos">' + (R.promos || []).map(function (p, i) { return '<span class="tag tag-accent" style="font-size:.9rem;padding:6px 10px">' + esc(p.code) + " · −" + p.pc + ' % <button type="button" data-promo-del="' + i + '" aria-label="Supprimer le code ' + esc(p.code) + '" style="border:0;background:none;color:inherit;cursor:pointer;font-weight:800">×</button></span>'; }).join("") + '</div><div class="hero-actions"><input id="promo-code" placeholder="ex. RENTREE2026" style="min-height:42px;border-radius:10px;border:1px solid var(--line-2);background:var(--bg);color:var(--text);padding:0 12px;text-transform:uppercase"><input id="promo-pc" type="number" min="1" max="90" placeholder="% de réduction" style="width:150px;min-height:42px;border-radius:10px;border:1px solid var(--line-2);background:var(--bg);color:var(--text);padding:0 12px"><button class="btn btn-ghost" type="button" id="promo-add">+ Ajouter</button></div></div>' +
      (A.moi().role === "super" ? '<div class="card mt-2"><h2 class="h-card">💾 Sauvegarde des données</h2><p>Téléchargez une copie complète (demandes, factures, clients, étudiants, formations, réglages…) à garder en lieu sûr, ou restaurez une sauvegarde.</p><div class="hero-actions"><button class="btn btn-primary" type="button" id="sauv-dl">⬇ Télécharger une sauvegarde</button><label class="btn btn-ghost" style="cursor:pointer">⬆ Restaurer une sauvegarde<input type="file" accept="application/json,.json" id="sauv-up" class="sr-only"></label></div><p class="muted" style="font-size:.85rem">Dernière sauvegarde manuelle : ' + (localStorage.getItem("ng_derniere_sauvegarde") ? A.heure(localStorage.getItem("ng_derniere_sauvegarde")) : "jamais") + " · sauvegarde automatique (chaque semaine) : " + (localStorage.getItem("ng_sauvegarde_auto_le") ? A.heure(localStorage.getItem("ng_sauvegarde_auto_le")) : "pas encore") + '</p>' + (localStorage.getItem("ng_sauvegarde_auto_le") ? '<button class="btn btn-ghost btn-sm" type="button" id="sauv-auto-dl" style="justify-self:start">⬇ Télécharger la dernière sauvegarde automatique</button>' : "") + "</div>" : "") +
      '<form class="card mt-2" id="form-reg"><h2 class="h-card">Informations légales</h2><div class="form-grid">' + [["raisonSociale", "Raison sociale"], ["directeur", "Nom du directeur"], ["rccm", "RCCM"], ["idnat", "Id. Nat."], ["nif", "NIF"], ["tva", "TVA (%)"], ["tauxCDF", "Taux du jour : 1 USD = … CDF"]].map(function (c) { var num = c[0] === "tva" || c[0] === "tauxCDF"; return '<label class="field">' + c[1] + '<input name="' + c[0] + '" value="' + esc(R[c[0]] || "") + '"' + (num ? ' type="number" min="0" step="0.01"' : "") + (c[0] === "tauxCDF" ? ' placeholder="ex. taux de la banque du jour"' : "") + ">" + (c[0] === "tauxCDF" ? "<small>Affiche l’équivalent en francs congolais sur les factures et le tableau de bord. Mettez-le à jour quand le taux change.</small>" : "") + "</label>"; }).join("") + '</div><p class="muted" style="font-size:.9rem">Les moyens de paiement se règlent dans « Paiements et caisse ».</p><button class="btn btn-primary" type="submit" style="align-self:flex-start">Enregistrer</button></form>';
    A.lier("[data-img]", "change", function (e, inp) { var fi = inp.files[0]; if (!fi) return; if (fi.size > 800 * 1024) { A.toast("Image trop lourde : 800 Ko maximum", "warn"); return; } A.redimensionner(fi, 600).then(function (u) { var R2 = S.reglages(); R2[inp.dataset.img] = u; S.enregistrerReglages(R2); S.log("Image mise à jour", inp.dataset.img); A.toast("Image enregistrée", "ok"); A.rafraichir(); }); });
    A.lier("[data-defaut]", "click", function (e, b) { var R2 = S.reglages(); R2[b.dataset.defaut] = ""; S.enregistrerReglages(R2); A.rafraichir(); });
    document.getElementById("promo-add").addEventListener("click", function () { var c = document.getElementById("promo-code").value.trim().toUpperCase(), pc = Number(document.getElementById("promo-pc").value); if (!c || !(pc > 0 && pc < 100)) { A.toast("Code et pourcentage (1 à 90) obligatoires", "warn"); return; } var R2 = S.reglages(); R2.promos = (R2.promos || []).filter(function (p) { return p.code !== c; }).concat([{ code: c, pc: pc }]); S.enregistrerReglages(R2); S.log("Code promo créé", c + " · −" + pc + " %"); A.rafraichir(); });
    A.lier("[data-promo-del]", "click", function (e, b) { var R2 = S.reglages(); var p = R2.promos.splice(Number(b.dataset.promoDel), 1)[0]; S.enregistrerReglages(R2); S.log("Code promo supprimé", p ? p.code : ""); A.rafraichir(); });
    var fsm = document.getElementById("form-simu");
    if (fsm) fsm.addEventListener("submit", function (e) { e.preventDefault(); var r = S.reglages(), sm = {}; ["camera", "enregistreur", "pointReseau", "borne", "vitrine", "ecommerce", "maintenancePoste"].forEach(function (k) { sm[k] = [Number(fsm[k + "-min"].value) || 0, Number(fsm[k + "-max"].value) || 0]; }); r.simulateur = sm; S.enregistrerReglages(r); S.log("Prix du simulateur modifiés", ""); A.toast("Prix du simulateur enregistrés", "ok"); });
    var sad = document.getElementById("sauv-auto-dl");
    if (sad) sad.addEventListener("click", function () { window.NGFichiers.lire("sauvegarde-auto").then(function (b) { if (!b) { A.toast("Sauvegarde automatique introuvable sur cet appareil", "warn"); return; } var a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "sauvegarde-auto-nextgenit-" + String(localStorage.getItem("ng_sauvegarde_auto_le")).slice(0, 10) + ".json"; document.body.appendChild(a); a.click(); a.remove(); }); });
    var sdl = document.getElementById("sauv-dl");
    if (sdl) {
      sdl.addEventListener("click", function () {
        var data = {}; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k.indexOf("ng_") === 0 && k.indexOf("ng_sync") !== 0 && k !== "ng_session") data[k] = localStorage.getItem(k); }
        var blob = new Blob([JSON.stringify({ application: "NextGenIT", version: 1, date: new Date().toISOString(), donnees: data }, null, 1)], { type: "application/json" });
        var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "sauvegarde-nextgenit-" + new Date().toISOString().slice(0, 10) + ".json"; document.body.appendChild(a); a.click(); a.remove();
        localStorage.setItem("ng_derniere_sauvegarde", new Date().toISOString()); S.log("Sauvegarde téléchargée", Object.keys(data).length + " jeux de données"); A.toast("Sauvegarde téléchargée", "ok");
      });
      document.getElementById("sauv-up").addEventListener("change", function (e) {
        var fi = e.target.files[0]; if (!fi) return;
        var r = new FileReader();
        r.onload = function () {
          try {
            var j = JSON.parse(r.result); if (j.application !== "NextGenIT" || !j.donnees) throw new Error("fichier");
            if (!confirm("Restaurer la sauvegarde du " + new Date(j.date).toLocaleString("fr-FR") + " ?\nLes données actuelles seront remplacées (sur tous les appareils si Firebase est actif).")) return;
            Object.keys(j.donnees).forEach(function (k) { if (k.indexOf("ng_") === 0) localStorage.setItem(k, j.donnees[k]); });
            S.log("Sauvegarde restaurée", j.date); A.toast("Sauvegarde restaurée", "ok"); setTimeout(function () { location.reload(); }, 900);
          } catch (er) { A.toast("Ce fichier n’est pas une sauvegarde NextGenIT", "warn"); }
        };
        r.readAsText(fi);
      });
    }
    document.getElementById("form-reg").addEventListener("submit", function (e) { e.preventDefault(); var R2 = S.reglages(); Array.prototype.forEach.call(e.target.elements, function (el) { if (el.name) R2[el.name] = el.name === "tva" || el.name === "tauxCDF" ? Number(el.value) || 0 : el.value.trim(); }); if (R2.tauxCDF) R2.tauxMajLe = new Date().toISOString(); S.enregistrerReglages(R2); S.log("Paramètres modifiés", R2.tauxCDF ? "1 USD = " + R2.tauxCDF + " CDF" : ""); A.toast("Enregistré", "ok"); });
  };
})();
