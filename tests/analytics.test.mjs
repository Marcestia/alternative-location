import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const modules = new Map();
function load(relative) {
  if (modules.has(relative)) return modules.get(relative);
  const sandbox = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(path.join(root, relative), "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    {
      module: sandbox,
      exports: sandbox.exports,
      require(name) {
        assert(name.startsWith("@/lib/"));
        return load(`src/lib/${name.slice(6)}.ts`);
      },
    },
  );
  modules.set(relative, sandbox.exports);
  return sandbox.exports;
}
const {
  buildOrders,
  buildPayments,
  clientStatistics,
  ALL_TIME,
  calendarDate,
  periodBounds,
  inPeriod,
  validCalendarDate,
} = load("src/lib/analytics.ts");
const { defaultIndicator, parseIndicatorDefinition } = load(
  "src/lib/indicator-config.ts",
);
const { calculateIndicator } = load("src/lib/indicator-engine.ts");
const { readAnalyticsPeriod } = load("src/lib/analytics-period.ts");
const date = (value = "2026-01-10") => new Date(`${value}T12:00:00Z`);
const now = date("2026-11-20");
const snapshot = (values = {}) => ({
  clients: [
    { id: "c1", name: "Client 1", createdAt: date() },
    { id: "c2", name: "Client 2", createdAt: date() },
  ],
  reservations: [],
  quotes: [],
  invoices: [],
  requests: [],
  items: [],
  ...values,
});
const line = (values = {}) => ({
  id: "line1",
  quantity: 2,
  unitPriceCents: 4000,
  item: { id: "item1", name: "Table", category: { name: "Mobilier" } },
  ...values,
});
const reservation = (values = {}) => ({
  id: "r1",
  clientId: "c1",
  code: "RES-1",
  status: "CONFIRMED",
  startDate: date("2026-06-01"),
  endDate: date("2026-06-02"),
  eventDate: null,
  createdAt: date(),
  items: [line()],
  ...values,
});
const quote = (values = {}) => ({
  id: "q1",
  clientId: "c1",
  quoteNumber: "DEV-1",
  status: "ACCEPTED",
  startDate: date("2026-06-01"),
  endDate: date("2026-06-02"),
  eventDate: null,
  createdAt: date(),
  signedAt: date("2026-01-12"),
  totalAmountCents: 12000,
  depositAmountCents: 3600,
  contactRequest: { eventType: "Mariage" },
  ...values,
});
const invoice = (values = {}) => ({
  id: "i1",
  clientId: "c1",
  number: "FAC-1",
  status: "SENT",
  quoteId: "q1",
  reservationId: "r1",
  totalAmountCents: 15000,
  advanceAmountCents: 4500,
  advanceReceivedAt: null,
  issueDate: date(),
  paidAt: null,
  serviceDate: null,
  createdAt: date(),
  ...values,
});
const customPeriod = (from, to) => ({ preset: "custom", from, to });
const plain = (value) => JSON.parse(JSON.stringify(value));

test("quote + reservation + invoice count as one order with the invoice amount", () => {
  const data = snapshot({
    reservations: [reservation()],
    quotes: [quote()],
    invoices: [invoice()],
  });
  const orders = buildOrders(data),
    stats = clientStatistics("c1", orders, data.invoices);
  assert.equal(orders.length, 1);
  assert.equal(stats.orderCount, 1);
  assert.equal(stats.totalCents, 15000);
  assert.equal(stats.averageCents, 15000);
  assert.equal(stats.estimatedCount, 0);
});

test("historical accepted quotes without reservations stay included; drafts and rejected quotes do not", () => {
  const data = snapshot({
    quotes: [
      quote(),
      quote({ id: "draft", status: "DRAFT" }),
      quote({ id: "rejected", status: "REJECTED" }),
    ],
  });
  const orders = buildOrders(data);
  assert.equal(orders.length, 1);
  assert.equal(orders[0].origin, "quote");
  assert.equal(orders[0].estimated, true);
  assert.equal(orders[0].amountCents, 12000);
});

test("unambiguous historical periods merge revisions and use the latest accepted quote", () => {
  const data = snapshot({
    reservations: [reservation()],
    quotes: [
      quote({
        id: "old",
        signedAt: date("2026-01-11"),
        totalAmountCents: 10000,
      }),
      quote({
        id: "new",
        signedAt: date("2026-01-12"),
        totalAmountCents: 14000,
      }),
    ],
  });
  const orders = buildOrders(data);
  assert.equal(orders.length, 1);
  assert.equal(orders[0].amountCents, 14000);
  assert.equal(orders[0].quoteIds.length, 2);
});

test("ambiguous reservations and different clients are never merged by period alone", () => {
  const data = snapshot({
    reservations: [
      reservation(),
      reservation({ id: "r2" }),
      reservation({ id: "r3", clientId: "c2" }),
    ],
    quotes: [quote()],
  });
  assert.equal(buildOrders(data).length, 4);
});

