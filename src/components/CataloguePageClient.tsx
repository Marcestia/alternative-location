"use client";

import { useEffect, useMemo, useState } from "react";
import ImageLightbox from "@/components/ImageLightbox";

type CategoryVM = {
  id: string;
  name: string;
  description: string | null;
  slug: string;
};

type ItemVM = {
  id: string;
  name: string;
  rentalPriceCents: number;
  totalQty: number;
  imageUrl: string | null;
  categoryId: string | null;
};

type SelectedItemVM = ItemVM & {
  quantity: number;
};

type GroupVM = {
  category: CategoryVM;
  items: ItemVM[];
};

type CataloguePageClientProps = {
  otherCategories: CategoryVM[];
  decorCategories: CategoryVM[];
  grouped: GroupVM[];
  decorItems: ItemVM[];
  decorDescription: string;
  uncategorized: ItemVM[];
};

const formatEuro = (cents: number) => `${(cents / 100).toFixed(2)} EUR`;

function ItemCard({
  item,
  quantity,
  onAdd,
  onRemove,
}: {
  item: ItemVM;
  quantity: number;
  onAdd: (item: ItemVM) => void;
  onRemove: (item: ItemVM) => void;
}) {
  const isSelected = quantity > 0;
  const canIncrease = quantity < Math.max(item.totalQty, 1);

  return (
    <div
      className={`rounded-[28px] border bg-white p-3 shadow-[0_18px_30px_rgba(30,25,20,0.06)] transition hover:-translate-y-1 hover:scale-[1.01] sm:p-4 ${
        isSelected ? "border-emerald-500 ring-2 ring-emerald-100" : "border-black/5"
      }`}
    >
      <div className="overflow-hidden rounded-2xl bg-[color:var(--surface)]">
        <ImageLightbox
          src={item.imageUrl || "/vitrine/hero.jpg"}
          alt={item.name}
          className="h-36 w-full sm:h-40"
        />
      </div>
      <p className="mt-4 text-sm font-semibold sm:text-base">{item.name}</p>
      <p className="mt-1 text-xs text-[color:var(--muted)]">
        {formatEuro(item.rentalPriceCents)} - {item.totalQty} dispo
      </p>
      {!isSelected ? (
        <button
          type="button"
          onClick={() => onAdd(item)}
          className="mt-3 w-full rounded-full border border-black/10 px-3 py-2 text-xs font-semibold text-[color:var(--muted)] transition hover:border-black/20"
        >
          Ajouter au calcul
        </button>
      ) : (
        <div className="mt-3 flex items-center justify-between rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1">
          <button
            type="button"
            onClick={() => onRemove(item)}
            className="h-8 w-8 rounded-full bg-white text-sm font-semibold text-emerald-700 shadow-sm"
          >
            -
          </button>
          <span className="text-xs font-semibold text-emerald-800">
            Quantite: {quantity}
          </span>
          <button
            type="button"
            onClick={() => onAdd(item)}
            disabled={!canIncrease}
            className="h-8 w-8 rounded-full bg-white text-sm font-semibold text-emerald-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}

export default function CataloguePageClient({
  otherCategories,
  decorCategories,
  grouped,
  decorItems,
  decorDescription,
  uncategorized,
}: CataloguePageClientProps) {
  const [selected, setSelected] = useState<Record<string, SelectedItemVM>>({});
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  const selectedItems = useMemo(() => Object.values(selected), [selected]);
  const selectedCount = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.quantity, 0),
    [selectedItems]
  );
  const totalCents = useMemo(
    () =>
      selectedItems.reduce(
        (sum, item) => sum + item.rentalPriceCents * item.quantity,
        0
      ),
    [selectedItems]
  );

  useEffect(() => {
    if (!mobileSummaryOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileSummaryOpen]);

  const addItem = (item: ItemVM) => {
    setSelected((prev) => {
      const existing = prev[item.id];
      if (!existing) return { ...prev, [item.id]: { ...item, quantity: 1 } };
      const nextQty = Math.min(existing.quantity + 1, Math.max(item.totalQty, 1));
      return { ...prev, [item.id]: { ...existing, quantity: nextQty } };
    });
  };

  const removeItem = (item: ItemVM) => {
    setSelected((prev) => {
      const existing = prev[item.id];
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        const copy = { ...prev };
        delete copy[item.id];
        return copy;
      }
      return {
        ...prev,
        [item.id]: { ...existing, quantity: existing.quantity - 1 },
      };
    });
  };

  const clearSelection = () => setSelected({});

  const summaryContent = (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <a
          href="/"
          className="inline-flex rounded-full bg-[color:var(--accent)] px-4 py-2 text-xs font-semibold text-white shadow-[0_10px_22px_rgba(217,119,55,0.35)] transition hover:-translate-y-0.5 hover:brightness-95"
        >
          Retour a l'accueil
        </a>
        <button
          type="button"
          onClick={clearSelection}
          disabled={selectedCount === 0}
          className="rounded-full border border-black/10 px-3 py-2 text-xs font-semibold text-[color:var(--muted)] transition hover:-translate-y-0.5 hover:border-black/30 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reinitialiser
        </button>
      </div>

      <div className="rounded-2xl border border-black/5 bg-[color:var(--surface)] p-4">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--muted)]">
          Simulateur rapide
        </p>
        <p className="mt-2 text-sm font-semibold">
          {selectedCount} article(s) selectionne(s)
        </p>
        <p className="mt-2 text-2xl font-semibold text-[color:var(--ink)]">
          Total: {formatEuro(totalCents)}
        </p>
        <p className="mt-2 text-xs text-[color:var(--muted)]">
          Estimation location hors livraison et caution.
        </p>

        {selectedItems.length > 0 ? (
          <div className="mt-3 max-h-[48vh] space-y-2 overflow-y-auto pr-1">
            {selectedItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-black/10 bg-white/90 p-2.5 shadow-[0_8px_18px_rgba(20,18,14,0.05)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-[13px] font-semibold leading-4 text-[color:var(--ink)]">
                      {item.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[color:var(--muted)]">
                      {formatEuro(item.rentalPriceCents)} / unite
                    </p>
                  </div>
                  <p className="whitespace-nowrap text-[12px] font-semibold text-[color:var(--ink)]">
                    {formatEuro(item.rentalPriceCents * item.quantity)}
                  </p>
                </div>
                <div className="mt-2 flex items-center justify-between rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-1">
                  <button
                    type="button"
                    onClick={() => removeItem(item)}
                    className="h-7 w-7 rounded-full bg-white text-xs font-semibold text-emerald-700 shadow-sm"
                    aria-label={`Retirer ${item.name}`}
                  >
                    -
                  </button>
                  <span className="text-[11px] font-semibold text-emerald-800">
                    Quantite: {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => addItem(item)}
                    disabled={item.quantity >= Math.max(item.totalQty, 1)}
                    className="h-7 w-7 rounded-full bg-white text-xs font-semibold text-emerald-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={`Ajouter ${item.name}`}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-black/10 bg-white/70 p-4 text-xs text-[color:var(--muted)]">
            Selectionnez des articles pour afficher le detail ici.
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[color:var(--background)] px-4 pb-28 pt-6 sm:px-6 sm:py-10 lg:px-6 lg:py-12">
      <div className="mx-auto w-full max-w-6xl lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
        <div className="space-y-6 sm:space-y-8 lg:space-y-10">
          <header className="rounded-[32px] border border-black/5 bg-white/80 p-5 shadow-[0_15px_30px_rgba(22,18,14,0.08)] sm:p-8">
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
              Catalogue
            </p>
            <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
              Decouvrez nos articles disponibles a la location.
            </h1>
            <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
              Pour toute demande, contactez-nous par telephone ou par email en
              decrivant votre besoin. Nous construisons le devis avec vous.
            </p>
            <div className="-mx-1 mt-5 flex gap-2 overflow-x-auto px-1 pb-2">
              {otherCategories.map((category) => (
                <a
                  key={category.id}
                  href={`#cat-${category.slug}`}
                  className="shrink-0 rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold text-[color:var(--muted)] transition hover:-translate-y-0.5 hover:border-black/30"
                >
                  {category.name}
                </a>
              ))}
              {decorCategories.length > 0 && (
                <a
                  href="#cat-decoration-mobilier"
                  className="shrink-0 rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold text-[color:var(--muted)] transition hover:-translate-y-0.5 hover:border-black/30"
                >
                  Decoration & mobilier
                </a>
              )}
              <a
                href="#contact"
                className="shrink-0 rounded-full bg-[color:var(--accent)] px-4 py-2 text-xs font-semibold text-white shadow-[0_10px_22px_rgba(217,119,55,0.35)] transition hover:-translate-y-0.5 hover:brightness-95"
              >
                Nous contacter
              </a>
            </div>
          </header>

          <section
            id="contact"
            className="rounded-[32px] border border-black/5 bg-white/80 p-5 sm:p-6"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                  Contact
                </p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                  Expliquez votre besoin et vos dates, meme si un article semble
                  indisponible.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <a
                  className="rounded-full bg-[color:var(--accent)] px-5 py-2 text-center text-xs font-semibold text-white shadow-[0_10px_22px_rgba(217,119,55,0.35)] transition hover:-translate-y-0.5 hover:brightness-95"
                  href="/#contact"
                >
                  Remplir le formulaire
                </a>
                <a
                  className="rounded-full border border-black/10 px-5 py-2 text-center text-xs font-semibold text-[color:var(--muted)] transition hover:-translate-y-0.5 hover:border-black/30 hover:bg-white"
                  href="mailto:alternativelocation@free.fr"
                >
                  Envoyer un email
                </a>
                <a
                  className="rounded-full border border-black/10 px-5 py-2 text-center text-xs font-semibold text-[color:var(--muted)] transition hover:-translate-y-0.5 hover:border-black/30 hover:bg-white"
                  href="tel:+33621205432"
                >
                  Appeler
                </a>
              </div>
            </div>
          </section>

          {decorCategories.length > 0 && (
            <section
              id="cat-decoration-mobilier"
              className="rounded-[32px] border border-black/5 bg-white/80 p-5 sm:p-8"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                  Decoration & mobilier
                </p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                  {decorDescription}
                </p>
              </div>
              {decorItems.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-black/10 bg-[color:var(--surface)] p-6 text-sm text-[color:var(--muted)]">
                  Aucun article pour le moment.
                </div>
              ) : (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
                  {decorItems.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      quantity={selected[item.id]?.quantity || 0}
                      onAdd={addItem}
                      onRemove={removeItem}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {grouped.map(({ category, items }) => (
            <section
              key={category.id}
              id={`cat-${category.slug}`}
              className="rounded-[32px] border border-black/5 bg-white/80 p-5 sm:p-8"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                  {category.name}
                </p>
                {category.description && (
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                    {category.description}
                  </p>
                )}
              </div>
              {items.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-black/10 bg-[color:var(--surface)] p-6 text-sm text-[color:var(--muted)]">
                  Aucun article pour le moment.
                </div>
              ) : (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
                  {items.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      quantity={selected[item.id]?.quantity || 0}
                      onAdd={addItem}
                      onRemove={removeItem}
                    />
                  ))}
                </div>
              )}
            </section>
          ))}

          {uncategorized.length > 0 && (
            <section className="rounded-[32px] border border-black/5 bg-white/80 p-5 sm:p-8">
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                Autres
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
                {uncategorized.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    quantity={selected[item.id]?.quantity || 0}
                    onAdd={addItem}
                    onRemove={removeItem}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="mt-10 hidden lg:mt-0 lg:block">
          <div className="lg:sticky lg:top-6">
            <div className="rounded-3xl border border-black/10 bg-white/95 p-4 shadow-[0_20px_40px_rgba(20,18,14,0.12)] backdrop-blur">
              {summaryContent}
            </div>
          </div>
        </aside>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 px-4 lg:hidden">
        <div className="pointer-events-auto mx-auto max-w-lg rounded-full border border-black/10 bg-white/96 p-2 shadow-[0_20px_40px_rgba(20,18,14,0.16)] backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 pl-2">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Simulation
              </p>
              <p className="truncate text-sm font-semibold">
                {selectedCount} article(s) - {formatEuro(totalCents)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMobileSummaryOpen(true)}
              className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-xs font-semibold text-white shadow-[0_10px_22px_rgba(217,119,55,0.35)]"
            >
              Voir
            </button>
          </div>
        </div>
      </div>

      {mobileSummaryOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 px-4 py-6 lg:hidden"
          onClick={() => setMobileSummaryOpen(false)}
        >
          <div
            className="mx-auto flex h-full max-w-lg flex-col rounded-[32px] bg-white p-4 shadow-[0_30px_70px_rgba(20,18,14,0.2)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">
                  Votre simulation
                </p>
                <p className="text-lg font-semibold">
                  {selectedCount} article(s)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMobileSummaryOpen(false)}
                className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-[color:var(--muted)]"
              >
                Fermer
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              {summaryContent}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
