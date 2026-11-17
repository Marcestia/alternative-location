import { publicPageMetadata } from "@/lib/seo";

import GalleryMasonry from "@/components/GalleryMasonry";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { sampleGalleryItems, type GalleryMediaView } from "@/lib/gallery";

export const metadata = publicPageMetadata({
  title: "Tables et décoration de réception en Gironde | Alternative Location",
  description:
    "Découvrez en photos et vidéos nos tables, décorations et ambiances pour vos mariages et fêtes en Gironde. Matériel à retirer à Galgon.",
  path: "/galerie",
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function GaleriePage() {
  const items = await prisma.galleryMedia.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const displayItems: GalleryMediaView[] =
    items.length > 0
      ? items.map((item) => ({
          id: item.id,
          title: item.title,
          subtitle: item.subtitle,
          type: item.type,
          mediaUrl: item.mediaUrl,
          posterUrl: item.posterUrl,
          sortOrder: item.sortOrder,
          sectionId: item.sectionId,
          sectionName: null,
        }))
      : sampleGalleryItems;

  return (
    <main className="gallery-page site-container">
      <section>
        <div className="gallery-page-intro">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow">LA GALERIE — PHOTOS & VIDÉOS</p>
              <h1 className="mt-3 text-4xl font-semibold leading-[0.96] sm:text-5xl">
                Un peu d’inspiration.
                <br />
                <em>Beaucoup d’émotions.</em>
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-black/8 bg-[color:var(--surface)] px-4 py-2 text-sm font-medium text-[color:var(--muted)]">
                {displayItems.length} média{displayItems.length > 1 ? "s" : ""}
              </div>
              <Link href="/#contact" className="button button-primary">
                Demander un devis
              </Link>
            </div>
          </div>
          <p>
            Tables dressées, objets choisis et jolies ambiances. Parcourez nos
            mises en scène et ouvrez chaque photo ou vidéo pour la découvrir en
            grand.
          </p>

          {items.length === 0 ? (
            <div className="mt-6 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Aperçu de démonstration. Ajoutez vos propres photos ou vidéos
              depuis les paramètres admin.
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-7xl">
        <GalleryMasonry items={displayItems} />
      </section>
    </main>
  );
}
