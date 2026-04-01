import CataloguePageClient from "@/components/CataloguePageClient";
import { CATEGORY_GROUP_META, CATEGORY_GROUP_ORDER } from "@/lib/catalog";
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

  const sections = CATEGORY_GROUP_ORDER.flatMap((group) =>
    withSlug
      .filter((category) => category.group === group)
      .map((category) => ({
        id: `cat-${category.slug}`,
        label: category.name,
        description: category.description,
        group: {
          key: group,
          label: CATEGORY_GROUP_META[group].label,
          slug: CATEGORY_GROUP_META[group].slug,
          description: CATEGORY_GROUP_META[group].description,
        },
        items: normalizeItems(items.filter((item) => item.categoryId === category.id)),
      }))
  );

  return (
    <CataloguePageClient
      sections={sections}
      uncategorized={normalizeItems(uncategorized)}
    />
  );
}
