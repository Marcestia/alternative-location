"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/lib/site";

const links = [
  { href: "/#univers", label: "Nos univers" },
  { href: "/catalogue", label: "Le catalogue" },
  { href: "/#offres", label: "Nos formules" },
  { href: "/galerie", label: "Inspirations" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    const resize = () => {
      if (window.innerWidth > 1000) setMenuOpen(false);
    };
    document.addEventListener("keydown", close);
    window.addEventListener("resize", resize);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", close);
      window.removeEventListener("resize", resize);
    };
  }, [menuOpen]);
  if (pathname.startsWith("/admin") || pathname === "/login") return null;

  return (
    <>
      <a className="skip-link" href="#site-content">
        Aller au contenu
      </a>
      <div className="site-announcement">
        <span>LES FÊTES PASSENT. LES SOUVENIRS RESTENT.</span>
        <span className="announcement-location">
          Galgon, Gironde <span aria-hidden="true">↗</span>
        </span>
      </div>
      <header className="site-header">
        <div className="site-header-inner">
          <Link
            className="site-brand"
            href="/"
            aria-label="Alternative Location — Accueil"
            onClick={() => setMenuOpen(false)}
          >
            <Image
              src="/logo-mark.png"
              alt=""
              width={54}
              height={54}
              className="site-brand-mark"
            />
            <span>
              <span className="site-brand-name">
                alternative<span>.</span>
              </span>
              <span className="site-brand-caption">
                LOCATION ÉVÉNEMENTIELLE · 33
              </span>
            </span>
          </Link>
          <nav className="site-desktop-nav" aria-label="Navigation principale">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <Link href="/#contact" className="button button-primary header-cta">
            On en parle ? <span aria-hidden="true" className="link-decoration">↗</span>
          </Link>
          <button
            type="button"
            ref={menuButtonRef}
            className="site-menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span>{menuOpen ? "Fermer" : "Menu"}</span>
            <span aria-hidden="true">{menuOpen ? "−" : "+"}</span>
          </button>
        </div>
        {menuOpen ? (
          <nav
            id="mobile-navigation"
            className="site-mobile-nav"
            aria-label="Navigation mobile"
            onKeyDown={(event) => {
              if (event.key === "Escape") setMenuOpen(false);
            }}
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
                <span aria-hidden="true" className="link-decoration">↗</span>
              </Link>
            ))}
            <Link href="/#contact" onClick={() => setMenuOpen(false)}>
              Contact & devis<span aria-hidden="true" className="link-decoration">↗</span>
            </Link>
          </nav>
        ) : null}
      </header>
    </>
  );
}

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || pathname === "/login") return null;

  return (
    <footer className="site-footer">
      <div className="footer-statement" aria-hidden="true">
        À la prochaine <span>fête.</span>↗
      </div>
      <div className="site-container footer-main">
        <div>
          <Link href="/" className="footer-brand">
            alternative.
          </Link>
          <p>La fête se termine. On remet ça ?</p>
          <p className="footer-description">
            Vaisselle, décoration, mobilier & sonorisation.
            <br />À vos côtés pour vos événements, à Galgon.
          </p>
        </div>
        <div>
          <p className="footer-label">À DÉCOUVRIR</p>
          <Link href="/catalogue">Notre catalogue</Link>
          <Link href="/#offres">Les formules</Link>
          <Link href="/galerie">La galerie</Link>
          <Link href="/#contact">Contact & devis</Link>
        </div>
        <div>
          <p className="footer-label">ON EN PARLE ?</p>
          <a href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}>
            {siteConfig.phone}
          </a>
          <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
          <p>{siteConfig.address}</p>
          <a
            href={`https://wa.me/${siteConfig.whatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noreferrer"
          >
            Écrivez-nous sur WhatsApp <span className="link-decoration" aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
      <div className="site-container footer-bottom">
        <p>© {new Date().getFullYear()} Alternative Location</p>
        <Link href="/conditions">Conditions générales de location</Link>
        <Link href="/login">Espace entreprise <span className="link-decoration" aria-hidden="true">↗</span></Link>
      </div>
    </footer>
  );
}
