import { deleteReservation, markConfirmationSent } from "@/app/actions/reservations";
import { createManualDemand } from "@/app/actions/demandes";
import { prisma } from "@/lib/prisma";
import { QuoteStatus, ReservationStatus } from "@/generated/prisma";

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

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ saved?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const [reservations, signedQuotes] = await Promise.all([
    prisma.reservation.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        client: true,
        items: { include: { item: true } },
      },
      take: 50,
    }),
    prisma.quote.findMany({
      where: { status: QuoteStatus.ACCEPTED },
      select: {
        id: true,
        clientId: true,
        startDate: true,
        endDate: true,
        pdfUrl: true,
        signedAt: true,
        client: { select: { email: true, name: true } },
      },
    }),
  ]);

  const dateKey = (value: Date) => value.toISOString().slice(0, 10);
  const signedByKey = new Map<string, (typeof signedQuotes)[number]>();
  signedQuotes.forEach((quote) => {
    const key = `${quote.clientId}|${dateKey(quote.startDate)}|${dateKey(
      quote.endDate
    )}`;
    if (!signedByKey.has(key)) {
      signedByKey.set(key, quote);
    }
  });

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-black/5 bg-white/80 p-8 shadow-[0_15px_30px_rgba(22,18,14,0.08)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
          Espace entreprise
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Réservations</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Suivi des demandes, planning et états de réservation.
        </p>
        <p className="mt-2 text-xs text-[color:var(--muted)]">
          {reservations.length} réservation{reservations.length > 1 ? "s" : ""}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-black/5 bg-[color:var(--surface-2)] p-6">
          <h2 className="text-xl font-semibold">Créer une demande</h2>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            À utiliser quand un client appelle ou passe par les réseaux sociaux.
            La demande suivra ensuite le même processus que celles du site.
          </p>
          <form action={createManualDemand} className="mt-4 grid gap-3">
            <input
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
              placeholder="Nom et prénom"
              name="name"
              required
            />
            <input
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
              placeholder="Email"
              name="email"
              type="email"
              required
            />
            <input
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
              placeholder="Téléphone"
              name="phone"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                name="startDate"
                type="date"
                required
              />
              <input
                className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
                name="endDate"
                type="date"
                required
              />
            </div>
            <input
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
              placeholder="Type d'événement"
              name="eventType"
            />
            <textarea
              className="min-h-[90px] rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm"
              placeholder="Message / notes"
              name="message"
            />
            <button
              className="rounded-full bg-[color:var(--ink)] px-6 py-3 text-sm font-semibold text-white"
              type="submit"
            >
              Créer la demande
            </button>
          </form>
        </div>
      </div>

      <div className="rounded-3xl border border-black/5 bg-white/80 p-6">
        <h2 className="text-xl font-semibold">Réservations</h2>
        {reservations.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-black/10 bg-[color:var(--surface)] p-6 text-sm text-[color:var(--muted)]">
            Aucune réservation enregistrée.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {reservations.map((reservation) => (
              <div
                key={reservation.id}
                className="rounded-2xl border border-black/5 bg-white px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">
                      {reservation.client.name}
                    </p>
                    <p className="mt-1 text-lg font-semibold">
                      {reservation.startDate.toLocaleDateString("fr-FR")} →{" "}
                      {reservation.endDate.toLocaleDateString("fr-FR")}
                    </p>
                    <p className="text-xs text-[color:var(--muted)]">
                      {reservation.eventLocation
                        ? reservation.eventLocation
                        : "Lieu non renseigné"}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-[color:var(--muted)]">
                        Statut: {reservationStatusLabel(reservation.status)}
                      </span>
                      {(() => {
                        const key = `${reservation.clientId}|${dateKey(
                          reservation.startDate
                        )}|${dateKey(reservation.endDate)}`;
                        const signedQuote = signedByKey.get(key);
                        if (signedQuote?.signedAt) {
                          return (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">
                              Signé
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {(() => {
                      const key = `${reservation.clientId}|${dateKey(
                        reservation.startDate
                      )}|${dateKey(reservation.endDate)}`;
                      const signedQuote = signedByKey.get(key);
                      if (signedQuote?.pdfUrl) {
                        return (
                          <>
                            <a
                              className="rounded-full border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-700"
                              href={signedQuote.pdfUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Ouvrir le devis signé
                            </a>
                            {signedQuote.client?.email && (
                              <form action={markConfirmationSent}>
                                <input type="hidden" name="id" value={reservation.id} />
                                <button
                                  className={`rounded-full border px-4 py-2 text-xs font-semibold ${
                                    reservation.confirmationSentAt
                                      ? "border-emerald-200 bg-emerald-100 text-emerald-700"
                                      : "border-black/10 text-[color:var(--muted)] hover:border-black/20"
                                  }`}
                                  type="submit"
                                >
                                  {reservation.confirmationSentAt
                                    ? "Confirmation envoyée"
                                    : "Envoyer la confirmation"}
                                </button>
                              </form>
                            )}
                          </>
                        );
                      }
                      return null;
                    })()}
                    <form action={deleteReservation}>
                      <input type="hidden" name="id" value={reservation.id} />
                      <button
                        className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-[color:var(--muted)] hover:border-black/20"
                        type="submit"
                      >
                        Supprimer
                      </button>
                    </form>
                  </div>
                </div>
                {reservation.items.length > 0 && (
                  <div className="mt-3 space-y-2 text-sm text-[color:var(--muted)]">
                    {reservation.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3"
                      >
                        <span>{item.item.name}</span>
                        <span>
                          × {item.quantity} • {(item.unitPriceCents / 100).toFixed(2)} €
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
