import { prisma } from "@/lib/prisma";

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateKey = (value: string) => {
  const [year, month, day] = value.split("-").map((part) => Number(part));
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};


export default async function StockItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ date?: string }>;
}) {
  const resolvedParams = await params;
  const itemId = resolvedParams.id;
  const resolvedSearch = searchParams ? await searchParams : undefined;

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { images: true, category: true },
  });

  if (!item) {
    return (
      <div className="rounded-3xl border border-black/5 bg-white/80 p-8">
        Article introuvable.
      </div>
    );
  }

  const reservationItems = await prisma.reservationItem.findMany({
    where: {
      itemId,
      reservation: {
        status: {
          in: ["PENDING", "CONFIRMED", "IN_PROGRESS"],
        },
      },
    },
    include: {
      reservation: {
        include: { client: true },
      },
    },
    orderBy: { reservation: { startDate: "asc" } },
  });

  const today = new Date();
  const todayKey = toDateKey(today);
  const selectedKey = resolvedSearch?.date || todayKey;
  const selectedDate = parseDateKey(selectedKey) || today;
  const reservedOnDate = reservationItems.reduce((total, entry) => {
    const startKey = toDateKey(entry.reservation.startDate);
    const endKey = toDateKey(entry.reservation.endDate);
    const inRange = selectedKey >= startKey && selectedKey <= endKey;
    return inRange ? total + entry.quantity : total;
  }, 0);
  const availableOnDate = Math.max(item.totalQty - reservedOnDate, 0);
  const reservedActive = reservationItems.reduce(
    (total, entry) => total + entry.quantity,
    0
  );
  const availableActive = Math.max(item.totalQty - reservedActive, 0);

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-black/5 bg-white/80 p-8 shadow-[0_15px_30px_rgba(22,18,14,0.08)]">
        <a
          className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--muted)]"
          href="/admin/stock"
        >
          ← Retour au stock
        </a>
        <h1 className="mt-4 text-3xl font-semibold">{item.name}</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Catégorie: {item.category?.name ?? "-"}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-black/5 bg-white/80 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                Fiche produit
              </p>
              <h2 className="mt-2 text-xl font-semibold">Résumé du stock</h2>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-[color:var(--surface)] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Total
              </p>
              <p className="text-lg font-semibold">{item.totalQty}</p>
            </div>
            <div className="rounded-2xl bg-[color:var(--surface)] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Réservé
              </p>
              <p className="text-lg font-semibold">{reservedActive}</p>
            </div>
            <div className="rounded-2xl bg-[color:var(--surface)] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Disponible
              </p>
              <p className="text-lg font-semibold">
                {availableActive}
              </p>
            </div>
          </div>
          <form className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]" method="get">
            <input
              className="rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm"
              name="date"
              type="date"
              defaultValue={selectedKey}
            />
            <button
              className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-[color:var(--muted)]"
              type="submit"
            >
              Vérifier la dispo
            </button>
          </form>
          <p className="mt-2 text-xs text-[color:var(--muted)]">
            Dispo le {formatDate(selectedDate)} : {availableOnDate} • Réservé : {reservedOnDate}
          </p>
          <div className="mt-6 text-sm text-[color:var(--muted)]">
            <p>
              Prix location : {(item.rentalPriceCents / 100).toFixed(2)} €
            </p>
            <p>
              Caution : {(item.depositPriceCents / 100).toFixed(2)} €
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-black/5 bg-white/80 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
            Visuel
          </p>
          {item.images[0]?.url ? (
            <img
              src={item.images[0].url}
              alt={item.name}
              className="mt-4 h-64 w-full rounded-3xl object-contain bg-white"
            />
          ) : (
            <div className="mt-4 rounded-3xl border border-dashed border-black/10 bg-[color:var(--surface)] p-6 text-sm text-[color:var(--muted)]">
              Pas d'image renseignée.
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-black/5 bg-white/80 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
            Réservations
          </p>
          {reservationItems.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-black/10 bg-[color:var(--surface)] p-6 text-sm text-[color:var(--muted)]">
              Aucune réservation active.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {reservationItems.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-2xl border border-black/5 bg-white px-4 py-3 text-sm"
                >
                  <p className="font-semibold">
                    {entry.reservation.client.name} · {entry.quantity} unité(s)
                  </p>
                  <p className="text-xs text-[color:var(--muted)]">
                    {formatDate(entry.reservation.startDate)} → {formatDate(entry.reservation.endDate)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
