# NextGenIT – site, espaces clients et étudiants, administration

Site professionnel pour PC et téléphone, en fichiers HTML, CSS et JavaScript : rien à installer.

## Adresses

| Partie | Adresse |
|---|---|
| Site public | `/` (index.html) |
| Demande de devis | `/devis.html` |
| Formations et inscription | `/formations.html` |
| Connexion clients et étudiants | `/connexion.html` |
| Espace client | `/mon-espace.html` |
| Espace étudiant (cours, quiz, notes, attestation) | `/etudiant.html` |
| Boutique (commande de matériel) | `/boutique.html` |
| Administration | `/admin.html` (ou `/admin/`) |

**Comptes de démonstration** (un bouton les remplit sur chaque page de connexion) :
- Administration : `admin@nextgenit.com` / `NextGenIT@2026` – le bouton disparaît dès que ce mot de passe est changé dans *Mon compte*.
- Client : `client@exemple.cd` / `Client2026` · Étudiant : `etudiant@exemple.cd` / `Etudiant2026`.

**Double authentification** : *Administration → Mon compte → Activer*. Scannez le QR code (ou saisissez la clé) avec Google Authenticator ou Microsoft Authenticator ; un code à 6 chiffres est ensuite demandé à chaque connexion. Après 5 mots de passe faux, la connexion est bloquée 15 minutes.

**Application installable** : sur téléphone, ouvrez le site puis « Ajouter à l’écran d’accueil ». Les pages déjà ouvertes restent consultables sans réseau.

## Tester sur GitHub Pages

1. Créez un dépôt, envoyez tout le contenu de ce dossier à la racine.
2. *Settings → Pages → Deploy from a branch → main / (root)*.
3. Le site s’ouvre en 1 à 2 minutes sur `https://VOTRE-NOM.github.io/NOM-DU-DEPOT/`.
4. Domaine : *Settings → Pages → Custom domain* → `www.nextgenit.com`, puis un enregistrement CNAME `www` vers `VOTRE-NOM.github.io` chez votre registraire.

Sur votre ordinateur : `python -m http.server 8000` dans ce dossier, puis `http://localhost:8000`.

## Administration : modules

- **Pilotage** : tableau de bord avec, en première vue, les demandes de devis, inscriptions, tickets clients et commandes à traiter, puis graphiques animés et équipe en ligne, notifications, rapports financiers, historique non supprimable.
- **Commercial** : demandes et devis, commandes de la boutique (transformées en devis préremplis, stock mis à jour à la livraison), clients (CRM), pipeline par glisser-déposer.
- **Opérations** : projets (Kanban, Gantt, jalons, rapport signé par le client), interventions, helpdesk avec délais garantis, stock, personnel et RH.
- **Finances** : devis, pro-forma, factures, acomptes, échéanciers, abonnements récurrents, paiements avec reçus, caisse et clôture, soldes, dépenses avec approbation, budgets, paie (fixe, heures, commissions, primes, avances) et bulletins.
- **Académie** : formations et cours (vidéos, PDF, documents, leçons, quiz), approbation des inscriptions avec envoi des identifiants, comptes étudiants, présences, notes, fiche de fréquentation et attestation.
- **Paramètres** : taux du jour USD → CDF affiché sur les factures et le tableau de bord.
- **Administration** : administrateurs (créer, activer, désactiver, suspendre, droits module par module), site public, apparence (5 thèmes, dont NextGen aux couleurs du logo), paramètres (logo, signature, sceau, mentions légales), mon compte (photo, identité, mot de passe).

Rôles fournis : Super admin, Gestionnaire, Comptable, Formateur, Technicien, Agent support.


## Mettre le site sur GitHub (important)

Le site est organisé **comme le projet DSK** : presque tous les fichiers sont à la racine (`index.html`, `admin.html`, `style.css`, `site.js`, `admin-core.js`…). Seules les images sont dans `assets/img/`.

