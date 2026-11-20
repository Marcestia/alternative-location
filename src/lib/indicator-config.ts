import {
  ALL_TIME,
  validCalendarDate,
  type AnalyticsPeriod,
} from "@/lib/analytics";

export type IndicatorSource =
  | "orders"
  | "invoices"
  | "payments"
  | "quotes"
  | "requests"
  | "clients"
  | "items"
  | "rentalLines";
export type IndicatorAggregation =
  "count" | "sum" | "average" | "min" | "max" | "uniqueClients";
export type IndicatorGroup =
  "none" | "client" | "month" | "status" | "category" | "item" | "eventType";
export type IndicatorDefinition = {
  version: 1;
  source: IndicatorSource;
  aggregation: IndicatorAggregation;
  field: string;
  dateField: string;
  statuses: string[];
  period: AnalyticsPeriod;
  clientId: string;
  groupBy: IndicatorGroup;
  category: string;
  eventType: string;
  minimum: number | null;
  maximum: number | null;
};
type SourceConfig = {
  label: string;
  fields: Record<string, { label: string; unit: "money" | "number" }>;
  dates: Record<string, string>;
  statuses: string[];
  groups: IndicatorGroup[];
  clients: boolean;
};
const money = (label: string) => ({ label, unit: "money" as const });
const number = (label: string) => ({ label, unit: "number" as const });
export const INDICATOR_SOURCES: Record<IndicatorSource, SourceConfig> = {
  orders: {
    label: "Commandes",
    fields: { amountCents: money("Montant de la commande") },
    dates: { orderedAt: "Date de commande", eventDate: "Date de l’événement" },
    statuses: [
      "DRAFT",
      "PENDING",
      "CONFIRMED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
    ],
    groups: ["none", "client", "month", "status", "eventType"],
    clients: true,
  },
  invoices: {
    label: "Factures",
    fields: {
      totalAmountCents: money("Montant total TTC"),
      collectedCents: money("Encaissements enregistrés sur la facture"),
      outstandingCents: money("Solde restant de la facture"),
    },
    dates: {
      issueDate: "Date d’émission",
      paidAt: "Date de paiement du solde",
      serviceDate: "Date de prestation",
    },
    statuses: ["DRAFT", "SENT", "PAID", "CANCELLED"],
    groups: ["none", "client", "month", "status"],
    clients: true,
  },
  payments: {
    label: "Encaissements",
    fields: { amountCents: money("Montant encaissé") },
    dates: { date: "Date d’encaissement" },
    statuses: ["ADVANCE", "BALANCE"],
    groups: ["none", "client", "month", "status"],
    clients: true,
  },
  quotes: {
    label: "Devis",
    fields: {
      totalAmountCents: money("Montant du devis"),
      depositAmountCents: money("Acompte prévu"),
    },
    dates: {
      createdAt: "Date de création",
      signedAt: "Date de signature",
      eventDate: "Date de l’événement",
    },
    statuses: ["DRAFT", "SUBMITTED", "ACCEPTED", "REJECTED"],
    groups: ["none", "client", "month", "status", "eventType"],
    clients: true,
  },
  requests: {
    label: "Demandes",
    fields: {
      guestCount: number("Nombre de convives"),
      budgetCents: money("Budget indiqué"),
    },
    dates: { createdAt: "Date de réception", eventDate: "Date de l’événement" },
    statuses: [
      "NEW",
      "CONTACTED",
      "PENDING",
      "QUOTE_RECEIVED",
      "CONFIRMED",
      "REFUSED",
    ],
    groups: ["none", "client", "month", "status", "eventType"],
    clients: true,
  },
  clients: {
    label: "Clients",
    fields: {
      orderCount: number("Commandes sur tout l’historique"),
      totalCents: money("Montant commandé sur tout l’historique"),
      averageCents: money("Panier moyen sur tout l’historique"),
      collectedCents: money("Encaissements sur tout l’historique"),
    },
    dates: { createdAt: "Date de création de la fiche" },
    statuses: [],
    groups: ["none", "client", "month"],
    clients: true,
  },
  items: {
    label: "Articles du catalogue",
    fields: {
      totalQty: number("Quantité en stock"),
      damageQty: number("Quantité endommagée"),
      rentalPriceCents: money("Prix de location unitaire"),
      depositPriceCents: money("Caution unitaire"),
    },
    dates: { createdAt: "Date de création de l’article" },
    statuses: ["ACTIVE", "INACTIVE"],
    groups: ["none", "month", "status", "category", "item"],
    clients: false,
  },
  rentalLines: {
    label: "Articles des réservations",
    fields: {
      quantity: number("Quantité louée"),
      amountCents: money("Montant de la ligne"),
      unitPriceCents: money("Prix de location unitaire"),
    },
    dates: {
      createdAt: "Date de création de la réservation",
      eventDate: "Date de l’événement",
    },
    statuses: [
      "DRAFT",
      "PENDING",
      "CONFIRMED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
    ],
    groups: ["none", "client", "month", "status", "category", "item"],
    clients: true,
  },
};
export const AGGREGATION_LABELS: Record<IndicatorAggregation, string> = {
  count: "Nombre",
  sum: "Somme",
  average: "Moyenne",
  min: "Minimum",
  max: "Maximum",
  uniqueClients: "Clients distincts",
};
export const GROUP_LABELS: Record<IndicatorGroup, string> = {
  none: "Sans regroupement",
  client: "Par client",
  month: "Par mois",
  status: "Par statut",
  category: "Par catégorie",
  item: "Par article",
  eventType: "Par type d’événement",
};
export const PERIOD_LABELS: Record<AnalyticsPeriod["preset"], string> = {
  all: "Tout l’historique",
  year: "Année en cours",
  lastYear: "Année précédente",
  "30days": "30 derniers jours",
  custom: "Dates personnalisées",
};

