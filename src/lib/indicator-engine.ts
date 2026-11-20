import {
  ALL_TIME,
  buildOrders,
  buildPayments,
  calendarDate,
  clientStatistics,
  euro,
  inPeriod,
  type AnalyticsSnapshot,
} from "@/lib/analytics";
import {
  INDICATOR_SOURCES,
  type IndicatorDefinition,
} from "@/lib/indicator-config";

type IndicatorRow = {
  id: string;
  clientId: string | null;
  status: string;
  category?: string;
  itemId?: string;
  itemName?: string;
  eventType?: string;
  values: Record<string, number | null>;
  dates: Record<string, Date | null>;
  estimated?: boolean;
  estimatedDate?: boolean;
};
export type IndicatorResult = {
  value: number | null;
  unit: "money" | "number";
  recordCount: number;
  measuredCount: number;
  estimatedCount: number;
  estimatedDateCount: number;
  groups: { key: string; label: string; value: number | null; count: number }[];
  calculatedAt: string;
};

function rowsForSource(
  snapshot: AnalyticsSnapshot,
  source: IndicatorDefinition["source"],
): IndicatorRow[] {
  if (source === "orders")
    return buildOrders(snapshot).map((o) => ({
      id: o.id,
      clientId: o.clientId,
      status: o.status,
      eventType: o.eventType,
      values: { amountCents: o.amountCents },
      dates: { orderedAt: o.orderedAt, eventDate: o.eventDate },
      estimated: o.estimated,
    }));
  if (source === "invoices") {
    const collected = new Map<string, number>();
    for (const p of buildPayments(snapshot.invoices)) {
      const id = p.id.slice(0, p.id.lastIndexOf(":"));
      collected.set(id, (collected.get(id) ?? 0) + p.amountCents);
    }
    return snapshot.invoices.map((i) => ({
      id: i.id,
      clientId: i.clientId,
      status: i.status,
      values: {
        totalAmountCents: i.totalAmountCents,
        collectedCents: collected.get(i.id) ?? 0,
        outstandingCents:
          i.status === "CANCELLED"
            ? 0
            : Math.max(0, i.totalAmountCents - (collected.get(i.id) ?? 0)),
      },
      dates: {
        issueDate: i.issueDate,
        paidAt: i.paidAt,
        serviceDate: i.serviceDate,
      },
    }));
  }
  if (source === "payments")
    return buildPayments(snapshot.invoices).map((p) => ({
      id: p.id,
      clientId: p.clientId,
      status: p.status,
      values: { amountCents: p.amountCents },
      dates: { date: p.date },
      estimatedDate: p.estimatedDate,
    }));
  if (source === "quotes")
    return snapshot.quotes.map((q) => ({
      id: q.id,
      clientId: q.clientId,
      status: q.status,
      eventType: q.contactRequest?.eventType?.trim() || "Non renseigné",
      values: {
        totalAmountCents: q.totalAmountCents,
        depositAmountCents: q.depositAmountCents,
      },
      dates: {
        createdAt: q.createdAt,
        signedAt: q.signedAt,
        eventDate: q.eventDate,
      },
    }));
  if (source === "requests")
    return snapshot.requests.map((r) => ({
      id: r.id,
      clientId: r.clientId,
      status: r.status,
      eventType: r.eventType?.trim() || "Non renseigné",
      values: { guestCount: r.guestCount, budgetCents: r.budgetCents },
      dates: { createdAt: r.createdAt, eventDate: r.eventDate },
    }));
  if (source === "clients") {
    const orders = buildOrders(snapshot);
    return snapshot.clients.map((c) => ({
      id: c.id,
      clientId: c.id,
      status: "",
      values: ((stats) => ({
        orderCount: stats.orderCount,
        totalCents:
          stats.orderCount > 0 && stats.pricedCount === 0
            ? null
            : stats.totalCents,
        averageCents: stats.averageCents,
        collectedCents: stats.collectedCents,
      }))(clientStatistics(c.id, orders, snapshot.invoices, ALL_TIME)),
      dates: { createdAt: c.createdAt },
    }));
  }
  if (source === "items")
    return snapshot.items.map((i) => ({
      id: i.id,
      clientId: null,
      status: i.active ? "ACTIVE" : "INACTIVE",
      category: i.category?.name ?? "Sans catégorie",
      itemId: i.id,
      itemName: i.name,
      values: {
        totalQty: i.totalQty,
        damageQty: i.damageQty,
        rentalPriceCents: i.rentalPriceCents,
        depositPriceCents: i.depositPriceCents,
      },
      dates: { createdAt: i.createdAt },
    }));
  return snapshot.reservations.flatMap((r) =>
    r.items.map((line) => ({
      id: line.id,
      clientId: r.clientId,
      status: r.status,
      category: line.item.category?.name ?? "Sans catégorie",
      itemId: line.item.id,
      itemName: line.item.name,
      values: {
        quantity: line.quantity,
        amountCents: line.quantity * line.unitPriceCents,
        unitPriceCents: line.unitPriceCents,
      },
      dates: { createdAt: r.createdAt, eventDate: r.eventDate ?? r.startDate },
    })),
  );
}

