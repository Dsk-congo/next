/* =========================================================
   Fichiers des formations (PDF, vidéos, présentations…)
   VERSION DE DÉMONSTRATION : les fichiers sont gardés dans le
   navigateur (IndexedDB). En production, remplacez par un
   stockage en ligne (Supabase Storage, Firebase Storage…).
   ========================================================= */
(function () {
  var DB = null;
  function ouvrir() {
    if (DB) return Promise.resolve(DB);
    return new Promise(function (ok, ko) {
      if (!window.indexedDB) { ko(new Error("Stockage de fichiers indisponible dans ce navigateur")); return; }
      var r = indexedDB.open("nextgenit-fichiers", 1);
      r.onupgradeneeded = function () { r.result.createObjectStore("fichiers"); };
      r.onsuccess = function () { DB = r.result; ok(DB); };
      r.onerror = function () { ko(r.error); };
    });
  }
  function tx(mode, fn) {
    return ouvrir().then(function (db) {
      return new Promise(function (ok, ko) {
        var t = db.transaction("fichiers", mode);
        var req = fn(t.objectStore("fichiers"));
        t.oncomplete = function () { ok(req && req.result); };
        t.onerror = function () { ko(t.error); };
      });
    });
  }
  /* Fichiers de moins de 700 Ko : aussi envoyés en ligne (Firebase) pour être vus sur tous les appareils.
     Au-delà (vidéos), utilisez un lien YouTube ou Google Drive. */
  var LIMITE = 700 * 1024;
  function versDataUrl(blob) { return new Promise(function (ok, ko) { var r = new FileReader(); r.onload = function () { ok(r.result); }; r.onerror = ko; r.readAsDataURL(blob); }); }
  function versBlob(dataUrl) { var p = dataUrl.split(","), m = (p[0].match(/:(.*?);/) || [])[1] || "application/octet-stream", b = atob(p[1]), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return new Blob([u], { type: m }); }
  function cloud() { return window.NGCloud && window.NGCloud.actif && window.NGCloud.envoyerFichier ? window.NGCloud : null; }
  window.NGFichiers = {
    LIMITE: LIMITE,
    enregistrer: function (cle, blob) {
      var local = tx("readwrite", function (s) { return s.put(blob, cle); });
      var c = cloud();
      if (!c || !blob || blob.size > LIMITE) return local;
      return local.then(function () { return versDataUrl(blob); }).then(function (d) { return c.envoyerFichier(cle, d, blob.name, blob.type); }).catch(function (e) { console.warn("Fichier gardé sur cet appareil seulement :", e); });
    },
    enLigne: function (taille) { return !!cloud() && taille <= LIMITE; },
    lire: function (cle) {
      return tx("readonly", function (s) { return s.get(cle); }).then(function (b) {
        if (b) return b;
        var c = cloud(); if (!c || !c.lireFichier) return null;
        return c.lireFichier(cle).then(function (doc) { if (!doc || !doc.d) return null; var bl = versBlob(doc.d); tx("readwrite", function (s) { return s.put(bl, cle); }).catch(function () {}); return bl; }).catch(function () { return null; });
      });
    },
    supprimer: function (cle) { var c = cloud(); if (c && c.supprimerFichier) c.supprimerFichier(cle).catch(function () {}); return tx("readwrite", function (s) { return s.delete(cle); }); },
    /* Ouvre le fichier dans un nouvel onglet (PDF, vidéo…) ou le télécharge */
    ouvrir: function (cle, nom) {
      return this.lire(cle).then(function (blob) {
        if (!blob) { alert("Ce fichier n’est pas disponible sur cet appareil."); return; }
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url; a.target = "_blank"; a.rel = "noopener";
        if (!/^(application\/pdf|video\/|image\/)/.test(blob.type)) a.download = nom || "fichier";
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
      });
    },
    taille: function (o) { if (!o) return ""; var k = o / 1024; return k < 1024 ? Math.round(k) + " Ko" : (k / 1024).toFixed(1).replace(".", ",") + " Mo"; }
  };
})();
