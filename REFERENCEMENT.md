# Référencement local — Gironde

Mise à jour du 17 novembre 2026.

## Page et intention

Page principale pour la recherche « location vaisselle Gironde » :
https://www.alternative-location.fr/location-vaisselle-gironde

La page présente le service réel, les assiettes, verres et couverts, les formules,
les conditions de réservation et de restitution. Les formules, compositions et
tarifs proviennent des articles actifs du catalogue, sans prix dupliqués dans le
code. Les disponibilités sont confirmées lors du devis.

Retrait et retour exclusivement au 14 impasse Moustron, 33133 Galgon, aux horaires
convenus. Les mentions des villes girondines décrivent le lieu des événements des
clients, sans annoncer de livraison ni d’agence dans ces villes.

## Changements techniques

- Lien dans les menus, le pied de page et un bloc visible de l’accueil.
- Titres, descriptions, URL canoniques et aperçus sociaux propres aux pages
  publiques et aux catégories du catalogue.
- Suppression de la canonique de l’accueil héritée par les autres pages.
- URL de production alignées sur le domaine final avec www, tout en conservant
  les origines locales lors du développement.
- Données structurées LocalBusiness, Service, WebPage et BreadcrumbList avec
  l’adresse réelle à Galgon ; aucune note ni aucun avis inventé.
- Sitemap incluant la page dédiée et les catégories contenant des articles actifs,
  sans dates de modification artificielles. Robots.txt conserve leur exploration.
- Pages de connexion, administration et devis privés déclarées noindex. Les
  protections d’accès existantes restent en place.

## Vérifications

- Build de production Next.js et TypeScript réussis avec
  `node scripts/run-next-with-project-env.js build` ; schéma Prisma inchangé.
- ESLint réussi sur les fichiers TypeScript modifiés.
- Réponses HTTP et HTML serveur vérifiées : titres, canoniques, H1, JSON-LD,
  quatre formules et prix, 19 URL du sitemap, noindex des pages privées.
- Les 11 champs du formulaire de contact sont présents ; les composants de
  sélection du catalogue et du formulaire n’ont pas été modifiés.
- Logique du catalogue serveur et de l’authentification de l’administration
  comparée à la version précédente ; redirection vers la connexion conservée.
- Menu vérifié dans un DOM simulé : liens existants, nouveau lien, ouverture à
  largeur tablette, fermeture avec Échap, focus et restauration du défilement.
- Le contrôle visuel via le navigateur automatisé n’était pas disponible dans
  cette session ; les vérifications ci-dessus ne constituent pas une capture
  visuelle de chaque format d’écran.

## Search Console après publication

1. Inspecter l’URL publique de la nouvelle page, tester l’URL active, puis demander
   son indexation.
2. Envoyer ou vérifier le sitemap :
   https://www.alternative-location.fr/sitemap.xml
3. Suivre les impressions et clics sur cette page, les requêtes contenant
   « location », « vaisselle », « Gironde » et les demandes de devis reçues.

La demande d’indexation et la fiche Google Business Profile ne sont pas effectuées
par ce changement de code. L’indexation et la position sont décidées par Google ;
aucune première place ni date de classement n’est garantie.
