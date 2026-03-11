import {
  addItem,
  deleteItem,
  updateItem,
} from "@/app/actions/stock";
import AdminImageInput from "@/components/AdminImageInput";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StockPage({
  searchParams,
}: {
  searchParams?: Promise<{ saved?: string; category?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const categoryFilter = resolvedParams?.category ?? "";

  const [items, categories] = await Promise.all([
    prisma.item.findMany({
      orderBy: { createdAt: "desc" },
      include: { images: true, category: true },
      take: 200,
      where: categoryFilter
        ? {
            categoryId: categoryFilter,
          }
        : undefined,
    }),
    prisma.itemCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
  ]);

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-black/5 bg-white/80 p-8 shadow-[0_15px_30px_rgba(22,18,14,0.08)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
          Espace entreprise
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Stock</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Inventaire des articles et quantit&eacute;s disponibles.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-black/5 bg-white/80 p-6">
          <h2 className="text-xl font-semibold">Ajouter un article</h2>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Prix en euros (ex: 25 = 25,00 &euro;).
          </p>
          {resolvedParams?.saved === "1" && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
              Article ajout&eacute;.
            </div>
          )}
          {resolvedParams?.saved === "0" && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
              Merci de renseigner un nom d'article.
            </div>
          )}
          {resolvedParams?.saved === "linked" && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
              Article utilis&eacute; dans un devis ou une r&eacute;servation : il a &eacute;t&eacute; d&eacute;sactiv&eacute;.
            </div>
          )}
          <form action={addItem} className="mt-4 grid gap-4">
            <input
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
              placeholder="Nom de l'article"
              name="name"
              required
            />
            <select
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
              name="categoryId"
              defaultValue=""
            >
              <option value="">Choisir une cat&eacute;gorie</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <div className="grid gap-3 sm:grid-cols-3">
              <AdminImageInput label="Image 1" name="imageData" />
              <AdminImageInput label="Image 2" name="imageData" />
              <AdminImageInput label="Image 3" name="imageData" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                placeholder="Quantit&eacute;"
                name="totalQty"
                type="number"
                min="0"
                defaultValue="0"
              />
              <input
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                placeholder="Prix location"
                name="rentalPriceCents"
                type="number"
                min="0"
                step="0.01"
                defaultValue="0"
              />
              <input
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                placeholder="Caution"
                name="depositPriceCents"
                type="number"
                min="0"
                step="0.01"
                defaultValue="0"
              />
            </div>
            <button
              className="rounded-full bg-[color:var(--ink)] px-6 py-3 text-sm font-semibold text-white"
              type="submit"
            >
              Enregistrer
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-black/5 bg-[color:var(--surface-2)] p-6">
          <h2 className="text-xl font-semibold">Conseil gestion</h2>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Pense &agrave; garder une marge de s&eacute;curit&eacute; pour les articles fragiles.
          </p>
          <ul className="mt-4 space-y-3 text-sm">
            {[
              "Mettre &agrave; jour les stocks apr&egrave;s chaque retour",
              "Noter les &eacute;l&eacute;ments endommag&eacute;s",
              "Regrouper les articles par th&egrave;me",
            ].map((tip) => (
              <li key={tip} className="rounded-2xl bg-white/80 px-4 py-3">
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-3xl border border-black/5 bg-white/80 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Articles</h2>
          <form className="flex flex-wrap items-center gap-2" method="get">
            <select
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold"
              name="category"
              defaultValue={categoryFilter}
            >
              <option value="">Toutes les cat&eacute;gories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <button
              className="rounded-full border border-black/10 px-3 py-2 text-xs font-semibold text-[color:var(--muted)]"
              type="submit"
            >
              Filtrer
            </button>
          </form>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              categoryFilter
                ? "border-black/10 text-[color:var(--muted)]"
                : "border-[color:var(--ink)]/20 text-[color:var(--ink)]"
            }`}
            href="/admin/stock"
          >
            Toutes
          </a>
          {categories.map((category) => (
            <a
              key={category.id}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                categoryFilter === category.id
                  ? "border-[color:var(--ink)]/20 text-[color:var(--ink)]"
                  : "border-black/10 text-[color:var(--muted)]"
              }`}
              href={`/admin/stock?category=${category.id}`}
            >
              {category.name}
            </a>
          ))}
        </div>
        {items.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-black/10 bg-[color:var(--surface)] p-6 text-sm text-[color:var(--muted)]">
            Aucun article enregistr&eacute;.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {items.map((item) => (
              <details
                key={item.id}
                className="rounded-2xl border border-black/5 bg-white px-4 py-3"
              >
                <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {item.images[0]?.url && (
                      <img
                        src={item.images[0].url}
                        alt={item.name}
                        className="h-16 w-20 rounded-xl object-cover"
                      />
                    )}
                    <div>
                      <p className="text-sm font-semibold">{item.name}</p>
                      <p className="text-xs text-[color:var(--muted)]">
                        Cat&eacute;gorie: {item.category?.name ?? "-"}
                      </p>
                      <p className="text-xs text-[color:var(--muted)]">
                        {item.totalQty - item.reservedQty} dispo / {item.totalQty} total
                      </p>
                      <p className="text-xs text-[color:var(--muted)]">
                        Location: {(item.rentalPriceCents / 100).toFixed(2)} &euro; &bull; Caution: {(item.depositPriceCents / 100).toFixed(2)} &euro;
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-[color:var(--muted)]"
                      href={`/admin/stock/${item.id}`}
                    >
                      Voir la fiche
                    </a>
                    <span className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
                      Modifier
                    </span>
                    <form action={deleteItem}>
                      <input type="hidden" name="id" value={item.id} />
                      <button
                        className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-[color:var(--muted)] hover:border-black/20"
                        type="submit"
                      >
                        Supprimer
                      </button>
                    </form>
                  </div>
                </summary>
                <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="grid gap-4">
                    <form action={updateItem} className="grid gap-3">
                      <input type="hidden" name="id" value={item.id} />
                      <input
                        className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                        placeholder="Nom de l'article"
                        name="name"
                        defaultValue={item.name}
                        required
                      />
                      <select
                        className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                        name="categoryId"
                        defaultValue={item.categoryId ?? ""}
                      >
                        <option value="">Choisir une cat&eacute;gorie</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                      <div className="grid gap-3">
                        {item.images.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {item.images.map((image) => (
                              <img
                                key={image.id}
                                src={image.url}
                                alt={item.name}
                                className="h-16 w-16 rounded-2xl border border-black/10 object-cover"
                              />
                            ))}
                          </div>
                        )}
                        <div className="grid gap-3 sm:grid-cols-3">
                          <AdminImageInput label="Ajouter image 1" name="imageData" />
                          <AdminImageInput label="Ajouter image 2" name="imageData" />
                          <AdminImageInput label="Ajouter image 3" name="imageData" />
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <input
                          className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                          placeholder="Quantit&eacute;"
                          name="totalQty"
                          type="number"
                          min="0"
                          defaultValue={item.totalQty}
                        />
                        <input
                          className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                          placeholder="Prix location"
                          name="rentalPriceCents"
                          type="number"
                          min="0"
                          step="0.01"
                          defaultValue={(item.rentalPriceCents / 100).toFixed(2)}
                        />
                        <input
                          className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                          placeholder="Caution"
                          name="depositPriceCents"
                          type="number"
                          min="0"
                          step="0.01"
                          defaultValue={(item.depositPriceCents / 100).toFixed(2)}
                        />
                      </div>
                      <button
                        className="rounded-full bg-[color:var(--ink)] px-6 py-3 text-sm font-semibold text-white"
                        type="submit"
                      >
                        Enregistrer les modifications
                      </button>
                    </form>
                    <form action={deleteItem}>
                      <input type="hidden" name="id" value={item.id} />
                      <button
                        className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-[color:var(--muted)] hover:border-black/20"
                        type="submit"
                      >
                        Supprimer
                      </button>
                    </form>
                  </div>
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}


