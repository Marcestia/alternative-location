import type { GalleryMedia } from "@/generated/prisma";

export type GalleryMediaView = Pick<
  GalleryMedia,
  "id" | "title" | "subtitle" | "type" | "mediaUrl" | "posterUrl" | "sortOrder"
>;

export const sampleGalleryItems: GalleryMediaView[] = [
  {
    id: "sample-hero",
    title: "Table de reception",
    subtitle:
      "Une ambiance claire et elegante pour les repas, brunchs et receptions.",
    type: "IMAGE",
    mediaUrl: "/vitrine/hero.jpg",
    posterUrl: null,
    sortOrder: 0,
  },
  {
    id: "sample-decoration",
    title: "Decoration et details",
    subtitle:
      "Vases, centres de table, compositions et accessoires de presentation.",
    type: "IMAGE",
    mediaUrl: "/vitrine/decoration.jpg",
    posterUrl: null,
    sortOrder: 1,
  },
  {
    id: "sample-mobilier",
    title: "Mobilier de reception",
    subtitle:
      "Tables, bancs et petit mobilier pour structurer votre evenement.",
    type: "IMAGE",
    mediaUrl: "/vitrine/mobilier.jpg",
    posterUrl: null,
    sortOrder: 2,
  },
  {
    id: "sample-vaisselle",
    title: "Vaisselle et dressage",
    subtitle:
      "Assiettes, verres et couverts pour une presentation propre et harmonieuse.",
    type: "IMAGE",
    mediaUrl: "/vitrine/vaisselle.jpg",
    posterUrl: null,
    sortOrder: 3,
  },
  {
    id: "sample-ambiance",
    title: "Ambiance et eclairage",
    subtitle:
      "Mise en scene lumineuse et materiel d'ambiance pour vos soirees.",
    type: "IMAGE",
    mediaUrl: "/vitrine/ambiance.jpg",
    posterUrl: null,
    sortOrder: 4,
  },
  {
    id: "sample-electro",
    title: "Materiel pratique",
    subtitle:
      "Electromenager et equipements utiles selon le format de votre reception.",
    type: "IMAGE",
    mediaUrl: "/vitrine/electromenager.jpg",
    posterUrl: null,
    sortOrder: 5,
  },
];

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
