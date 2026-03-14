import { createQuoteLink, markQuoteSent, refuseContact, markContacted, reopenQuote } from "@/app/actions/demandes";
import { approveQuote, rejectQuote, updateQuoteAdmin, generateQuotePdf } from "@/app/actions/quotes";
import { prisma } from "@/lib/prisma";
import { ContactStatus, QuoteStatus } from "@/generated/prisma";
import { headers } from "next/headers";
import Script from "next/script";

function statusLabel(status: ContactStatus) {
  switch (status) {
    case ContactStatus.NEW:
      return "Nouvelle";
    case ContactStatus.CONTACTED:
      return "Prise de contact";
    case ContactStatus.PENDING:
      return "Devis envoyé";
    case ContactStatus.QUOTE_RECEIVED:
      return "Devis en préparation";
    case ContactStatus.CONFIRMED:
      return "Réservation confirmée";
    case ContactStatus.REFUSED:
      return "Refusée";
    default:
      return status;
  }
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DemandesPage() {
  const [demandes, items, reservations, heldQuotes] = await Promise.all([
    prisma.contactRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        client: true,
        quote: {
          include: {
            items: { include: { item: true } },
            lines: true,
          },
        },
      },
      take: 50,
    }),
    prisma.item.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
    prisma.reservation.findMany({
      where: {
        status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
      },
      include: { items: true },
    }),
    prisma.quote.findMany({
      where: { status: QuoteStatus.SUBMITTED },
      include: { items: true },
    }),
  ]);

  const headerList = await headers();
  const host = headerList.get("host") || "localhost:3001";
  const proto = headerList.get("x-forwarded-proto") || "http";
  const baseUrl = `${proto}://${host}`;

  const demandesNouvelles = demandes.filter(
    (d) => d.status === ContactStatus.NEW
  );
  const prisesDeContact = demandes.filter(
    (d) => d.status === ContactStatus.CONTACTED
  );
  const devisEnPreparation = demandes.filter(
    (d) => d.status === ContactStatus.QUOTE_RECEIVED
  );
  const devisEnvoyes = demandes.filter(
    (d) => d.status === ContactStatus.PENDING
  );
  const refusees = demandes.filter(
    (d) => d.status === ContactStatus.REFUSED
  );

  const renderDemandeCard = (demande: typeof demandes[number]) => {
    const quote = demande.quote;
    const acceptLink = quote
      ? `${baseUrl}/devis/accept/${quote.token}`
      : null;
    const discountLines = quote?.lines.filter((line) => line.label === "Remise") ?? [];
    const otherLines = quote?.lines.filter((line) => line.label !== "Remise") ?? [];
    const discountCents = discountLines.reduce(
      (total, line) => total + line.unitPriceCents * line.quantity,
      0
    );
    const periodStart = quote?.startDate ?? demande.startDate;
    const periodEnd = quote?.endDate ?? demande.endDate;
    const listId = `items-datalist-${demande.id}`;
    const selectedItemIds = new Set((quote?.items ?? []).map((entry) => entry.itemId));
    const reservedByItem: Record<string, number> = {};
    if (periodStart && periodEnd) {
      reservations.forEach((reservation) => {
        if (reservation.startDate > periodEnd || reservation.endDate < periodStart) {
          return;
        }
        reservation.items.forEach((entry) => {
          reservedByItem[entry.itemId] =
            (reservedByItem[entry.itemId] || 0) + entry.quantity;
        });
      });
      heldQuotes.forEach((heldQuote) => {
        if (heldQuote.id === quote?.id) {
          return;
        }
        if (heldQuote.startDate > periodEnd || heldQuote.endDate < periodStart) {
          return;
        }
        heldQuote.items.forEach((entry) => {
          reservedByItem[entry.itemId] =
            (reservedByItem[entry.itemId] || 0) + entry.quantity;
        });
      });
    }
    const availableByItem = items.reduce<Record<string, number>>((acc, item) => {
      const reserved = reservedByItem[item.id] || 0;
      acc[item.id] = Math.max(0, item.totalQty - reserved);
      return acc;
    }, {});

    return (
      <div
        key={demande.id}
        className="rounded-2xl border border-black/5 bg-white px-4 py-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">{demande.name}</p>
            <p className="text-xs text-[color:var(--muted)]">
              {demande.email}
              {demande.phone ? ` • ${demande.phone}` : ""}
            </p>
          </div>
          <span className="rounded-full bg-[color:var(--surface)] px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
            {statusLabel(demande.status)}
          </span>
        </div>
        <p className="mt-3 text-sm text-[color:var(--muted)]">
          {demande.message}
        </p>
        {(demande.startDate || demande.endDate) && (
          <p className="mt-2 text-xs text-[color:var(--muted)]">
            Période:{" "}
            {demande.startDate
              ? demande.startDate.toLocaleDateString("fr-FR")
              : "?"}{" "}
            -{" "}
            {demande.endDate
              ? demande.endDate.toLocaleDateString("fr-FR")
              : "?"}
          </p>
        )}
        {(demande.eventLocation || demande.guestCount || demande.budgetCents) && (
          <div className="mt-2 space-y-1 text-xs text-[color:var(--muted)]">
            {demande.eventLocation && <p>Lieu: {demande.eventLocation}</p>}
            {demande.guestCount && <p>Invités: {demande.guestCount}</p>}
            {demande.budgetCents && (
              <p>Budget: {(demande.budgetCents / 100).toFixed(2)} €</p>
            )}
          </div>
        )}
        {demande.client && (
          <p className="mt-2 text-xs text-[color:var(--muted)]">
            Client: {demande.client.name}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {demande.status !== ContactStatus.REFUSED && (
            <form action={refuseContact}>
              <input type="hidden" name="id" value={demande.id} />
              <button
                className="rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700"
                type="submit"
              >
                Refuser
              </button>
            </form>
          )}
        </div>

        {demande.status === ContactStatus.NEW && (
          <div className="mt-4 rounded-2xl border border-black/5 bg-[color:var(--surface)] p-4">
            <p className="text-sm font-semibold">Prise de contact & notes</p>
            <p className="mt-1 text-xs text-[color:var(--muted)]">
              Notez le besoin, les contraintes ou les quantites. Cette etape ne cree pas encore le devis.
            </p>
            <form action={markContacted} className="mt-3 grid gap-3">
              <input type="hidden" name="id" value={demande.id} />
              <textarea
                className="min-h-[120px] rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm"
                name="contactNotes"
                placeholder="Notes internes (appel, quantites, style, logistique...)"
                defaultValue={demande.contactNotes ?? ""}
              />
              <button
                className="rounded-full bg-[color:var(--ink)] px-4 py-2 text-xs font-semibold text-white"
                type="submit"
              >
                Enregistrer la prise de contact
              </button>
            </form>
          </div>
        )}

        {demande.contactNotes && demande.status !== ContactStatus.NEW && (
          <div className="mt-4 rounded-2xl border border-black/5 bg-[color:var(--surface)] p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
              Notes
            </p>
            <p className="mt-2 whitespace-pre-line text-sm text-[color:var(--muted)]">
              {demande.contactNotes}
            </p>
          </div>
        )}

        {!quote && (demande.status === ContactStatus.CONTACTED || demande.status === ContactStatus.QUOTE_RECEIVED) && (
          <div className="mt-4 rounded-2xl border border-black/5 bg-[color:var(--surface)] p-4">
            <p className="text-sm font-semibold">Préparer le devis</p>
            <p className="mt-1 text-xs text-[color:var(--muted)]">
              Aucun devis n&apos;est encore créé pour cette demande.
            </p>
            <form action={createQuoteLink} className="mt-3">
              <input type="hidden" name="id" value={demande.id} />
              <button
                className="rounded-full bg-[color:var(--ink)] px-4 py-2 text-xs font-semibold text-white"
                type="submit"
              >
                Créer le devis
              </button>
            </form>
          </div>
        )}

        {quote && (quote.status === QuoteStatus.DRAFT || quote.status === QuoteStatus.SUBMITTED || demande.status === ContactStatus.PENDING) && (
          <div className="mt-4 rounded-2xl border border-black/5 bg-[color:var(--surface)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold">{quote.status === QuoteStatus.DRAFT
                  ? "Préparer le devis"
                  : "Proposition de devis"}</p>
              {demande.status === ContactStatus.PENDING && (
                <form action={reopenQuote}>
                  <input type="hidden" name="id" value={demande.id} />
                  <button
                    className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-[color:var(--muted)]"
                    type="submit"
                  >
                    Repasser en preparation
                  </button>
                </form>
              )}
            </div>

            <form action={updateQuoteAdmin} className="mt-4 grid gap-6">
              <input type="hidden" name="quoteId" value={quote.id} />
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                  Articles sélectionnés
                </p>
                {quote.items.map((item) => (
                  <div key={item.id} className="grid gap-2 md:grid-cols-[2fr_1fr_1fr_auto]">
                    <div>
                      <p className="text-sm font-semibold">{item.item.name}</p>
                      <p className="text-xs text-[color:var(--muted)]">
                        Dispo: {availableByItem[item.itemId] ?? 0}
                      </p>
                      <input type="hidden" name="itemId" value={item.itemId} />
                    </div>
                    <label className="grid gap-1 text-xs font-semibold text-[color:var(--muted)]">
                      Quantite
                      <input
                        className="rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm"
                        name="itemQty"
                        type="number"
                        min="0"
                        max={availableByItem[item.itemId] ?? item.item.totalQty}
                        defaultValue={item.quantity}
                      />
                    </label>
                    <label className="grid gap-1 text-xs font-semibold text-[color:var(--muted)]">
                      Prix
                      <input
                        className="rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm"
                        name="itemPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={(item.unitPriceCents / 100).toFixed(2)}
                      />
                    </label>
                    <button
                      className="rounded-full border border-black/10 px-3 py-2 text-xs font-semibold text-[color:var(--muted)]"
                      type="button"
                      data-action="remove-quote-item"
                    >
                      Retirer
                    </button>
                  </div>
                ))}
                <p className="text-xs text-[color:var(--muted)]">
                  Mettre la quantité à 0 pour retirer un article.
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                  Ajouter des articles
                </p>
                <div data-role="quote-new-items" className="grid gap-3">
                  <div
                    data-role="quote-new-item-row"
                    className="grid gap-2 md:grid-cols-[2fr_1fr_1fr_auto]"
                  >
                    <div className="grid gap-2">
                      <input
                        className="rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm"
                        name="newItemLabel"
                        list={listId}
                        placeholder="Taper le nom de l'article"
                        data-role="quote-item-input"
                      />
                      <input type="hidden" name="newItemId" data-role="quote-item-id" />
                    </div>
                    <label className="grid gap-1 text-xs font-semibold text-[color:var(--muted)]">
                      Quantite
                      <input
                        className="rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm"
                        name="newItemQty"
                        type="number"
                        min="0"
                        max="0"
                        defaultValue="0"
                        data-role="quote-item-qty"
                      />
                    </label>
                    <label className="grid gap-1 text-xs font-semibold text-[color:var(--muted)]">
                      Prix
                      <input
                        className="rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm"
                        name="newItemPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue="0"
                        data-role="quote-item-price"
                      />
                    </label>
                    <button
                      className="rounded-full border border-black/10 px-3 py-2 text-xs font-semibold text-[color:var(--muted)]"
                      type="button"
                      data-action="remove-new-quote-item-row"
                    >
                      Retirer
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-[color:var(--muted)]"
                    type="button"
                    data-action="add-new-quote-item-row"
                  >
                    Ajouter une ligne
                  </button>
                  <p className="text-xs text-[color:var(--muted)]">
                    Laisser le prix a 0 pour utiliser le prix catalogue.
                  </p>
                </div>
              </div>

          <datalist id={listId}>
            {items.map((item) => (
              selectedItemIds.has(item.id) ? null : (
                <option
                  key={item.id}
                  value={item.name}
                  data-id={item.id}
                  data-price={(item.rentalPriceCents / 100).toFixed(2)}
                  data-available={availableByItem[item.id] ?? item.totalQty}
                  data-total={item.totalQty}
                />
              )
            ))}
          </datalist>

              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                  Lignes personnalisées
                </p>
                {[...otherLines, { id: "new-1" }, { id: "new-2" }, { id: "new-3" }].map((line) => (
                  <div key={line.id} className="grid gap-2 md:grid-cols-[2fr_1fr_1fr]">
                    <label className="grid gap-1 text-xs font-semibold text-[color:var(--muted)]">
                      Libelle
                      <input
                        className="rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm"
                        name="lineLabel"
                        placeholder="Libelle"
                        defaultValue={"label" in line ? line.label : ""}
                      />
                    </label>
                    <label className="grid gap-1 text-xs font-semibold text-[color:var(--muted)]">
                      Quantite
                      <input
                        className="rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm"
                        name="lineQty"
                        type="number"
                        min="0"
                        defaultValue={"quantity" in line ? line.quantity : 0}
                      />
                    </label>
                    <label className="grid gap-1 text-xs font-semibold text-[color:var(--muted)]">
                      Prix
                      <input
                        className="rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm"
                        name="linePrice"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={
                          "unitPriceCents" in line
                            ? (line.unitPriceCents / 100).toFixed(2)
                            : "0"
                        }
                      />
                    </label>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                  Remise
                </p>
                <input
                  className="rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm"
                  name="discountAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Montant de la remise en €"
                  defaultValue={discountCents < 0 ? (Math.abs(discountCents) / 100).toFixed(2) : "0"}
                />
              </div>

              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                  Caution
                </p>
                <input
                  className="rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm"
                  name="depositAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Montant de la caution en €"
                  defaultValue={(quote.depositAmountCents / 100).toFixed(2)}
                />
              </div>

              <button
                className="rounded-full bg-[color:var(--ink)] px-4 py-2 text-xs font-semibold text-white"
                type="submit"
              >
                Mettre à jour le devis
              </button>
            </form>

            <div className="mt-4 flex flex-wrap gap-2">
              <form action={generateQuotePdf}>
                <input type="hidden" name="quoteId" value={quote.id} />
                <button
                  className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-[color:var(--muted)]"
                  type="submit"
                >
                  Générer le PDF
                </button>
              </form>
              {quote.pdfUrl && (
                <a
                  className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-[color:var(--muted)]"
                  href={`/api/pdfs?key=${encodeURIComponent(quote.pdfUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Voir le PDF
                </a>
              )}
              {quote.pdfUrl && acceptLink && (
                <form action={markQuoteSent}>
                  <input type="hidden" name="id" value={demande.id} />
                  <button
                    className={`rounded-full px-4 py-2 text-xs font-semibold text-white shadow-[0_12px_24px_rgba(30,25,20,0.16)] transition hover:-translate-y-0.5 ${
                      demande.status === ContactStatus.PENDING
                        ? "bg-emerald-600 shadow-[0_12px_24px_rgba(5,150,105,0.25)]"
                        : "bg-sky-600 shadow-[0_12px_24px_rgba(2,132,199,0.25)]"
                    }`}
                    type="submit"
                  >
                    {demande.status === ContactStatus.PENDING
                      ? "Devis envoye"
                      : "Envoyer le devis"}
                  </button>
                </form>
              )}
              {demande.status === ContactStatus.PENDING && (
                <form action={reopenQuote}>
                  <input type="hidden" name="id" value={demande.id} />
                  <button
                    className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-[color:var(--muted)]"
                    type="submit"
                  >
                    Repasser en preparation
                  </button>
                </form>
              )}
              <form action={approveQuote}>
                <input type="hidden" name="id" value={quote.id} />
                <button
                  className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-[0_12px_24px_rgba(5,150,105,0.25)] transition hover:-translate-y-0.5"
                  type="submit"
                >
                  Confirmer manuellement
                </button>
              </form>
            </div>

            <p className="mt-3 text-sm font-semibold">
              Total: {(quote.totalAmountCents / 100).toFixed(2)} €
            </p>
            {discountCents < 0 && (
              <p className="mt-1 text-xs text-[color:var(--muted)]">
                Remise: {(Math.abs(discountCents) / 100).toFixed(2)} €
              </p>
            )}
            {quote.depositAmountCents > 0 && (
              <p className="mt-1 text-xs text-[color:var(--muted)]">
                Caution: {(quote.depositAmountCents / 100).toFixed(2)} €
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <form action={rejectQuote}>
                <input type="hidden" name="id" value={quote.id} />
                <button
                  className="rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700"
                  type="submit"
                >
                  Refuser le devis
                </button>
              </form>
            </div>
          </div>
        )}

        {quote && quote.status === QuoteStatus.ACCEPTED && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold">Devis signé</p>
              {quote.pdfUrl && (
                <a
                  className="rounded-full border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-700"
                  href={`/api/pdfs?key=${encodeURIComponent(quote.pdfUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ouvrir le PDF signé
                </a>
              )}
              {demande.status === ContactStatus.PENDING && (
                <form action={reopenQuote}>
                  <input type="hidden" name="id" value={demande.id} />
                  <button
                    className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-[color:var(--muted)]"
                    type="submit"
                  >
                    Repasser en preparation
                  </button>
                </form>
              )}
            </div>

            {(quote.signedName || quote.signedAt) && (
              <p className="mt-2 text-xs text-emerald-700">
                {quote.signedName ? `Signé par ${quote.signedName}` : "Signé"}
                {quote.signedAt
                  ? ` • ${quote.signedAt.toLocaleDateString("fr-FR")}`
                  : ""}
              </p>
            )}


            <div className="mt-3 space-y-2 text-sm text-[color:var(--muted)]">
              {quote.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3">
                  <span>{item.item.name}</span>
                  <span>
                    × {item.quantity} • {(item.unitPriceCents / 100).toFixed(2)} €
                  </span>
                </div>
              ))}
              {quote.lines.map((line) => (
                <div key={line.id} className="flex items-center justify-between gap-3">
                  <span>{line.label}</span>
                  <span>
                    × {line.quantity} • {(line.unitPriceCents / 100).toFixed(2)} €
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-3 text-sm font-semibold">
              Total: {(quote.totalAmountCents / 100).toFixed(2)} €
            </p>
            {quote.depositAmountCents > 0 && (
              <p className="mt-1 text-xs text-[color:var(--muted)]">
                Caution: {(quote.depositAmountCents / 100).toFixed(2)} €
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="space-y-6">
      <Script id="quote-autofill" strategy="afterInteractive">
        {`
          document.addEventListener('change', (event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;
            const select = target.closest('select[data-role="quote-item-select"]');
            if (select) {
              const selected = select.options[select.selectedIndex];
              const price = selected?.getAttribute('data-price');
              const row = select.closest('div');
              if (!row) return;
              const priceInput = row.querySelector('input[data-role="quote-item-price"]');
              const qtyInput = row.querySelector('input[data-role="quote-item-qty"]');
              if (priceInput && price) priceInput.value = price;
              if (qtyInput && qtyInput.value === '0') qtyInput.value = '1';
              return;
            }

            const input = target.closest('input[data-role="quote-item-input"]');
            if (!input) return;
            const listId = input.getAttribute('list');
            const datalist = listId ? document.getElementById(listId) : null;
            if (!datalist) return;
            const option = Array.from(datalist.querySelectorAll('option')).find(
              (opt) => opt.value === input.value
            );
            if (!option) return;
            const row = input.closest('[data-role="quote-new-item-row"]');
            if (!row) return;
            const price = option.getAttribute('data-price');
            const itemId = option.getAttribute('data-id');
            const available = option.getAttribute('data-available');
            const idInput = row.querySelector('input[data-role="quote-item-id"]');
            const priceInput = row.querySelector('input[data-role="quote-item-price"]');
            const qtyInput = row.querySelector('input[data-role="quote-item-qty"]');
            const selectedInExisting = Array.from(document.querySelectorAll('input[name="itemId"]'))
              .some((el) => el instanceof HTMLInputElement && el.value === itemId);
            const selectedInNewRows = Array.from(document.querySelectorAll('input[data-role="quote-item-id"]'))
              .some((el) => {
                if (!(el instanceof HTMLInputElement)) return false;
                if (el === idInput) return false;
                return el.value === itemId;
              });
            if (selectedInExisting || selectedInNewRows) {
              input.value = '';
              if (idInput instanceof HTMLInputElement) idInput.value = '';
              if (priceInput instanceof HTMLInputElement) priceInput.value = '0';
              if (qtyInput instanceof HTMLInputElement) qtyInput.value = '0';
              return;
            }
            if (idInput && itemId) idInput.value = itemId;
            if (priceInput && price) priceInput.value = price;
            if (qtyInput) {
              if (available) qtyInput.max = available;
              if (qtyInput.value === '0') qtyInput.value = '1';
            }
          });

          document.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;
            if (!target.matches('[data-action="add-new-quote-item-row"]')) return;
            const container = document.querySelector('[data-role="quote-new-items"]');
            if (!container) return;
            const row = container.querySelector('[data-role="quote-new-item-row"]');
            if (!row) return;
            const clone = row.cloneNode(true);
            if (!(clone instanceof HTMLElement)) return;
            clone.querySelectorAll('input').forEach((input) => {
              if (!(input instanceof HTMLInputElement)) return;
              if (input.name === 'newItemQty' || input.name === 'newItemPrice') {
                input.value = '0';
              } else {
                input.value = '';
              }
              if (input.dataset.role === 'quote-item-id') input.value = '';
              input.removeAttribute('data-filled');
            });
            const qtyInput = clone.querySelector('input[data-role="quote-item-qty"]');
            if (qtyInput instanceof HTMLInputElement) {
              qtyInput.max = '0';
            }
            container.appendChild(clone);
          });

          document.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;
            if (!target.matches('[data-action="remove-new-quote-item-row"]')) return;
            const row = target.closest('[data-role="quote-new-item-row"]');
            if (!row) return;
            const container = row.parentElement;
            if (!container) return;
            const rows = container.querySelectorAll('[data-role="quote-new-item-row"]');
            if (rows.length <= 1) {
              row.querySelectorAll('input').forEach((input) => {
                if (!(input instanceof HTMLInputElement)) return;
                if (input.name === 'newItemQty' || input.name === 'newItemPrice') {
                  input.value = '0';
                } else {
                  input.value = '';
                }
                if (input.dataset.role === 'quote-item-id') input.value = '';
              });
              return;
            }
            row.remove();
          });

          document.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;
            if (!target.matches('[data-action="remove-quote-item"]')) return;
            const row = target.closest('div');
            if (!row) return;
            const qtyInput = row.querySelector('input[name="itemQty"]');
            if (qtyInput) qtyInput.value = '0';
            row.style.opacity = '0.6';
          });
        `}
      </Script>
      <header className="rounded-3xl border border-black/5 bg-white/80 p-8 shadow-[0_15px_30px_rgba(22,18,14,0.08)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
          Espace entreprise
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Demandes reçues</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Suivi des demandes, propositions de devis et réservations.
        </p>
      </header>

      <div className="space-y-6">
        <div className="rounded-3xl border border-black/5 bg-white/80 p-6">
          <h2 className="text-xl font-semibold">1. Nouvelles demandes</h2>
          {demandesNouvelles.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-black/10 bg-[color:var(--surface)] p-6 text-sm text-[color:var(--muted)]">
              Aucune nouvelle demande.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {demandesNouvelles.map(renderDemandeCard)}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-black/5 bg-white/80 p-6">
          <h2 className="text-xl font-semibold">2. Prise de contact</h2>
          {prisesDeContact.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-black/10 bg-[color:var(--surface)] p-6 text-sm text-[color:var(--muted)]">
              Aucune prise de contact.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {prisesDeContact.map(renderDemandeCard)}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-black/5 bg-white/80 p-6">
          <h2 className="text-xl font-semibold">3. Devis en préparation</h2>
          {devisEnPreparation.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-black/10 bg-[color:var(--surface)] p-6 text-sm text-[color:var(--muted)]">
              Aucun devis en préparation.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {devisEnPreparation.map(renderDemandeCard)}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-black/5 bg-white/80 p-6">
          <h2 className="text-xl font-semibold">4. Devis envoyés</h2>
          {devisEnvoyes.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-black/10 bg-[color:var(--surface)] p-6 text-sm text-[color:var(--muted)]">
              Aucun devis envoyé.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {devisEnvoyes.map(renderDemandeCard)}
            </div>
          )}
        </div>

        {refusees.length > 0 && (
          <div className="rounded-3xl border border-black/5 bg-white/60 p-6">
            <h2 className="text-xl font-semibold">Refusées</h2>
            <div className="mt-4 space-y-4">
              {refusees.map(renderDemandeCard)}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
