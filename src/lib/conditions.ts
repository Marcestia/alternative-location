export const CG_VERSION = "2026-03-19";

type ConditionSection = {
  title: string;
  intro?: string;
  bullets: string[];
};

export const CONDITIONS_SECTIONS: ConditionSection[] = [
  {
    title: "1. Réservation et paiement",
    intro:
      "Le devis indique le détail de la prestation, le prix et la période de location. Sa signature vaut acceptation expresse des CG.",
    bullets: [
      "Un acompte de 30 % est exigible pour valider la réservation. À défaut, la réservation n'est pas confirmée.",
      "La signature du devis vaut engagement de versement de l'acompte sous 7 jours.",
      "Le prix de la location correspond au montant indiqué sur le devis, hors frais de livraison à la charge du Locataire.",
      "Le règlement total et la caution sont exigibles lors de la remise du matériel.",
      "La location est effective contre dépôt de caution (montant indiqué sur le devis).",
      "La caution est restituée après retour et contrôle du matériel, sous réserve d'absence de dégradation, de casse ou de manquant.",
      "La location est due, qu'elle soit utilisée ou non.",
    ],
  },
  {
    title: "2. Retrait, retour et livraison",
    bullets: [
      "La location est prévue du vendredi au lundi, aux horaires convenus lors de la réservation.",
      "La société est fermée le dimanche (en cas d'impossibilité, un accord préalable est requis).",
      "Le retrait et le retour du matériel s'effectuent exclusivement à l'adresse de la société.",
      "La livraison est possible dans la limite de 80 km, au tarif de 1 EUR / km ; au-delà, un accord préalable est requis.",
      "Tout retard donne lieu à une pénalité de 25 %.",
    ],
  },
  {
    title: "3. Annulation",
    bullets: [
      "En cas d'annulation à moins de 72 heures, aucun remboursement n'est effectué.",
      "Un avoir pourra être octroyé, valable 1 an.",
    ],
  },
  {
    title: "4. Responsabilité et usage",
    bullets: [
      "Le matériel loué demeure la propriété du Loueur.",
      "Le Locataire s'interdit de sous-louer, revendre ou céder le matériel, en tout ou partie.",
      "Le Locataire est responsable du matériel dès la remise et jusqu'à sa restitution.",
    ],
  },
  {
    title: "5. Restitution du matériel (mode d'emploi)",
    intro:
      "Le Locataire s'engage à restituer le matériel dans l'état et les conditions suivantes.",
    bullets: [
      "La vaisselle est restituée rincée, sans déchets alimentaires, dans son emballage d'origine.",
      "Les verres sont restitués vides, dans leurs cartons ou casiers, têtes en haut.",
      "Les lumières et la sono sont restituées dans leur emballage d'origine.",
      "La décoration est restituée dans son emballage d'origine.",
      "Tables, bancs, mange-debout, percolateur, etc. sont restitués nettoyés et en état d'origine.",
      "Les clous sur le mobilier sont interdits.",
      "Pour les nappes et textiles loués, l'usage de cierges magiques, bougies, chandelles et de toute source de chaleur directe est fortement déconseillé.",
      "La cire de bougie, les brûlures, les trous, les taches tenaces ou toute dégradation irréversible sur les nappes et textiles loués peuvent entraîner une retenue partielle ou totale de la caution.",
      "Les feutres, stylos, marqueurs et tout autre produit d'écriture ne doivent pas être utilisés directement sur les nappes ou autres textiles loués, y compris les produits dits lavables.",
      "Tout emballage ou caisse détérioré(e) ou cassé(e) sera facturé(e).",
      "Tout matériel cassé, manquant ou endommagé sera facturé au tarif perte ou casse.",
      "En cas d'abus constatés, une pénalité pourra être appliquée.",
    ],
  },
  {
    title: "6. Acceptation des conditions générales",
    bullets: [
      "Le Locataire reconnaît avoir pris connaissance des présentes CG et les accepter sans réserve.",
      "La signature du devis vaut acceptation expresse des CG.",
    ],
  },
];
