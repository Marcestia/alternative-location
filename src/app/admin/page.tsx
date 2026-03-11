import { prisma } from "@/lib/prisma";
import { ContactStatus, ReservationStatus, InvoiceStatus } from "@/generated/prisma";


export const dynamic = "force-dynamic";
export const revalidate = 0;

const reservationStatusLabel = (status: ReservationStatus) => {
  switch (status) {
    case ReservationStatus.DRAFT:
      return "Brouillon";
    case ReservationStatus.PENDING:
      return "En attente";
    case ReservationStatus.CONFIRMED:
      return "Confirmée";
    case ReservationStatus.IN_PROGRESS:
      return "En cours";
    case ReservationStatus.COMPLETED:
      return "Terminée";
    case ReservationStatus.CANCELLED:
      return "Annulée";
    default:
      return status;
  }
};

export default async function AdminDashboard() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    newDemandes,
    pendingReservations,
    draftInvoices,
    totalItems,
    latestDemandes,
    upcomingReservations,
  ] = await Promise.all([
      prisma.contactRequest.count({ where: { status: ContactStatus.NEW } }),
      prisma.reservation.count({ where: { status: ReservationStatus.PENDING } }),
      prisma.invoice.count({ where: { status: InvoiceStatus.DRAFT } }),
      prisma.item.count({ where: { active: true } }),
      prisma.contactRequest.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.reservation.findMany({
        where: {
          status: { in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED] },
          startDate: { gte: today },
        },
        include: { client: true },
        orderBy: { startDate: "asc" },
        take: 6,
      }),
    ]);

  const metrics = [
    { label: "Nouvelles demandes", value: String(newDemandes) },
    { label: "Réservations en attente", value: String(pendingReservations) },
    { label: "Factures en brouillon", value: String(draftInvoices) },
    { label: "Articles actifs", value: String(totalItems) },
  ];

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-black/5 bg-white/80 p-8 shadow-[0_15px_30px_rgba(22,18,14,0.08)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
          Tableau de bord
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          Bonjour, voici votre activité du jour
        </h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Vue rapide sur les demandes, réservations et factures.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-3xl border border-black/5 bg-white/80 p-5"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
              {metric.label}
            </p>
            <p className="mt-3 text-2xl font-semibold">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-black/5 bg-white/80 p-6">
        <h2 className="text-xl font-semibold">Dernières demandes</h2>
        {latestDemandes.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-black/10 bg-[color:var(--surface)] p-6 text-sm text-[color:var(--muted)]">
            Aucune demande pour le moment.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {latestDemandes.map((demande) => (
              <div
                key={demande.id}
                className="rounded-2xl border border-black/5 bg-white px-4 py-3"
              >
                <p className="text-sm font-semibold">{demande.name}</p>
                <p className="text-xs text-[color:var(--muted)]">
                  {demande.email}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-black/5 bg-white/80 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">
            Prochaines réservations à préparer
          </h2>
          <a
            className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-[color:var(--muted)]"
            href="/admin/reservations"
          >
            Voir tout
          </a>
        </div>
        {upcomingReservations.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-black/10 bg-[color:var(--surface)] p-6 text-sm text-[color:var(--muted)]">
            Aucune réservation à venir.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {upcomingReservations.map((reservation) => (
              <div
                key={reservation.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-black/5 bg-white px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold">{reservation.client.name}</p>
                  <p className="mt-1 text-lg font-semibold">
                    {reservation.startDate.toLocaleDateString("fr-FR")} →{" "}
                    {reservation.endDate.toLocaleDateString("fr-FR")}
                  </p>
                  <p className="text-xs text-[color:var(--muted)]">
                    {reservation.eventLocation
                      ? reservation.eventLocation
                      : "Lieu non renseigné"}
                  </p>
                </div>
                <span className="rounded-full bg-[color:var(--surface)] px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
                  {reservationStatusLabel(reservation.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
