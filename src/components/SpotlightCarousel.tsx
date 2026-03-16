"use client";

import { useEffect, useMemo, useState } from "react";

type SpotlightItem = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
};

type SpotlightCarouselProps = {
  items: SpotlightItem[];
};

export default function SpotlightCarousel({ items }: SpotlightCarouselProps) {
  const activeItems = useMemo(
    () => items.filter((item) => item.title),
    [items]
  );
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  if (activeItems.length === 0) return null;

  const current = activeItems[index % activeItems.length];

  const goPrev = () =>
    setIndex((prev) => (prev - 1 + activeItems.length) % activeItems.length);
  const goNext = () => setIndex((prev) => (prev + 1) % activeItems.length);

  useEffect(() => {
    if (activeItems.length <= 1) return;
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % activeItems.length);
    }, 5000);
    return () => clearInterval(id);
  }, [activeItems.length]);

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <div className="h-full">
      <div className="group relative flex h-full items-center justify-center p-0 [perspective:1600px]">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[color:var(--accent)]/20 blur-3xl" />
        <div className="absolute -bottom-10 left-6 h-40 w-40 rounded-full bg-[color:var(--accent-2)]/30 blur-3xl" />

        <div
          className={`relative h-full w-full overflow-hidden rounded-[36px] bg-white/65 shadow-[0_40px_90px_rgba(12,10,8,0.22)] transition-transform duration-700 ease-out ${
            visible ? "scale-[1.01]" : "scale-[0.995]"
          }`}
        >
          <div className="relative h-full w-full overflow-hidden rounded-[36px] bg-white">
            <img
              key={current.id}
              src={current.imageUrl || "/vitrine/hero.jpg"}
              alt={current.title}
              className={`h-full w-full object-cover object-center transition-all duration-700 ease-out ${
                visible ? "opacity-100 scale-[1.01]" : "opacity-0 scale-[0.995]"
              }`}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent" />

            {current.imageUrl && (
              <a
                href={current.imageUrl}
                target="_blank"
                rel="noreferrer"
                className="absolute right-5 top-5 z-20 rounded-full border border-white/70 bg-white/92 px-3 py-2 text-xs font-semibold text-[color:var(--ink)] shadow-[0_12px_28px_rgba(12,10,8,0.16)] transition hover:bg-white"
              >
                Ouvrir
              </a>
            )}

            <div className="absolute bottom-6 left-6 right-6 rounded-3xl bg-white/85 px-5 py-4 text-[13px] text-[color:var(--muted)] backdrop-blur">
              <p className="text-base font-semibold text-[color:var(--ink)]">
                {current.title}
              </p>
              {current.description && (
                <p className="mt-1 line-clamp-2">{current.description}</p>
              )}
            </div>
          </div>

          {activeItems.length > 1 && (
            <>
              <button
                className="absolute left-5 top-1/2 z-30 -translate-y-1/2 rounded-full border border-white/70 bg-white/95 px-3 py-2 text-sm font-semibold text-[color:var(--ink)] shadow-[0_12px_28px_rgba(12,10,8,0.16)] transition hover:-translate-x-0.5 hover:bg-white focus:outline-none focus:ring-2 focus:ring-white/80"
                type="button"
                onPointerDown={(event) => {
                  event.preventDefault();
                  goPrev();
                }}
                aria-label="Precedent"
              >
                {"<"}
              </button>
              <button
                className="absolute right-5 top-1/2 z-30 -translate-y-1/2 rounded-full border border-white/70 bg-white/95 px-3 py-2 text-sm font-semibold text-[color:var(--ink)] shadow-[0_12px_28px_rgba(12,10,8,0.16)] transition hover:translate-x-0.5 hover:bg-white focus:outline-none focus:ring-2 focus:ring-white/80"
                type="button"
                onPointerDown={(event) => {
                  event.preventDefault();
                  goNext();
                }}
                aria-label="Suivant"
              >
                {">"}
              </button>
            </>
          )}
        </div>
      </div>

      {activeItems.length > 1 && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-[color:var(--muted)]">
          <button
            type="button"
            onClick={goPrev}
            className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/90 px-4 py-2 font-semibold text-[color:var(--ink)] transition hover:-translate-y-0.5 hover:border-black/20"
            aria-label="Image precedente"
          >
            <span aria-hidden="true">←</span>
            <span>Precedent</span>
          </button>
          <span className="rounded-full bg-white/80 px-2 py-1 font-semibold">
            {index + 1} / {activeItems.length}
          </span>
          <div className="flex items-center gap-2">
            {activeItems.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setIndex(idx)}
                className={`h-2.5 w-2.5 rounded-full border transition ${
                  idx === index
                    ? "scale-110 border-[color:var(--accent)] bg-[color:var(--accent)]"
                    : "border-black/15 bg-white/80 hover:border-black/25 hover:bg-black/20"
                }`}
                aria-label={`Voir ${item.title}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={goNext}
            className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/90 px-4 py-2 font-semibold text-[color:var(--ink)] transition hover:-translate-y-0.5 hover:border-black/20"
            aria-label="Image suivante"
          >
            <span>Suivant</span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      )}
    </div>
  );
}
