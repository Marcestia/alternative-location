import type { Metadata } from "next";
import GalleryMasonry from "@/components/GalleryMasonry";
import { prisma } from "@/lib/prisma";
import {
  getGalleryPreviewUrl,
  sampleGalleryItems,
  sampleGallerySections,
  type GalleryMediaView,
} from "@/lib/gallery";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Galerie | Alternative Location",
  description:
    "Galerie d'ambiances, de mises en scene et d'inspirations pour mariages, receptions et evenements.",
  alternates: {
    canonical: "/galerie",
  },
};

export default async function GaleriePage() {
  const [sections, items] = await Promise.all([
    prisma.gallerySection.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.galleryMedia.findMany({
      where: { active: true },
      include: { section: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const displaySections = sections.length > 0 ? sections : sampleGallerySections;
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
          sectionName: item.section?.name ?? null,
        }))
      : sampleGalleryItems;

  const heroItems = displayItems
    .slice(0, 4)
    .filter((item) => getGalleryPreviewUrl(item));

  const groupedSections = displaySections
    .map((section) => ({
      ...section,
      items: displayItems.filter((item) => item.sectionId === section.id),
    }))
    .filter((section) => section.items.length > 0);

  const unsectionedItems = displayItems.filter((item) => !item.sectionId);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f6f0e9_0%,#faf7f3_18%,#ffffff_100%)] px-4 py-6 text-[color:var(--ink)] sm:px-6 lg:px-10">
      <section className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-[22px] border border-black/5 bg-white/92 shadow-[0_35px_90px_rgba(30,25,20,0.10)]">
          <div className="grid gap-0 lg:grid-cols-[0.72fr_1.28fr]">
            <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-10">
              <div>
                <p className="text-xs uppercase tracking-[0.36em] text-[color:var(--accent-2)]">
                  Galerie d&apos;ambiances
                </p>
                <h1 className="mt-4 max-w-[10ch] text-4xl font-semibold leading-[0.95] sm:text-5xl">
                  Des thèmes, puis les photos en grand format
                </h1>
                <p className="mt-5 max-w-md text-sm leading-7 text-[color:var(--muted)] sm:text-base">
                  Une galerie simple, visuelle et directe pour montrer les mises en
                  scène, les ambiances et les détails.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="/catalogue"
                  className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:-translate-y-0.5 hover:border-black/20"
                >
                  Voir le catalogue
                </a>
                <a
                  href="/#contact"
                  className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(216,111,63,0.24)] transition hover:-translate-y-0.5"
                >
                  Demander un devis
                </a>
              </div>

              {items.length === 0 ? (
                <div className="mt-6 rounded-[16px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Aperçu de démonstration. Ajoutez vos propres sections et médias
                  depuis les paramètres admin.
                </div>
              ) : null}
            </div>

            <div className="grid min-h-[340px] gap-3 bg-[linear-gradient(180deg,rgba(244,238,231,0.8),rgba(255,255,255,0.92))] p-4 sm:grid-cols-2 sm:p-5">
              {heroItems.map((item, index) => {
                const previewUrl = getGalleryPreviewUrl(item);
                const large = index === 0 || index === 3;

                return (
                  <div
                    key={item.id}
                    className={`overflow-hidden rounded-[18px] bg-[color:var(--surface)] shadow-[0_16px_35px_rgba(30,25,20,0.10)] ${
                      large ? "sm:row-span-2" : ""
                    }`}
                  >
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full min-h-[160px] items-center justify-center text-sm text-[color:var(--muted)]">
                        Apercu indisponible
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-7xl space-y-10">
        {groupedSections.map((section) => (
          <div key={section.id} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-black/10" />
              <p className="text-xs uppercase tracking-[0.36em] text-[color:var(--accent-2)]">
                {section.name}
              </p>
              <div className="h-px flex-1 bg-black/10" />
            </div>
            <GalleryMasonry items={section.items} />
          </div>
        ))}

        {unsectionedItems.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-black/10" />
              <p className="text-xs uppercase tracking-[0.36em] text-[color:var(--accent-2)]">
                Sélection libre
              </p>
              <div className="h-px flex-1 bg-black/10" />
            </div>
            <GalleryMasonry items={unsectionedItems} />
          </div>
        ) : null}
      </section>
    </main>
  );
}
