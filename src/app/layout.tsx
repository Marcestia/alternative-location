import type { Metadata } from "next";
import { DM_Sans, Nunito_Sans } from "next/font/google";
import { siteConfig } from "@/lib/site";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import ArtDirectionMotion from "@/components/ArtDirectionMotion";
import "./globals.css";
import "./art-direction.css";

const displayFont = Nunito_Sans({
  variable: "--font-display",
  subsets: ["latin"],
});

const bodyFont = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: `${siteConfig.name} | Location vaisselle, décoration et mobilier`,
  description:
    "Location de vaisselle, décoration, mobilier, sonorisation et ambiance pour mariages, anniversaires et évènements festifs avec retrait sur place à Galgon (33).",
  keywords: [
    "location vaisselle",
    "location décoration",
    "location mobilier",
    "location materiel évènementiel",
    "location sono",
    "location mariage",
    "Galgon",
    "Gironde",
    "33133",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: siteUrl,
    siteName: siteConfig.name,
    title: `${siteConfig.name} | Location vaisselle, decoration et mobilier`,
    description:
      "Location de vaisselle, decoration, mobilier, sonorisation et ambiance pour mariages, anniversaires et evenements festifs avec retrait sur place a Galgon (33).",
    images: [
      {
        url: "/vitrine/hero.jpg",
        width: 1200,
        height: 630,
        alt: "Alternative Location - location evenementielle a Galgon",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} | Location vaisselle, decoration et mobilier`,
    description:
      "Location de vaisselle, decoration, mobilier, sonorisation et ambiance pour mariages, anniversaires et evenements festifs avec retrait sur place a Galgon (33).",
    images: ["/vitrine/hero.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${displayFont.variable} ${bodyFont.variable} antialiased`}
      >
        <SiteHeader />
        <ArtDirectionMotion />
        <div id="site-content" tabIndex={-1}>
          {children}
        </div>
        <SiteFooter />
      </body>
    </html>
  );
}
