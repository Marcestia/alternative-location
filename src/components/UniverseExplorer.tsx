"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type Universe = { id: string; name: string; description: string; slug: string };
const visuals: Record<string, { image: string; title: string; tag: string }> = {
  "materiel-service": {
    image: "/vitrine/vaisselle.jpg",
    title: "À table.",
    tag: "LA GRANDE TABLÉE",
  },
  "ambiance-son": {
    image: "/vitrine/ambiance.jpg",
    title: "Le son.",
    tag: "ON MONTE LE SON",
  },
  decoration: {
    image: "/vitrine/decoration.jpg",
    title: "Le décor.",
    tag: "LE PETIT DÉTAIL EN PLUS",
  },
};

export default function UniverseExplorer({
  categories,
}: {
  categories: Universe[];
}) {
  const [activeSlug, setActiveSlug] = useState(categories[0]?.slug ?? "");
  const active =
    categories.find((category) => category.slug === activeSlug) ??
    categories[0];
  return (
    <section
      id="univers"
      className="universe-explorer site-container"
      aria-labelledby="universes-title"
      data-scroll-section
    >
      <div className="editorial-heading" data-reveal>
        <p className="micro-label">01 / L’INVENTAIRE DES POSSIBLES</p>
        <h2 id="universes-title">
          Y’a tout.
          <br />
          <span className="outline-type">Surtout vous.</span>
        </h2>
        <Link href="/catalogue" className="text-link">
          TOUT LE CATALOGUE <span aria-hidden="true" className="link-decoration">↗</span>
        </Link>
      </div>
      <div className="universe-explorer-grid">
        <div
          className="universe-preview"
          data-reveal="photo"
          data-parallax="0.045"
        >
          <div className="universe-preview-photo">
            {categories.map((category) => (
              <Image
                key={category.id}
                src={visuals[category.slug]?.image ?? "/vitrine/mobilier.jpg"}
                alt={category.name}
                fill
                sizes="(max-width: 760px) 90vw, 40vw"
                className={category.slug === active?.slug ? "is-active" : ""}
                aria-hidden={category.slug !== active?.slug}
              />
            ))}
          </div>
          <span className="universe-preview-sticker">
            {active
              ? (visuals[active.slug]?.tag ?? active.name)
              : "À DÉCOUVRIR"}
          </span>
          <span className="micro-label universe-preview-label">
            SURVOLEZ LES UNIVERS. TROUVEZ LE VÔTRE. <span className="mobile-decoration" aria-hidden="true">↗</span>
          </span>
        </div>
        <div className="universe-index" data-stagger>
          {categories.map((category, index) => (
            <Link
              key={category.id}
              href={`/catalogue#group-${category.slug}`}
              className={`universe-index-link ${active?.slug === category.slug ? "is-active" : ""}`}
              onPointerEnter={() => setActiveSlug(category.slug)}
              onFocus={() => setActiveSlug(category.slug)}
              data-reveal
            >
              <span className="universe-index-number">0{index + 1}</span>
              <span className="universe-index-body">
                <span className="universe-index-title">
                  {visuals[category.slug]?.title ?? category.name}
                </span>
                <span className="universe-index-category">{category.name}</span>
                <span className="universe-index-description">
                  {category.description}
                </span>
              </span>
              <span className="universe-index-arrow link-decoration" aria-hidden="true">
                ↗
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
