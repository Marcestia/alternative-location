import {
  createInvoiceFromQuote,
  deleteInvoice,
  markInvoiceAdvanceReceived,
  markInvoicePaid,
  markInvoiceSentAndEmail,
  regenerateInvoicePdf,
} from "@/app/actions/invoices";
import { prisma } from "@/lib/prisma";
import { InvoiceStatus, QuoteStatus } from "@/generated/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const statusLabel = (status: InvoiceStatus) => {
  switch (status) {
    case InvoiceStatus.DRAFT:
      return "Brouillon";
    case InvoiceStatus.SENT:
      return "Envoyee";
    case InvoiceStatus.PAID:
      return "Payee";
    case InvoiceStatus.CANCELLED:
      return "Annulee";
    default:
      return status;
  }
};

export default async function FacturesPage({
  searchParams,
}: {
  searchParams?: Promise<{ saved?: string; advance?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const [invoices, signedQuotes] = await Promise.all([
    prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      include: { client: true },
      take: 50,
    }),
    prisma.quote.findMany({
      where: { status: QuoteStatus.ACCEPTED },
      include: { client: true, invoice: true },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
  ]);

  const pendingQuotes = signedQuotes.filter((quote) => !quote.invoice);

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-black/5 bg-white/80 p-8 shadow-[0_15px_30px_rgba(22,18,14,0.08)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
          Espace entreprise
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Factures</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Factures legales generees a partir des devis signes.
        </p>
      </header>

      {resolvedParams?.saved === "1" && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          Facture creee et PDF genere.
        </div>
      )}
      {resolvedParams?.saved === "0" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Impossible de creer la facture (devis manquant ou non signe).
        </div>
      )}
      {resolvedParams?.advance === "1" && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          Acompte enregistre et facture mise a jour.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-black/5 bg-white/80 p-6">
          <h2 className="text-xl font-semibold">Creer une facture</h2>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Basee sur les devis signes (statut accepte).
          </p>
          {pendingQuotes.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-black/10 bg-[color:var(--surface)] p-6 text-sm text-[color:var(--muted)]">
              Aucun devis signe en attente de facture.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {pendingQuotes.map((quote) => (
                <form
                  key={quote.id}
                  action={createInvoiceFromQuote}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/5 bg-white px-4 py-3"
                >
                  <input type="hidden" name="quoteId" value={quote.id} />
                  <div>
                    <p className="text-sm font-semibold">{quote.client.name}</p>
                    <p className="text-xs text-[color:var(--muted)]">
                      {quote.startDate.toLocaleDateString("fr-FR")} -{" "}
                      {quote.endDate.toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <button
                    className="rounded-full bg-[color:var(--ink)] px-4 py-2 text-xs font-semibold text-white"
                    type="submit"
                  >
                    Generer la facture
                  </button>
                </form>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-black/5 bg-[color:var(--surface-2)] p-6">
          <h2 className="text-xl font-semibold">Statuts</h2>
          <ul className="mt-3 space-y-2 text-sm text-[color:var(--muted)]">
            <li>- Brouillon : facture generee, pas encore envoyee.</li>
            <li>- Envoyee : la facture a ete communiquee au client.</li>
            <li>- Payee : le paiement est confirme.</li>
          </ul>
        </div>
      </div>

      <div className="rounded-3xl border border-black/5 bg-white/80 p-6">
        <h2 className="text-xl font-semibold">Factures</h2>
        {invoices.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-black/10 bg-[color:var(--surface)] p-6 text-sm text-[color:var(--muted)]">
            Aucune facture enregistree.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {invoices.map((invoice) => {
              const balanceDueCents =
                invoice.totalAmountCents -
                (invoice.advanceReceivedAt ? invoice.advanceAmountCents : 0);

              return (
                <div
                  key={invoice.id}
                  className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-black/5 px-4 py-4 ${
                    invoice.status === InvoiceStatus.PAID
                      ? "bg-emerald-50/40 opacity-70"
                      : "bg-white"
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {invoice.number} - {invoice.client.name}
                    </p>
                    <p className="text-xs text-[color:var(--muted)]">
                      {invoice.issueDate.toLocaleDateString("fr-FR")} -{" "}
                      {(invoice.totalAmountCents / 100).toFixed(2)} EUR -{" "}
                      {statusLabel(invoice.status)}
                    </p>
                    {invoice.advanceAmountCents > 0 && (
                      <p className="mt-1 text-xs text-[color:var(--muted)]">
                        {invoice.advanceReceivedAt
                          ? `Acompte recu : ${(invoice.advanceAmountCents / 100).toFixed(
                              2
                            )} EUR - Solde : ${(balanceDueCents / 100).toFixed(2)} EUR`
                          : `Acompte prevu (30%) : ${(invoice.advanceAmountCents / 100).toFixed(
                              2
                            )} EUR`}
                      </p>
                    )}
                    {invoice.pdfUrl && (
                      <a
                        className="mt-2 inline-flex rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700"
                        href={`/api/pdfs?key=${encodeURIComponent(invoice.pdfUrl)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Ouvrir le PDF
                      </a>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <form action={regenerateInvoicePdf}>
                      <input type="hidden" name="id" value={invoice.id} />
                      <button
                        className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-[color:var(--muted)] hover:border-black/20"
                        type="submit"
                      >
                        Regenerer PDF
                      </button>
                    </form>
                    {!invoice.advanceReceivedAt &&
                      invoice.advanceAmountCents > 0 &&
                      invoice.status !== InvoiceStatus.PAID && (
                        <form action={markInvoiceAdvanceReceived}>
                          <input type="hidden" name="id" value={invoice.id} />
                          <button
                            className="rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800"
                            type="submit"
                          >
                            Marquer acompte recu
                          </button>
                        </form>
                      )}
                    {invoice.advanceReceivedAt && (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800">
                        Acompte recu
                      </span>
                    )}
                    {invoice.pdfUrl && invoice.status === InvoiceStatus.DRAFT && (
                      <form action={markInvoiceSentAndEmail}>
                        <input type="hidden" name="id" value={invoice.id} />
                        <button
                          className="rounded-full bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-[0_12px_24px_rgba(2,132,199,0.25)]"
                          type="submit"
                        >
                          Envoyer la facture
                        </button>
                      </form>
                    )}
                    {invoice.pdfUrl && invoice.status !== InvoiceStatus.DRAFT && (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
                        Facture envoyee
                      </span>
                    )}
                    {invoice.status === InvoiceStatus.SENT && (
                      <form action={markInvoicePaid}>
                        <input type="hidden" name="id" value={invoice.id} />
                        <button
                          className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-[0_12px_24px_rgba(5,150,105,0.25)]"
                          type="submit"
                        >
                          Marquer payee
                        </button>
                      </form>
                    )}
                    <form action={deleteInvoice}>
                      <input type="hidden" name="id" value={invoice.id} />
                      <button
                        className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-[color:var(--muted)] hover:border-black/20"
                        type="submit"
                      >
                        Supprimer
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