test("an invoice belonging to another client cannot inflate the first client's order", () => {
  const data = snapshot({
    quotes: [quote()],
    invoices: [invoice({ clientId: "c2", reservationId: null })],
  });
  const orders = buildOrders(data);
  assert.equal(clientStatistics("c1", orders, data.invoices).totalCents, 12000);
  assert.equal(clientStatistics("c2", orders, data.invoices).totalCents, 15000);
});

test("cancelled/pending/draft orders are excluded from standard customer statistics", () => {
  const data = snapshot({
    reservations: [
      reservation({ status: "CANCELLED" }),
      reservation({ id: "pending", status: "PENDING" }),
      reservation({ id: "draft", status: "DRAFT" }),
    ],
    quotes: [quote()],
    invoices: [invoice({ status: "CANCELLED" })],
  });
  assert.equal(clientStatistics("c1", buildOrders(data), []).orderCount, 0);
});

test("a signed accepted quote confirms its linked pending reservation commercially", () => {
  const data = snapshot({
    reservations: [reservation({ status: "PENDING" })],
    quotes: [quote()],
  });
  assert.equal(clientStatistics("c1", buildOrders(data), []).orderCount, 1);
});

test("missing prices are excluded from the average while explicit free orders remain included", () => {
  const data = snapshot({
    reservations: [
      reservation({ id: "unknown", items: [] }),
      reservation({ id: "free", items: [line({ unitPriceCents: 0 })] }),
      reservation({
        id: "paid",
        items: [line({ quantity: 1, unitPriceCents: 10000 })],
      }),
    ],
  });
  const stats = clientStatistics("c1", buildOrders(data), []);
  assert.equal(stats.orderCount, 3);
  assert.equal(stats.pricedCount, 2);
  assert.equal(stats.unpricedCount, 1);
  assert.equal(stats.averageCents, 5000);
});

test("advance and balance total the invoice once and retain their own receipt dates", () => {
  const invoices = [
    invoice({
      status: "PAID",
      totalAmountCents: 10000,
      advanceAmountCents: 3000,
      advanceReceivedAt: date("2026-01-15"),
      paidAt: date("2026-02-15"),
    }),
  ];
  const payments = buildPayments(invoices);
  assert.equal(payments.length, 2);
  assert.equal(
    payments.reduce((sum, p) => sum + p.amountCents, 0),
    10000,
  );
  assert.equal(
    clientStatistics(
      "c1",
      [],
      invoices,
      customPeriod("2026-01-01", "2026-01-31"),
    ).collectedCents,
    3000,
  );
  assert.equal(
    clientStatistics(
      "c1",
      [],
      invoices,
      customPeriod("2026-02-01", "2026-02-28"),
    ).collectedCents,
    7000,
  );
});

test("oversized advances are capped; cancelled invoices contribute no receipt", () => {
  const payments = buildPayments([
    invoice({
      status: "PAID",
      advanceAmountCents: 20000,
      advanceReceivedAt: date(),
      totalAmountCents: 10000,
    }),
    invoice({
      id: "cancelled",
      status: "CANCELLED",
      advanceReceivedAt: date(),
    }),
  ]);
  assert.equal(
    payments.reduce((sum, p) => sum + p.amountCents, 0),
    10000,
  );
});

test("legacy paid invoices without payment dates use issue dates with an explicit quality flag", () => {
  const payments = buildPayments([invoice({ status: "PAID" })]);
  assert.equal(payments[0].estimatedDate, true);
  assert.equal(+payments[0].date, +date());
  const data = snapshot({ invoices: [invoice({ status: "PAID" })] });
  assert.equal(
    calculateIndicator(data, defaultIndicator("payments"), now)
      .estimatedDateCount,
    1,
  );
});

test("Paris calendar dates include full selected days across DST and UTC boundaries", () => {
  assert.equal(calendarDate(new Date("2026-10-31T23:30:00Z")), "2026-11-01");
  assert.equal(calendarDate(new Date("2026-07-01T22:30:00Z")), "2026-07-02");
  assert(
    inPeriod(
      new Date("2026-10-31T23:30:00Z"),
      customPeriod("2026-11-01", "2026-11-01"),
    ),
  );
  assert.equal(validCalendarDate("2026-02-30"), false);
  assert.deepEqual(
    plain(periodBounds({ preset: "30days", from: "", to: "" }, now)),
    { from: "2026-10-22", to: "2026-11-20" },
  );
});

test("dynamic sum, average and distinct clients use the filtered population", () => {
  const data = snapshot({
    quotes: [
      quote(),
      quote({ id: "q2", clientId: "c2", totalAmountCents: 8000 }),
      quote({ id: "q3", clientId: "c2", totalAmountCents: 10000 }),
    ],
  });
  const base = { ...defaultIndicator("orders"), aggregation: "sum" };
  assert.equal(calculateIndicator(data, base, now).value, 30000);
  assert.equal(
    calculateIndicator(data, { ...base, aggregation: "average" }, now).value,
    10000,
  );
  assert.equal(
    calculateIndicator(data, { ...base, aggregation: "uniqueClients" }, now)
      .value,
    2,
  );
  assert.equal(
    calculateIndicator(data, { ...base, clientId: "c1" }, now).value,
    12000,
  );
});

