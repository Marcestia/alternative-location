# Refonte visuelle — Alternative Location

## Présentation

Direction douce et contemporaine : crème, terre cuite, bleu grisé et sauge, titres Nunito Sans aux formes arrondies et texte DM Sans. La composition asymétrique et les photos réelles du catalogue sont conservées, avec des cadrages arrondis, des boutons en pilule et des mouvements plus discrets. L’accueil, le catalogue, la galerie, la connexion et le cadre de l’administration utilisent cette identité.

Espacements resserrés entre les sections, hauteur de l’accueil rééquilibrée et accès directs aux trois univers. La galerie adopte une mosaïque adaptée au nombre de médias, avec une composition plus compacte sur mobile. Les coordonnées restent visibles pendant le défilement du formulaire sur ordinateur.

## Interactions et animations

- Trois ambiances dans l’accueil : Guinguette, Réception et Dancefloor. Le choix change la photographie, la légende et la palette de la scène.
- Fondu entre les trois photographies, léger mouvement de zoom, sélection d’ambiance avec curseur coulissant, bouton magnétique et éléments flottants.
- Prévisualisation des univers au survol et au clavier, avec accès direct aux catégories conservé.
- Formules accessibles par boutons, flèches du clavier et glissement. Lecture automatique et pause/reprise conservées.
- Apparitions en cascade, dévoilement progressif des photos, parallaxe légère, repères de progression au défilement et survol des photos en perspective.
- Ouverture et fermeture progressives des accordéons, avec prise en charge des clics rapides et maintien du comportement natif sans animation. Tous les textes restent consultables.
- Animations décoratives désactivées selon la préférence système de réduction des mouvements. Contenu visible sans JavaScript.

## Fonctionnalités conservées

| Parcours | Éléments conservés |
| --- | --- |
| Accueil | Univers issus de la base, accès aux catégories, formules Prestige, Épicure, Bistrot et Enfant, galerie dynamique et coordonnées. |
| Formules | Défilement automatique, choix direct et commandes précédent/suivant, lien vers la demande de devis. Ajout d’une commande pause/reprise et respect de la réduction des animations. |
| Catalogue | Catégories et sous-catégories, ouverture/repli des sections, fiches avec toutes les photos, agrandissement, tarifs, stocks, ajout/retrait des quantités, total, réinitialisation et récapitulatif mobile. |
| Sélection pour un devis | Mode de sélection lié à la date, conservation dans la session, retour au formulaire et reprise des articles dans la demande. Le réglage d’activation existant reste appliqué. |
| Contact | Nom, email, téléphone, adresse, type et lieu d’événement, invités, budget, date, message et sélection d’articles. Brouillon de session, captcha et messages de résultat conservés. |
| Informations | Horaires complets, retrait et retour, paiement, caution, Facebook, WhatsApp, Google Maps et conditions générales. Les horaires et informations pratiques s’ouvrent dans des volets. |
| Galerie | Photos, vidéos, agrandissement, navigation entre médias et aperçu de démonstration inchangés. |
| Devis | Liens par jeton, validation, signature, acceptation/refus, conditions et pages de résultat conservés. |
| Administration | Accueil, demandes, réservations, stock, clients, factures, performance, nettoyage, paramètres, badges, rafraîchissement et déconnexion. Accès aux rapports ajouté au menu existant. |
| Données et traitements | Actions serveur, API, schéma de base de données, emails, PDF, imports et exports conservés. |

## Vérifications

- TypeScript : `npx tsc --noEmit` validé.
- Compilation de production Next.js : `node scripts/run-next-with-project-env.js build` validé, avec toutes les routes existantes présentes dans le résultat. Le schéma Prisma n’a pas changé ; sa régénération via `npm run build` rencontre un verrou Windows sur la DLL utilisée par l’aperçu déjà ouvert.
- Tests de composants avec React et un DOM simulé : choix des trois ambiances, focus des univers, quatre formules, lecture automatique, pause/reprise, navigation circulaire, clavier, glissement et menu mobile.
- Tests des animations : révélation au défilement, parallaxe, survol magnétique, désactivation selon la préférence de réduction des mouvements et nettoyage des observateurs/écouteurs validés.
- Contrôles complémentaires : cascade des apparitions, progression des sections, survol des photos, curseur d’ambiance, état des trois visuels et ouvertures/fermetures d’accordéons validés dans un DOM simulé, y compris le repli sans animation et le nettoyage.
- Comparaison avec la version Git initiale : logique du panier et du formulaire identique, tous les champs nommés et toutes les entrées du menu d’administration conservés.
- Réponses HTTP 200 et rendu serveur vérifiés pour les cinq pages publiques principales et les dix pages d’administration, avec authentification pour ces dernières.
- Présence vérifiée des onze champs du formulaire et des sections de l’accueil.
- Aucun formulaire de contact, envoi d’email, signature ou changement de données effectué pendant ces contrôles.
- Le contrôle visuel interactif sur ordinateur et mobile reste à effectuer : l’outil de contrôle s’est arrêté car il ne pouvait pas vérifier l’URL du navigateur avec suffisamment de certitude.

Pour ouvrir la version locale : `npm run dev`, puis l’adresse affichée par Next.js, normalement `http://localhost:3000`.
