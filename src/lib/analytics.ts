export const ORDER_STATUSES = ["CONFIRMED", "IN_PROGRESS", "COMPLETED"];
export const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
  SENT: "Envoyée",
  PAID: "Payée",
  SUBMITTED: "Soumis",
  ACCEPTED: "Accepté",
  REJECTED: "Refusé",
  NEW: "Nouvelle",
  CONTACTED: "Contactée",
  QUOTE_RECEIVED: "Devis reçu",
  REFUSED: "Refusée",
  ADVANCE: "Acompte",
  BALANCE: "Solde",
  ACTIVE: "Actif",
  INACTIVE: "Inactif",
};
export type AnalyticsInvoice = {
  id: string;
  clientId: string;
  number: string;
  status: string;
  quoteId: string | null;
  reservationId: string | null;
  totalAmountCents: number;
  advanceAmountCents: number;
  advanceReceivedAt: Date | null;
  issueDate: Date;
  paidAt: Date | null;
  serviceDate: Date | null;
  createdAt: Date;
};
export type AnalyticsQuote = {
  id: string;
  clientId: string;
  quoteNumber: string | null;
  status: string;
  startDate: Date;
  endDate: Date;
  eventDate: Date | null;
  createdAt: Date;
  signedAt: Date | null;
  totalAmountCents: number;
  depositAmountCents: number;
  contactRequest: { eventType: string | null } | null;
};
export type AnalyticsReservation = {
  id: string;
  clientId: string;
  code: string;
  status: string;
  startDate: Date;
  endDate: Date;
  eventDate: Date | null;
  createdAt: Date;
  items: {
    id: string;
    quantity: number;
    unitPriceCents: number;
    item: { id: string; name: string; category: { name: string } | null };
  }[];
};
export type AnalyticsRequest = {
  id: string;
  clientId: string | null;
  status: string;
  createdAt: Date;
  eventDate: Date | null;
  eventType: string | null;
  guestCount: number | null;
  budgetCents: number | null;
};
export type AnalyticsClient = { id: string; name: string; createdAt: Date };
export type AnalyticsItem = {
  id: string;
  name: string;
  active: boolean;
  totalQty: number;
  damageQty: number;
  rentalPriceCents: number;
  depositPriceCents: number;
  createdAt: Date;
  category: { name: string } | null;
};
export type AnalyticsSnapshot = {
  clients: AnalyticsClient[];
  reservations: AnalyticsReservation[];
  quotes: AnalyticsQuote[];
  invoices: AnalyticsInvoice[];
  requests: AnalyticsRequest[];
  items: AnalyticsItem[];
};
export type AnalyticsOrder = {
  id: string;
  clientId: string;
  reference: string;
  status: string;
  orderedAt: Date;
  eventDate: Date;
  amountCents: number | null;
  estimated: boolean;
  eventType: string;
  origin: "reservation" | "quote" | "invoice";
  invoiceIds: string[];
  quoteIds: string[];
};
export type AnalyticsPayment = {
  id: string;
  clientId: string;
  amountCents: number;
  date: Date;
  status: "ADVANCE" | "BALANCE";
  estimatedDate: boolean;
};

const parisCalendar = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Paris",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
export function calendarDate(date: Date) {
  const parts = parisCalendar.formatToParts(date);
  return ["year", "month", "day"]
    .map((type) => parts.find((part) => part.type === type)?.value)
    .join("-");
}
export type AnalyticsPeriod = {
  preset: "all" | "year" | "lastYear" | "30days" | "custom";
  from: string;
  to: string;
};
export const ALL_TIME: AnalyticsPeriod = { preset: "all", from: "", to: "" };
export function periodBounds(period: AnalyticsPeriod, now = new Date()) {
  const today = calendarDate(now),
    year = Number(today.slice(0, 4));
  if (period.preset === "year")
    return { from: `${year}-01-01`, to: `${year}-12-31` };
  if (period.preset === "lastYear")
    return { from: `${year - 1}-01-01`, to: `${year - 1}-12-31` };
  if (period.preset === "30days") {
    const start = new Date(`${today}T12:00:00Z`);
    start.setUTCDate(start.getUTCDate() - 29);
    return { from: start.toISOString().slice(0, 10), to: today };
  }
  return period.preset === "custom"
    ? { from: period.from, to: period.to }
    : { from: "", to: "" };
}
export function inPeriod(
  date: Date | null,
  period: AnalyticsPeriod,
  now = new Date(),
) {
  const { from, to } = periodBounds(period, now);
  if (!from && !to) return true;
  if (!date) return false;
  const key = calendarDate(date);
  return (!from || key >= from) && (!to || key <= to);
}
export function validCalendarDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(`${value}T12:00:00Z`)) &&
    new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value
  );
}

