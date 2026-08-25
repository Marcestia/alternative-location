"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useState } from "react";
import formuleBistrotImage from "../../public/formule_bistrot.jpg";
import formuleEnfantImage from "../../public/formule_enfant.jpg";
import formuleEpicureImage from "../../public/formule_epicure.jpg";
import formulePrestigeImage from "../../public/Formule_prestige.jpg";

const offers: {
  name: string;
  eyebrow: string;
  description: string;
  image: StaticImageData;
}[] = [
  {
    name: "Prestige",
    eyebrow: "La plus complète",
    description: "Une table élégante et complète, des verres aux couverts.",
    image: formulePrestigeImage,
  },
  {
    name: "Épicure",
    eyebrow: "Esprit réception",
    description: "L’essentiel raffiné pour recevoir avec style.",
    image: formuleEpicureImage,
  },
  {
    name: "Bistrot",
    eyebrow: "Simple & conviviale",
    description: "Une formule chaleureuse pour les grandes tablées.",
    image: formuleBistrotImage,
  },
  {
    name: "Enfant",
    eyebrow: "Pour les petits invités",
    description: "Vaisselle adaptée et petite attention ludique.",
    image: formuleEnfantImage,
  },
];

export default function MomentOffersCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % offers.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  const showPrevious = () => {
    setActiveIndex((current) => (current - 1 + offers.length) % offers.length);
  };

  const showNext = () => {
    setActiveIndex((current) => (current + 1) % offers.length);
  };

  return (
    <div
      id="offres"
      className="rounded-[30px] border border-white/65 bg-[#201c18]/82 p-4 text-white shadow-[0_30px_70px_rgba(20,16,12,0.22)] backdrop-blur-xl sm:p-5 lg:p-6"
    >
      <div className="flex items-end justify-between gap-5 px-1 pb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#efb08e]">
            Offre du moment
          </p>
          <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
            Une formule, tout simplement
          </h2>
        </div>
      </div>

      <div className="relative min-h-[400px] overflow-hidden rounded-[26px] bg-white sm:min-h-[430px] lg:min-h-[500px]">
        {offers.map((offer, index) => (
          <article
            key={offer.name}
            aria-hidden={index !== activeIndex}
            className={`absolute inset-0 grid transition duration-700 ease-out sm:grid-cols-[1.15fr_0.85fr] ${
              index === activeIndex
                ? "pointer-events-auto translate-x-0 opacity-100"
                : "pointer-events-none translate-x-5 opacity-0"
            }`}
          >
            <div className="relative min-h-[235px] overflow-hidden sm:min-h-full">
              <Image
                src={offer.image}
                alt={`Présentation de la formule ${offer.name}`}
                fill
                sizes="(max-width: 640px) 100vw, 36vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent sm:bg-gradient-to-r sm:from-transparent sm:to-black/10" />
              <span className="absolute left-4 top-4 rounded-full border border-white/50 bg-black/35 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-md">
                {String(index + 1).padStart(2, "0")} / {String(offers.length).padStart(2, "0")}
              </span>
            </div>

            <div className="flex flex-col justify-between p-5 text-[color:var(--ink)] sm:p-7 lg:p-8">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--accent-2)]">
                  {offer.eyebrow}
                </p>
                <h3 className="mt-3 text-3xl font-semibold leading-none lg:text-4xl">
                  Formule<br />{offer.name}
                </h3>
                <p className="mt-4 text-sm leading-6 text-[color:var(--muted)]">
                  {offer.description}
                </p>
              </div>
              <a
                href="#contact"
                tabIndex={index === activeIndex ? 0 : -1}
                className="mt-6 inline-flex w-fit items-center gap-2 text-sm font-semibold text-[color:var(--accent)] underline-offset-4 hover:underline"
              >
                Demander cette formule <span aria-hidden="true">→</span>
              </a>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 px-1">
        <div className="flex gap-2" role="tablist" aria-label="Choisir une formule">
          {offers.map((offer, index) => (
            <button
              key={offer.name}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Afficher la formule ${offer.name}`}
              onClick={() => setActiveIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === activeIndex ? "w-8 bg-[#efb08e]" : "w-2 bg-white/35 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={showPrevious}
            aria-label="Formule précédente"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-lg transition hover:bg-white hover:text-[color:var(--ink)]"
          >
            <span aria-hidden="true">←</span>
          </button>
          <button
            type="button"
            onClick={showNext}
            aria-label="Formule suivante"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-lg transition hover:bg-white hover:text-[color:var(--ink)]"
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
