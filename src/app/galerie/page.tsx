import type { Metadata } from "next";
import GalleryMasonry from "@/components/GalleryMasonry";
import { prisma } from "@/lib/prisma";
import { sampleGalleryItems, type GalleryMediaView } from "@/lib/gallery";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Galerie | Alternative Location",
  description:
    "Une galerie simple de photos et vidéos pour découvrir les mises en scène, tables et ambiances d'Alternative Location.",
  alternates: {
    canonical: "/galerie",
  },
};

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
    <main className="min-h-screen bg-[linear-gradient(180deg,#f6f0e9_0%,#faf7f3_18%,#ffffff_100%)] px-4 py-6 text-[color:var(--ink)] sm:px-6 lg:px-10">
      <section className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-[26px] border border-black/5 bg-white/92 p-6 shadow-[0_30px_70px_rgba(30,25,20,0.1)] sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.34em] text-[color:var(--accent-2)]">
                Galerie
              </p>
              <h1 className="mt-3 text-4xl font-semibold leading-[0.96] sm:text-5xl">
                Les mises en scène en images
              </h1>
              <p className="mt-4 text-sm leading-7 text-[color:var(--muted)] sm:text-base">
                Une galerie simple, visuelle et directe pour parcourir les ambiances, les tables et les détails tels qu&apos;ils sont réellement mis en place.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-black/8 bg-[color:var(--surface)] px-4 py-2 text-sm font-medium text-[color:var(--muted)]">
                {displayItems.length} média{displayItems.length > 1 ? "s" : ""}
              </div>
              <a
                href="/#contact"
                className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(216,111,63,0.22)] transition hover:-translate-y-0.5"
              >
                Demander un devis
              </a>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="mt-6 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Aperçu de démonstration. Ajoutez vos propres photos ou vidéos depuis les paramètres admin.
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