1. Décompressez l’archive.
2. Sur GitHub : **Add file → Upload files**, glissez **tous les fichiers et dossiers** (sélectionnez tout avec Ctrl + A), puis **Commit changes**.
3. **Settings → Pages → Deploy from a branch → main / (root) → Save**.
4. Ouvrez `https://VOTRE-NOM.github.io/VOTRE-DEPOT/test-github.html` : tout doit être vert.
5. Après chaque nouvel envoi : **Ctrl + F5**.

Adresses :
- site public : `…/index.html`
- administration : `…/admin.html` (ou `…/admin/`, qui y redirige)

## Firebase : déjà branché (comme le site DSK)

Le site est relié au projet Firebase **dsk-congo** (le même que DSK, qui fonctionne déjà sur GitHub). Les données de NextGenIT sont rangées à part, dans la collection **`nextgenit`** : elles ne touchent pas celles de DSK.

**Une seule vérification à faire** dans https://console.firebase.google.com → projet *dsk-congo* → **Firestore Database → Règles** : les règles doivent autoriser la collection `nextgenit`. Si elles contiennent déjà `match /{document=**} { allow read, write: if true; }`, rien à faire. Sinon, ajoutez ce bloc à côté des règles de DSK, puis **Publier** :

```
match /nextgenit/{cle} {
  allow read, write: if true;
}
```

Dans l’administration, la pastille en haut indique **☁ Synchronisé** quand tout fonctionne. Si elle affiche « Firebase injoignable », passez la souris dessus : le message dit quoi corriger.

Ce qui est partagé en direct entre tous les appareils : demandes, devis, factures, paiements, clients, personnel, formations, comptes, textes du site, thème… Quand l’admin enregistre, le site public se met à jour tout seul à la même position.

Pour passer plus tard sur votre propre projet NextGenIT : créez un projet Firebase, une base Firestore, collez le contenu de `firestore.rules`, puis remplacez les valeurs dans `firebase-config.js`.

Limites (test) : la collection est ouverte comme celle de DSK ; avant l’ouverture au public, il faudra des comptes Firebase pour l’équipe et des règles plus strictes. Les vidéos et PDF des cours ont besoin de Firebase Storage pour être partagés.

**Mise à jour sur GitHub** : les adresses des fichiers portent un numéro de version (`?v=30`) et l’ancien service worker se désinstalle tout seul, pour que chaque envoi soit visible tout de suite (faites Ctrl + F5 une fois).

## Apparence « NextGen Pro » (par défaut)

Inspirée du site DSK : bleu marine, bleu et or, police Plus Jakarta Sans.
- Site public : barre du haut, menu en pastilles, accueil bleu marine avec bas arrondi, domaines d’expertise, chiffres clés, boutons flottants (WhatsApp, assistant, téléphone, email), retour en haut, pied de page bleu marine. Les animations de transition ont été retirées.
- Administration : connexion sur fond bleu marine, menu latéral flottant avec carte de profil et recherche, bandeau de bienvenue, indicateurs aux icônes colorées, bouton « Aperçu en direct » qui affiche le site à droite pendant vos modifications.
- Pour revenir à l’ancien style : *Administration → Apparence*. Les effets se trouvent dans `pro.css`, `effets.js` et `admin-ui.js`.

## Nouveautés de cette version

- **Connexion** : `www.nextgenit.com/admin` ouvre la page de connexion de l’administration (cadenas, engrenages, double authentification par application, bouton « compte de démonstration », exemples dans les champs). Les clients et étudiants se connectent ou créent leur compte sur `connexion.html`.
- **Double authentification** : chaque admin l’active dans *Mon compte* avec Google Authenticator ou Microsoft Authenticator.
- **Tableau de bord** : dès l’ouverture, les demandes de devis, inscriptions, tickets clients et commandes boutique à traiter, puis les graphiques.
- **Boutique** : les clients commandent du matériel (`boutique.html`) ; l’équipe traite les commandes dans *Commandes boutique*.
- **Site public** depuis l’admin : bannière d’annonce, sections affichées ou masquées, actualités.
- **Académie** : codes promo, accès aux cours débloqué automatiquement après paiement, travaux pratiques à rendre et corriger, questions des étudiants au formateur, badges, reprise de la dernière leçon, attestation avec QR code de vérification.
- **Multi-devises** : taux USD → CDF dans *Paramètres*, montant en francs congolais sur les documents.
- **Application installable** (PWA) : le site s’installe sur le téléphone et reste consultable hors connexion.

