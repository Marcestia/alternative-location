import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";

const configuredUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.alternative-location.fr",
);
// The public domain redirects to www; canonical URLs must use the final host.
if (configuredUrl.hostname === "alternative-location.fr") {
  configuredUrl.hostname = "www.alternative-location.fr";
}
export const siteUrl = configuredUrl.origin;

export const absoluteUrl = (path = "/") => new URL(path, `${siteUrl}/`).href;

export function publicPageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(path) },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      siteName: siteConfig.name,
      title,
      description,
      url: absoluteUrl(path),
      images: [
        {
          url: absoluteUrl("/vitrine/hero.jpg"),
          width: 1316,
          height: 640,
          alt: "Une table de réception avec la vaisselle d’Alternative Location",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl("/vitrine/hero.jpg")],
    },
  };
}

export const privatePageMetadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export const localBusinessSchema = {
  "@type": "LocalBusiness",
  "@id": absoluteUrl("/#entreprise"),
  name: siteConfig.name,
  alternateName: siteConfig.alternateName,
  url: absoluteUrl(),
  image: absoluteUrl("/vitrine/hero.jpg"),
  telephone: "+33621205432",
  email: siteConfig.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: "14 impasse Moustron",
    addressLocality: siteConfig.city,
    postalCode: siteConfig.postalCode,
    addressCountry: siteConfig.country,
  },
  areaServed: { "@type": "AdministrativeArea", name: "Gironde" },
  description:
    "Location de vaisselle, décoration, mobilier et sonorisation pour les événements en Gironde. Retrait et retour exclusivement à Galgon, aux horaires convenus lors de la réservation.",
};

export const jsonLd = (value: unknown) =>
  JSON.stringify(value).replace(/</g, "\\u003c");
