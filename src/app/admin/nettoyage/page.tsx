import { prisma } from "@/lib/prisma";
import Script from "next/script";
import { deleteClient } from "@/app/actions/clients";
import { deleteInvoice } from "@/app/actions/invoices";
import { deleteReservation } from "@/app/actions/reservations";
import {
  deleteContactRequestById,
  deleteInvoicePdf,
  deleteQuoteById,
  deleteQuotePdf,
  deleteReviewById,
} from "@/app/actions/maintenance";
import { deleteSpotlight } from "@/app/actions/stock";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NettoyagePage() {
  const [clients, demandes, quotes, reservations, invoices, reviews, spotlights] =
    await Promise.all([
      prisma.client.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
      prisma.contactRequest.findMany({
        orderBy: { createdAt: "desc" },
        include: { client: true, quote: true },
        take: 30,
      }),
      prisma.quote.findMany({
        orderBy: { createdAt: "desc" },
        include: { client: true },
        take: 30,
      }),
      prisma.reservation.findMany({
        orderBy: { createdAt: "desc" },
        include: { client: true },
        take: 30,
      }),
      prisma.invoice.findMany({
        orderBy: { createdAt: "desc" },
        include: { client: true },
        take: 30,
      }),
      prisma.review.findMany({
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
      prisma.spotlight.findMany({
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        take: 10,
      }),
    ]);

  return (
    <section className="space-y-6">
      <Script id="cleanup-confirm" strategy="afterInteractive">
        {`
          document.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;
            const label = target.getAttribute('data-confirm');
            if (!label) return;
            if (!confirm('Supprimer ' + label + ' ?')) {
              event.preventDefault();
            }
          });
        `}
      </Script>

      <header className="rounded-3xl border border-black/5 bg-white/80 p-8 shadow-[0_15px_30px_rgba(22,18,14,0.08)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
          Espace entreprise
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Nettoyage</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Suppression manuelle des donnees de test.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-black/5 bg-white/80 p-6">
          <h2 className="text-lg font-semibold">Demandes</h2>
          <div className="mt-4 space-y-3 text-sm">
            {demandes.length === 0 && (
              <p className="text-[color:var(--muted)]">Aucune demande.</p>
            )}
            {demandes.map((demande) => (
              <div
                key={demande.id}
                className="rounded-2xl border border-black/5 bg-white px-4 py-3"
              >
                <p className="font-semibold">{demande.name}</p>
                <p className="text-xs text-[color:var(--muted)]">
                  {demande.email}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <form action={deleteContactRequestById}>
                    <input type="hidden" name="id" value={demande.id} />
                    <button
                      className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700"
                      type="submit"
                      data-confirm={`la demande de ${demande.name}`}
                    >
                      Supprimer
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-black/5 bg-white/80 p-6">
          <h2 className="text-lg font-semibold">Devis</h2>
          <div className="mt-4 space-y-3 text-sm">
            {quotes.length === 0 && (
              <p className="text-[color:var(--muted)]">Aucun devis.</p>
            )}
            {quotes.map((quote) => (
              <div
                key={quote.id}
                className="rounded-2xl border border-black/5 bg-white px-4 py-3"
              >
                <p className="font-semibold">
                  {quote.client?.name || "Client inconnu"}
                </p>
                <p className="text-xs text-[color:var(--muted)]">
                  {quote.quoteNumber || quote.id}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {quote.pdfUrl && (
                    <form action={deleteQuotePdf}>
                      <input type="hidden" name="id" value={quote.id} />
                      <button
                        className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-[color:var(--muted)]"
                        type="submit"
                        data-confirm={`le PDF du devis ${quote.quoteNumber || quote.id}`}
                      >
                        Retirer PDF
                      </button>
                    </form>
                  )}
                  <form action={deleteQuoteById}>
                    <input type="hidden" name="id" value={quote.id} />
                    <button
                      className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700"
                      type="submit"
                      data-confirm={`le devis ${quote.quoteNumber || quote.id}`}
                    >
                      Supprimer
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-black/5 bg-white/80 p-6">
          <h2 className="text-lg font-semibold">Reservations</h2>
          <div className="mt-4 space-y-3 text-sm">
            {reservations.length === 0 && (
              <p className="text-[color:var(--muted)]">Aucune reservation.</p>
            )}
            {reservations.map((reservation) => (
              <div
                key={reservation.id}
                className="rounded-2xl border border-black/5 bg-white px-4 py-3"
              >
                <p className="font-semibold">
                  {reservation.client?.name || "Client inconnu"}
                </p>
                <p className="text-xs text-[color:var(--muted)]">
                  {reservation.startDate.toLocaleDateString("fr-FR")} -{" "}
                  {reservation.endDate.toLocaleDateString("fr-FR")}
                </p>
                <form action={deleteReservation} className="mt-2">
                  <input type="hidden" name="id" value={reservation.id} />
                  <button
                    className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700"
                    type="submit"
                    data-confirm={`la reservation de ${reservation.client?.name || "ce client"}`}
                  >
                    Supprimer
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-black/5 bg-white/80 p-6">
          <h2 className="text-lg font-semibold">Factures</h2>
          <div className="mt-4 space-y-3 text-sm">
            {invoices.length === 0 && (
              <p className="text-[color:var(--muted)]">Aucune facture.</p>
            )}
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="rounded-2xl border border-black/5 bg-white px-4 py-3"
              >
                <p className="font-semibold">
                  {invoice.client?.name || "Client inconnu"}
                </p>
                <p className="text-xs text-[color:var(--muted)]">
                  {invoice.number}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {invoice.pdfUrl && (
                    <form action={deleteInvoicePdf}>
                      <input type="hidden" name="id" value={invoice.id} />
                      <button
                        className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-[color:var(--muted)]"
                        type="submit"
                        data-confirm={`le PDF de la facture ${invoice.number}`}
                      >
                        Retirer PDF
                      </button>
                    </form>
                  )}
                  <form action={deleteInvoice}>
                    <input type="hidden" name="id" value={invoice.id} />
                    <button
                      className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700"
                      type="submit"
                      data-confirm={`la facture ${invoice.number}`}
                    >
                      Supprimer
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-black/5 bg-white/80 p-6">
          <h2 className="text-lg font-semibold">Clients</h2>
          <div className="mt-4 space-y-3 text-sm">
            {clients.length === 0 && (
              <p className="text-[color:var(--muted)]">Aucun client.</p>
            )}
            {clients.map((client) => (
              <div
                key={client.id}
                className="rounded-2xl border border-black/5 bg-white px-4 py-3"
              >
                <p className="font-semibold">{client.name}</p>
                <p className="text-xs text-[color:var(--muted)]">
                  {client.email || "email non renseigne"}
                </p>
                <form action={deleteClient} className="mt-2">
                  <input type="hidden" name="id" value={client.id} />
                  <button
                    className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700"
                    type="submit"
                    data-confirm={`le client ${client.name}`}
                  >
                    Supprimer
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-black/5 bg-white/80 p-6">
          <h2 className="text-lg font-semibold">Avis</h2>
          <div className="mt-4 space-y-3 text-sm">
            {reviews.length === 0 && (
              <p className="text-[color:var(--muted)]">Aucun avis.</p>
            )}
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-2xl border border-black/5 bg-white px-4 py-3"
              >
                <p className="font-semibold">{review.name}</p>
                <p className="text-xs text-[color:var(--muted)]">
                  Note: {review.rating}/5
                </p>
                <form action={deleteReviewById} className="mt-2">
                  <input type="hidden" name="id" value={review.id} />
                  <button
                    className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700"
                    type="submit"
                    data-confirm={`l'avis de ${review.name}`}
                  >
                    Supprimer
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-black/5 bg-white/80 p-6">
          <h2 className="text-lg font-semibold">Spotlights</h2>
          <div className="mt-4 space-y-3 text-sm">
            {spotlights.length === 0 && (
              <p className="text-[color:var(--muted)]">Aucun spotlight.</p>
            )}
            {spotlights.map((spotlight) => (
              <div
                key={spotlight.id}
                className="rounded-2xl border border-black/5 bg-white px-4 py-3"
              >
                <p className="font-semibold">{spotlight.title}</p>
                <form action={deleteSpotlight} className="mt-2">
                  <input type="hidden" name="id" value={spotlight.id} />
                  <button
                    className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-700"
                    type="submit"
                    data-confirm={`le spotlight ${spotlight.title}`}
                  >
                    Supprimer
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