## Modifier

- Textes, services, formations, FAQ : `contenu.js` (ou *Administration → Site public*).
- Logo, signature, sceau : `assets/img/` (ou *Administration → Paramètres*).
- Couleurs : *Administration → Apparence* ; nouveaux thèmes dans `style.css` et `theme.js`.

## ⚠ Avant l’ouverture au public

Cette version enregistre tout **dans le navigateur** (localStorage, et IndexedDB pour les fichiers de cours). C’est parfait pour tester, mais :
- les données ne sont pas partagées entre appareils (une demande faite sur le téléphone d’un client n’arrive pas sur votre PC) ;
- la connexion se vérifie dans le navigateur : elle ne protège pas de vraies données ;
- les vidéos et PDF ajoutés aux cours restent sur l’appareil qui les a envoyés.

**Étape suivante** : brancher une base de données, une authentification et un stockage de fichiers en ligne (par exemple Supabase). Les lectures et écritures passent par `store.js` et `fichiers.js` : ce sont les fichiers à remplacer.

Pour l’envoi automatique (sans clic) des emails, SMS et WhatsApp, et la confirmation automatique des paiements Mobile Money et carte, il faut un serveur relié à ces services et à un agrégateur de paiement opérant en RDC. En attendant, chaque message est prêt et part en un clic, et chaque paiement s’enregistre avec sa référence.

## Badges, factures et photos

- **Badges** : chaque membre du personnel reçoit un numéro (NG-T-… pour les techniciens) valable un an. Bouton « 🪪 Badge » : carte recto-verso avec photo et QR code. Le QR code ouvre `verification.html`, qui affiche la photo et indique si le badge est valide ou non (agent désactivé, date dépassée).
- **Factures** : générées automatiquement dès qu’un devis est accepté. Dans la facture : « ✎ Articles et prix » pour ajouter des articles du stock ou des lignes libres, puis « 🖨 Imprimer », PDF, WhatsApp, email ou SMS.
- **Photos de profil** : à chaque envoi, une fenêtre permet de recadrer (glisser), zoomer et pivoter. Dans « Mon compte », le bouton « ✂ Recadrer / redimensionner » reprend la photo existante.

## Tout se modifie et se supprime

- **Factures** : 👁 ouvrir · 📄 PDF · ✎ modifier (client, dates, objet, TVA, note, articles) · 🗑 supprimer (avec ses paiements, après confirmation).
- **Paiements, dépenses, abonnements, mouvements de caisse, avances** : ✎ modifier et 🗑 supprimer ; les soldes et statuts se recalculent.
- **Stock** : ajouter, modifier, supprimer un article, annuler un mouvement (la quantité est corrigée).
- **Historique** : ajouter une note ; le Super admin peut modifier ou supprimer une ligne, ou les lignes filtrées.

## Contenus ciblés pour les étudiants

- **Chaque formation a un domaine** (Réseaux, Cybersécurité, Systèmes, Vidéosurveillance, Web, Cloud, Bureautique).
- **Académie → Publications ciblées** : annonces, cours, documents, vidéos et devoirs. Pour chacun, choisissez **qui le voit** :
  - tous les étudiants ;
  - un ou plusieurs **domaines** (ex. Cybersécurité : seuls les étudiants des formations en sécurité le voient) ;
  - une ou plusieurs **formations** ;
  - des **étudiants précis** ;
  - en option, uniquement **en ligne** ou uniquement **en présentiel**.
  Le formulaire indique en direct combien d’étudiants le verront. On peut aussi programmer la date de publication et épingler.
