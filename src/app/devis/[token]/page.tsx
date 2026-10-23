import { submitQuote } from "@/app/actions/quotes";
import { prisma } from "@/lib/prisma";
import { QuoteStatus, ReservationStatus } from "@/generated/prisma";

export default async function DevisPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams?: { error?: string };
}) {
  const { token } = await params;
  const quote = await prisma.quote.findUnique({
    where: { token },
    include: { client: true },
  });

  if (!quote) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Lien invalide</h1>
        <p className="mt-4 text-sm text-[color:var(--muted)]">
          Ce lien n'existe pas ou a expiré.
        </p>
      </div>
    );
  }

  if (quote.status !== QuoteStatus.DRAFT) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Merci !</h1>
        <p className="mt-4 text-sm text-[color:var(--muted)]">
          Votre sélection a bien été envoyée.
        </p>
      </div>
    );
  }

  const reservations = await prisma.reservationItem.findMany({
    where: {
      reservation: {
        status: {
          in: [
            ReservationStatus.PENDING,
            ReservationStatus.CONFIRMED,
            ReservationStatus.IN_PROGRESS,
          ],
        },
        startDate: { lte: quote.endDate },
        endDate: { gte: quote.startDate },
      },
    },
    include: { item: true },
  });

  const reservedMap = reservations.reduce<Record<string, number>>(
    (acc, entry) => {
      acc[entry.itemId] = (acc[entry.itemId] || 0) + entry.quantity;
      return acc;
    },
    {}
  );

  const items = await prisma.item.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  const catalogItems = items.map((item) => {
    const reserved = reservedMap[item.id] || 0;
    const available = Math.max(0, item.totalQty - reserved);
    return { item, available, hasConflict: reserved > 0 };
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="rounded-3xl border border-black/5 bg-white/80 p-8 shadow-[0_15px_30px_rgba(22,18,14,0.08)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
          Sélection des articles
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          Bonjour {quote.client.name}
        </h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Choisissez librement les articles souhaités. Les conflits éventuels
          seront vérifiés par l&apos;entreprise.
        </p>
        <p className="mt-3 text-sm text-[color:var(--muted)]">
          Période: {quote.startDate.toLocaleDateString("fr-FR")} → {" "}
          {quote.endDate.toLocaleDateString("fr-FR")}
        </p>

        {searchParams?.error === "1" && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Merci de sélectionner au moins un article.
          </div>
        )}
        {catalogItems.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Aucun article n&apos;est actuellement présent dans le catalogue.
          </div>
        ) : (
          <form action={submitQuote} className="mt-8 space-y-6">
          <input type="hidden" name="token" value={quote.token} />
          <div className="grid gap-4 md:grid-cols-2">
            {catalogItems.map(({ item, available, hasConflict }) => (
              <div
                key={item.id}
                className="rounded-2xl border border-black/5 bg-white px-4 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{item.name}</p>
                    {hasConflict ? (
                      <p className="mt-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">
                        Déjà réservé sur cette période · disponibilité à confirmer
                        {available < item.totalQty ? ` (${available} estimée)` : ""}
                      </p>
                    ) : (
                      <p className="text-xs text-[color:var(--muted)]">
                        Stock total : {item.totalQty}
                      </p>
                    )}
                    <p className="text-xs text-[color:var(--muted)]">
                      {(item.rentalPriceCents / 100).toFixed(2)} € / unité
                    </p>
                  </div>
                  <input
                    className="w-20 rounded-xl border border-black/10 bg-white px-2 py-2 text-center text-sm"
                    name={`item_${item.id}`}
                    type="number"
                    min="0"
                    max={item.totalQty}
                    defaultValue="0"
                    aria-label={`Quantité souhaitée pour ${item.name}`}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            className="w-full rounded-full bg-[color:var(--ink)] px-6 py-3 text-sm font-semibold text-white"
            type="submit"
          >
            Envoyer mon devis
          </button>
          </form>
        )}
      </div>
    </div>
  );
}
