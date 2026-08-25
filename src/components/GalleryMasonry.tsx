"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
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
  onPrevious,
  onNext,
}: {
  item: GalleryMediaView;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const embedUrl = item.type === "VIDEO" ? toVideoEmbedUrl(item.mediaUrl) : null;
  const previewUrl = getGalleryPreviewUrl(item);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onPrevious();
      if (event.key === "ArrowRight") onNext();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose, onNext, onPrevious]);

  return createPortal(
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center bg-black/92 p-3 backdrop-blur-md sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Aperçu de ${item.title}`}
    >
      <div
        className="relative flex max-h-[94vh] max-w-[96vw] items-center justify-center"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer l’image"
          className="absolute right-2 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/55 text-2xl text-white shadow-lg backdrop-blur-md transition hover:scale-105 hover:bg-white hover:text-black sm:right-4 sm:top-4"
        >
          <span aria-hidden="true">×</span>
        </button>
        <button
          type="button"
          onClick={onPrevious}
          aria-label="Image précédente"
          className="fixed left-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/55 text-2xl text-white shadow-lg backdrop-blur-md transition hover:scale-105 hover:bg-white hover:text-black sm:left-6 sm:h-14 sm:w-14"
        >
          <span aria-hidden="true">←</span>
        </button>
        <button
          type="button"
          onClick={onNext}
          aria-label="Image suivante"
          className="fixed right-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/55 text-2xl text-white shadow-lg backdrop-blur-md transition hover:scale-105 hover:bg-white hover:text-black sm:right-6 sm:h-14 sm:w-14"
        >
          <span aria-hidden="true">→</span>
        </button>
        {item.type === "IMAGE" && previewUrl ? (
          <img
            src={item.mediaUrl}
            alt={item.title}
            className="max-h-[94vh] max-w-[96vw] rounded-xl object-contain shadow-[0_30px_100px_rgba(0,0,0,0.55)]"
          />
        ) : embedUrl ? (
          <iframe
            src={embedUrl}
            title={item.title}
            className="h-[80vh] w-[min(92vw,1200px)] rounded-xl bg-black"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            src={item.mediaUrl}
            poster={item.posterUrl || undefined}
            className="max-h-[94vh] max-w-[96vw] rounded-xl object-contain"
            controls
            playsInline
            preload="metadata"
          />
        )}
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
  const activeIndex = activeItem
    ? items.findIndex((item) => item.id === activeItem.id)
    : -1;

  const showPrevious = () => {
    if (activeIndex < 0) return;
    const previousIndex = (activeIndex - 1 + items.length) % items.length;
    setActiveId(items[previousIndex].id);
  };

  const showNext = () => {
    if (activeIndex < 0) return;
    const nextIndex = (activeIndex + 1) % items.length;
    setActiveId(items[nextIndex].id);
  };

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
        threshold: 0.12,
        rootMargin: "0px 0px -6% 0px",
      }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [items]);

  return (
    <>
      <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 lg:gap-4">
        {items.map((item, index) => {
          const previewUrl = getGalleryPreviewUrl(item);
          const isVisible = Boolean(visibleIds[item.id]);
          const isVideo = item.type === "VIDEO";
          const isEmbed = isVideo && !isDirectVideoUrl(item.mediaUrl);

          return (
            <article
              key={item.id}
              data-gallery-card
              data-gallery-id={item.id}
              className="mb-3 break-inside-avoid lg:mb-4"
            >
              <button
                type="button"
                onClick={() => setActiveId(item.id)}
                className={`group relative w-full overflow-hidden rounded-[18px] border border-white/75 bg-white text-left shadow-[0_20px_45px_rgba(30,25,20,0.08)] transition duration-300 ${
                  isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                }`}
                style={{
                  transitionDelay: `${Math.min(index * 45, 220)}ms`,
                }}
                aria-label={`Ouvrir ${item.title}`}
              >
                <div className="relative overflow-hidden bg-[color:var(--surface)]">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={item.title}
                      className="h-auto w-full object-cover transition duration-500 ease-out group-hover:scale-[1.03]"
                      draggable={false}
                    />
                  ) : (
                    <div className="flex min-h-[260px] items-center justify-center text-sm text-[color:var(--muted)]">
                      Aperçu indisponible
                    </div>
                  )}

                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,0.18))] opacity-0 transition duration-300 group-hover:opacity-100" />

                  {isVideo ? (
                    <div className="absolute right-3 top-3 rounded-full border border-white/25 bg-black/38 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-white backdrop-blur-md">
                      {isEmbed ? "Film" : "Vidéo"}
                    </div>
                  ) : null}
                </div>
              </button>
            </article>
          );
        })}
      </div>

      {activeItem ? (
        <GalleryModal
          item={activeItem}
          onClose={() => setActiveId(null)}
          onPrevious={showPrevious}
          onNext={showNext}
        />
      ) : null}
    </>
  );
}