- **Leçons d’une formation** : « Visible pour » (tous, en ligne, présentiel, étudiants choisis) et « Disponible à partir du » (la leçon apparaît verrouillée 🔒 jusqu’à cette date).
- Côté étudiant : onglet **Annonces et ressources** avec le nombre de nouveautés, vidéos intégrées, dépôt des devoirs. Côté admin : 👁 pour voir qui a lu, qui a rendu, et noter les devoirs (la note compte dans la moyenne).

## Espace étudiant

- **Menu** : Tableau de bord · Mes cours · Quiz et tests · Devoirs et TP · Documents et vidéos · Annonces · Notes et présences · Attestation · Mon compte · Aide. Les pastilles jaunes indiquent ce qui reste à faire.
- **Tableau de bord** : bouton « Continuer » vers la prochaine leçon, chiffres clés, anneaux (leçons, présence, moyenne), graphique des notes, activité des 14 derniers jours, progression par module, liste « À faire » (devoirs, séances, annonces) et badges.
- **Assistant IA** : il répond directement, sans renvoyer vers Google. Il rassemble la réponse trouvée dans les cours, une explication de Wikipédia (français, sinon anglais) et la réponse acceptée d’un expert sur Stack Exchange (Network Engineering, Super User, Server Fault, Security), puis cite ses sources. Pour des réponses rédigées par une IA générative, renseignez `window.NG_IA_URL` (service à mettre en place côté serveur).
- **Sécurité des connexions** : après 5 mots de passe faux, **seul le compte concerné** est bloqué 15 minutes ; le compteur se remet à zéro à la connexion suivante réussie. L’administrateur peut débloquer un étudiant (bouton 🔓 dans Comptes étudiants).

## Cours, fichiers et comptes

- **Image d’affichage** d’une formation : Formations et cours → Modifier → « Choisir une image ». Elle apparaît sur le site, dans l’espace étudiant et dans l’administration.
- **Contenu du cours** : pour chaque leçon, ✎ modifier, ↑ ↓ réordonner, 🗑 supprimer ; ✎ renommer un module. Types : PDF, tuto vidéo, document, leçon écrite, quiz, TP, **document en ligne** (lien Google Drive ou PDF, affiché dans la page).
- **Fichiers** : ceux de moins de 700 Ko (PDF, images) sont envoyés en ligne (collection Firestore `nextgenit_fichiers`, règle incluse dans `firestore.rules`) et visibles sur tous les appareils. Pour les vidéos et gros PDF, utilisez YouTube ou Google Drive.
- **Comptes étudiants et clients** : bouton ⚙ → Suspendre (avec date de fin facultative), Désactiver, Réactiver ou Supprimer, toujours avec un **motif** et un commentaire ; la personne peut être prévenue sur WhatsApp. La personne voit le motif à la connexion ; la suspension se lève seule à la date prévue. Les comptes supprimés sont gardés dans l’historique (collection `comptes_supprimes`).
- **Tickets** : 🗑 dans la liste ou dans la fenêtre du ticket, avec la raison notée dans l’historique.

## Nouveautés : badges, sécurité et assistant IA