export function defaultIndicator(
  source: IndicatorSource = "orders",
  clientId = "",
): IndicatorDefinition {
  const config = INDICATOR_SOURCES[source];
  return {
    version: 1,
    source,
    aggregation: "count",
    field: Object.keys(config.fields)[0],
    dateField: Object.keys(config.dates)[0],
    statuses:
      source === "orders" || source === "rentalLines"
        ? ["CONFIRMED", "IN_PROGRESS", "COMPLETED"]
        : source === "invoices"
          ? ["SENT", "PAID"]
          : [],
    period: { ...ALL_TIME },
    clientId: config.clients ? clientId : "",
    groupBy: "none",
    category: "",
    eventType: "",
    minimum: null,
    maximum: null,
  };
}

export function parseIndicatorDefinition(input: unknown): IndicatorDefinition {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("Configuration d’indicateur invalide.");
  const value = input as Record<string, unknown>;
  if (
    value.version !== 1 ||
    typeof value.source !== "string" ||
    !Object.hasOwn(INDICATOR_SOURCES, value.source)
  )
    throw new Error("Choisissez une source de données valide.");
  const source = value.source as IndicatorSource,
    config = INDICATOR_SOURCES[source];
  if (
    typeof value.aggregation !== "string" ||
    !Object.hasOwn(AGGREGATION_LABELS, value.aggregation)
  )
    throw new Error("Choisissez un calcul valide.");
  if (value.aggregation === "uniqueClients" && !config.clients)
    throw new Error("Cette source ne contient pas de clients.");
  if (
    typeof value.field !== "string" ||
    !Object.hasOwn(config.fields, value.field)
  )
    throw new Error("Choisissez un champ valide pour cette source.");
  if (
    typeof value.dateField !== "string" ||
    !Object.hasOwn(config.dates, value.dateField)
  )
    throw new Error("Choisissez une date valide pour cette source.");
  if (
    typeof value.groupBy !== "string" ||
    !config.groups.includes(value.groupBy as IndicatorGroup)
  )
    throw new Error("Regroupement incompatible avec cette source.");
  if (
    !Array.isArray(value.statuses) ||
    value.statuses.length > config.statuses.length ||
    !value.statuses.every(
      (s) => typeof s === "string" && config.statuses.includes(s),
    )
  )
    throw new Error("Statuts invalides pour cette source.");
  const period = value.period as Record<string, unknown> | undefined;
  if (
    !period ||
    typeof period.preset !== "string" ||
    !Object.hasOwn(PERIOD_LABELS, period.preset)
  )
    throw new Error("Période invalide.");
  const from =
    period.preset === "custom" && typeof period.from === "string"
      ? period.from
      : "";
  const to =
    period.preset === "custom" && typeof period.to === "string"
      ? period.to
      : "";
  if (
    period.preset === "custom" &&
    ((!from && !to) ||
      (from && !validCalendarDate(from)) ||
      (to && !validCalendarDate(to)) ||
      (from && to && from > to))
  )
    throw new Error("Vérifiez les dates de début et de fin.");
  const text = (key: string, maximum: number) => {
    const raw = value[key];
    if (typeof raw !== "string" || raw.length > maximum)
      throw new Error("Filtre invalide.");
    return raw.trim();
  };
  const clientId = text("clientId", 128),
    category = text("category", 150),
    eventType = text("eventType", 150);
  if (clientId && !config.clients)
    throw new Error("Le catalogue global ne peut pas être filtré par client.");
  if (category && !["items", "rentalLines"].includes(source))
    throw new Error("Filtre de catégorie incompatible.");
  if (eventType && !["orders", "quotes", "requests"].includes(source))
    throw new Error("Filtre d’événement incompatible.");
  const numeric = (key: string) => {
    const raw = value[key];
    if (raw === null) return null;
    if (
      typeof raw !== "number" ||
      !Number.isFinite(raw) ||
      Math.abs(raw) > 1e12
    )
      throw new Error("Seuil numérique invalide.");
    return raw;
  };
  const minimum = numeric("minimum"),
    maximum = numeric("maximum");
  if (minimum !== null && maximum !== null && minimum > maximum)
    throw new Error("Le minimum doit être inférieur ou égal au maximum.");
  return {
    version: 1,
    source,
    aggregation: value.aggregation as IndicatorAggregation,
    field: value.field,
    dateField: value.dateField,
    statuses: [...new Set(value.statuses as string[])],
    period: { preset: period.preset as AnalyticsPeriod["preset"], from, to },
    clientId,
    groupBy: value.groupBy as IndicatorGroup,
    category,
    eventType,
    minimum,
    maximum,
  };
}
