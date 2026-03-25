"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  getGalleryLabel,
  getGalleryPreviewUrl,
  isDirectVideoUrl,
  toVideoEmbedUrl,
  type GalleryMediaView,
} from "@/lib/gallery";

type GalleryMasonryProps = {
  items: GalleryMediaView[];
};

function GalleryModal({
  item,
  onClose,
}: {
  item: GalleryMediaView;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const embedUrl = item.type === "VIDEO" ? toVideoEmbedUrl(item.mediaUrl) : null;
  const previewUrl = getGalleryPreviewUrl(item);

  useEffect(() => {
    setMounted(true);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center bg-[rgba(16,12,9,0.82)] p-4 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/10 bg-[#0f0c0a] shadow-[0_35px_120px_rgba(0,0,0,0.45)]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-[color:var(--ink)] transition hover:bg-white"
        >
          Fermer
        </button>
        <div className="grid gap-0 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="min-h-[48vh] bg-black">
            {item.type === "IMAGE" && previewUrl ? (
              <img
                src={item.mediaUrl}
                alt={item.title}
                className="h-full max-h-[85vh] w-full object-contain"
              />
            ) : embedUrl ? (
              <iframe
                src={embedUrl}
                title={item.title}
                className="h-[48vh] w-full lg:h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={item.mediaUrl}
                poster={item.posterUrl || undefined}
                className="h-full max-h-[85vh] w-full object-contain"
                controls
                playsInline
                preload="metadata"
              />
            )}
          </div>
          <div className="flex flex-col justify-between gap-6 bg-[linear-gradient(180deg,#f7f2ec_0%,#fdfbf8_100%)] p-6 sm:p-8">
            <div>
              <p className="text-xs uppercase tracking-[0.34em] text-[color:var(--accent-2)]">
                {getGalleryLabel(item)}
              </p>
              <h2 className="mt-4 text-3xl font-semibold leading-tight text-[color:var(--ink)]">
                {item.title}
              </h2>
              {item.subtitle ? (
                <p className="mt-4 text-sm leading-7 text-[color:var(--muted)]">
                  {item.subtitle}
                </p>
              ) : (
                <p className="mt-4 text-sm leading-7 text-[color:var(--muted)]">
                  Une ambiance pensee pour mettre en valeur la table, la matiere
                  et la mise en scene de l&apos;evenement.
                </p>
              )}
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
                className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(216,111,63,0.24)] transition hover:-translate-y-0.5"
              >
                Demander un devis
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function GalleryMasonry({ items }: GalleryMasonryProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [visibleIds, setVisibleIds] = useState<Record<string, boolean>>({});

  const activeItem = useMemo(
    () => items.find((item) => item.id === activeId) ?? null,
    [activeId, items]
  );

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-gallery-card]"));
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.getAttribute("data-gallery-id");
          if (!id) return;
          setVisibleIds((current) =>
            current[id] ? current : { ...current, [id]: true }
          );
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.18,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [items]);

  return (
    <>
      <div className="columns-1 gap-5 md:columns-2 xl:columns-3 2xl:columns-4">
        {items.map((item, index) => {
          const previewUrl = getGalleryPreviewUrl(item);
          const isVisible = Boolean(visibleIds[item.id]);
          const label = getGalleryLabel(item);
          const isVideo = item.type === "VIDEO";
          const isEmbed = isVideo && !isDirectVideoUrl(item.mediaUrl);

          return (
            <article
              key={item.id}
              data-gallery-card
              data-gallery-id={item.id}
              className="mb-5 break-inside-avoid"
            >
              <button
                type="button"
                onClick={() => setActiveId(item.id)}
                className={`group relative w-full overflow-hidden rounded-[14px] border border-white/70 bg-white text-left shadow-[0_24px_60px_rgba(30,25,20,0.08)] transition duration-300 ${
                  isVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-10 opacity-0"
                }`}
                style={{
                  transitionDelay: `${Math.min(index * 55, 260)}ms`,
                }}
                aria-label={`Voir l'ambiance ${item.title}`}
              >
                <div className="relative overflow-hidden bg-[color:var(--surface)]">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={item.title}
                      className="h-auto w-full object-cover transition duration-300 ease-out group-hover:scale-[1.05]"
                      draggable={false}
                    />
                  ) : (
                    <div className="flex min-h-[320px] items-center justify-center text-sm text-[color:var(--muted)]">
                      Apercu indisponible
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(13,11,10,0.82)] via-[rgba(13,11,10,0.28)] to-transparent opacity-70 transition duration-300 md:opacity-0 md:group-hover:opacity-100" />

                  <div className="absolute left-4 top-4 rounded-full border border-white/25 bg-white/12 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-white backdrop-blur-md">
                    {isVideo ? (isEmbed ? "Film" : "Video") : label}
                  </div>

                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                    <div className="translate-y-0 transition duration-300 md:translate-y-5 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
                      <p className="max-w-[18ch] text-xl font-semibold leading-tight text-white sm:text-2xl">
                        {item.title}
                      </p>
                      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/12 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md">
                        <span>Voir l&apos;ambiance</span>
                        <span aria-hidden="true">+</span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            </article>
          );
        })}
      </div>

      {activeItem ? <GalleryModal item={activeItem} onClose={() => setActiveId(null)} /> : null}
    </>
  );
}