- **Badge → QR code** : le QR code est un **lien direct** vers `verification.html`. Scanné avec l’appareil photo d’un téléphone, il ouvre la page qui affiche **« Ce technicien … est bien de NextGenIT »** avec le nom, la fonction, l’ID et la photo. Un agent créé dans l’administration est reconnu dès que ses données sont en ligne (Firebase). Si la base ne répond pas, la page affiche les informations du badge et demande d’appeler NextGenIT.
- **Documents** : la signature et le sceau passent derrière le texte (nom du directeur toujours lisible).
- **Mot de passe oublié** (clients et étudiants) : la demande arrive dans l’administration (alerte + Notifications) ; un clic génère un nouveau mot de passe à envoyer sur WhatsApp ou par email.
- **Déconnexion automatique** de l’administration après 30 minutes sans activité.
- **Sauvegarde** (Paramètres, Super admin) : télécharger toutes les données en un fichier, ou restaurer une sauvegarde.
- **robots.txt et sitemap.xml** pour le référencement (l’administration n’est pas indexée).
- **Téléphone** : sections en carrousels à faire glisser, domaines en grille compacte, boutons flottants allégés.
- **Assistant IA** : cours + Wikipédia + **DuckDuckGo** + Stack Exchange, et **Google** si vous ajoutez une clé gratuite dans `firebase-config.js` (`window.NG_GOOGLE`, 100 recherches par jour).

## Thèmes, attestations, import de cours

- **Thèmes** (Administration → Apparence, appliqués aussi au site public) : NextGen Pro (bleu marine et or), Pro Océan, Pro Émeraude, Pro Bordeaux, Pro Violet, Pro Graphite, **Pro Nuit (mode sombre)**, plus les anciens thèmes. Polices et tailles de texte au choix.
- **Attestations** : elles n’apparaissent chez l’étudiant **qu’après autorisation** (Présences et évaluations → Fréquentation et attestations → ✅ Autoriser). Une notification signale les étudiants qui ont terminé et remplissent les conditions. L’étudiant voit « En validation » en attendant. L’autorisation peut être retirée.
- **Importer des PDF et tutos** : dans Contenu du cours, « 📎 Importer PDF / tutos » sur un module : chaque fichier devient une leçon (titre tiré du nom du fichier). Les publications ciblées acceptent aussi un fichier joint.
- **Badge** : signature et sceau en filigrane derrière le texte ; les couleurs (bandeau bleu) sont gardées à l’impression (activez « Graphiques d’arrière-plan » si votre navigateur le demande).
- **Retour** sur les factures, badges et documents : revient à la page précédente ou ferme l’onglet ouvert depuis l’administration.
- **Comptes de démonstration supprimés** : plus de bouton « compte de démonstration ». Le compte administrateur d’installation reste `admin@nextgenit.com` / `NextGenIT@2026` : une alerte rouge demande de changer ce mot de passe tant qu’il n’est pas modifié.

## Nouvelles fonctionnalités

- **Fiche de fréquentation** : comme l’attestation, elle n’apparaît chez l’étudiant qu’après publication par l’admin (Présences et évaluations → Fréquentation et attestations → « 📋 Publier la fiche »).
- **Menu mobile** : le bouton ☰ ouvre un tiroir à gauche (navigation, espaces, devis, WhatsApp).
- **Espace technicien** (`technicien.html`, à ajouter à l’écran d’accueil du téléphone) : connexion avec le numéro de badge et un code personnel (Personnel et RH → « 📱 Activer l’accès »). Interventions du jour, étapes En route / Sur site / Terminé, appel, WhatsApp, itinéraire Google Maps, photos avant/après, rapport signé par le client sur l’écran, tickets assignés, statut du technicien.
- **Calendrier partagé** (Opérations) : semaine ou mois, interventions, séances, projets et échéances, filtre par technicien.
- **Devis signé en ligne** : le client signe au doigt dans son espace (« Bon pour accord ») ; la signature, le nom et l’heure apparaissent sur le devis PDF.
- **Paiement déclaré par le client** : « ✅ J’ai payé » (mode, référence) dans l’espace client ; l’admin vérifie et confirme (Paiements → Déclarés par les clients) : le reçu est créé automatiquement. Bouton « Payer par carte » si un lien de paiement est renseigné.
- **Satisfaction** : le client note chaque ticket résolu et chaque intervention terminée (1 à 5 étoiles) ; moyenne et classement des techniciens au tableau de bord ; alerte sur les avis de 2 étoiles ou moins.
- **Rappels du jour** (Notifications) : factures échues, échéances, renouvellements, interventions et séances du lendemain, préparés automatiquement ; un clic pour envoyer. Pour un envoi sans clic, renseignez `window.NG_RAPPELS_URL` (service relié à WhatsApp Business ou à un fournisseur de SMS).
- **Sauvegarde automatique** chaque semaine (Super admin), téléchargeable dans Paramètres.
- **Sécurité** : `firestore.rules.production` (interdit les suppressions et les contenus anormaux) + restriction de la clé API à vos domaines et Firebase App Check (voir le fichier).

