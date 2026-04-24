import CataloguePageClient from "@/components/CataloguePageClient";
import { CATEGORY_GROUP_META, CATEGORY_GROUP_ORDER } from "@/lib/catalog";
import { prisma } from "@/lib/prisma";
import { QuoteStatus } from "@/generated/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

const isValidIsoDate = (value: string | undefined) =>
  Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));

export default async function CataloguePage({
  searchParams,
}: {
  searchParams?: Promise<{ request?: string; eventDate?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const eventDateValue = isValidIsoDate(resolvedParams?.eventDate)
    ? resolvedParams?.eventDate
    : undefined;
  const requestModeEnabled = resolvedParams?.request === "1" && Boolean(eventDateValue);

  const [settings, items, categories, reservations, heldQuotes] = await Promise.all([
    prisma.companySetting.findUnique({
      where: { id: "company" },
      select: { catalogRequestEnabled: true },
    }),
    prisma.item.findMany({
      where: { active: true },
      include: { images: true },
      orderBy: { name: "asc" },
    }),
    prisma.itemCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    requestModeEnabled
      ? prisma.reservation.findMany({
          where: {
            status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
          },
          include: { items: true },
        })
      : Promise.resolve([]),
    requestModeEnabled
      ? prisma.quote.findMany({
          where: { status: QuoteStatus.SUBMITTED },
          include: { items: true },
        })
      : Promise.resolve([]),
  ]);

  const catalogRequestEnabled = settings?.catalogRequestEnabled ?? false;
  const requestMode = requestModeEnabled && catalogRequestEnabled;
  const availabilityByItem = new Map<string, number>();

  if (requestMode && eventDateValue) {
    const dayStart = new Date(`${eventDateValue}T00:00:00.000Z`);
    const dayEnd = new Date(`${eventDateValue}T23:59:59.999Z`);
    const reservedByItem = new Map<string, number>();

    reservations.forEach((reservation) => {
      if (reservation.startDate > dayEnd || reservation.endDate < dayStart) return;
      reservation.items.forEach((entry) => {
        reservedByItem.set(
          entry.itemId,
          (reservedByItem.get(entry.itemId) || 0) + entry.quantity
        );
      });
    });

    heldQuotes.forEach((quote) => {
      if (quote.startDate > dayEnd || quote.endDate < dayStart) return;
      quote.items.forEach((entry) => {
        reservedByItem.set(
          entry.itemId,
          (reservedByItem.get(entry.itemId) || 0) + entry.quantity
        );
      });
    });

    items.forEach((item) => {
      availabilityByItem.set(
        item.id,
        Math.max(0, item.totalQty - (reservedByItem.get(item.id) || 0))
      );
    });
  }

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
      availableQty: requestMode
        ? availabilityByItem.get(item.id) ?? item.totalQty
        : item.totalQty,
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
      requestMode={requestMode}
      eventDateValue={eventDateValue}
      sections={sections}
      uncategorized={normalizeItems(uncategorized)}
    />
  );
}
