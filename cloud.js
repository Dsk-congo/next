/* =========================================================
   Synchronisation Firebase (Firestore) de NextGenIT
   Toutes les données du site (clés « ng_… » du navigateur) sont
   copiées dans la collection Firestore « nextgenit » : un document
   par jeu de données. Chaque appareil reçoit les changements en
   direct. Les listes (demandes, factures, clients…) sont fusionnées
   élément par élément pour ne pas écraser le travail d'un collègue.
   ========================================================= */
const CFG = window.NG_FIREBASE || {};
const VERSION = "10.12.5";
const LOCAL = ["ng_session", "ng_client_tel", "ng_sync_meta"];
const COLL = "nextgenit";
const html = document.documentElement;
function finAttente() { html.classList.remove("ng-sync"); try { sessionStorage.setItem("ng_sync_ok", "1"); } catch (e) {} }
function syncable(k) { return k && k.indexOf("ng_") === 0 && LOCAL.indexOf(k) < 0 && k.indexOf("ng_sync") !== 0; }

if (!CFG.apiKey || !CFG.projectId) {
  finAttente();
  window.NGCloud = { actif: false, etat: "local" };
} else {
  demarrer().catch(function (e) {
    console.warn("Firebase indisponible, mode local :", e);
    var code = String(e && (e.code || e.message) || e);
    var msg = /permission/i.test(code) ? "Firebase refuse l’accès : collez les règles du fichier firestore.rules dans Firestore → Règles." : /unavailable|network|offline/i.test(code) ? "Pas de connexion Internet vers Firebase." : code;
    window.NGCloud = { actif: false, etat: "erreur", erreur: msg };
    finAttente();
    window.dispatchEvent(new CustomEvent("ng-cloud", { detail: window.NGCloud }));
  });
}

