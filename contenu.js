/* =========================================================
   CONTENU DU SITE – modifiez les textes ici.
   Tout ce qui est affiché en liste (services, formations,
   FAQ…) vient de ce fichier. Gardez les guillemets et les
   virgules : chaque élément est entre { } et séparé par ,
   ========================================================= */

window.NG_CONTENU = {
  entreprise: {
    nom: "NextGenIT",
    slogan: "Services informatiques à Kolwezi et partout en RDC",
    telephone: "+243 000 000 000",
    whatsapp: "243000000000", // sans le + ni les espaces
    email: "contact@nextgenit.com",
    adresse: "[Votre adresse], Kolwezi, Lualaba – RDC",
    horaires: "Lun – Sam · 8 h – 18 h · urgences 24/7"
  },

  accueil: {
    badge: "Techniciens disponibles à Kolwezi",
    titre: "L’informatique de votre entreprise, installée, sécurisée et suivie en temps réel.",
    texte: "Réseaux, vidéosurveillance, cybersécurité, virtualisation, sites web et support. Décrivez votre besoin : nous l’évaluons et vous envoyons un devis détaillé par email, WhatsApp ou SMS.",
    points: ["Support 24/7", "Devis détaillé sous 24 h", "Paiement Mobile Money et carte"]
  },

  /* Questions fréquentes de l'espace client */
  faqClient: [
    { q: "Comment suivre l’avancement de mon intervention ?", r: "Onglet « Suivi de projet » : chaque étape terminée est cochée. Vous pouvez valider les étapes vous-même. Pour une panne, l’onglet « Support » montre où en est votre ticket." },
    { q: "Comment signaler une panne ?", r: "Onglet « Support » → « Signaler une panne ». Choisissez l’urgence : critique (réponse sous 4 h), haute (8 h), normale (24 h) ou basse (72 h). Le technicien est assigné et vous suivez chaque étape." },
    { q: "Que veulent dire les statuts d’un ticket ?", r: "Reçu : notre équipe a votre demande. Technicien assigné : un spécialiste s’en occupe. En cours : intervention en cours. Résolu : le problème est réglé, confirmez-le. Fermé : le ticket est clôturé." },
    { q: "Comment payer une facture ?", r: "Par M-Pesa, Orange Money, Airtel Money, carte Visa ou Mastercard, virement ou en espèces au bureau. Indiquez le numéro de facture comme référence ; votre reçu apparaît dans « Factures et paiements »." },
    { q: "Où trouver mes factures et reçus ?", r: "Onglet « Factures et paiements » : chaque facture et chaque reçu s’ouvre en PDF, à imprimer ou à enregistrer." },
    { q: "Comment accepter un devis ?", r: "Onglet « Demandes et devis » → « Accepter le devis ». La facture est préparée automatiquement et l’intervention est planifiée." },
    { q: "Comment vérifier qu’un technicien vient bien de NextGenIT ?", r: "Scannez le QR code de son badge : un message vert confirme son nom, sa fonction et son numéro." }
  ],
  /* Questions fréquentes de l'espace étudiant */
  faqEtudiant: [
    { q: "Comment commencer mes cours ?", r: "Onglet « Mes cours » : choisissez une leçon à gauche. Votre progression est enregistrée et vous reprenez là où vous vous êtes arrêté." },
    { q: "Mon compte est « en attente de validation », que faire ?", r: "NextGenIT vérifie votre inscription (et le paiement si nécessaire). Vous êtes prévenu par WhatsApp ou par email dès que l’accès est ouvert." },
    { q: "Comment est calculée ma progression ?", r: "Une leçon compte quand vous la marquez comme terminée, quand vous réussissez son quiz (50 % minimum) ou quand vous rendez le TP." },
    { q: "Comment obtenir mon attestation ?", r: "À la fin de la formation, avec au moins 80 % de présence et une moyenne de 50/100. Elle se télécharge dans l’onglet « Attestation » et porte un QR code de vérification." },
    { q: "Je suis la formation en présentiel, à quoi sert l’espace ?", r: "Vous y trouvez les supports, les vidéos, les quiz, vos notes et vos présences. Le formateur fait l’appel à chaque séance." },
    { q: "Comment poser une question ?", r: "Sous chaque leçon, « Poser une question au formateur ». Pour une aide immédiate, utilisez l’assistant IA (bouton 🤖) : il cherche dans vos cours et prépare vos recherches sur Google, YouTube et Wikipédia." },
    { q: "J’ai oublié mon mot de passe", r: "Contactez NextGenIT par WhatsApp : un nouveau mot de passe vous est envoyé. Vous pourrez le changer dans « Mon compte »." }
  ],

  /* Chiffres et atouts (section « Pourquoi choisir NextGenIT ») */
  chiffres: [
    { valeur: "6", texte: "domaines d’expertise" },
    { valeur: "24/7", texte: "support et supervision" },
    { valeur: "< 24 h", texte: "pour recevoir votre devis" },
    { valeur: "100 %", texte: "des interventions suivies en ligne" }
  ],
  atouts: [
    { icone: "check", titre: "Devis clair et détaillé", texte: "Chaque prix est expliqué ligne par ligne, sans surprise." },
    { icone: "casque", titre: "Techniciens certifiés", texte: "Spécialistes par domaine, badge vérifiable par QR code." },
    { icone: "moniteur", titre: "Suivi en temps réel", texte: "Votre espace client montre chaque étape de votre projet." },
    { icone: "eclair", titre: "Paiement simple", texte: "M-Pesa, Orange Money, Airtel Money, carte ou virement." }
  ],
  /* Résumé de chaque domaine (vue « Tous » de la section services) */
  domaines: {
    reseau: { icone: "reseau", texte: "Câblage, LAN/WAN, routage, commutation et Wi-Fi d’entreprise." },
    secu: { icone: "bouclier", texte: "Audits, pare-feu Fortinet et Sophos, VPN et durcissement des systèmes." },
    web: { icone: "web", texte: "Sites vitrines, e-commerce, applications sur mesure et domaines .cd." },
    cloud: { icone: "serveur", texte: "Hébergement, VPS, messagerie pro et migration vers Microsoft 365 ou Google Workspace." },
    install: { icone: "camera", titre: "Installation et configuration", texte: "Parcs informatiques, CCTV, serveurs Windows et Linux, imprimantes réseau." },
    formation: { icone: "calendrier", texte: "Réseaux, systèmes et sécurité : cours pratiques et attestation vérifiable." }
  },

  /* Solutions par secteur (section « Solutions » de l'accueil) */
  solutions: [
    { titre: "Mines et industrie", icone: "reseau", texte: "Réseaux de site robustes, liaisons radio et fibre, vidéosurveillance des zones sensibles et supervision 24/7.", points: ["Liaisons longue distance", "CCTV de site", "Supervision des équipements"] },
    { titre: "PME et commerces", icone: "engrenage", texte: "Votre service informatique complet pour un abonnement : postes, Wi-Fi, sauvegardes, caisse et support.", points: ["Contrat de maintenance", "Wi-Fi et caisse", "Sauvegardes"] },
    { titre: "Banques et micro-finance", icone: "parefeu", texte: "Pare-feu, VPN entre agences, contrôle d’accès et journalisation pour les audits.", points: ["VPN inter-agences", "Contrôle d’accès", "Audit de sécurité"] },
    { titre: "Écoles et universités", icone: "calendrier", texte: "Salles informatiques, Wi-Fi campus filtré, plateformes de cours et formation des enseignants.", points: ["Wi-Fi campus", "Salles informatiques", "Formation"] },
    { titre: "Santé", icone: "bouclier", texte: "Réseau fiable pour les services, protection des données des patients et énergie secourue.", points: ["Données protégées", "Onduleurs", "Réseau fiable"] },
    { titre: "Hôtels et ONG", icone: "satellite", texte: "Wi-Fi clients avec portail, caméras, bureaux reliés et support à distance pour les équipes terrain.", points: ["Wi-Fi invités", "Caméras", "Support à distance"] }
  ],

  secteurs: ["Sociétés minières", "Sous-traitants", "PME et commerces", "Banques et micro-finance", "Écoles et universités", "Santé", "Hôtels et ONG"],

  categories: [
    { id: "tous", nom: "Tous" },
    { id: "reseau", nom: "Réseaux et infrastructure" },
    { id: "secu", nom: "Cybersécurité" },
    { id: "web", nom: "Web et logiciel" },
    { id: "cloud", nom: "Hébergement et cloud" },
    { id: "install", nom: "Installation et configuration" },
    { id: "formation", nom: "Formations" }
  ],

  /* Chaque service : une carte avec la liste de ce qu'il comprend */
  services: [
    { cat: "reseau", icone: "reseau", titre: "Conception et câblage structuré", texte: "Plans, baies, câblage cuivre et fibre certifié pour bureaux, entrepôts et sites miniers.", equipe: "Équipe Réseau", details: ["Étude et plan du réseau", "Câblage Cat6 et fibre", "Baies et brassage étiquetés"] },
    { cat: "reseau", icone: "reseau", titre: "LAN, WAN, routage et commutation", texte: "Configuration des switchs, VLAN, routage entre sites et liaisons inter-agences.", equipe: "Équipe Réseau", details: ["VLAN et qualité de service", "Routage et liaisons WAN", "Supervision des équipements"] },
    { cat: "reseau", icone: "satellite", titre: "Wi-Fi d’entreprise", texte: "Couverture sans zone morte, réseaux invités séparés et gestion centralisée des bornes.", equipe: "Équipe Réseau", details: ["Étude de couverture", "Bornes Wi-Fi 6 et 7", "Portail invités"] },
    { cat: "secu", icone: "bouclier", titre: "Audit de sécurité", texte: "Analyse des failles, tests et plan d’action priorisé pour protéger vos données.", equipe: "Équipe Sécurité", details: ["Inventaire et analyse des risques", "Tests de vulnérabilité", "Rapport et plan d’action"] },
    { cat: "secu", icone: "parefeu", titre: "Pare-feu et VPN", texte: "Fortinet, Sophos : filtrage, VPN site à site et accès à distance sécurisé.", equipe: "Équipe Sécurité", details: ["Installation et règles", "VPN entre agences et nomades", "Filtrage web et IPS"] },
    { cat: "secu", icone: "badge", titre: "Durcissement des systèmes", texte: "Serveurs et postes configurés selon les bonnes pratiques (hardening), sauvegardes protégées.", equipe: "Équipe Sécurité", details: ["Politiques de mots de passe", "Mises à jour maîtrisées", "Sauvegardes hors ligne"] },
    { cat: "web", icone: "web", titre: "Sites vitrines et e-commerce", texte: "Sites modernes, rapides et adaptés au téléphone, avec paiement Mobile Money et carte.", equipe: "Équipe Web", details: ["Design sur mesure", "Boutique en ligne", "Référencement Google"] },
    { cat: "web", icone: "moniteur", titre: "Applications web sur mesure", texte: "Outils de gestion, portails clients, tableaux de bord adaptés à votre métier.", equipe: "Équipe Web", details: ["Analyse du besoin", "Développement et tests", "Formation des utilisateurs"] },
    { cat: "web", icone: "web", titre: "Noms de domaine .cd et autres", texte: "Réservation, renouvellement et gestion technique de vos domaines.", equipe: "Équipe Web", details: ["Extension .cd, .com, .org", "Configuration DNS", "Rappels avant expiration"] },
    { cat: "cloud", icone: "serveur", titre: "Hébergement web et VPS", texte: "Hébergement rapide et serveurs virtuels supervisés, sauvegardes quotidiennes.", equipe: "Équipe Cloud", details: ["Hébergement de sites", "Serveurs virtuels (VPS)", "Certificats HTTPS"] },
    { cat: "cloud", icone: "mail", titre: "Messagerie professionnelle", texte: "Adresses @votreentreprise sur Microsoft 365 ou Google Workspace.", equipe: "Équipe Cloud", details: ["Création des comptes", "Agendas partagés", "Protection anti-spam"] },
    { cat: "cloud", icone: "virtualisation", titre: "Migration vers le cloud et virtualisation", texte: "Proxmox, VMware, Hyper-V, Microsoft 365 : migration sans perte de données.", equipe: "Équipe Infrastructure", details: ["Plan de migration", "Machines virtuelles", "Haute disponibilité"] },
    { cat: "install", icone: "camera", titre: "Vidéosurveillance (CCTV)", texte: "Caméras IP 4K, enregistreurs, consultation sur téléphone et alertes.", equipe: "Équipe CCTV", details: ["Repérage et pose", "Enregistreur NVR", "Accès mobile"] },
    { cat: "install", icone: "moniteur", titre: "Déploiement de parcs informatiques", texte: "Postes livrés configurés, sécurisés et inventoriés, prêts à l’emploi.", equipe: "Équipe Maintenance", details: ["Préparation des postes", "Installation sur site", "Inventaire du parc"] },
    { cat: "install", icone: "serveur", titre: "Serveurs Windows et Linux", texte: "Installation de serveurs physiques, Active Directory, partage de fichiers.", equipe: "Équipe Infrastructure", details: ["Windows Server et Linux", "Active Directory", "Sauvegardes"] },
    { cat: "install", icone: "outil", titre: "Imprimantes réseau et dépannage", texte: "Imprimantes partagées, scanners, dépannage sur site à Kolwezi ou à distance.", equipe: "Techniciens terrain", details: ["Installation réseau", "Dépannage rapide", "Contrats de maintenance"] },
    { cat: "formation", icone: "calendrier", titre: "Formations et certifications", texte: "Réseaux, administration systèmes, sécurité : cours pratiques et inscription en ligne.", equipe: "NextGenIT Academy", details: ["Cours en salle et en ligne", "Quiz et examens", "Attestation vérifiable"] }
  ],

  etapes: [
    { titre: "Vous décrivez le besoin", texte: "Sur le site, par l’assistant ou sur WhatsApp. Un ticket est créé." },
    { titre: "Un spécialiste évalue", texte: "Il étudie la demande et fixe le montant exact." },
    { titre: "Vous recevez le devis", texte: "Par email, WhatsApp ou SMS, avec le détail de chaque ligne." },
    { titre: "Intervention suivie", texte: "Vous voyez l’avancement en direct puis vous validez la fin des travaux." }
  ],

  equipements: [
    { type: "rack", court: "NGFW", nom: "Pare-feu nouvelle génération", texte: "Filtrage, VPN et protection contre les intrusions." },
    { type: "serveur", nom: "Serveur rack", texte: "Virtualisation, stockage RAID et sauvegardes." },
    { type: "ap", nom: "Point d’accès Wi-Fi 7", texte: "Couverture rapide pour bureaux, hôtels et sites." },
    { type: "rack", court: "SW-48", nom: "Switch 48 ports PoE+", texte: "Cœur de réseau qui alimente caméras et bornes." },
    { type: "laptop", nom: "Laptop professionnel", texte: "Livré configuré, chiffré et protégé." },
    { type: "camera", nom: "Caméra IP 4K", texte: "Vision nocturne et détection des intrusions." },
    { type: "rack", court: "UPS", nom: "Onduleur online", texte: "Protège vos équipements des coupures." }
  ],

  offres: [
    { nom: "Essentiel", pour: "Petits bureaux jusqu’à 10 postes", points: ["Support à distance illimité", "1 visite préventive par mois", "Antivirus géré", "Rapport mensuel"] },
    { nom: "Pro", pour: "PME jusqu’à 50 postes", vedette: true, points: ["Tout Essentiel", "Intervention sur site sous 4 h", "Supervision réseau 24/7", "Gestion du pare-feu", "Sauvegardes vérifiées"] },
    { nom: "Entreprise", pour: "Sites miniers et multi-sites", points: ["Tout Pro", "Technicien dédié", "Engagement de délai (SLA)", "Audit sécurité trimestriel"] }
  ],

  /* Formations de départ. Une fois l'administration utilisée,
     ce sont les formations créées dans « Académie » qui s'affichent. */
  formations: [
    { titre: "Réseaux informatiques (CCNA)", texte: "Adressage IP, switchs, routage, VLAN et sécurité de base, avec labos pratiques.", debut: "2026-10-13", fin: "2026-11-21", duree: "72 h", niveau: "Intermédiaire", mode: "Présentiel + en ligne", places: 18, formateur: "Christian K.", programme: ["Fondamentaux des réseaux", "Adressage IP et sous-réseaux", "Switching et VLAN", "Routage", "Sécurité et ACL", "Projet final"] },
    { titre: "Cybersécurité et pare-feu", texte: "Menaces, pare-feu Fortinet et Sophos, politiques de sécurité, VPN.", debut: "2026-10-27", fin: "2026-11-22", duree: "48 h", niveau: "Intermédiaire", mode: "Présentiel", places: 12, formateur: "Grâce K.", programme: ["Panorama des menaces", "Pare-feu : règles et NAT", "VPN site à site et nomade", "Filtrage web et IPS", "Audit et bonnes pratiques"] },
    { titre: "Linux et serveurs", texte: "Administration Linux, services réseau, Windows Server et Active Directory.", debut: "2026-11-24", fin: "2026-12-26", duree: "60 h", niveau: "Intermédiaire", mode: "En ligne", places: 20, formateur: "Daniel B.", programme: ["Ligne de commande", "Utilisateurs et droits", "Services réseau", "Windows Server et AD", "Sauvegardes"] },
    { titre: "Installation CCTV", texte: "Caméras IP, enregistreurs, câblage et consultation à distance sur téléphone.", debut: "2026-12-01", fin: "2026-12-12", duree: "36 h", niveau: "Tous niveaux", mode: "Pratique terrain", places: 10, formateur: "Patrick M.", programme: ["Choisir les caméras", "Câblage et PoE", "Configuration du NVR", "Accès à distance", "Chantier pratique"] },
    { titre: "Virtualisation (Proxmox, VMware)", texte: "Machines virtuelles, stockage, sauvegardes et haute disponibilité.", debut: "2027-01-05", fin: "2027-02-13", duree: "54 h", niveau: "Avancé", mode: "Présentiel + labos", places: 15, formateur: "Christian K.", programme: ["Concepts de virtualisation", "Proxmox VE", "VMware ESXi", "Stockage et réseau virtuels", "Sauvegarde et reprise", "Haute disponibilité"] },
    { titre: "Bureautique professionnelle", texte: "Word, Excel, emails et outils collaboratifs pour être efficace au bureau.", debut: "2026-09-01", fin: "2026-10-10", duree: "40 h", niveau: "Débutant", mode: "Présentiel", places: 20, formateur: "Moïse B.", programme: ["Word", "Excel", "Messagerie et agenda", "Travail en équipe en ligne"] }
  ],

  faq: [
    { q: "Pourquoi les prix ne sont-ils pas affichés ?", r: "Chaque installation est différente. Un spécialiste évalue votre demande et vous envoie un devis exact et détaillé, sans surprise." },
    { q: "En combien de temps je reçois mon devis ?", r: "En général dans la journée ouvrable, par email, WhatsApp ou SMS selon votre choix." },
    { q: "Dans quelles zones intervenez-vous ?", r: "Sur site à Kolwezi et dans le Lualaba, et à distance partout en RDC." },
    { q: "Quels moyens de paiement acceptez-vous ?", r: "M-Pesa, Orange Money, Airtel Money, carte Visa ou Mastercard et virement bancaire." },
    { q: "Les formations donnent-elles une attestation ?", r: "Oui. L’attestation de fréquentation est générée automatiquement dès 80 % de présence et une évaluation réussie. Elle se vérifie par son numéro sur notre site." },
    { q: "Comment vérifier qu’un technicien vient bien de chez vous ?", r: "Entrez le numéro de son badge dans la section « Vérifier » du site. Un vrai technicien NextGenIT apparaît avec sa photo et sa spécialité." }
  ],

  avis: [
    { nom: "[Nom du client]", role: "[Fonction, entreprise]", texte: "[Avis de votre premier client : le problème, la rapidité, le résultat.]" },
    { nom: "[Nom du client]", role: "[Fonction, entreprise]", texte: "[Avis client : le suivi en temps réel et le sérieux du technicien.]" },
    { nom: "[Nom du client]", role: "[Fonction, entreprise]", texte: "[Avis client : la formation suivie ou le contrat de maintenance.]" }
  ],

  /* Badges et attestations vérifiables (exemples) */
  verifications: {
    "NG-T-0142": { type: "Technicien", nom: "Patrick M.", detail: "Spécialiste vidéosurveillance · badge valide jusqu’au 31/12/2026" },
    "ATT-2026-0154": { type: "Attestation", nom: "Bénédicte K.", detail: "Réseaux informatiques (CCNA) · 72 h · délivrée le 10/10/2026" }
  }
};
