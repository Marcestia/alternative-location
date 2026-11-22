"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import formuleBistrotImage from "../../public/formule_bistrot.jpg";
import formuleEnfantImage from "../../public/formule_enfant.jpg";
import formuleEpicureImage from "../../public/formule_epicure.jpg";
import formulePrestigeImage from "../../public/Formule_prestige.jpg";

const offers = [
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
  const [paused, setPaused] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (
      paused ||
      !autoPlay ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const interval = window.setInterval(
      () => setActiveIndex((current) => (current + 1) % offers.length),
      6000,
    );
    return () => window.clearInterval(interval);
  }, [paused, autoPlay, activeIndex]);

  const swipeStart = useRef<number | null>(null);
  const offer = offers[activeIndex];
  const previous = () =>
    setActiveIndex((current) => (current - 1 + offers.length) % offers.length);
  const next = () => setActiveIndex((current) => (current + 1) % offers.length);

  return (
    <section
      id="offres"
      className="home-offers"
      aria-labelledby="offers-title"
      data-scroll-section
    >
      <div className="site-container">
        <div className="editorial-heading" data-reveal>
          <p className="micro-label">02 / LES FORMULES</p>
          <h2 id="offers-title">
            La table
            <br />
            <span>est mise.</span>
          </h2>
          <p>
            Prestige, Épicure, Bistrot ou Enfant.
            <br />
            Quatre formules. À vous de choisir.
          </p>
        </div>
        <div
          className="offers-carousel"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget))
              setPaused(false);
          }}
          onPointerDown={(event) => {
            swipeStart.current = event.clientX;
          }}
          onPointerCancel={() => {
            swipeStart.current = null;
          }}
          onPointerUp={(event) => {
            if (swipeStart.current !== null) {
              const distance = event.clientX - swipeStart.current;
              if (Math.abs(distance) > 70) {
                if (distance < 0) next();
                else previous();
              }
              swipeStart.current = null;
            }
          }}
          onKeyDown={(event) => {
            if (event.target !== event.currentTarget) return;
            if (event.key === "ArrowRight") {
              event.preventDefault();
              next();
            }
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              previous();
            }
          }}
          tabIndex={0}
          aria-roledescription="carrousel"
          aria-label="Les quatre formules de vaisselle. Flèches gauche et droite pour naviguer."
        >
          <div className="offers-tabs" aria-label="Choisir une formule">
            {offers.map((item, index) => (
              <button
                key={item.name}
                type="button"
                aria-pressed={index === activeIndex}
                onClick={() => setActiveIndex(index)}
                className={index === activeIndex ? "is-active" : ""}
              >
                <span>0{index + 1}</span>
                {item.name}
                <span className="link-decoration" aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
          <div className="offer-stage">
            <div className="offers-content">
              <span className="offer-edition">
                LA SÉLECTION / 0{activeIndex + 1}
              </span>
              <div
                className="offers-description"
                aria-live={paused || !autoPlay ? "polite" : "off"}
                aria-atomic="true"
              >
                <p className="micro-label">{offer.eyebrow}</p>
                <h3 key={offer.name}>
                  {offer.name}
                  <span>.</span>
                </h3>
                <p>{offer.description}</p>
                <a href="#contact" className="button button-acid" data-magnetic>
                  DEMANDER CETTE FORMULE <span aria-hidden="true" className="link-decoration">↗</span>
                </a>
              </div>
              <div className="offers-controls">
                <span>
                  <strong>{String(activeIndex + 1).padStart(2, "0")}</strong> /
                  04 — GLISSEZ POUR EXPLORER
                </span>
                <div>
                  <button
                    type="button"
                    aria-label={
                      autoPlay
                        ? "Mettre le défilement en pause"
                        : "Reprendre le défilement"
                    }
                    aria-pressed={!autoPlay}
                    onClick={() => setAutoPlay((current) => !current)}
                  >
                    {autoPlay ? "Ⅱ" : "▷"}
                  </button>
                  <button
                    type="button"
                    aria-label="Formule précédente"
                    onClick={previous}
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    aria-label="Formule suivante"
                    onClick={next}
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
            <div className="offers-image">
              <Image
                key={offer.name}
                src={offer.image}
                alt={`Présentation de la formule ${offer.name}`}
                fill
                sizes="(max-width: 760px) 100vw, 50vw"
                draggable={false}
              />
              <span className="offers-image-label">
                C’EST L’HEURE DE PASSER À TABLE.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