async function demarrer() {
  const appMod = await import(`https://www.gstatic.com/firebasejs/${VERSION}/firebase-app.js`);
  const fs = await import(`https://www.gstatic.com/firebasejs/${VERSION}/firebase-firestore.js`);
  const app = appMod.initializeApp(CFG);
  /* Connexion anonyme facultative (si elle est activée dans Firebase) */
  try {
    const authMod = await import(`https://www.gstatic.com/firebasejs/${VERSION}/firebase-auth.js`);
    await Promise.race([authMod.signInAnonymously(authMod.getAuth(app)), new Promise((_, rej) => setTimeout(() => rej(new Error("délai")), 2500))]);
  } catch (e) { console.info("Firebase : connexion anonyme non utilisée (" + (e.code || e.message) + ")"); }
  const db = fs.getFirestore(app);
  const col = fs.collection(db, COLL);
  const setOrig = window.__ngSetOrig || Storage.prototype.setItem;
  const ecrireLocal = (k, v) => setOrig.call(localStorage, k, v);
  const modifs = () => { try { return JSON.parse(localStorage.getItem("ng_sync_mod") || "{}"); } catch (e) { return {}; } };

  /* Mémoire de synchronisation : clés modifiées hors ligne et identifiants connus */
  let meta = {};
  try { meta = JSON.parse(localStorage.getItem("ng_sync_meta") || "{}"); } catch (e) {}
  meta.sale = meta.sale || {}; meta.ids = meta.ids || {};
  const garderMeta = () => setOrig.call(localStorage, "ng_sync_meta", JSON.stringify(meta));
  const ident = x => (x && typeof x === "object" && x.id != null) ? "id:" + x.id : "j:" + JSON.stringify(x);
  const idsDe = v => { try { const a = JSON.parse(v); return Array.isArray(a) ? a.map(ident) : null; } catch (e) { return null; } };

  /* Fusion d'une liste : la version locale gagne pour un même élément,
     les éléments ajoutés ailleurs sont gardés, ceux supprimés ici sont retirés. */
  function fusion(cle, local, distant) {
    let L, D;
    try { L = JSON.parse(local); D = JSON.parse(distant); } catch (e) { return local; }
    if (!Array.isArray(L) || !Array.isArray(D)) return local;
    const connus = new Set(meta.ids[cle] || []), ici = new Set(L.map(ident));
    const ajouts = D.filter(x => !ici.has(ident(x)) && !connus.has(ident(x)));
    if (!ajouts.length) return local;
    const avecDate = L.concat(ajouts);
    if (avecDate.every(x => x && (x.creeLe || x.quand))) avecDate.sort((a, b) => String(b.creeLe || b.quand).localeCompare(String(a.creeLe || a.quand)));
    return JSON.stringify(avecDate);
  }

  /* Envoi d'une clé (avec fusion) */
  const minuteurs = {};
  async function pousser(cle) {
    const local = localStorage.getItem(cle);
    const ref = fs.doc(db, COLL, cle);
    if (local === null) { await fs.deleteDoc(ref); delete meta.sale[cle]; garderMeta(); return; }
    if (local.length > 900000) { console.warn("Donnée trop volumineuse pour Firestore :", cle); return; }
    const final = await fs.runTransaction(db, async tr => {
      const s = await tr.get(ref);
      const v = s.exists() ? fusion(cle, local, s.data().v) : local;
      tr.set(ref, { v: v, t: Date.now() });
      return v;
    });
    if (final !== localStorage.getItem(cle)) { ecrireLocal(cle, final); signaler([cle]); }
    const ids = idsDe(final); if (ids) meta.ids[cle] = ids;
    delete meta.sale[cle]; garderMeta();
  }
  function planifier(cle) {
    meta.sale[cle] = 1; garderMeta();
    clearTimeout(minuteurs[cle]);
    minuteurs[cle] = setTimeout(() => pousser(cle).catch(e => console.warn("Envoi Firebase impossible", cle, e)), cle === "ng_presence" ? 50 : 400);
  }
  /* Toute écriture « ng_… » du site part aussi vers Firebase (suivi installé par theme.js) */
  let pret = false;
  window.__ngPousser = k => { if (!syncable(k)) return; if (pret) planifier(k); else meta.sale[k] = 1; };
  (window.__ngAttente || []).forEach(k => { if (syncable(k)) meta.sale[k] = 1; });

  function signaler(cles) {
    if (!cles.length) return;
    if (cles.some(k => /_site$/.test(k)) && window.NGTheme) window.NGTheme.appliquer();
    window.dispatchEvent(new CustomEvent("ng-donnees", { detail: { cles: cles } }));
  }

  /* Première synchronisation */
  const snap = await fs.getDocs(col);
  const distants = {}, changes = [];
  snap.forEach(d => { distants[d.id] = d.data(); });
  const mod = modifs();
  pret = true;
  Object.keys(distants).forEach(k => {
    if (!syncable(k)) return;
    const r = distants[k].v, l = localStorage.getItem(k);
    /* Modifié ici plus récemment que la version en ligne : on envoie (avec fusion) au lieu d'écraser */
    if (l !== null && r !== l && (meta.sale[k] || (mod[k] || 0) > (distants[k].t || 0))) { planifier(k); return; }
    if (r !== l) { ecrireLocal(k, r); changes.push(k); }
    const ids = idsDe(r); if (ids) meta.ids[k] = ids;
  });
  Object.keys(meta.sale).forEach(k => { if (!distants[k] && localStorage.getItem(k) !== null) planifier(k); });
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (syncable(k) && !distants[k]) planifier(k); }
  garderMeta();
  /* Fichiers des cours (PDF, images, petites vidéos) : un document par fichier dans « nextgenit_fichiers » */
  const colF = "nextgenit_fichiers";
  const envoyerFichier = (cle, dataUrl, nom, type) => fs.setDoc(fs.doc(db, colF, cle), { d: dataUrl, nom: nom || "", type: type || "", t: Date.now() });
  const lireFichier = cle => fs.getDoc(fs.doc(db, colF, cle)).then(s => s.exists() ? s.data() : null);
  const supprimerFichier = cle => fs.deleteDoc(fs.doc(db, colF, cle));
  window.NGCloud = { actif: true, etat: "connecte", projet: CFG.projectId, pousser: planifier, envoyerFichier, lireFichier, supprimerFichier };
  window.dispatchEvent(new CustomEvent("ng-cloud", { detail: window.NGCloud }));

  if (changes.length && html.classList.contains("ng-sync")) {
    try { sessionStorage.setItem("ng_sync_ok", "1"); } catch (e) {}
    location.reload();
    return;
  }
  finAttente();
  if (changes.length) signaler(changes);

  /* Changements en direct venant des autres appareils */
  fs.onSnapshot(col, s => {
    const cles = [];
    s.docChanges().forEach(ch => {
      const k = ch.doc.id;
      if (!syncable(k) || ch.type === "removed" || meta.sale[k]) return;
      const r = ch.doc.data().v;
      if (r !== localStorage.getItem(k)) { ecrireLocal(k, r); cles.push(k); }
      const ids = idsDe(r); if (ids) meta.ids[k] = ids;
    });
    if (cles.length) { garderMeta(); signaler(cles); }
  });
}