function aggregate(
  rows: IndicatorRow[],
  definition: IndicatorDefinition,
): number | null {
  if (definition.aggregation === "count") return rows.length;
  if (definition.aggregation === "uniqueClients")
    return new Set(rows.map((r) => r.clientId).filter(Boolean)).size;
  const values = rows
    .map((r) => r.values[definition.field])
    .filter((n): n is number => typeof n === "number" && Number.isFinite(n));
  if (definition.aggregation === "sum")
    return values.length
      ? values.reduce((sum, value) => sum + value, 0)
      : rows.length
        ? null
        : 0;
  if (!values.length) return null;
  if (definition.aggregation === "average")
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.reduce((result, value) =>
    definition.aggregation === "min"
      ? Math.min(result, value)
      : Math.max(result, value),
  );
}

export function calculateIndicator(
  snapshot: AnalyticsSnapshot,
  definition: IndicatorDefinition,
  now = new Date(),
): IndicatorResult {
  const source = INDICATOR_SOURCES[definition.source];
  const multiplier = source.fields[definition.field].unit === "money" ? 100 : 1;
  const rows = rowsForSource(snapshot, definition.source).filter((r) => {
    if (definition.clientId && r.clientId !== definition.clientId) return false;
    if (definition.statuses.length && !definition.statuses.includes(r.status))
      return false;
    if (definition.category && r.category !== definition.category) return false;
    if (definition.eventType && r.eventType !== definition.eventType)
      return false;
    if (
      !inPeriod(r.dates[definition.dateField] ?? null, definition.period, now)
    )
      return false;
    const value = r.values[definition.field];
    if (
      definition.minimum !== null &&
      (value === null ||
        value === undefined ||
        value < definition.minimum * multiplier)
    )
      return false;
    if (
      definition.maximum !== null &&
      (value === null ||
        value === undefined ||
        value > definition.maximum * multiplier)
    )
      return false;
    return true;
  });
  const clientNames = new Map(snapshot.clients.map((c) => [c.id, c.name]));
  const groups = new Map<string, { label: string; rows: IndicatorRow[] }>();
  if (definition.groupBy !== "none")
    for (const row of rows) {
      let key: string, label: string;
      if (definition.groupBy === "client") {
        key = row.clientId ?? "none";
        label = clientNames.get(key) ?? "Sans client associé";
      } else if (definition.groupBy === "month") {
        const date = row.dates[definition.dateField];
        key = date ? calendarDate(date).slice(0, 7) : "unknown";
        label = date
          ? new Date(`${key}-15T12:00:00Z`).toLocaleDateString("fr-FR", {
              month: "long",
              year: "numeric",
              timeZone: "Europe/Paris",
            })
          : "Date non renseignée";
      } else if (definition.groupBy === "item") {
        key = row.itemId ?? "none";
        label = row.itemName ?? "Article inconnu";
      } else {
        key =
          definition.groupBy === "status"
            ? row.status
            : definition.groupBy === "category"
              ? (row.category ?? "Sans catégorie")
              : (row.eventType ?? "Non renseigné");
        label = key;
      }
      if (!groups.has(key)) groups.set(key, { label, rows: [] });
      groups.get(key)!.rows.push(row);
    }
  const breakdown = Array.from(groups, ([key, group]) => ({
    key,
    label: group.label,
    value: aggregate(group.rows, definition),
    count: group.rows.length,
  }));
  breakdown.sort((a, b) =>
    definition.groupBy === "month"
      ? a.key.localeCompare(b.key)
      : (b.value ?? -Infinity) - (a.value ?? -Infinity) ||
        a.label.localeCompare(b.label, "fr"),
  );
  return {
    value: aggregate(rows, definition),
    unit: ["count", "uniqueClients"].includes(definition.aggregation)
      ? "number"
      : source.fields[definition.field].unit,
    recordCount: rows.length,
    measuredCount: rows.filter(
      (r) => typeof r.values[definition.field] === "number",
    ).length,
    estimatedCount: rows.filter((r) => r.estimated).length,
    estimatedDateCount: rows.filter((r) => r.estimatedDate).length,
    groups: breakdown,
    calculatedAt: now.toISOString(),
  };
}

export const indicatorValue = (
  value: number | null,
  unit: "money" | "number",
) =>
  unit === "money"
    ? euro(value)
    : value === null
      ? "—"
      : new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(
          value,
        );