## Page Actualités (site public)

- Nouvelle page **`actualites.html`** (menu « Actualités », pied de page, bouton « Toutes les actualités » sur l’accueil) : toutes les actualités publiées, l’article épinglé « À la une », recherche, filtres par catégorie, « Voir plus ».
- Chaque actualité a sa page (`actualites.html?id=…`) : image, article complet, temps de lecture, partage WhatsApp / Facebook / LinkedIn / copier le lien, « À lire aussi ».
- Dans l’administration (Site public → Actualités) : titre, catégorie, résumé, **article complet**, **image**, épinglage, publier/retirer, nombre de lectures.

## Langues (français, anglais, swahili)

- Fichier `langue.js` : sélecteur **FR · EN · SW** dans l’en-tête et le menu ☰. Première visite : anglais si l’appareil est en anglais, sinon français. Lien direct possible : `index.html?lang=en`.
- Traduits : toutes les pages publiques, l’espace client, les dates et les compteurs. L’administration reste en français ; l’espace étudiant est partiellement traduit.
- **Langue de chaque entreprise** : le client la choisit dans Mon compte, ou l’admin la fixe dans la fiche du compte client. Son espace et ses **devis, factures et reçus** s’affichent dans cette langue.
- Pour corriger ou ajouter une traduction : modifier le dictionnaire au début de `langue.js` (phrase française → [anglais, swahili]).

## Autres nouveautés

- **Réalisations** (`realisations.html` + admin Commercial → Réalisations) : photos avant/après, résultat, témoignage ; création depuis un rapport d’intervention ; 3 chantiers sur l’accueil.
- **Avis clients** (admin Commercial → Avis clients) : publier les meilleurs avis sur l’accueil.
- **Simulateur de budget** sur la page Devis ; prix modifiables dans Paramètres.
- **Newsletter** : inscription en bas de chaque page ; admin → Newsletter pour envoyer une actualité.
- **Contrats de maintenance** : visites préventives planifiées automatiquement chaque mois, heures consommées / incluses.
- **Parc des clients** (Opérations) : matériel et licences, alertes 30 jours avant la fin de garantie ; onglet « Mon parc informatique » chez le client.
- **Supervision en ligne** (Opérations) : témoin vert/rouge, ticket critique créé automatiquement en cas de panne (vérification toutes les 5 minutes tant que l’administration est ouverte).
- **Véhicules et carburant** (Opérations) : pleins enregistrés comme dépenses, consommation, échéances d’assurance et de contrôle technique.
- **Examen chronométré** (type de leçon) : questions tirées au hasard, minuteur, envoi automatique, tentatives limitées.
- **Classes virtuelles** : lien Meet/Zoom sur la séance ; « Rejoindre la classe » note la présence.
- **Certificat LinkedIn** : « Ajouter à mon profil LinkedIn » et « Partager ma réussite » sur l’attestation autorisée.

## Nouvelle identité visuelle et nouveaux menus

