"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

type CategoryVM = {
  id: string;
  name: string;
  description: string | null;
  slug: string;
};

type ItemVM = {
  id: string;
  name: string;
  description: string | null;
  rentalPriceCents: number;
  totalQty: number;
  imageUrl: string | null;
  images: { url: string; alt: string | null }[];
  categoryId: string | null;
};

type SelectedItemVM = ItemVM & {
  quantity: number;
};

type SectionVM = {
  id: string;
  label: string;
  description: string | null;
  group: {
    key: string;
    label: string;
    slug: string;
    description: string;
  };
  items: ItemVM[];
};

type CataloguePageClientProps = {
  sections: SectionVM[];
  uncategorized: ItemVM[];
};

const euroFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

const formatEuro = (cents: number) => euroFormatter.format(cents / 100);

function CatalogueItemModal({
  item,
  quantity,
  onClose,
  onAdd,
  onRemove,
}: {
  item: ItemVM;
  quantity: number;
  onClose: () => void;
  onAdd: (item: ItemVM) => void;
  onRemove: (item: ItemVM) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const images = item.images.length
    ? item.images
    : [{ url: item.imageUrl || "/vitrine/hero.jpg", alt: item.name }];
  const canIncrease = quantity < Math.max(item.totalQty, 1);

  useEffect(() => {
    setMounted(true);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") setActiveIndex((current) => (current + 1) % images.length);
      if (event.key === "ArrowLeft") setActiveIndex((current) => (current - 1 + images.length) % images.length);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [images.length, onClose]);

  useEffect(() => {
    setActiveIndex(0);
  }, [item.id]);

  if (!mounted) return null;

  const activeImage = images[activeIndex];

  return createPortal(
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-[rgba(16,12,9,0.76)] p-3 backdrop-blur-md sm:p-5" onClick={onClose} role="dialog" aria-modal="true">
      <div className="relative w-full max-w-6xl overflow-hidden rounded-[30px] border border-white/10 bg-[#fbf7f2] shadow-[0_35px_120px_rgba(0,0,0,0.35)]" onClick={(event) => event.stopPropagation()}>
        <button type="button" onClick={onClose} className="absolute right-4 top-4 z-10 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-[color:var(--ink)] transition hover:bg-white">
          Fermer
        </button>
        <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="bg-[#f1ebe4] p-4 sm:p-6">
            <div className="relative overflow-hidden rounded-[24px] bg-white shadow-[0_16px_35px_rgba(30,25,20,0.08)]">
              <img src={activeImage.url} alt={activeImage.alt || item.name} className="max-h-[68vh] w-full object-contain bg-white" />
              {images.length > 1 ? (
                <>
                  <button type="button" onClick={() => setActiveIndex((current) => (current - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg font-semibold text-[color:var(--ink)] shadow-[0_12px_30px_rgba(0,0,0,0.12)] transition hover:bg-white" aria-label="Image precedente">&larr;</button>
                  <button type="button" onClick={() => setActiveIndex((current) => (current + 1) % images.length)} className="absolute right-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg font-semibold text-[color:var(--ink)] shadow-[0_12px_30px_rgba(0,0,0,0.12)] transition hover:bg-white" aria-label="Image suivante">&rarr;</button>
                </>
              ) : null}
            </div>
            {images.length > 1 ? (
              <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
                {images.map((image, index) => (
                  <button key={`${item.id}-${image.url}-${index}`} type="button" onClick={() => setActiveIndex(index)} className={`overflow-hidden rounded-[18px] border bg-white transition ${index === activeIndex ? "border-[color:var(--accent)] ring-2 ring-[color:var(--accent)]/15" : "border-black/8 hover:border-black/20"}`} aria-label={`Voir l'image ${index + 1} de ${item.name}`}>
                    <img src={image.url} alt={image.alt || `${item.name} ${index + 1}`} className="h-20 w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex flex-col justify-between gap-6 p-5 sm:p-8">
            <div>
              <p className="text-xs uppercase tracking-[0.34em] text-[color:var(--accent-2)]">Article du catalogue</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight text-[color:var(--ink)]">{item.name}</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-[color:var(--surface)] px-3 py-1 text-xs font-semibold text-[color:var(--ink)]">{formatEuro(item.rentalPriceCents)}</span>
                <span className="rounded-full bg-[color:var(--ink)]/8 px-3 py-1 text-xs font-semibold text-[color:var(--ink)]">{item.totalQty} disponible{item.totalQty > 1 ? "s" : ""}</span>
                <span className="rounded-full bg-[color:var(--accent)]/10 px-3 py-1 text-xs font-semibold text-[color:var(--accent)]">{images.length} photo{images.length > 1 ? "s" : ""}</span>
              </div>
              <p className="mt-5 text-sm leading-7 text-[color:var(--muted)]">{item.description || "Consultez toutes les photos de cet article puis ajoutez la quantite souhaitee a votre estimation."}</p>
            </div>
            <div className="space-y-4 rounded-[24px] border border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,240,233,0.94))] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted)]">Quantit? s?lectionn?e</p>
                  <p className="mt-1 text-2xl font-semibold text-[color:var(--ink)]">{quantity}</p>
                </div>
                <p className="text-right text-sm font-semibold text-[color:var(--ink)]">{formatEuro(item.rentalPriceCents * quantity)}</p>
              </div>
              <div className="flex items-center justify-between rounded-full border border-emerald-200 bg-emerald-50 px-2 py-2">
                <button type="button" onClick={() => onRemove(item)} disabled={quantity === 0} className="h-10 w-10 rounded-full bg-white text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-40">-</button>
                <button type="button" onClick={() => onAdd(item)} disabled={!canIncrease} className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40">Ajouter a l'estimation</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ItemCard({
  item,
  quantity,
  onAdd,
  onRemove,
  onOpenDetails,
}: {
  item: ItemVM;
  quantity: number;
  onAdd: (item: ItemVM) => void;
  onRemove: (item: ItemVM) => void;
  onOpenDetails: (item: ItemVM) => void;
}) {
  const isSelected = quantity > 0;
  const canIncrease = quantity < Math.max(item.totalQty, 1);

  return (
    <article className={`group flex h-full flex-col rounded-[32px] border bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(248,242,236,0.94))] p-4 shadow-[0_24px_50px_rgba(30,25,20,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_60px_rgba(30,25,20,0.1)] sm:p-5 ${isSelected ? "border-emerald-500 ring-2 ring-emerald-100" : "border-black/5 hover:border-black/10"}`}>
      <div className="relative overflow-hidden rounded-[24px] bg-[color:var(--surface)]">
          <button type="button" onClick={() => onOpenDetails(item)} className="block h-44 w-full text-left sm:h-52" aria-label={`Voir le detail de ${item.name}`}>
          <img src={item.imageUrl || "/vitrine/hero.jpg"} alt={item.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" draggable={false} />
        </button>
        {item.images.length > 1 ? (
          <>
            <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-[rgba(18,14,11,0.72)] px-3 py-1 text-[11px] font-semibold text-white shadow-[0_10px_18px_rgba(0,0,0,0.18)]">
              {item.images.length} photos
            </div>
            <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-2 shadow-[0_10px_18px_rgba(0,0,0,0.12)]">
              {item.images.slice(0, 3).map((image, index) => (
                <span
                  key={`${item.id}-thumb-${index}`}
                  className="h-2.5 w-2.5 rounded-full bg-[color:var(--accent)]/85"
                  aria-hidden="true"
                />
              ))}
              {item.images.length > 3 ? (
                <span className="pl-1 text-[10px] font-semibold text-[color:var(--ink)]">
                  +{item.images.length - 3}
                </span>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
      <div className="mt-4 flex flex-1 flex-col">
        <div>
          <h3 className="text-base font-semibold leading-tight text-[color:var(--ink)] sm:text-lg">{item.name}</h3>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{item.images.length > 1 ? `${item.images.length} photos disponibles. Ouvrez la fiche pour toutes les voir.` : "Location a l'unite. Ouvrez la fiche pour voir le detail."}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-[color:var(--surface)] px-3 py-1 text-[11px] font-semibold text-[color:var(--ink)]">{formatEuro(item.rentalPriceCents)}</span>
            <span className="rounded-full bg-[color:var(--ink)]/8 px-3 py-1 text-[11px] font-semibold text-[color:var(--ink)]">{item.totalQty} disponible{item.totalQty > 1 ? "s" : ""}</span>
          </div>
        </div>
        <div className="mt-5 pt-1">
          <button type="button" onClick={() => onOpenDetails(item)} className="mb-3 w-full rounded-full border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:-translate-y-0.5 hover:border-black/20">Voir le detail</button>
          {!isSelected ? (
            <button type="button" onClick={() => onAdd(item)} className="w-full rounded-full border border-black/10 bg-[color:var(--surface)]/65 px-4 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:-translate-y-0.5 hover:border-black/20 hover:bg-white">Ajouter au calcul</button>
          ) : (
            <div className="rounded-[24px] border border-emerald-200 bg-emerald-50/90 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
              <div className="flex items-center justify-between gap-2 rounded-full border border-emerald-200 bg-white/90 px-2 py-1.5">
                <button type="button" onClick={() => onRemove(item)} className="h-9 w-9 rounded-full bg-emerald-50 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100" aria-label={`Retirer ${item.name}`}>-</button>
                <div className="text-center">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-700/75">Quantite</p>
                  <p className="text-sm font-semibold text-emerald-800">{quantity}</p>
                </div>
                <button type="button" onClick={() => onAdd(item)} disabled={!canIncrease} className="h-9 w-9 rounded-full bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40" aria-label={`Ajouter ${item.name}`}>+</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function CataloguePageClient({
  sections,
  uncategorized,
}: CataloguePageClientProps) {
  const [selected, setSelected] = useState<Record<string, SelectedItemVM>>({});
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

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
  const displaySections = useMemo<SectionVM[]>(() => {
    if (!uncategorized.length) return sections;

    return [
      ...sections,
      {
        id: "cat-autres",
        label: "Autres articles",
        description: null,
        group: {
          key: "AUTRES",
          label: "Autres",
          slug: "autres",
          description: "Articles non rattaches a une sous-categorie.",
        },
        items: uncategorized,
      },
    ];
  }, [sections, uncategorized]);
  const allItems = useMemo(
    () => displaySections.flatMap((section) => section.items),
    [displaySections]
  );
  const activeItem = useMemo(
    () => allItems.find((item) => item.id === activeItemId) ?? null,
    [activeItemId, allItems]
  );
  const sectionGroups = useMemo(() => {
    const groups = new Map<
      string,
      {
        key: string;
        label: string;
        slug: string;
        description: string;
        sections: SectionVM[];
      }
    >();

    for (const section of displaySections) {
      const existing = groups.get(section.group.slug);
      if (existing) {
        existing.sections.push(section);
      } else {
        groups.set(section.group.slug, {
          ...section.group,
          sections: [section],
        });
      }
    }

    return Array.from(groups.values());
  }, [displaySections]);

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
                Choisissez facilement les articles adaptés à votre événement.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[color:var(--muted)] sm:text-base">
                Parcourez chaque univers, agrandissez les visuels, ajoutez les
                quantités dans votre simulation puis contactez-nous pour recevoir
                un devis adapté à votre événement.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="/"
                  className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(217,119,55,0.35)] transition hover:-translate-y-0.5 hover:brightness-95"
                >
                  Retour à l'accueil
                </a>
                <a
                  href="/#contact"
                  className="rounded-full border border-black/10 bg-white/90 px-5 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:-translate-y-0.5 hover:border-black/20"
                >
                  Demander un devis
                </a>
              </div>
            </div>

            <div className="grid gap-3 xl:grid-cols-1">
              <div className="rounded-[28px] border border-white/80 bg-white/88 p-5 shadow-[0_18px_36px_rgba(30,25,20,0.06)]">
                <p className="text-[11px] uppercase tracking-[0.26em] text-[color:var(--accent-2)]/80">
                  Contact
                </p>
                <p className="mt-2 text-lg font-semibold text-[color:var(--ink)]">
                  Téléphone, e-mail ou formulaire
                </p>
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
                  {sectionGroups.map((group) => (
                    <div key={group.slug} className="space-y-2">
                      <a
                        href={`#group-${group.slug}`}
                        className="block rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm font-semibold text-[color:var(--ink)] transition hover:border-black/10"
                      >
                        {group.label}
                      </a>
                      <div className="space-y-1 pl-2">
                        {group.sections.map((section) => (
                          <a
                            key={section.id}
                            href={`#${section.id}`}
                            className="block rounded-2xl border border-transparent bg-[color:var(--surface)]/65 px-4 py-2 text-xs font-semibold text-[color:var(--muted)] transition hover:border-black/10 hover:bg-white hover:text-[color:var(--ink)]"
                          >
                            {section.label}
                          </a>
                        ))}
                      </div>
                    </div>
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
            {sectionGroups.map((group) => (
              <section key={group.slug} id={`group-${group.slug}`} className="scroll-mt-24 space-y-5">
                <div className="rounded-[34px] border border-black/5 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(247,240,233,0.88))] p-5 shadow-[0_18px_40px_rgba(30,25,20,0.06)] sm:p-7">
                  <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--accent-2)]">
                    Famille
                  </p>
                  <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-semibold text-[color:var(--ink)] sm:text-3xl">
                        {group.label}
                      </h2>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--muted)]">
                        {group.description}
                      </p>
                    </div>
                    <div className="rounded-full border border-black/8 bg-white/80 px-4 py-2 text-xs font-semibold text-[color:var(--muted)]">
                      {group.sections.reduce((sum, section) => sum + section.items.length, 0)} article(s)
                    </div>
                  </div>
                </div>

                {group.sections.map((section) => (
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
                            onOpenDetails={(selectedItem) => setActiveItemId(selectedItem.id)}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                ))}
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

      {activeItem ? (
        <CatalogueItemModal
          item={activeItem}
          quantity={selected[activeItem.id]?.quantity || 0}
          onClose={() => setActiveItemId(null)}
          onAdd={addItem}
          onRemove={removeItem}
        />
      ) : null}
    </div>
  );
}
