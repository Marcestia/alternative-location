import type { CategoryGroup } from "@/generated/prisma";

export const CATEGORY_GROUP_ORDER: CategoryGroup[] = [
  "AMBIANCE_SON",
  "MATERIEL_SERVICE",
  "DECORATION",
];

export const CATEGORY_GROUP_META: Record<
  CategoryGroup,
  {
    label: string;
    slug: string;
    description: string;
  }
> = {
  AMBIANCE_SON: {
    label: "Ambiance et son",
    slug: "ambiance-son",
    description:
      "Jeux, sonorisation, lumières et projecteurs pour animer vos événements.",
  },
  MATERIEL_SERVICE: {
    label: "Matériel de service",
    slug: "materiel-service",
    description:
      "Matériel de table, réception et équipements électriques pour le service.",
  },
  DECORATION: {
    label: "Décoration",
    slug: "decoration",
    description:
      "Univers décoratifs, linge, vases, arches et accessoires de mise en scène.",
  },
};

export const DEFAULT_CATEGORY_STRUCTURE: Array<{
  name: string;
  group: CategoryGroup;
  sortOrder: number;
}> = [
  { name: "Jeux", group: "AMBIANCE_SON", sortOrder: 10 },
  { name: "Sonorisation", group: "AMBIANCE_SON", sortOrder: 20 },
  { name: "Lumières et projecteur", group: "AMBIANCE_SON", sortOrder: 30 },
  { name: "Matériel de table", group: "MATERIEL_SERVICE", sortOrder: 40 },
  { name: "Réception", group: "MATERIEL_SERVICE", sortOrder: 50 },
  { name: "Électrique matériel", group: "MATERIEL_SERVICE", sortOrder: 60 },
  { name: "Lanternes et lumières", group: "DECORATION", sortOrder: 70 },
  { name: "Linge de table et chaise", group: "DECORATION", sortOrder: 80 },
  { name: "Photophores et chandelier", group: "DECORATION", sortOrder: 90 },
  { name: "Vases et soliflores", group: "DECORATION", sortOrder: 100 },
  { name: "Arches", group: "DECORATION", sortOrder: 110 },
  { name: "Divers déco", group: "DECORATION", sortOrder: 120 },
  { name: "Décoration vintage", group: "DECORATION", sortOrder: 130 },
];

export function getCategoryGroupMeta(group: CategoryGroup) {
  return CATEGORY_GROUP_META[group];
}
