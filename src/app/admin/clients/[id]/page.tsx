import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
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
  });

  if (!client) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-black/5 bg-white/80 p-8 shadow-[0_15px_30px_rgba(22,18,14,0.08)]">
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
                      {quote.createdAt.toLocaleDateString("fr-FR")} • {quote.status}
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
                        × {item.quantity} • {(item.unitPriceCents / 100).toFixed(2)} €
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
                        × {line.quantity} • {(line.unitPriceCents / 100).toFixed(2)} €
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
                        × {item.quantity} • {(item.unitPriceCents / 100).toFixed(2)} €
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
