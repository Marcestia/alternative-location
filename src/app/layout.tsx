import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { siteConfig } from "@/lib/site";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: `${siteConfig.name} | Location vaisselle, decoration et mobilier`,
  description:
    "Location de vaisselle, decoration, mobilier, sonorisation et ambiance pour mariages, anniversaires et evenements festifs a Galgon (33) et dans un rayon de 150 km.",
  keywords: [
    "location vaisselle",
    "location decoration",
    "location mobilier",
    "location materiel evenementiel",
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
      "Location de vaisselle, decoration, mobilier, sonorisation et ambiance pour mariages, anniversaires et evenements festifs a Galgon (33) et dans un rayon de 150 km.",
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
      "Location de vaisselle, decoration, mobilier, sonorisation et ambiance pour mariages, anniversaires et evenements festifs a Galgon (33) et dans un rayon de 150 km.",
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
      <body className={`${fraunces.variable} ${manrope.variable} antialiased`}>
        {children}
        <footer className="px-5 pb-10 sm:px-6">
          <div className="mx-auto w-full max-w-6xl border-t border-black/5 pt-6 text-xs text-[color:var(--muted)]">
            <a
              className="font-semibold text-[color:var(--ink)] hover:underline"
              href="/conditions"
            >
              Conditions generales
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