- **Logos** dans `assets/img/` : `embleme.png` (icône hexagone), `logo.png` (logo complet, documents), `logo-sombre.png` (pied de page), `favicon.png`.
- **Couleurs du logo** appliquées au thème par défaut « NextGen Pro » : bleu nuit `#081631`, bleu → cyan `#2563EB → #22D3EE`, cuivre `#EFB470 → #B5552A`. Détails dans `marque.css` (motif d’hexagones, titres soulignés bleu/cuivre, boutons cuivre).
- **Menu principal avec sous-menus** : Services ▾ (8 rubriques), Formations, Réalisations, Ressources ▾ (Actualités, Centre d’aide, Vérifier un badge), L’entreprise ▾ (À propos, Carrières, Contact), Contact.
- **Nouvelles pages** : `contact.html` (formulaire, coordonnées, carte, urgence), `carrieres.html` (offres d’emploi, candidature avec CV), `support.html` (centre d’aide : recherche, guides, suivi de ticket, état des services).
- **Nouveaux menus d’administration** : Messages reçus, Recrutement (offres et candidatures), Centre d’aide (articles). Alertes en direct et notifications pour les messages et candidatures. Supervision : case « afficher sur le site ».

## Prix privés et nouvelles fonctionnalités

- **Aucun prix public** : la page Devis prépare la demande (type de projet, taille) sans afficher de montant ; le catalogue affiche « Prix sur demande » ; le prix est envoyé au client **en privé** dans son devis. Seuls les partenaires connectés voient leurs propres prix négociés, dans leur portail.
- **Prendre rendez-vous** (`rendez-vous.html`) : visite gratuite, audit, appel ou démonstration ; créneaux libres seulement ; admin → Rendez-vous → ✅ Confirmer crée l’intervention (calendrier) et prépare le message WhatsApp.
- **Chat en direct** : dans l’assistant du site, « Parler à un humain » ouvre une conversation ; admin → Chat en direct (réponses rapides, transformation en demande de devis). Les réponses arrivent en direct chez le visiteur (Firebase).
- **Catalogue de matériel** (`catalogue.html`) : articles cochés « Afficher au catalogue » dans Stock ; le visiteur compose sa demande de prix → demande de devis avec les lignes, à chiffrer dans l’admin.
- **Portail partenaires** (`partenaire.html`) : admin → Partenaires (remise %, commission %, « 🔑 Accès au portail ») ; le partenaire voit ses prix, commande, recommande des clients et suit ses commissions.
- **Parrainage** : onglet de l’espace client ; admin → Parrainages (statut et avantage accordé, en privé).
- **Rapport mensuel** des contrats : `document.html?type=rapportmensuel&ab=…&mois=AAAA-MM` (bouton 📊 dans les abonnements, onglet « Rapports mensuels » chez le client) : interventions, tickets, heures, disponibilité, recommandations.
- **Études de cas** : champs contexte, défis, chiffres clés dans Réalisations ; bouton « Télécharger l’étude de cas (PDF) » sur le site.
- **Application installable** : `app.js`, `sw.js` (toujours la version en ligne d’abord, copie locale seulement hors connexion), icônes `app-192.png` / `app-512.png`, raccourcis vers les espaces ; bouton « 📲 Installer l’application » ; notifications de l’espace client (tickets, devis, factures).

## Design aux couleurs du logo (`design.css`)

Thème « NextGen Pro » du site public : fond ivoire chaud, titres bleu nuit `#0B1F44` (texte du logo), boutons principaux **cuivre** `#EFB470 → #B5552A` (hexagone et « IT »), icônes en dégradé **bleu → cyan** `#2563EB → #22D3EE` (le « N »). Sections bleu nuit en alternance (Pourquoi nous, Méthode, Espace client) avec motif d’hexagones, surtitres cuivre au-dessus des titres, menu souligné cuivre, cartes blanches qui se soulèvent au survol. L’administration garde son propre style.

## Design de l’administration (`admin-design.css`)

Barre latérale bleu nuit pleine hauteur (élément actif souligné cuivre), barre du haut blanche épurée (Aperçu du site, Voir le site, profil, déconnexion en icône), un seul système de boutons (cuivre = action principale, contour = secondaire), indicateurs et cartes blancs sobres, onglets en contrôle segmenté, tableaux à en-tête clair, fenêtres avec liseré bleu → cuivre. Les boutons flottants en bas d’écran sont remplacés par la barre du haut.
