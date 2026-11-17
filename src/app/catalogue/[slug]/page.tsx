import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ImageLightbox from "@/components/ImageLightbox";
import { cache } from "react";
import Link from "next/link";
import { categorySlug } from "@/lib/catalogue-paths";
import { publicPageMetadata, privatePageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const getCategories = cache(async () => {
  return prisma.itemCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      items: {
        where: { active: true },
        include: { images: true },
        orderBy: { name: "asc" },
      },
    },
  });
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = (await getCategories()).find(
    (item) => categorySlug(item.name) === slug,
  );
  if (!category) return privatePageMetadata;
  return publicPageMetadata({
    title: `${category.name} en location à Galgon (33) | Alternative Location`,
    description: `Découvrez notre sélection « ${category.name} » et ses tarifs pour vos événements en Gironde. Retrait et retour à Galgon, près de Libourne. Devis sur demande.`,
    path: `/catalogue/${categorySlug(category.name)}`,
  });
}

export default async function CatalogueCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const categories = await getCategories();

  const category = categories.find((item) => categorySlug(item.name) === slug);
  if (!category) {
    notFound();
  }

  const coverImage =
    category.heroImageUrl ||
    category.items.find((item) => item.images[0]?.url)?.images[0]?.url ||
    "/vitrine/hero.jpg";
  const heroTitle = category.heroTitle || category.name;

  return (
    <div className="min-h-screen bg-[color:var(--background)] px-6 py-12">
      <div className="mx-auto w-full max-w-6xl space-y-10">
        <header className="rounded-3xl border border-black/5 bg-white/80 p-8 shadow-[0_20px_60px_rgba(36,26,18,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                Catalogue
              </p>
              <h1 className="mt-2 text-3xl font-semibold">{heroTitle}</h1>
              {category.description && (
                <p className="mt-2 text-sm text-[color:var(--muted)]">
                  {category.description}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  className="rounded-full border border-black/10 px-5 py-2 text-xs font-semibold text-[color:var(--muted)]"
                  href="/catalogue"
                >
                  Voir tout le catalogue
                </Link>
                <Link
                  className="rounded-full bg-[color:var(--accent)] px-5 py-2 text-xs font-semibold text-white"
                  href="/#contact"
                >
                  Nous contacter
                </Link>
                <Link
                  className="rounded-full border border-black/10 px-5 py-2 text-xs font-semibold text-[color:var(--muted)]"
                  href="/"
                >
                  Retour à l’accueil
                </Link>
              </div>
            </div>
            <div className="w-full max-w-sm">
              <div className="overflow-hidden rounded-3xl bg-[color:var(--surface)]">
                <ImageLightbox
                  src={coverImage}
                  alt={category.name}
                  className="h-56 w-full object-cover"
                />
              </div>
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-black/5 bg-white/80 p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-xl font-semibold">
              Articles disponibles ({category.items.length})
            </h2>
          </div>
          {category.items.length == 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-black/10 bg-[color:var(--surface)] p-6 text-sm text-[color:var(--muted)]">
              Aucun article enregistré pour le moment.
            </div>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {category.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-black/5 bg-white p-4 shadow-[0_18px_30px_rgba(30,25,20,0.06)] transition hover:shadow-[0_22px_38px_rgba(30,25,20,0.10)]"
                >
                  <div className="overflow-hidden rounded-2xl bg-[color:var(--surface)]">
                    <ImageLightbox
                      src={item.images[0]?.url || "/vitrine/hero.jpg"}
                      alt={item.name}
                      className="h-48 w-full object-cover"
                    />
                  </div>
                  <p className="mt-4 text-sm font-semibold">{item.name}</p>
                  <p className="mt-1 text-xs text-[color:var(--muted)]">
                    {item.totalQty} dispo ·{" "}
                    {(item.rentalPriceCents / 100).toFixed(2)} €
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
