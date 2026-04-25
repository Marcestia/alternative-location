export type GallerySectionView = {
  id: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  active: boolean;
  sortOrder: number;
};

export type GalleryMediaView = {
  id: string;
  title: string;
  subtitle: string | null;
  type: "IMAGE" | "VIDEO";
  mediaUrl: string;
  posterUrl: string | null;
  active?: boolean;
  sortOrder: number;
  sectionId: string | null;
  sectionName: string | null;
};

export const sampleGallerySections: GallerySectionView[] = [
  {
    id: "sample-romance",
    name: "Romance",
    description: "Tons clairs, fleurs et tables lumineuses.",
    coverImageUrl: "/vitrine/hero.jpg",
    active: true,
    sortOrder: 0,
  },
  {
    id: "sample-tables",
    name: "Tables",
    description: "Dressages, vaisselle et détails de réception.",
    coverImageUrl: "/vitrine/vaisselle.jpg",
    active: true,
    sortOrder: 1,
  },
  {
    id: "sample-ambiance",
    name: "Ambiance",
    description: "Lumières, volume et atmosphère générale.",
    coverImageUrl: "/vitrine/ambiance.jpg",
    active: true,
    sortOrder: 2,
  },
];

export const sampleGalleryItems: GalleryMediaView[] = [
  {
    id: "sample-hero",
    title: "Romantic Rose",
    subtitle: "Réception romantique aux tons clairs et détails floraux.",
    type: "IMAGE",
    mediaUrl: "/vitrine/hero.jpg",
    posterUrl: null,
    sortOrder: 0,
    sectionId: "sample-romance",
    sectionName: "Romance",
  },
  {
    id: "sample-decoration",
    title: "Boho Chic",
    subtitle: "Textures naturelles, vases et détails décoratifs doux.",
    type: "IMAGE",
    mediaUrl: "/vitrine/decoration.jpg",
    posterUrl: null,
    sortOrder: 1,
    sectionId: "sample-romance",
    sectionName: "Romance",
  },
  {
    id: "sample-mobilier",
    title: "Garden Reception",
    subtitle: "Mobilier de réception et implantation soignée en extérieur.",
    type: "IMAGE",
    mediaUrl: "/vitrine/mobilier.jpg",
    posterUrl: null,
    sortOrder: 2,
    sectionId: "sample-ambiance",
    sectionName: "Ambiance",
  },
  {
    id: "sample-vaisselle",
    title: "Timeless Table",
    subtitle: "Dressage sobre et harmonieux pour une table élégante.",
    type: "IMAGE",
    mediaUrl: "/vitrine/vaisselle.jpg",
    posterUrl: null,
    sortOrder: 3,
    sectionId: "sample-tables",
    sectionName: "Tables",
  },
  {
    id: "sample-ambiance",
    title: "Golden Lights",
    subtitle: "Ambiance lumineuse et matériel décoratif pour la soirée.",
    type: "IMAGE",
    mediaUrl: "/vitrine/ambiance.jpg",
    posterUrl: null,
    sortOrder: 4,
    sectionId: "sample-ambiance",
    sectionName: "Ambiance",
  },
  {
    id: "sample-electro",
    title: "Reception Service",
    subtitle: "Équipements utiles pour le confort et le rythme du service.",
    type: "IMAGE",
    mediaUrl: "/vitrine/electromenager.jpg",
    posterUrl: null,
    sortOrder: 5,
    sectionId: "sample-tables",
    sectionName: "Tables",
  },
];

export const getGalleryLabel = (item: GalleryMediaView) => {
  if (item.type === "VIDEO") return "Vidéo";
  if (item.sectionName) return item.sectionName;
  if (item.subtitle) {
    const shortLabel = item.subtitle.split(/[,.]/)[0]?.trim();
    if (shortLabel && shortLabel.length <= 38) return shortLabel;
  }
  return "Ambiance";
};

export const getGalleryPreviewUrl = (item: GalleryMediaView) =>
  item.type === "IMAGE" ? item.mediaUrl : item.posterUrl || "";

export const isDirectVideoUrl = (url: string) =>
  /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url);

export const toVideoEmbedUrl = (url: string) => {
  const youtubeMatch =
    url.match(/youtube\.com\/watch\?v=([^&]+)/i) ||
    url.match(/youtu\.be\/([^?&]+)/i) ||
    url.match(/youtube\.com\/shorts\/([^?&]+)/i);

  if (youtubeMatch?.[1]) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }

  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/i);
  if (vimeoMatch?.[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return null;
};
