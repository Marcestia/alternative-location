"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type ImageLightboxProps = {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
};

export default function ImageLightbox({
  src,
  alt,
  className,
  imgClassName,
}: ImageLightboxProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`group block text-left ${className ?? ""}`}
        aria-label={`Agrandir ${alt}`}
      >
        <img
          src={src}
          alt={alt}
          className={`block cursor-zoom-in ${imgClassName ?? "h-full w-full object-cover"}`}
          draggable={false}
        />
      </button>
      {open && mounted
        ? createPortal(
            <div
              className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 px-4"
              onClick={() => setOpen(false)}
              role="dialog"
              aria-modal="true"
            >
              <div
                className="relative w-full max-w-5xl"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[color:var(--ink)]"
                  type="button"
                  onClick={() => setOpen(false)}
                >
                  Fermer
                </button>
                <img
                  src={src}
                  alt={alt}
                  className="max-h-[85vh] w-full rounded-2xl bg-white object-contain shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
                />
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
