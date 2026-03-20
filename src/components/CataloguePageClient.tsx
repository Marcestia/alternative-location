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

type SectionVM = {
  id: string;
  label: string;
  description: string | null;
  items: ItemVM[];
};

const euroFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

const formatEuro = (cents: number) => euroFormatter.format(cents / 100);

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
    <article
      className={`group flex h-full flex-col rounded-[32px] border bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(248,242,236,0.94))] p-4 shadow-[0_24px_50px_rgba(30,25,20,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_60px_rgba(30,25,20,0.1)] sm:p-5 ${
        isSelected
          ? "border-emerald-500 ring-2 ring-emerald-100"
          : "border-black/5 hover:border-black/10"
      }`}
    >
      <div className="relative overflow-hidden rounded-[24px] bg-[color:var(--surface)]">
        <ImageLightbox
          src={item.imageUrl || "/vitrine/hero.jpg"}
          alt={item.name}
          className="h-44 w-full sm:h-52"
        />
        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-center justify-between gap-3">
          <span className="rounded-full bg-white/94 px-3 py-1 text-[11px] font-semibold text-[color:var(--ink)] shadow-[0_8px_18px_rgba(30,25,20,0.12)] backdrop-blur">
            {formatEuro(item.rentalPriceCents)}
          </span>
          <span className="rounded-full bg-[color:var(--ink)]/78 px-3 py-1 text-[11px] font-semibold text-white shadow-[0_8px_18px_rgba(30,25,20,0.16)] backdrop-blur">
            {item.totalQty} dispo
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-1 flex-col">
        <div>
          <h3 className="text-base font-semibold leading-tight text-[color:var(--ink)] sm:text-lg">
            {item.name}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
            Location à l'unité. Cliquez sur l'image pour l'agrandir.
          </p>
        </div>

        <div className="mt-5 pt-1">
          {!isSelected ? (
            <button
              type="button"
              onClick={() => onAdd(item)}
              className="w-full rounded-full border border-black/10 bg-[color:var(--surface)]/65 px-4 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:-translate-y-0.5 hover:border-black/20 hover:bg-white"
            >
              Ajouter au calcul
            </button>
          ) : (
            <div className="rounded-[24px] border border-emerald-200 bg-emerald-50/90 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
              <div className="flex items-center justify-between gap-2 rounded-full border border-emerald-200 bg-white/90 px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => onRemove(item)}
                  className="h-9 w-9 rounded-full bg-emerald-50 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                  aria-label={`Retirer ${item.name}`}
                >
                  -
                </button>
                <div className="text-center">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-700/75">
                    Quantité
                  </p>
                  <p className="text-sm font-semibold text-emerald-800">{quantity}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onAdd(item)}
                  disabled={!canIncrease}
                  className="h-9 w-9 rounded-full bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={`Ajouter ${item.name}`}
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
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

  const sections = useMemo<SectionVM[]>(() => {
    const baseSections = grouped.map(({ category, items }) => ({
      id: `cat-${category.slug}`,
      label: category.name,
      description: category.description,
      items,
    }));

    const decoratedSections = decorCategories.length
      ? [
          {
            id: "cat-decoration-mobilier",
            label: "Décoration & mobilier",
            description: decorDescription,
            items: decorItems,
          },
          ...baseSections,
        ]
      : baseSections;

    if (!uncategorized.length) return decoratedSections;

    return [
      ...decoratedSections,
      {
        id: "cat-autres",
        label: "Autres articles",
        description: null,
        items: uncategorized,
      },
    ];
  }, [decorCategories.length, decorDescription, decorItems, grouped, uncategorized]);

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
          Retour à l'accueil
        </a>
        <button
          type="button"
          onClick={clearSelection}
          disabled={selectedCount === 0}
          className="rounded-full border border-black/10 px-3 py-2 text-xs font-semibold text-[color:var(--muted)] transition hover:-translate-y-0.5 hover:border-black/30 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Réinitialiser
        </button>
      </div>

      <div className="rounded-[30px] border border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,240,233,0.96))] p-5 shadow-[0_20px_44px_rgba(30,25,20,0.08)]">
        <p className="text-[11px] uppercase tracking-[0.26em] text-[color:var(--muted)]">
          Simulation
        </p>
        <p className="mt-3 text-sm font-semibold text-[color:var(--ink)]">
          {selectedCount} article(s) sélectionné(s)
        </p>
        <p className="mt-2 text-3xl font-semibold text-[color:var(--ink)]">
          {formatEuro(totalCents)}
        </p>
        <p className="mt-2 text-xs leading-5 text-[color:var(--muted)]">
          Estimation de location hors livraison et caution.
        </p>

        {selectedItems.length > 0 ? (
          <div className="mt-4 max-h-[50vh] space-y-2 overflow-y-auto pr-1">
            {selectedItems.map((item) => (
              <div
                key={item.id}
                className="rounded-[20px] border border-black/10 bg-white/92 p-3 shadow-[0_10px_22px_rgba(20,18,14,0.05)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-[13px] font-semibold leading-5 text-[color:var(--ink)]">
                      {item.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[color:var(--muted)]">
                      {formatEuro(item.rentalPriceCents)} / unité
                    </p>
                  </div>
                  <p className="whitespace-nowrap text-[12px] font-semibold text-[color:var(--ink)]">
                    {formatEuro(item.rentalPriceCents * item.quantity)}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-1.5">
                  <button
                    type="button"
                    onClick={() => removeItem(item)}
                    className="h-8 w-8 rounded-full bg-white text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100"
                    aria-label={`Retirer ${item.name}`}
                  >
                    -
                  </button>
                  <span className="text-[11px] font-semibold text-emerald-800">
                    Quantité : {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => addItem(item)}
                    disabled={item.quantity >= Math.max(item.totalQty, 1)}
                    className="h-8 w-8 rounded-full bg-white text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={`Ajouter ${item.name}`}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-[22px] border border-dashed border-black/10 bg-white/70 p-4 text-xs leading-6 text-[color:var(--muted)]">
            Sélectionnez des articles pour afficher le détail ici.
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(216,111,63,0.12),transparent_20%),radial-gradient(circle_at_top_right,rgba(203,182,160,0.18),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.92),rgba(247,240,233,0.98))] px-3 pb-28 pt-4 sm:px-5 sm:pb-32 lg:px-8 lg:pt-8">
      <a
        href="/"
        className="fixed left-4 top-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white/92 text-xl font-semibold text-[color:var(--ink)] shadow-[0_16px_34px_rgba(30,25,20,0.16)] backdrop-blur transition hover:-translate-y-0.5 hover:border-black/20 hover:bg-white sm:left-5 sm:top-5"
        aria-label="Revenir à l'accueil"
      >
        ←
      </a>

      <div className="mx-auto w-full max-w-[1680px] space-y-6 xl:space-y-8">
        <header
          id="contact"
          className="relative overflow-hidden rounded-[40px] border border-black/5 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(247,240,233,0.94))] px-5 py-6 shadow-[0_34px_70px_rgba(30,25,20,0.08)] sm:px-8 sm:py-8 xl:px-10 xl:py-10"
        >
          <div className="pointer-events-none absolute -left-20 top-0 h-56 w-56 rounded-full bg-[color:var(--accent)]/10 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-[color:var(--accent-2)]/16 blur-3xl" />

          <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_380px] xl:items-start">
            <div>
              <p className="text-xs uppercase tracking-[0.34em] text-[color:var(--accent-2)]">
                Catalogue
              </p>
              <h1 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight sm:text-4xl xl:text-5xl">
                Une présentation plus élégante pour préparer votre location.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[color:var(--muted)] sm:text-base">
                Parcourez chaque univers, agrandissez les visuels, ajoutez les
                quantités dans votre simulation puis contactez-nous pour recevoir
                un devis adapté à votre événement.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="/#contact"
                  className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(217,119,55,0.35)] transition hover:-translate-y-0.5 hover:brightness-95"
                >
                  Demander un devis
                </a>
                <a
                  href="/"
                  className="rounded-full border border-black/10 bg-white/90 px-5 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:-translate-y-0.5 hover:border-black/20"
                >
                  Retour à l'accueil
                </a>
              </div>

            </div>

            <div className="grid gap-3 xl:grid-cols-1">
              <div className="rounded-[28px] border border-white/80 bg-white/88 p-5 shadow-[0_18px_36px_rgba(30,25,20,0.06)]">
                <p className="text-[11px] uppercase tracking-[0.26em] text-[color:var(--accent-2)]/80">
                  Contact
                </p>
                <p className="mt-2 text-lg font-semibold text-[color:var(--ink)]">Téléphone, e-mail ou formulaire</p>
                <p className="mt-2 text-sm text-[color:var(--muted)]">
                  Nous préparons le devis avec vous, selon les quantités et les dates.
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  <a
                    className="rounded-full bg-[color:var(--accent)] px-4 py-2.5 text-center text-xs font-semibold text-white shadow-[0_10px_22px_rgba(217,119,55,0.35)] transition hover:-translate-y-0.5 hover:brightness-95"
                    href="/#contact"
                  >
                    Remplir le formulaire
                  </a>
                  <div className="flex flex-col gap-2 sm:flex-row xl:flex-col">
                    <a
                      className="rounded-full border border-black/10 px-4 py-2.5 text-center text-xs font-semibold text-[color:var(--muted)] transition hover:-translate-y-0.5 hover:border-black/30 hover:bg-white"
                      href="mailto:alternativelocation@free.fr"
                    >
                      Envoyer un e-mail
                    </a>
                    <a
                      className="rounded-full border border-black/10 px-4 py-2.5 text-center text-xs font-semibold text-[color:var(--muted)] transition hover:-translate-y-0.5 hover:border-black/30 hover:bg-white"
                      href="tel:+33621205432"
                    >
                      Appeler
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="xl:grid xl:grid-cols-[230px_minmax(0,1fr)_360px] xl:gap-8">
          <aside className="hidden xl:block">
            <div className="sticky top-6 space-y-4">
              <div className="rounded-[30px] border border-black/8 bg-white/95 p-5 shadow-[0_22px_45px_rgba(30,25,20,0.08)]">
                <p className="text-[11px] uppercase tracking-[0.28em] text-[color:var(--muted)]">
                  Navigation
                </p>
                <div className="mt-4 space-y-2">
                  {sections.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                    className="block rounded-2xl border border-transparent bg-[color:var(--surface)]/65 px-4 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:border-black/10 hover:bg-white"
                  >
                    {section.label}
                  </a>
                ))}
                <a
                  href="#contact"
                  className="block rounded-2xl border border-transparent bg-[color:var(--surface)]/65 px-4 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:border-black/10 hover:bg-white"
                >
                  Nous contacter
                </a>
              </div>
            </div>
            </div>
          </aside>

          <main className="space-y-6 sm:space-y-8 xl:space-y-10">
            {sections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-24 rounded-[34px] border border-black/5 bg-white/88 p-5 shadow-[0_18px_40px_rgba(30,25,20,0.06)] sm:p-7"
              >
                <div className="flex flex-wrap items-end justify-between gap-4 border-b border-black/6 pb-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                      {section.label}
                    </p>
                    {section.description && (
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--muted)]">
                        {section.description}
                      </p>
                    )}
                  </div>
                  <div className="rounded-full border border-black/8 bg-[color:var(--surface)]/70 px-4 py-2 text-xs font-semibold text-[color:var(--muted)]">
                    {section.items.length} article(s)
                  </div>
                </div>

                {section.items.length === 0 ? (
                  <div className="mt-5 rounded-[24px] border border-dashed border-black/10 bg-[color:var(--surface)] p-6 text-sm text-[color:var(--muted)]">
                    Aucun article pour le moment.
                  </div>
                ) : (
                  <div className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-3 2xl:gap-6">
                    {section.items.map((item) => (
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
          </main>

          <aside className="mt-10 hidden xl:block xl:mt-0">
            <div className="sticky top-6">
              <div className="rounded-[32px] border border-black/10 bg-white/96 p-4 shadow-[0_24px_50px_rgba(20,18,14,0.12)] backdrop-blur">
                {summaryContent}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 px-4 xl:hidden">
        <div className="pointer-events-auto mx-auto max-w-xl rounded-full border border-black/10 bg-white/96 p-2 shadow-[0_20px_40px_rgba(20,18,14,0.16)] backdrop-blur">
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
          className="fixed inset-0 z-40 bg-black/40 px-4 py-6 xl:hidden"
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
                <p className="text-lg font-semibold">{selectedCount} article(s)</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileSummaryOpen(false)}
                className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-[color:var(--muted)]"
              >
                Fermer
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">{summaryContent}</div>
          </div>
        </div>
      )}
    </div>
  );
}