export function buildOrders(snapshot: AnalyticsSnapshot): AnalyticsOrder[] {
  type Bucket = {
    reservation?: AnalyticsReservation;
    quotes: AnalyticsQuote[];
    invoices: AnalyticsInvoice[];
  };
  const buckets = new Map<string, Bucket>();
  const accepted = new Map(
    snapshot.quotes
      .filter((q) => q.status === "ACCEPTED")
      .map((q) => [q.id, q]),
  );
  const quoteBucket = new Map<string, string>();
  const reservationById = new Map(snapshot.reservations.map((r) => [r.id, r]));
  for (const r of snapshot.reservations)
    buckets.set(`r:${r.id}`, { reservation: r, quotes: [], invoices: [] });
  // Explicit invoice links take precedence over historical period matching.
  for (const invoice of snapshot.invoices) {
    const reservation = invoice.reservationId
      ? reservationById.get(invoice.reservationId)
      : undefined;
    if (
      invoice.quoteId &&
      accepted.has(invoice.quoteId) &&
      reservation?.clientId === invoice.clientId &&
      accepted.get(invoice.quoteId)?.clientId === invoice.clientId
    ) {
      quoteBucket.set(invoice.quoteId, `r:${reservation.id}`);
    }
  }
  for (const quote of accepted.values()) {
    let key = quoteBucket.get(quote.id);
    if (!key) {
      const candidates = snapshot.reservations.filter(
        (r) =>
          r.clientId === quote.clientId &&
          +r.startDate === +quote.startDate &&
          +r.endDate === +quote.endDate,
      );
      key = candidates.length === 1 ? `r:${candidates[0].id}` : `q:${quote.id}`;
      quoteBucket.set(quote.id, key);
    }
    if (!buckets.has(key)) buckets.set(key, { quotes: [], invoices: [] });
    buckets.get(key)!.quotes.push(quote);
  }
  for (const invoice of snapshot.invoices) {
    const reservation = invoice.reservationId
      ? reservationById.get(invoice.reservationId)
      : undefined;
    let key = invoice.quoteId ? quoteBucket.get(invoice.quoteId) : undefined;
    if (key) {
      const linked = buckets.get(key);
      const owner =
        linked?.reservation?.clientId ?? linked?.quotes[0]?.clientId;
      if (owner && owner !== invoice.clientId) key = undefined;
    }
    if (!key && reservation?.clientId === invoice.clientId)
      key = `r:${reservation.id}`;
    if (!key && ["SENT", "PAID"].includes(invoice.status))
      key = `i:${invoice.id}`;
    if (!key) continue;
    if (!buckets.has(key)) buckets.set(key, { quotes: [], invoices: [] });
    const bucket = buckets.get(key)!;
    const owner =
      bucket.reservation?.clientId ??
      bucket.quotes[0]?.clientId ??
      invoice.clientId;
    if (owner === invoice.clientId) bucket.invoices.push(invoice);
  }
  return Array.from(buckets, ([id, bucket]) => {
    const r = bucket.reservation;
    const quote = [...bucket.quotes].sort(
      (a, b) => +(b.signedAt ?? b.createdAt) - +(a.signedAt ?? a.createdAt),
    )[0];
    const invoices = bucket.invoices.filter((i) => i.status !== "CANCELLED");
    const invoice = invoices[0] ?? bucket.invoices[0];
    let amountCents: number | null = null;
    if (invoices.length)
      amountCents = invoices.reduce((sum, i) => sum + i.totalAmountCents, 0);
    else if (quote) amountCents = quote.totalAmountCents;
    else if (r?.items.length)
      amountCents = r.items.reduce(
        (sum, i) => sum + i.quantity * i.unitPriceCents,
        0,
      );
    const cancelled = bucket.invoices.length > 0 && invoices.length === 0;
    return {
      id,
      clientId: r?.clientId ?? quote?.clientId ?? invoice!.clientId,
      reference:
        r?.code ?? quote?.quoteNumber ?? invoice?.number ?? "Devis accepté",
      status: r
        ? quote && ["DRAFT", "PENDING"].includes(r.status)
          ? "CONFIRMED"
          : r.status
        : cancelled
          ? "CANCELLED"
          : "CONFIRMED",
      orderedAt:
        quote?.signedAt ??
        quote?.createdAt ??
        r?.createdAt ??
        invoice!.issueDate,
      eventDate:
        r?.eventDate ??
        r?.startDate ??
        quote?.eventDate ??
        quote?.startDate ??
        invoice!.serviceDate ??
        invoice!.issueDate,
      amountCents,
      estimated: invoices.length === 0 && amountCents !== null,
      eventType: quote?.contactRequest?.eventType?.trim() || "Non renseigné",
      origin: r ? "reservation" : quote ? "quote" : "invoice",
      invoiceIds: bucket.invoices.map((i) => i.id),
      quoteIds: bucket.quotes.map((q) => q.id),
    };
  });
}

