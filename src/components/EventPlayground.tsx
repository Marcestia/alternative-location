"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type CSSProperties, type PointerEvent } from "react";
import gardenImage from "../../public/vitrine/vaisselle.jpg";
import dinnerImage from "../../public/vitrine/decoration.jpg";
import partyImage from "../../public/vitrine/ambiance.jpg";

const scenes = [
  {
    name: "Guinguette",
    label: "Une table guinguette avec vaisselle et linge à carreaux",
    image: gardenImage,
    caption: "Les grandes tablées. Les bonnes personnes.",
    mood: "garden",
  },
  {
    name: "Réception",
    label: "Une table de réception avec des fleurs et une décoration rose",
    image: dinnerImage,
    caption: "Le détail qui change toute la table.",
    mood: "dinner",
  },
  {
    name: "Dancefloor",
    label: "Montez le son",
    image: partyImage,
    caption: "Ce soir, personne ne rentre tôt.",
    mood: "party",
  },
];

export default function EventPlayground() {
  const [activeScene, setActiveScene] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const scene = scenes[activeScene];

  const movePhoto = (event: PointerEvent<HTMLDivElement>) => {
    if (
      event.pointerType !== "mouse" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty(
      "--tilt-x",
      `${((event.clientY - bounds.top) / bounds.height - 0.5) * -3}deg`,
    );
    event.currentTarget.style.setProperty(
      "--tilt-y",
      `${((event.clientX - bounds.left) / bounds.width - 0.5) * 4}deg`,
    );
  };

  return (
    <section
      className="party-hero"
      data-mood={scene.mood}
      aria-labelledby="hero-title"
    >
      <div className="hero-coordinate">
        <span>ALTERNATIVE LOCATION</span>
        <span>GALGON, GIRONDE — 33</span>
        <span>LES FÊTES PASSENT. LES SOUVENIRS RESTENT.</span>
      </div>
      <div className="party-hero-grid">
        <div className="party-hero-copy">
          <p className="micro-label hero-intro-label">
            <span className="live-dot" /> VAISSELLE & ÉVÉNEMENTS EN GIRONDE
          </p>
          <h1 id="hero-title" className="party-title">
            <span>La fête.</span>
            <span>À votre</span>
            <span className="hero-title-last">
              façon<span className="hero-full-stop">.</span>
            </span>
          </h1>
          <div className="hero-bottom-copy">
            <p>
              La vaisselle. Le décor. Le son.
              <br />
              Pour vos mariages et vos fêtes.
              <br />À retirer à Galgon, près de Libourne.
            </p>
            <Link href="/catalogue" className="round-cta" data-magnetic>
              <span>
                On fait
                <br />
                la fête ?
              </span>
              <span aria-hidden="true" className="link-decoration">↗</span>
            </Link>
          </div>
          <div className="hero-quick-links" data-stagger>
            <Link href="/catalogue#group-materiel-service" data-reveal>
              À table <span aria-hidden="true" className="link-decoration">↗</span>
            </Link>
            <Link href="/catalogue#group-decoration" data-reveal>
              Le décor <span aria-hidden="true" className="link-decoration">↗</span>
            </Link>
            <Link href="/catalogue#group-ambiance-son" data-reveal>
              L’ambiance <span aria-hidden="true" className="link-decoration">↗</span>
            </Link>
          </div>
        </div>
        <div
          className="party-hero-stage"
          ref={stageRef}
          onPointerMove={movePhoto}
          onPointerLeave={() => {
            stageRef.current?.style.setProperty("--tilt-x", "0deg");
            stageRef.current?.style.setProperty("--tilt-y", "0deg");
          }}
        >
          <div className="hero-picture-frame">
            {scenes.map((item, index) => (
              <div
                className={`hero-scene-image ${activeScene === index ? "is-active" : ""}`}
                key={item.mood}
                aria-hidden={activeScene !== index}
              >
                <Image
                  src={item.image}
                  alt={item.label}
                  fill
                  priority={index === 0}
                  sizes="(max-width: 760px) 90vw, 48vw"
                />
              </div>
            ))}
            <span className="hero-image-count">
              FIG. 0{activeScene + 1} / 03
            </span>
            <p className="hero-image-caption" aria-live="polite">
              {scene.caption}
            </p>
          </div>
          <div className="orbit-stamp mobile-decoration" aria-hidden="true">
            <svg viewBox="0 0 120 120">
              <defs>
                <path
                  id="party-orbit"
                  d="M60,60 m-43,0 a43,43 0 1,1 86,0 a43,43 0 1,1 -86,0"
                />
              </defs>
              <text>
                <textPath href="#party-orbit" textLength="270">
                  LES BONS MOMENTS • ÇA SE LOUE •{" "}
                </textPath>
              </text>
            </svg>
            <span>✽</span>
          </div>
          <div className="hero-tape" aria-hidden="true">
            PAS DE FÊTE SANS DÉTAILS. <span className="mobile-decoration" aria-hidden="true">↗</span>
          </div>
          <div className="scene-selector">
            <span className="micro-label">CHANGEZ D’AMBIANCE <span className="mobile-decoration" aria-hidden="true">↓</span></span>
            <div style={{ "--active-scene": activeScene } as CSSProperties}>
              <span className="scene-selector-indicator" aria-hidden="true" />
              {scenes.map((item, index) => (
                <button
                  key={item.mood}
                  type="button"
                  aria-pressed={activeScene === index}
                  onClick={() => setActiveScene(index)}
                >
                  <span>0{index + 1}</span>
                  {item.name}
                  <span className="link-decoration" aria-hidden="true">↗</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="hero-baseline">
        <a href="#univers">
          SCROLLEZ. LA FÊTE COMMENCE. <span aria-hidden="true" className="link-decoration">↓</span>
        </a>
        <a href="#contact">UN PROJET ? PARLONS-EN <span className="link-decoration" aria-hidden="true">↗</span></a>
        <span>RETRAIT SUR RENDEZ-VOUS À GALGON</span>
      </div>
    </section>
  );
}
