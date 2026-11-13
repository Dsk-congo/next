/* =========================================================
   Données du site.
   VERSION DE DÉMONSTRATION : tout est enregistré dans le
   navigateur (localStorage). Pour un usage réel à plusieurs,
   remplacez les fonctions ci-dessous par des appels à une
   base de données (Supabase, Firebase…) : le reste du site
   n'a pas besoin de changer.
   ========================================================= */
(function () {
  function get(cle, defaut) {
    try { var v = localStorage.getItem(cle); return v ? JSON.parse(v) : defaut; } catch (e) { return defaut; }
  }
  function set(cle, val) {
    try { localStorage.setItem(cle, JSON.stringify(val)); return true; } catch (e) { return false; }
  }

  function prochainNumero(prefixe, cle) {
    var n = get(cle, 1050) + 1;
    set(cle, n);
    return prefixe + n;
  }


  var MOIS = new Date().toISOString().slice(0, 7);
  function J(n) { return new Date(Date.now() + n * 864e5).toISOString().slice(0, 10); }
  var DEFAUTS = {
    personnel: [
      { id: "P-01", nom: "Christian K.", poste: "Responsable technique", type: "technicien", specialites: ["Réseau", "Virtualisation"], telephone: "+243 000 000 101", statut: "Disponible", actif: true, salaire: 900, mode: "Banque", badge: "NG-T-0101" },
      { id: "P-02", nom: "Patrick M.", poste: "Technicien vidéosurveillance", type: "technicien", specialites: ["Vidéosurveillance"], telephone: "+243 000 000 142", statut: "Sur site", actif: true, salaire: 550, mode: "M-Pesa", badge: "NG-T-0142" },
      { id: "P-03", nom: "Grâce K.", poste: "Technicienne sécurité", type: "technicien", specialites: ["Cybersécurité", "Pare-feu"], telephone: "+243 000 000 103", statut: "En route", actif: true, salaire: 600, mode: "Orange Money", badge: "NG-T-0103" },
      { id: "P-04", nom: "Daniel B.", poste: "Technicien réseau", type: "technicien", specialites: ["Réseau", "Supervision"], telephone: "+243 000 000 104", statut: "Disponible", actif: true, salaire: 550, mode: "M-Pesa", badge: "NG-T-0104" },
      { id: "P-05", nom: "Joël T.", poste: "Technicien dépannage", type: "technicien", specialites: ["Dépannage", "Maintenance"], telephone: "+243 000 000 105", statut: "Indisponible", actif: true, salaire: 450, mode: "Airtel Money", badge: "NG-T-0105" },
      { id: "P-06", nom: "Ruth N.", poste: "Développeuse web", type: "technicien", specialites: ["Web", "Cloud"], telephone: "+243 000 000 106", statut: "Disponible", actif: true, salaire: 600, mode: "Banque", badge: "NG-T-0106" },
      { id: "P-07", nom: "Esther S.", poste: "Comptable", type: "bureau", specialites: [], telephone: "+243 000 000 107", statut: "Disponible", actif: true, salaire: 700, mode: "Banque" },
      { id: "P-08", nom: "Moïse B.", poste: "Agent support", type: "bureau", specialites: ["Support"], telephone: "+243 000 000 108", statut: "Disponible", actif: true, salaire: 400, mode: "M-Pesa" }
    ],
    paiements: [],
    sorties: [
      { id: "SRT-001", creeLe: MOIS + "-03T09:10:00.000Z", categorie: "Matériel", libelle: "Câble Cat6 – 2 bobines de 305 m", montant: 260, compte: "Caisse", demandePar: "Christian K.", statut: "paye", approuvePar: "Administrateur" },
      { id: "SRT-002", creeLe: MOIS + "-05T11:40:00.000Z", categorie: "Carburant et déplacements", libelle: "Carburant mission site minier", montant: 180, compte: "Caisse", demandePar: "Patrick M.", statut: "demande" },
      { id: "SRT-003", creeLe: MOIS + "-06T08:00:00.000Z", categorie: "Internet et licences", libelle: "Abonnement Internet du bureau", montant: 150, compte: "Banque", demandePar: "Esther S.", statut: "approuve", approuvePar: "Administrateur" }
    ],
    admins: [],
    roles: null,
    /* Données d'exemple pour découvrir les modules (supprimables) */
    articles: [
      { id: "ART-1", nom: "Caméra IP 4K extérieure", reference: "CAM-4K-EXT", boutique: true, description: "Caméra IP 4K extérieure, vision nocturne 30 m, détection de mouvement, garantie 1 an.", categorie: "Vidéosurveillance", quantite: 14, seuil: 6, prixAchat: 68, prixVente: 120, emplacement: "Magasin Kolwezi" },
      { id: "ART-2", nom: "Enregistreur NVR 8 voies", reference: "NVR-8", boutique: true, description: "Enregistreur 8 voies avec disque, consultation des caméras sur téléphone.", categorie: "Vidéosurveillance", quantite: 3, seuil: 2, prixAchat: 140, prixVente: 290, emplacement: "Magasin Kolwezi" },
      { id: "ART-3", nom: "Switch 24 ports PoE+", reference: "SW-24P", boutique: true, description: "Switch administrable 24 ports PoE+, alimente caméras et bornes Wi-Fi.", categorie: "Réseau", quantite: 2, seuil: 2, prixAchat: 210, prixVente: 340, emplacement: "Magasin Kolwezi" },
      { id: "ART-4", nom: "Point d’accès Wi-Fi 6", reference: "AP-AX", boutique: true, description: "Borne Wi-Fi 6 plafonnière, gestion centralisée, réseau invités.", categorie: "Réseau", quantite: 9, seuil: 4, prixAchat: 85, prixVente: 160, emplacement: "Magasin Kolwezi" },
      { id: "ART-5", nom: "Câble Cat6 – bobine 305 m", reference: "CAT6-305", boutique: true, description: "Bobine de câble réseau Cat6 cuivre, 305 mètres.", categorie: "Câbles et connectique", quantite: 5, seuil: 3, prixAchat: 95, prixVente: 150, emplacement: "Réserve" },
      { id: "ART-7", nom: "Laptop professionnel 14 pouces", reference: "PC-PRO-14", boutique: true, description: "Core i5, 16 Go, SSD 512 Go, livré configuré, antivirus et Office installés.", categorie: "Postes et serveurs", quantite: 4, seuil: 2, prixAchat: 520, prixVente: 690, emplacement: "Magasin Kolwezi" },
      { id: "ART-8", nom: "Pare-feu nouvelle génération (PME)", reference: "NGFW-PME", boutique: true, description: "Pare-feu pour 50 postes : filtrage web, VPN, protection contre les intrusions. Installation comprise sur devis.", categorie: "Réseau", quantite: 2, seuil: 1, prixAchat: 480, prixVente: 790, emplacement: "Magasin Kolwezi" },
      { id: "ART-6", nom: "Onduleur 1500 VA", reference: "UPS-1500", boutique: true, description: "Onduleur 1500 VA pour protéger PC, serveur et réseau des coupures.", categorie: "Énergie", quantite: 1, seuil: 2, prixAchat: 120, prixVente: 210, emplacement: "Réserve" }
    ],
    projets: [
      { id: "PRJ-1", nom: "Site web vitrine", type: "Site web", clientNom: "Hôtel Lualaba (exemple)", telephone: "", debut: J(-12), fin: J(18), responsableId: "P-06", statut: "en_cours", jalons: [{ id: "J1", nom: "Cahier des charges", fait: true, valideClient: true, date: J(-10) }, { id: "J2", nom: "Maquette validée", fait: true, valideClient: true, date: J(-4) }, { id: "J3", nom: "Développement", fait: false }, { id: "J4", nom: "Contenus intégrés", fait: false }, { id: "J5", nom: "Mise en ligne", fait: false }] },
      { id: "PRJ-2", nom: "Réseau et Wi-Fi du campus", type: "Réseau et Wi-Fi", clientNom: "Institut Kolwezi (exemple)", telephone: "", debut: J(-5), fin: J(25), responsableId: "P-04", statut: "en_cours", jalons: [{ id: "J1", nom: "Visite et plan", fait: true, valideClient: true, date: J(-3) }, { id: "J2", nom: "Câblage", fait: false }, { id: "J3", nom: "Configuration", fait: false }, { id: "J4", nom: "Tests", fait: false }, { id: "J5", nom: "Réception client", fait: false }] }
    ],
    taches: [
      { id: "T-1", projetId: "PRJ-1", titre: "Intégrer la page Réservations", techId: "P-06", statut: "encours", heures: 6, echeance: J(3) },
      { id: "T-2", projetId: "PRJ-1", titre: "Optimiser les images", techId: "P-06", statut: "attente", heures: 0, echeance: J(6) },
      { id: "T-3", projetId: "PRJ-2", titre: "Tirer les câbles du bâtiment B", techId: "P-04", statut: "encours", heures: 9, echeance: J(2) },
      { id: "T-4", projetId: "PRJ-2", titre: "Configurer les VLAN", techId: "P-01", statut: "attente", heures: 0, echeance: J(8) },
      { id: "T-5", projetId: "PRJ-1", titre: "Recette des formulaires", techId: "P-06", statut: "test", heures: 2, echeance: J(1) }
    ],
    tickets: [
      { id: "TK-1001", clientNom: "Pharmacie du Centre (exemple)", telephone: "", sujet: "Imprimante réseau hors ligne", description: "", priorite: "normale", source: "WhatsApp", statut: "assigne", techId: "P-05", creeLe: new Date(Date.now() - 5 * 3600e3).toISOString() },
      { id: "TK-1002", clientNom: "Hôtel Lualaba (exemple)", telephone: "", sujet: "Coupure Internet à la réception", description: "", priorite: "critique", source: "Téléphone", statut: "nouveau", techId: "", creeLe: new Date(Date.now() - 3.2 * 3600e3).toISOString() }
    ],
    actualites: [
      { id: "ACT-1", titre: "Suivez vos interventions en temps réel", categorie: "Nouveauté", texte: "Depuis votre espace client, voyez l’étape de votre projet, validez chaque jalon et ouvrez un ticket en cas de panne.", date: J(-3), publie: true },
      { id: "ACT-2", titre: "Nouvelle session : Virtualisation (Proxmox, VMware)", categorie: "Formation", texte: "Inscriptions ouvertes pour la session de janvier : machines virtuelles, stockage, sauvegardes et haute disponibilité.", date: J(-6), publie: true },
      { id: "ACT-3", titre: "Faux techniciens : vérifiez le badge", categorie: "Alerte sécurité", texte: "Avant de laisser entrer quelqu’un, entrez le numéro de son badge dans la section « Vérifier » de notre site.", date: J(-10), publie: true }
    ],
    abonnements: [
      { id: "AB-1", clientNom: "Hôtel Lualaba (exemple)", telephone: "", email: "", service: "Hébergement web", periodicite: "Annuel", montant: 180, prochaine: J(6), actif: true },
      { id: "AB-2", clientNom: "Institut Kolwezi (exemple)", telephone: "", email: "", service: "Contrat de maintenance Pro", periodicite: "Mensuel", montant: 450, prochaine: J(12), actif: true }
    ]
  };

  var Store = {
    /* ----- Demandes de devis (tickets) ----- */
    demandes: function () { return get("ng_demandes", []); },
    ajouterDemande: function (d) {
      var liste = Store.demandes();
      d.id = prochainNumero("NG-", "ng_compteur");
      d.creeLe = new Date().toISOString();
      d.statut = "a_evaluer";
      d.lignes = [];
      liste.unshift(d);
      set("ng_demandes", liste);
      return d;
    },
    majDemande: function (id, modif) {
      var liste = Store.demandes().map(function (d) { return d.id === id ? Object.assign({}, d, modif) : d; });
      set("ng_demandes", liste);
      return liste.filter(function (d) { return d.id === id; })[0];
    },
    supprimerDemande: function (id) {
      set("ng_demandes", Store.demandes().filter(function (d) { return d.id !== id; }));
    },

    /* ----- Réglages de l'entreprise (logo, signature, sceau…) ----- */
    reglages: function () {
      var r = get("ng_reglages", null) || {};
      if (r.tva && !r.sansTva) { r.tva = 0; r.sansTva = true; set("ng_reglages", r); }
      if (!r.logoV2) { r.logo = ""; r.logoV2 = true; set("ng_reglages", r); }
      var d = {
        raisonSociale: "NextGenIT SARL",
        rccm: "[numéro RCCM]",
        idnat: "[numéro Id. Nat.]",
        nif: "[numéro NIF]",
        directeur: "[Nom du directeur]",
        tva: 0,
        /* Simulateur de budget (prix indicatifs en $, min et max par unité) – modifiables dans Paramètres */
        simulateur: { camera: [180, 320], enregistreur: [250, 450], pointReseau: [45, 90], borne: [150, 300], vitrine: [400, 900], ecommerce: [1200, 3000], maintenancePoste: [8, 15], formation: [150, 450] },
        devise: "USD",
        banque: "[Banque] · [numéro de compte]",
        mobileMoney: "M-Pesa / Orange Money / Airtel Money : [numéros]",
        logo: "", signature: "", sceau: "", budgets: {}, delaiPaiement: 15, acompteDefaut: 50,
        soldesInitiaux: { "Banque": 2500, "M-Pesa": 300, "Orange Money": 200, "Airtel Money": 100, "Caisse": 600 }
      };
      var out = Object.assign(d, r);
      /* Images fournies par défaut (dossier assets/img) */
      if (!out.logo) out.logo = "assets/img/logo.png";
      if (!out.signature) out.signature = "assets/img/signature.png";
      if (!out.sceau) out.sceau = "assets/img/sceau.png";
      return out;
    },
    enregistrerReglages: function (r) { return set("ng_reglages", r); },

    /* ----- Textes du site modifiés depuis l'administration ----- */
    contenuPerso: function () { return get("ng_contenu_perso", {}); },
    enregistrerContenuPerso: function (c) { return set("ng_contenu_perso", c); },


    /* ----- Collections génériques (techniciens, paiements, sorties…) ----- */
    liste: function (nom) { return get("ng_" + nom, DEFAUTS[nom] ? JSON.parse(JSON.stringify(DEFAUTS[nom])) : []); },
    enregistrerListe: function (nom, l) { return set("ng_" + nom, l); },
    /* Domaines d'enseignement (pour cibler les contenus : « Cybersécurité » = visible des étudiants en sécurité, etc.) */
    DOMAINES: ["Réseaux", "Cybersécurité", "Systèmes et virtualisation", "Vidéosurveillance", "Développement web", "Cloud et hébergement", "Bureautique"],
    domaineFormation: function (f) {
      if (!f) return "";
      if (f.domaine) return f.domaine;
      var t = (f.titre || "").toLowerCase();
      if (/s[ée]curit|pare-feu|firewall|cyber/.test(t)) return "Cybersécurité";
      if (/linux|windows|serveur|virtualis|proxmox|vmware/.test(t)) return "Systèmes et virtualisation";
      if (/cctv|cam[ée]ra|vid[ée]o/.test(t)) return "Vidéosurveillance";
      if (/web|site|html|javascript|d[ée]velop/.test(t)) return "Développement web";
      if (/cloud|h[ée]berg|365|workspace/.test(t)) return "Cloud et hébergement";
      if (/bureautique|word|excel|office/.test(t)) return "Bureautique";
      return "Réseaux";
    },
    /* Une publication est-elle visible pour cet étudiant ? cible = { tous, domaines[], formations[], mode, etudiants[] } */
    visiblePour: function (cible, e) {
      if (!e) return false;
      cible = cible || { tous: true };
      if ((cible.etudiants || []).indexOf(e.id) > -1) return true;
      var f = this.formations().filter(function (x) { return x.id === e.formationId; })[0];
      var groupe = cible.tous || (cible.formations || []).indexOf(e.formationId) > -1 || (cible.domaines || []).indexOf(this.domaineFormation(f)) > -1;
      if (!groupe) return false;
      var m = String(e.modeSuivi || "").toLowerCase();
      if (!cible.mode || cible.mode === "tous" || !m || /ligne et/.test(m)) return true;
      return cible.mode === "en_ligne" ? /ligne/.test(m) : /pr[ée]sentiel/.test(m);
    },
    ajouter: function (nom, objet, prefixe) {
      var l = Store.liste(nom);
      objet.id = objet.id || (prefixe || "ID-") + Date.now().toString(36).toUpperCase();
      objet.creeLe = objet.creeLe || new Date().toISOString();
      l.unshift(objet);
      set("ng_" + nom, l);
      return objet;
    },
    modifier: function (nom, id, modif) {
      var l = Store.liste(nom).map(function (x) { return x.id === id ? Object.assign({}, x, modif) : x; });
      set("ng_" + nom, l);
      return l.filter(function (x) { return x.id === id; })[0];
    },
    retirer: function (nom, id) { set("ng_" + nom, Store.liste(nom).filter(function (x) { return x.id !== id; })); },

    /* ----- Journal de traçabilité : chaque action est enregistrée ----- */
    journal: function () { return get("ng_journal", []); },
    log: function (action, detail, montant) {
      var j = Store.journal();
      var qui = "";
      try { qui = sessionStorage.getItem("ng_admin_nom") || "Système"; } catch (e) { qui = "Système"; }
      j.unshift({ quand: new Date().toISOString(), qui: qui, action: action, detail: detail || "", montant: montant == null ? null : montant });
      set("ng_journal", j.slice(0, 800));
    },


    /* ----- Catalogue des formations (créé dans l'Académie) ----- */
    formations: function () {
      var l = get("ng_formations", null);
      if (!l) {
        l = (window.NG_CONTENU.formations || []).map(function (f, i) {
          var mods = (f.programme || []).map(function (t, k) { return { id: "M" + (k + 1), titre: t, lecons: [] }; });
          if (mods.length && i === 0) {
            mods[0].lecons = [
              { id: "L-" + (101 + i) + "-1", titre: "Bienvenue et objectifs de la formation", type: "texte", contenu: "Bienvenue ! Dans cette formation, vous allez apprendre à concevoir, configurer et dépanner un réseau d’entreprise.\n\nChaque module contient des vidéos, un support PDF et un quiz. Votre progression est enregistrée automatiquement." },
              { id: "L-" + (101 + i) + "-2", titre: "Quiz : les bases des réseaux", type: "quiz", questions: [{ q: "Quel équipement relie plusieurs réseaux IP ?", bonne: "Le routeur", choix: ["Le routeur", "Le switch", "Le répéteur"] }, { q: "Le masque d’un réseau /24 est…", bonne: "255.255.255.0", choix: ["255.255.255.0", "255.255.0.0", "255.0.0.0"] }, { q: "Quel câble est le plus utilisé en réseau local ?", bonne: "Cat6", choix: ["Cat6", "Coaxial", "Téléphonique"] }] }
            ];
          }
          return Object.assign({ id: "F-" + (101 + i), publie: true, inscriptionsOuvertes: true, seances: [], modules: mods, evaluations: [{ id: "EV1", titre: "Examen final", sur: 100 }] }, f);
        });
        set("ng_formations", l);
      }
      var auj = new Date().toISOString().slice(0, 10);
      return l.map(function (f) {
        var st = auj < f.debut ? "ouverte" : auj > f.fin ? "terminee" : "encours";
        var tot = (new Date(f.fin) - new Date(f.debut)) || 1;
        var av = st === "encours" ? Math.round((new Date(auj) - new Date(f.debut)) / tot * 100) : st === "terminee" ? 100 : 0;
        var fmt = function (d) { return new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }); };
        return Object.assign({}, f, { statut: st, avancement: av, periode: fmt(f.debut) + " → " + fmt(f.fin) });
      });
    },
    enregistrerFormations: function (l) {
      return set("ng_formations", l.map(function (f) { var c = Object.assign({}, f); delete c.statut; delete c.avancement; delete c.periode; return c; }));
    },
    /* ----- Inscriptions aux formations ----- */
    etudiants: function () {
      return get("ng_etudiants", [
        { nom: "Bénédicte K.", formation: "Réseaux informatiques (CCNA)", progression: 92, presence: 95, note: 84 },
        { nom: "Jonathan M.", formation: "Réseaux informatiques (CCNA)", progression: 88, presence: 90, note: 71 },
        { nom: "Sarah T.", formation: "Réseaux informatiques (CCNA)", progression: 80, presence: 85, note: 66 },
        { nom: "Elie N.", formation: "Réseaux informatiques (CCNA)", progression: 64, presence: 72, note: 48 },
        { nom: "Ruth K.", formation: "Cybersécurité et pare-feu", progression: 70, presence: 100, note: null },
        { nom: "Patient L.", formation: "Cybersécurité et pare-feu", progression: 40, presence: 55, note: null }
      ]);
    },
    enregistrerEtudiants: function (l) { return set("ng_etudiants", l); }
  };

  /* Applique les textes modifiés depuis l'admin au contenu par défaut */
  var perso = Store.contenuPerso();
  var C = window.NG_CONTENU || {};
  if (perso.entreprise) C.entreprise = Object.assign({}, C.entreprise, perso.entreprise);
  if (perso.accueil) C.accueil = Object.assign({}, C.accueil, perso.accueil);

  window.NGStore = Store;
})();
