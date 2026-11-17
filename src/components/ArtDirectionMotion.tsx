"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { attachDetailsMotion } from "@/lib/detailsMotion";

export default function ArtDirectionMotion() {
  const pathname = usePathname();
  const progressRef = useRef<HTMLDivElement>(null);
  const isPrivate = pathname.startsWith("/admin") || pathname === "/login";

  useEffect(() => {
    if (isPrivate) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let removeMotion: (() => void) | undefined;
    const setup = () => {
      removeMotion?.();
      if (media.matches) return;
      const root = document.getElementById("site-content");
      if (!root) return;
      const elements = Array.from(
        root.querySelectorAll<HTMLElement>("[data-reveal]"),
      );
      const parallax = Array.from(
        root.querySelectorAll<HTMLElement>("[data-parallax]"),
      );
      const scrollSections = Array.from(
        root.querySelectorAll<HTMLElement>("[data-scroll-section]"),
      );
      const staggered = new Set<HTMLElement>();
      root.querySelectorAll<HTMLElement>("[data-stagger]").forEach((group) => {
        Array.from(group.children).forEach((child, index) => {
          if (
            !(child instanceof HTMLElement) ||
            !child.hasAttribute("data-reveal")
          )
            return;
          child.style.setProperty(
            "--reveal-delay",
            `${Math.min(index * 85, 255)}ms`,
          );
          staggered.add(child);
        });
      });
      const removeDetailsMotion = attachDetailsMotion(root);
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries)
            if (entry.isIntersecting) {
              entry.target.setAttribute("data-visible", "true");
              observer.unobserve(entry.target);
            }
        },
        { threshold: 0.08, rootMargin: "0px 0px -30px 0px" },
      );
      root.classList.add("motion-ready");
      elements.forEach((element) => observer.observe(element));
      let frame = 0;
      const draw = () => {
        frame = 0;
        const maxScroll =
          document.documentElement.scrollHeight - window.innerHeight;
        if (progressRef.current)
          progressRef.current.style.transform = `scaleX(${maxScroll > 0 ? Math.min(1, window.scrollY / maxScroll) : 0})`;
        for (const element of parallax) {
          const bounds = element.getBoundingClientRect();
          if (bounds.top < window.innerHeight + 150 && bounds.bottom > -150) {
            const offset =
              (window.innerHeight / 2 - (bounds.top + bounds.height / 2)) *
              Number(element.dataset.parallax || 0);
            element.style.setProperty(
              "--scroll-shift",
              `${Math.max(-55, Math.min(55, offset))}px`,
            );
          }
        }
        for (const section of scrollSections) {
          const bounds = section.getBoundingClientRect();
          if (bounds.top < window.innerHeight && bounds.bottom > 0) {
            const progress = Math.max(
              0,
              Math.min(
                1,
                (window.innerHeight - bounds.top) /
                  (window.innerHeight + bounds.height),
              ),
            );
            section.style.setProperty("--section-progress", String(progress));
          }
        }
      };
      const schedule = () => {
        if (!frame) frame = requestAnimationFrame(draw);
      };
      window.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", schedule);
      root.addEventListener("toggle", schedule, true);
      schedule();
      const magneticCleanup: (() => void)[] = [];
      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        root
          .querySelectorAll<HTMLElement>("[data-magnetic]")
          .forEach((element) => {
            const move = (event: PointerEvent) => {
              const bounds = element.getBoundingClientRect();
              element.style.setProperty(
                "--magnetic-x",
                `${(event.clientX - bounds.left - bounds.width / 2) * 0.075}px`,
              );
              element.style.setProperty(
                "--magnetic-y",
                `${(event.clientY - bounds.top - bounds.height / 2) * 0.075}px`,
              );
            };
            const leave = () => {
              element.style.setProperty("--magnetic-x", "0px");
              element.style.setProperty("--magnetic-y", "0px");
            };
            element.addEventListener("pointermove", move);
            element.addEventListener("pointerleave", leave);
            magneticCleanup.push(() => {
              element.removeEventListener("pointermove", move);
              element.removeEventListener("pointerleave", leave);
              leave();
            });
          });
        root
          .querySelectorAll<HTMLElement>("[data-hover-card]")
          .forEach((card) => {
            const move = (event: PointerEvent) => {
              const bounds = card.getBoundingClientRect();
              if (!bounds.width || !bounds.height) return;
              card.style.setProperty(
                "--card-rx",
                `${((event.clientY - bounds.top) / bounds.height - 0.5) * -4}deg`,
              );
              card.style.setProperty(
                "--card-ry",
                `${((event.clientX - bounds.left) / bounds.width - 0.5) * 5}deg`,
              );
            };
            const leave = () => {
              card.style.removeProperty("--card-rx");
              card.style.removeProperty("--card-ry");
            };
            card.addEventListener("pointermove", move);
            card.addEventListener("pointerleave", leave);
            magneticCleanup.push(() => {
              card.removeEventListener("pointermove", move);
              card.removeEventListener("pointerleave", leave);
              leave();
            });
          });
      }
      removeMotion = () => {
        observer.disconnect();
        window.removeEventListener("scroll", schedule);
        window.removeEventListener("resize", schedule);
        root.removeEventListener("toggle", schedule, true);
        cancelAnimationFrame(frame);
        magneticCleanup.forEach((cleanup) => cleanup());
        removeDetailsMotion();
        root.classList.remove("motion-ready");
        parallax.forEach((element) =>
          element.style.removeProperty("--scroll-shift"),
        );
        staggered.forEach((element) =>
          element.style.removeProperty("--reveal-delay"),
        );
        scrollSections.forEach((section) =>
          section.style.removeProperty("--section-progress"),
        );
      };
    };
    setup();
    media.addEventListener("change", setup);
    return () => {
      removeMotion?.();
      media.removeEventListener("change", setup);
    };
  }, [pathname, isPrivate]);

  if (isPrivate) return null;
  return (
    <div className="reading-progress" aria-hidden="true">
      <div ref={progressRef} />
    </div>
  );
}
