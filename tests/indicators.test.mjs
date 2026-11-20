import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
class Redirect extends Error {
  constructor(location) {
    super(location);
    this.location = location;
  }
}
function harness({ authorized = true, failingSave = false } = {}) {
  const calls = {
    reads: 0,
    creates: [],
    updates: [],
    deletes: [],
    revalidations: [],
  };
  const cache = new Map();
  const empty = {
    clients: [
      { id: "client-1", name: "Client", createdAt: new Date("2026-01-01") },
    ],
    reservations: [],
    quotes: [],
    invoices: [],
    requests: [],
    items: [],
  };
  const mocks = {
    "next/headers": {
      cookies: async () => ({
        get: () => (authorized ? { value: "test-admin" } : undefined),
      }),
    },
    "next/navigation": {
      redirect(location) {
        throw new Redirect(location);
      },
    },
    "next/cache": {
      revalidatePath(...args) {
        calls.revalidations.push(args);
      },
    },
    "@/lib/analytics-data": {
      async loadAnalyticsSnapshot() {
        calls.reads++;
        return empty;
      },
    },
    "@/lib/prisma": {
      prisma: {
        savedIndicator: {
          async create(args) {
            if (failingSave) throw new Error("Unavailable");
            calls.creates.push(args);
            return { id: "saved-1" };
          },
          async update(args) {
            if (failingSave) throw new Error("Unavailable");
            calls.updates.push(args);
            return { id: args.where.id };
          },
          async deleteMany(args) {
            calls.deletes.push(args);
            return { count: 1 };
          },
        },
      },
    },
  };
  function load(relative) {
    if (cache.has(relative)) return cache.get(relative);
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
        Error,
        process: { env: { ADMIN_TOKEN: "test-admin" } },
        console: { error() {} },
        require(name) {
          if (name in mocks) return mocks[name];
          if (name.startsWith("@/lib/"))
            return load(`src/lib/${name.slice(6)}.ts`);
          throw new Error(`Unexpected dependency ${name}`);
        },
      },
    );
    cache.set(relative, sandbox.exports);
    return sandbox.exports;
  }
  const { defaultIndicator } = load("src/lib/indicator-config.ts");
  const actions = load("src/app/actions/indicators.ts");
  function form({
    definition = defaultIndicator(),
    intent = "preview",
    name = "Mon indicateur",
    id = "",
  } = {}) {
    const result = new FormData();
    result.set(
      "definition",
      typeof definition === "string" ? definition : JSON.stringify(definition),
    );
    result.set("intent", intent);
    result.set("name", name);
    result.set("id", id);
    return result;
  }
  return { actions, calls, form, defaultIndicator };
}
const idle = { status: "idle" };

test("preview, save and delete authenticate before reading or changing data", async () => {
  const { actions, calls, form } = harness({ authorized: false });
  await assert.rejects(
    actions.runIndicator(idle, form()),
    (e) => e instanceof Redirect && e.location === "/login",
  );
  await assert.rejects(
    actions.runIndicator(idle, form({ intent: "save" })),
    (e) => e instanceof Redirect && e.location === "/login",
  );
  await assert.rejects(
    actions.deleteIndicator(form({ id: "saved-1" })),
    (e) => e instanceof Redirect && e.location === "/login",
  );
  assert.equal(
    calls.reads +
      calls.creates.length +
      calls.updates.length +
      calls.deletes.length,
    0,
  );
});

test("preview is read-only and returns a current result without requiring a name", async () => {
  const { actions, calls, form } = harness();
  const state = await actions.runIndicator(idle, form({ name: "" }));
  assert.equal(state.status, "success");
  assert.equal(state.result.value, 0);
  assert.equal(calls.reads, 1);
  assert.equal(
    calls.creates.length + calls.updates.length + calls.deletes.length,
    0,
  );
  assert.equal(calls.revalidations.length, 0);
});

test("invalid JSON and arbitrary field/status expressions cannot reach the database", async () => {
  const { actions, calls, form, defaultIndicator } = harness();
  for (const definition of [
    "{invalid",
    "x".repeat(10001),
    { ...defaultIndicator(), field: "SELECT * FROM Client" },
    { ...defaultIndicator(), statuses: ["CONFIRMED; DROP TABLE Client"] },
  ])
    assert.equal(
      (await actions.runIndicator(idle, form({ definition }))).status,
      "error",
    );
  assert.equal(calls.reads, 0);
});

test("saving requires a name and a valid existing client filter", async () => {
  const { actions, calls, form, defaultIndicator } = harness();
  assert.equal(
    (await actions.runIndicator(idle, form({ intent: "save", name: " " })))
      .status,
    "error",
  );
  assert.equal(calls.reads, 0);
  assert.equal(
    (
      await actions.runIndicator(
        idle,
        form({
          definition: { ...defaultIndicator(), clientId: "missing-client" },
        }),
      )
    ).status,
    "error",
  );
  assert.equal(calls.creates.length, 0);
});

test("save creates a shared definition and opens its stable edit URL", async () => {
  const { actions, calls, form } = harness();
  await assert.rejects(
    actions.runIndicator(
      idle,
      form({ intent: "save", name: "  Mes commandes  " }),
    ),
    (e) =>
      e instanceof Redirect &&
      e.location === "/admin/indicateurs?edit=saved-1&saved=1",
  );
  assert.equal(calls.creates.length, 1);
  assert.equal(calls.creates[0].data.name, "Mes commandes");
  assert.equal(calls.creates[0].data.definition.source, "orders");
  assert.equal(calls.revalidations[0][0], "/admin/indicateurs");
});

test("editing an indicator updates its id instead of creating another definition", async () => {
  const { actions, calls, form } = harness();
  await assert.rejects(
    actions.runIndicator(idle, form({ intent: "save", id: "saved-1" })),
    (e) => e instanceof Redirect && e.location.includes("edit=saved-1"),
  );
  assert.equal(calls.updates[0].where.id, "saved-1");
  assert.equal(calls.creates.length, 0);
});

test("a database failure returns an error rather than a false saved confirmation", async () => {
  const { actions, calls, form } = harness({ failingSave: true });
  const state = await actions.runIndicator(idle, form({ intent: "save" }));
  assert.equal(state.status, "error");
  assert.equal(calls.revalidations.length, 0);
});

test("deletion is scoped to the chosen definition and refreshes the indicators page", async () => {
  const { actions, calls, form } = harness();
  await assert.rejects(
    actions.deleteIndicator(form({ id: "saved-1" })),
    (e) =>
      e instanceof Redirect && e.location === "/admin/indicateurs?deleted=1",
  );
  assert.equal(calls.deletes.length, 1);
  assert.equal(calls.deletes[0].where.id, "saved-1");
});
