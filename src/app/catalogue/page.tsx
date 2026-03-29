import CataloguePageClient from "@/components/CataloguePageClient";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

export default async function CataloguePage() {
  const [items, categories] = await Promise.all([
    prisma.item.findMany({
      where: { active: true },
      include: { images: true },
      orderBy: { name: "asc" },
    }),
    prisma.itemCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  const withSlug = categories.map((category) => ({
    ...category,
    slug: slugify(category.name),
  }));

  const decorCategories = withSlug.filter((category) =>
    /decor|mobilier|meuble/i.test(category.slug)
  );
  const otherCategories = withSlug.filter(
    (category) => !/decor|mobilier|meuble/i.test(category.slug)
  );

  const grouped = otherCategories.map((category) => ({
    category,
    items: items.filter((item) => item.categoryId === category.id),
  }));

  const decorItems = decorCategories.flatMap((category) =>
    items.filter((item) => item.categoryId === category.id)
  );

  const decorDescription =
    decorCategories.find((category) => category.description)?.description ||
    "Tables, chaises, housses, centres de table et ambiances.";

  const uncategorized = items.filter((item) => !item.categoryId);

  const normalizeItems = (list: typeof items) =>
    list.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      rentalPriceCents: item.rentalPriceCents,
      totalQty: item.totalQty,
      imageUrl: item.images[0]?.url || null,
      images: item.images.map((image) => ({
        url: image.url,
        alt: image.alt,
      })),
      categoryId: item.categoryId,
    }));

  const groupedForClient = grouped.map(({ category, items: groupItems }) => ({
    category,
    items: normalizeItems(groupItems),
  }));

  return (
    <CataloguePageClient
      otherCategories={otherCategories}
      decorCategories={decorCategories}
      grouped={groupedForClient}
      decorItems={normalizeItems(decorItems)}
      decorDescription={decorDescription}
      uncategorized={normalizeItems(uncategorized)}
    />
  );
}