test("numeric money thresholds use euros, not raw cents, and omit unknown prices", () => {
  const data = snapshot({
    reservations: [reservation({ id: "unknown", items: [] })],
    quotes: [
      quote({ startDate: date("2026-07-01") }),
      quote({
        id: "small",
        totalAmountCents: 5000,
        startDate: date("2026-08-01"),
      }),
    ],
  });
  const def = { ...defaultIndicator(), minimum: 100, maximum: 120 };
  const result = calculateIndicator(data, def, now);
  assert.equal(result.value, 1);
  assert.equal(result.recordCount, 1);
});

test("monthly grouping sorts by calendar month and all groups reconcile with the scalar", () => {
  const data = snapshot({
    quotes: [
      quote({ signedAt: date("2026-02-01") }),
      quote({ id: "second", signedAt: date("2026-01-01") }),
    ],
  });
  const result = calculateIndicator(
    data,
    { ...defaultIndicator(), aggregation: "sum", groupBy: "month" },
    now,
  );
  assert.deepEqual(plain(result.groups.map((g) => g.key)), [
    "2026-01",
    "2026-02",
  ]);
  assert.equal(
    result.groups.reduce((sum, g) => sum + g.value, 0),
    result.value,
  );
});

test("no numeric observations means no average, while count still counts records", () => {
  const data = snapshot({
    requests: [
      {
        id: "request",
        clientId: null,
        status: "NEW",
        createdAt: date(),
        eventDate: null,
        eventType: null,
        guestCount: null,
        budgetCents: null,
      },
    ],
  });
  assert.equal(
    calculateIndicator(
      data,
      { ...defaultIndicator("requests"), aggregation: "average" },
      now,
    ).value,
    null,
  );
  assert.equal(
    calculateIndicator(
      data,
      { ...defaultIndicator("requests"), aggregation: "sum" },
      now,
    ).value,
    null,
  );
  assert.equal(
    calculateIndicator(data, defaultIndicator("requests"), now).value,
    1,
  );
  assert.equal(
    calculateIndicator(
      data,
      { ...defaultIndicator("requests"), aggregation: "uniqueClients" },
      now,
    ).value,
    0,
  );
});

test("catalogue and rental-line filters support category, active status and quantities", () => {
  const data = snapshot({
    reservations: [
      reservation(),
      reservation({ id: "cancelled", status: "CANCELLED" }),
    ],
    items: [
      {
        id: "item1",
        name: "Table",
        active: true,
        totalQty: 10,
        damageQty: 1,
        rentalPriceCents: 4000,
        depositPriceCents: 5000,
        createdAt: date(),
        category: { name: "Mobilier" },
      },
    ],
  });
  assert.equal(
    calculateIndicator(
      data,
      {
        ...defaultIndicator("items"),
        aggregation: "sum",
        category: "Mobilier",
        statuses: ["ACTIVE"],
      },
      now,
    ).value,
    10,
  );
  assert.equal(
    calculateIndicator(
      data,
      {
        ...defaultIndicator("rentalLines"),
        aggregation: "sum",
        category: "Mobilier",
      },
      now,
    ).value,
    2,
  );
});

test("lifetime client metrics allow identifying repeat customers", () => {
  const data = snapshot({
    quotes: [
      quote(),
      quote({ id: "second", totalAmountCents: 5000 }),
      quote({ id: "other", clientId: "c2" }),
    ],
  });
  const result = calculateIndicator(
    data,
    { ...defaultIndicator("clients"), minimum: 2 },
    now,
  );
  assert.equal(result.value, 1);
});

test("definitions reject unsupported sources, fields, status injection and invalid dates", () => {
  for (const change of [
    { source: "__proto__" },
    { field: "constructor" },
    { dateField: "password" },
    { statuses: ["CONFIRMED'); DROP TABLE Client;"] },
    { minimum: Infinity },
    { minimum: 10, maximum: 1 },
    { period: customPeriod("2026-02-30", "2026-03-01") },
    { period: customPeriod("2026-12-01", "2026-01-01") },
    { period: customPeriod("", "") },
  ])
    assert.throws(() =>
      parseIndicatorDefinition({ ...defaultIndicator(), ...change }),
    );
  assert.throws(() =>
    parseIndicatorDefinition({ ...defaultIndicator("items"), clientId: "c1" }),
  );
  assert.equal(parseIndicatorDefinition(defaultIndicator()).source, "orders");
});

test("invalid URL date filters are reported and safely fall back to all history", () => {
  const result = readAnalyticsPeriod({ period: "custom", from: "bad", to: "" });
  assert(result.error);
  assert.equal(result.period.preset, "all");
  assert.equal(readAnalyticsPeriod({ period: "year" }).period.preset, "year");
  assert.equal(inPeriod(date("2026-01-01"), ALL_TIME), true);
});
