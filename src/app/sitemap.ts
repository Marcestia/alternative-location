import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { categorySlug } from "@/lib/catalogue-paths";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const categories = await prisma.itemCategory.findMany({
    where: { items: { some: { active: true } } },
    select: { name: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return [
    "/",
    "/location-vaisselle-gironde",
    "/catalogue",
    "/galerie",
    "/conditions",
    ...categories.map(
      (category) => `/catalogue/${categorySlug(category.name)}`,
    ),
  ].map((path) => ({ url: absoluteUrl(path) }));
}