export function buildPayments(
  invoices: AnalyticsInvoice[],
): AnalyticsPayment[] {
  return invoices.flatMap((invoice) => {
    if (invoice.status === "CANCELLED") return [];
    const total = Math.max(0, invoice.totalAmountCents);
    const advance = invoice.advanceReceivedAt
      ? Math.min(total, Math.max(0, invoice.advanceAmountCents))
      : 0;
    const result: AnalyticsPayment[] = [];
    if (advance > 0)
      result.push({
        id: `${invoice.id}:advance`,
        clientId: invoice.clientId,
        amountCents: advance,
        date: invoice.advanceReceivedAt!,
        status: "ADVANCE",
        estimatedDate: false,
      });
    if (invoice.status === "PAID" && total > advance)
      result.push({
        id: `${invoice.id}:balance`,
        clientId: invoice.clientId,
        amountCents: total - advance,
        date: invoice.paidAt ?? invoice.issueDate,
        status: "BALANCE",
        estimatedDate: !invoice.paidAt,
      });
    return result;
  });
}

export function clientStatistics(
  clientId: string,
  orders: AnalyticsOrder[],
  invoices: AnalyticsInvoice[],
  period: AnalyticsPeriod = ALL_TIME,
  now = new Date(),
) {
  const selected = orders.filter(
    (o) =>
      o.clientId === clientId &&
      ORDER_STATUSES.includes(o.status) &&
      inPeriod(o.orderedAt, period, now),
  );
  const priced = selected.filter((o) => o.amountCents !== null);
  const totalCents = priced.reduce((sum, o) => sum + (o.amountCents ?? 0), 0);
  const payments = buildPayments(
    invoices.filter((i) => i.clientId === clientId),
  ).filter((p) => inPeriod(p.date, period, now));
  const billedCents = invoices
    .filter(
      (i) =>
        i.clientId === clientId &&
        ["SENT", "PAID"].includes(i.status) &&
        inPeriod(i.issueDate, period, now),
    )
    .reduce((sum, i) => sum + i.totalAmountCents, 0);
  return {
    orderCount: selected.length,
    totalCents,
    averageCents: priced.length ? totalCents / priced.length : null,
    pricedCount: priced.length,
    unpricedCount: selected.length - priced.length,
    estimatedCount: priced.filter((o) => o.estimated).length,
    collectedCents: payments.reduce((sum, p) => sum + p.amountCents, 0),
    billedCents,
    estimatedPaymentDates: payments.filter((p) => p.estimatedDate).length,
    lastOrderAt: selected.length
      ? new Date(Math.max(...selected.map((o) => +o.orderedAt)))
      : null,
  };
}

export const euro = (cents: number | null) =>
  cents === null
    ? "—"
    : new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
      }).format(cents / 100);
export const shortDate = (date: Date | null) =>
  date ? date.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" }) : "—";
