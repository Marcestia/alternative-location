import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const lastModified = new Date();

  return [
    {
      url: siteUrl,
      lastModified,
    },
    {
      url: `${siteUrl}/catalogue`,
      lastModified,
    },
    {
      url: `${siteUrl}/conditions`,
      lastModified,
    },
  ];
}
