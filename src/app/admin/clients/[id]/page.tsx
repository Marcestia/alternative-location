import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import ClientForm from "@/components/ClientForm";
import ClientStatistics from "@/components/ClientStatistics";
import { loadAnalyticsSnapshot } from "@/lib/analytics-data";
import { readAnalyticsPeriod } from "@/lib/analytics-period";
import { euro, shortDate, STATUS_LABELS } from "@/lib/analytics";

export default async function ClientDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    created?: string;
    period?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const [{ id }, resolvedParams] = await Promise.all([params, searchParams]);
  const { period, error } = readAnalyticsPeriod(resolvedParams);
  const [client, snapshot] = await Promise.all([
    prisma.client.findUnique({
      where: { id },
      include: {
        invoices: {
          orderBy: { issueDate: "desc" },
          select: {
            id: true,
            number: true,
            status: true,
            issueDate: true,
            totalAmountCents: true,
            pdfUrl: true,
          },
        },
        quotes: {
          orderBy: { createdAt: "desc" },
          include: {
            items: { include: { item: true } },
            lines: true,
          },
        },
        reservations: {
          orderBy: { createdAt: "desc" },
          include: {
            items: { include: { item: true } },
          },
        },
      },
    }),
    loadAnalyticsSnapshot(id),
  ]);

  if (!client) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-black/5 bg-white/80 p-8 shadow-[0_15px_30px_rgba(22,18,14,0.08)]">
        <Link
          href="/admin/clients"
          className="mb-4 inline-block text-sm text-[color:var(--muted)] underline underline-offset-4"
        >
          ← Tous les clients
        </Link>
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
          Fiche client
        </p>
        <h1 className="mt-2 text-3xl font-semibold">{client.name}</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          {client.email || "Email non renseigné"}
          {client.phone ? ` • ${client.phone}` : ""}
        </p>
        {client.address && (
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            {client.address}
          </p>
        )}
      </header>

      {resolvedParams?.created === "1" && (
        <p
          role="status"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
        >
          Client créé. Vous pouvez modifier ses coordonnées à tout moment
          ci-dessous.
        </p>
      )}

      <ClientStatistics
        snapshot={snapshot}
        clientId={id}
        period={period}
        error={error}
      />

      <div
        id="coordonnees"
        className="rounded-3xl border border-black/5 bg-white/80 p-6"
      >
        <h2 className="text-xl font-semibold">Coordonnées du client</h2>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Corrigez ses informations puis enregistrez vos modifications. Les
          coordonnées sont également actualisées dans les demandes liées à ce
          client.
        </p>
        <ClientForm
          key={client.id}
          client={{
            id: client.id,
            name: client.name,
            email: client.email,
            phone: client.phone,
            address: client.address,
            notes: client.notes,
          }}
        />
        <p className="mt-4 text-xs text-[color:var(--muted)]">
          Les PDF déjà générés conservent les coordonnées affichées lors de leur
          création.
        </p>
      </div>

      <div className="rounded-3xl border border-black/5 bg-white/80 p-6">
        <h2 className="text-xl font-semibold">Devis</h2>
        {client.quotes.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-black/10 bg-[color:var(--surface)] p-6 text-sm text-[color:var(--muted)]">
            Aucun devis pour ce client.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {client.quotes.map((quote) => (
              <div
                key={quote.id}
                className="rounded-2xl border border-black/5 bg-white px-4 py-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">
                      Devis {quote.quoteNumber || quote.id}
                    </p>
                    <p className="text-xs text-[color:var(--muted)]">
                      {quote.createdAt.toLocaleDateString("fr-FR")} •{" "}
                      {quote.status}
                    </p>
                  </div>
                  {quote.pdfUrl && (
                    <a
                      className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-[color:var(--muted)]"
                      href={`/api/pdfs?key=${encodeURIComponent(quote.pdfUrl)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ouvrir le PDF
                    </a>
                  )}
                </div>

                <div className="mt-3 space-y-2 text-sm text-[color:var(--muted)]">
                  {quote.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3"
                    >
                      <span>{item.item.name}</span>
                      <span>
                        × {item.quantity} •{" "}
                        {(item.unitPriceCents / 100).toFixed(2)} €
                      </span>
                    </div>
                  ))}
                  {quote.lines.map((line) => (
                    <div
                      key={line.id}
                      className="flex items-center justify-between gap-3"
                    >
                      <span>{line.label}</span>
                      <span>
                        × {line.quantity} •{" "}
                        {(line.unitPriceCents / 100).toFixed(2)} €
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-black/5 bg-white/80 p-6">
        <h2 className="text-xl font-semibold">Factures du client</h2>
        {client.invoices.length === 0 ? (
          <p className="mt-4 text-sm text-[color:var(--muted)]">
            Aucune facture enregistrée.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {client.invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/5 bg-white p-4"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {invoice.number} · {euro(invoice.totalAmountCents)}
                  </p>
                  <p className="mt-1 text-xs text-[color:var(--muted)]">
                    {shortDate(invoice.issueDate)} ·{" "}
                    {STATUS_LABELS[invoice.status]}
                  </p>
                </div>
                {invoice.pdfUrl && (
                  <a
                    className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold"
                    href={`/api/pdfs?key=${encodeURIComponent(invoice.pdfUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ouvrir le PDF
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-black/5 bg-white/80 p-6">
        <h2 className="text-xl font-semibold">Réservations</h2>
        {client.reservations.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-black/10 bg-[color:var(--surface)] p-6 text-sm text-[color:var(--muted)]">
            Aucune réservation confirmée.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {client.reservations.map((reservation) => (
              <div
                key={reservation.id}
                className="rounded-2xl border border-black/5 bg-white px-4 py-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold">
                    Réservation {reservation.code}
                  </p>
                  <p className="text-xs text-[color:var(--muted)]">
                    {reservation.startDate.toLocaleDateString("fr-FR")} →{" "}
                    {reservation.endDate.toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="mt-3 space-y-2 text-sm text-[color:var(--muted)]">
                  {reservation.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3"
                    >
                      <span>{item.item.name}</span>
                      <span>
                        × {item.quantity} •{" "}
                        {(item.unitPriceCents / 100).toFixed(2)} €
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
