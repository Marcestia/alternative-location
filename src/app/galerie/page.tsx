import type { Metadata } from "next";
import ImageLightbox from "@/components/ImageLightbox";
import { prisma } from "@/lib/prisma";
import {
  getGalleryPreviewUrl,
  isDirectVideoUrl,
  sampleGalleryItems,
  toVideoEmbedUrl,
} from "@/lib/gallery";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Galerie | Alternative Location",
  description:
    "Photos et videos de mise en scene, decoration, mobilier et ambiances pour evenements avec Alternative Location.",
  alternates: {
    canonical: "/galerie",
  },
};

function VideoCard({
  mediaUrl,
  posterUrl,
  title,
}: {
  mediaUrl: string;
  posterUrl: string | null;
  title: string;
}) {
  const embedUrl = toVideoEmbedUrl(mediaUrl);

  if (embedUrl) {
    return (
      <div className="aspect-video overflow-hidden rounded-[28px] bg-[color:var(--surface)]">
        <iframe
          src={embedUrl}
          title={title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="aspect-video overflow-hidden rounded-[28px] bg-[color:var(--surface)]">
      <video
        src={mediaUrl}
        poster={posterUrl || undefined}
        className="h-full w-full object-contain bg-black"
        controls
        playsInline
        preload="metadata"
      />
    </div>
  );
}

export default async function GaleriePage() {
  const items = await prisma.galleryMedia.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  const displayItems = items.length > 0 ? items : sampleGalleryItems;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f2ec_0%,#fbf8f4_18%,#ffffff_100%)] px-4 py-6 text-[color:var(--ink)] sm:px-6 lg:px-10">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-[36px] border border-black/5 bg-white/90 p-6 shadow-[0_30px_70px_rgba(30,25,20,0.08)] sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.34em] text-[color:var(--accent-2)]">
                Galerie
              </p>
              <h1 className="mt-3 text-3xl font-semibold sm:text-4xl lg:text-5xl">
                Une galerie visuelle sobre et editoriale
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[color:var(--muted)] sm:text-base">
                Parcourez les images de presentation, de mise en scene et
                d&apos;ambiance sans surcharger la lecture. Le but est simple :
                montrer le rendu.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
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
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-7xl">
        {items.length === 0 && (
          <div className="mb-5 rounded-[28px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            Apercu de demonstration. Ajoutez vos propres photos et videos depuis
            les parametres admin pour remplacer cette selection.
          </div>
        )}
        <div className="columns-1 gap-4 md:columns-2 xl:columns-3">
          {displayItems.map((item, index) => {
            const previewUrl = getGalleryPreviewUrl(item);
            const canShowVideoDirect =
              item.type === "VIDEO" && isDirectVideoUrl(item.mediaUrl);

            return (
              <article
                key={item.id}
                className="group relative mb-4 break-inside-avoid overflow-hidden rounded-[30px] border border-white/70 bg-white shadow-[0_24px_60px_rgba(30,25,20,0.08)]"
              >
                {item.type === "IMAGE" && previewUrl ? (
                  <ImageLightbox
                    src={item.mediaUrl}
                    alt={item.title}
                    className="w-full"
                    imgClassName="h-auto w-full object-contain bg-white"
                  />
                ) : item.type === "VIDEO" ? (
                  <div className="w-full p-3">
                    <VideoCard
                      mediaUrl={item.mediaUrl}
                      posterUrl={item.posterUrl}
                      title={item.title}
                    />
                  </div>
                ) : (
                  <div className="flex min-h-[280px] items-center justify-center bg-[color:var(--surface)] text-sm text-[color:var(--muted)]">
                    Apercu indisponible
                  </div>
                )}

                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent px-5 pb-5 pt-14">
                  <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white/92">
                        {item.title}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/25 bg-white/12 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white backdrop-blur">
                      {item.type === "VIDEO"
                        ? canShowVideoDirect
                          ? "Video"
                          : "Embed"
                        : "Photo"}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
