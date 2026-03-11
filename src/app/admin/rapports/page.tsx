import { prisma } from "@/lib/prisma";
import { ContactStatus, QuoteStatus, ReservationStatus, InvoiceStatus } from "@/generated/prisma";

export default async function ReportsPage() {
  const [
    totalDemandes,
    newDemandes,
    pendingDemandes,
    quoteReceived,
    confirmedDemandes,
    refusedDemandes,
    quotesSubmitted,
    quotesAccepted,
    revenueFromQuotes,
    reservationsCount,
    invoicesPaid,
    revenueInvoices,
    topItems,
  ] = await Promise.all([
    prisma.contactRequest.count(),
    prisma.contactRequest.count({ where: { status: ContactStatus.NEW } }),
    prisma.contactRequest.count({ where: { status: ContactStatus.PENDING } }),
    prisma.contactRequest.count({
      where: { status: ContactStatus.QUOTE_RECEIVED },
    }),
    prisma.contactRequest.count({
      where: { status: ContactStatus.CONFIRMED },
    }),
    prisma.contactRequest.count({ where: { status: ContactStatus.REFUSED } }),
    prisma.quote.count({ where: { status: QuoteStatus.SUBMITTED } }),
    prisma.quote.count({ where: { status: QuoteStatus.ACCEPTED } }),
    prisma.quote.aggregate({
      _sum: { totalAmountCents: true },
      where: { status: QuoteStatus.ACCEPTED },
    }),
    prisma.reservation.count({
      where: { status: ReservationStatus.CONFIRMED },
    }),
    prisma.invoice.count({ where: { status: InvoiceStatus.PAID } }),
    prisma.invoice.aggregate({
      _sum: { totalAmountCents: true },
      where: { status: InvoiceStatus.PAID },
    }),
    prisma.reservationItem.groupBy({
      by: ["itemId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);

  const topItemIds = topItems.map((item) => item.itemId);
  const topItemDetails = await prisma.item.findMany({
    where: { id: { in: topItemIds } },
  });

  const topItemsWithNames = topItems.map((entry) => {
    const item = topItemDetails.find((detail) => detail.id === entry.itemId);
    return {
      name: item?.name || "Article",
      qty: entry._sum.quantity || 0,
    };
  });

  const quoteRevenue = (revenueFromQuotes._sum.totalAmountCents || 0) / 100;
  const invoiceRevenue = (revenueInvoices._sum.totalAmountCents || 0) / 100;

  const stats = [
    { label: "Demandes totales", value: totalDemandes },
    { label: "Nouvelles demandes", value: newDemandes },
    { label: "Demandes en attente", value: pendingDemandes },
    { label: "Devis reçus", value: quoteReceived },
    { label: "Demandes confirmées", value: confirmedDemandes },
    { label: "Demandes refusées", value: refusedDemandes },
    { label: "Devis soumis", value: quotesSubmitted },
    { label: "Devis acceptés", value: quotesAccepted },
    { label: "Réservations confirmées", value: reservationsCount },
    { label: "Factures payées", value: invoicesPaid },
  ];

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-black/5 bg-white/80 p-8 shadow-[0_15px_30px_rgba(22,18,14,0.08)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
          Rapports
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Chiffres clés</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Suivi global des demandes, devis, réservations et factures.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-3xl border border-black/5 bg-white/80 p-5"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
              {stat.label}
            </p>
            <p className="mt-3 text-2xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-black/5 bg-white/80 p-6">
          <h2 className="text-xl font-semibold">Revenus</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-2xl bg-[color:var(--surface)] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                Devis acceptés
              </p>
              <p className="text-lg font-semibold">
                {quoteRevenue.toFixed(2)} €
              </p>
            </div>
            <div className="rounded-2xl bg-[color:var(--surface)] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                Factures payées
              </p>
              <p className="text-lg font-semibold">
                {invoiceRevenue.toFixed(2)} €
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-black/5 bg-[color:var(--surface-2)] p-6">
          <h2 className="text-xl font-semibold">Top articles loués</h2>
          {topItemsWithNames.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-black/10 bg-white/70 p-6 text-sm text-[color:var(--muted)]">
              Pas encore de données.
            </div>
          ) : (
            <ul className="mt-4 space-y-3 text-sm">
              {topItemsWithNames.map((item) => (
                <li
                  key={item.name}
                  className="rounded-2xl bg-white/80 px-4 py-3"
                >
                  {item.name} — {item.qty} unités
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
