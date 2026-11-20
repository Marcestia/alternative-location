import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

function loadTypeScript(relativePath, imports = {}, globals = {}) {
  const file = path.join(projectRoot, relativePath);
  const sandboxModule = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: file,
  }).outputText;
  vm.runInNewContext(code, {
    module: sandboxModule,
    exports: sandboxModule.exports,
    process,
    console,
    require(name) {
      if (name in imports) return imports[name];
      throw new Error(`Unexpected dependency: ${name}`);
    },
    ...globals,
  });
  return sandboxModule.exports;
}

const validation = loadTypeScript("src/lib/clientForm.ts");
const idle = { status: "idle" };
const original = {
  name: "Camille Martin",
  email: "typo@example.test",
  phone: "0612345678",
};
const corrected = {
  id: "client-1",
  name: "Camille Dupont",
  email: "camille+fete@example.test",
  phone: "+33 6 21 20 54 32",
  address: "14 rue des Lilas, 33133 Galgon",
  notes: "Appeler avant le retrait.\nPrévoir les casiers.",
};
const plain = (value) => JSON.parse(JSON.stringify(value));
const form = (values = corrected) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
};

class Redirect extends Error {
  constructor(location) {
    super(location);
    this.location = location;
  }
}
class KnownPrismaError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

function harness(options = {}) {
  const calls = {
    transactions: 0,
    reads: [],
    updates: [],
    creates: [],
    contacts: [],
    revalidations: [],
    errors: [],
    deletes: [],
  };
  const client = {
    async findUniqueOrThrow(args) {
      calls.reads.push(args);
      if (options.missing) throw new KnownPrismaError("P2025");
      return options.original ?? original;
    },
    async update(args) {
      calls.updates.push(args);
      return { id: args.where.id, ...args.data };
    },
    async create(args) {
      calls.creates.push(args);
      return { id: "created-client" };
    },
    async delete(args) {
      calls.deletes.push(args);
    },
  };
  const prisma = {
    client,
    reservation: {
      async count() {
        return options.reservations ?? 0;
      },
    },
    invoice: {
      async count() {
        return 0;
      },
    },
    async $transaction(callback) {
      calls.transactions++;
      return callback({
        client,
        contactRequest: {
          async updateMany(args) {
            calls.contacts.push(args);
            if (options.failSync) throw new Error("Database unavailable");
            return { count: 2 };
          },
        },
      });
    },
  };
  const actions = loadTypeScript(
    "src/app/actions/clients.ts",
    {
      "@/lib/prisma": { prisma },
      "@/lib/clientForm": validation,
      "@/generated/prisma": {
        Prisma: { PrismaClientKnownRequestError: KnownPrismaError },
      },
      "next/headers": {
        async cookies() {
          return {
            get() {
              return options.authorized === false
                ? undefined
                : { value: process.env.ADMIN_TOKEN ?? "change-me" };
            },
          };
        },
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
    },
    {
      console: {
        error(...args) {
          calls.errors.push(args);
        },
      },
    },
  );
  return { actions, calls };
}

test("every client mutation requires an admin session before database access", async () => {
  const { actions, calls } = harness({ authorized: false });
  for (const name of ["addClient", "updateClient", "deleteClient"]) {
    await assert.rejects(
      name === "deleteClient"
        ? actions[name](form())
        : actions[name](idle, form()),
      (error) => error instanceof Redirect && error.location === "/login",
    );
  }
  assert.equal(
    calls.transactions + calls.creates.length + calls.deletes.length,
    0,
  );
});

test("invalid name and email keep entered fields and do not write data", async () => {
  const { actions, calls } = harness();
  const state = await actions.updateClient(
    idle,
    form({ ...corrected, name: "  ", email: "wrong-email" }),
  );
  assert.equal(state.status, "error");
  assert(state.fieldErrors.name);
  assert(state.fieldErrors.email);
  assert.equal(state.values.address, corrected.address);
  assert.equal(state.values.notes, corrected.notes);
  assert.equal(calls.transactions, 0);
});

test("oversized fields are rejected on the server", async () => {
  const { actions, calls } = harness();
  const state = await actions.updateClient(
    idle,
    form({ ...corrected, name: "a".repeat(201), notes: "b".repeat(10001) }),
  );
  assert(state.fieldErrors.name);
  assert(state.fieldErrors.notes);
  assert.equal(calls.transactions, 0);
});

test("all five fields are saved on the same client and linked contacts are corrected atomically", async () => {
  const { actions, calls } = harness();
  const state = await actions.updateClient(
    idle,
    form(
      Object.fromEntries(
        Object.entries(corrected).map(([key, value]) => [key, `  ${value}  `]),
      ),
    ),
  );
  assert.equal(state.status, "success");
  assert.equal(calls.transactions, 1);
  assert.deepEqual(plain(calls.updates), [
    {
      where: { id: "client-1" },
      data: {
        name: corrected.name,
        email: corrected.email,
        phone: corrected.phone,
        address: corrected.address,
        notes: corrected.notes,
      },
    },
  ]);
  assert.deepEqual(plain(calls.contacts), [
    {
      where: { clientId: "client-1" },
      data: {
        name: corrected.name,
        email: corrected.email,
        phone: corrected.phone,
      },
    },
  ]);
  assert.deepEqual(plain(calls.revalidations), [
    ["/admin", "layout"],
    ["/devis/[token]", "page"],
    ["/devis/accept/[token]", "page"],
  ]);
  assert.equal(calls.creates.length + calls.deletes.length, 0);
});

test("optional fields can be cleared without falling back to an old email", async () => {
  const { actions, calls } = harness();
  const state = await actions.updateClient(
    idle,
    form({
      id: "client-1",
      name: original.name,
      email: "",
      phone: "",
      address: "",
      notes: "",
    }),
  );
  assert.equal(state.status, "success");
  assert.deepEqual(plain(calls.updates[0].data), {
    name: original.name,
    email: null,
    phone: null,
    address: null,
    notes: null,
  });
  assert.deepEqual(plain(calls.contacts[0].data), { email: "", phone: null });
});

test("editing only notes or address leaves request contact fields untouched", async () => {
  const { actions, calls } = harness();
  const state = await actions.updateClient(
    idle,
    form({ ...corrected, ...original }),
  );
  assert.equal(state.status, "success");
  assert.equal(calls.updates[0].data.notes, corrected.notes);
  assert.equal(calls.contacts.length, 0);
});

test("a missing client returns a useful error instead of creating a duplicate", async () => {
  const { actions, calls } = harness({ missing: true });
  const state = await actions.updateClient(idle, form());
  assert.equal(state.status, "error");
  assert.match(state.message, /n’existe plus/);
  assert.equal(
    calls.updates.length + calls.creates.length + calls.contacts.length,
    0,
  );
});

test("database failure preserves the form and does not report success or revalidate", async () => {
  const { actions, calls } = harness({ failSync: true });
  const state = await actions.updateClient(idle, form());
  assert.equal(state.status, "error");
  assert.equal(state.values.email, corrected.email);
  assert.equal(calls.revalidations.length, 0);
});

test("a newly created client includes notes and opens its editable record", async () => {
  const { actions, calls } = harness();
  await assert.rejects(
    actions.addClient(idle, form()),
    (error) =>
      error instanceof Redirect &&
      error.location === "/admin/clients/created-client?created=1",
  );
  assert.equal(calls.creates[0].data.notes, corrected.notes);
  assert.equal(calls.creates[0].data.email, corrected.email);
});

test("creation also validates email and keeps the entered address", async () => {
  const { actions, calls } = harness();
  const state = await actions.addClient(
    idle,
    form({ ...corrected, email: "invalid" }),
  );
  assert.equal(state.status, "error");
  assert(state.fieldErrors.email);
  assert.equal(state.values.address, corrected.address);
  assert.equal(calls.creates.length, 0);
});

test("missing client id is rejected before a transaction", async () => {
  const { actions, calls } = harness();
  const state = await actions.updateClient(
    idle,
    form({ ...corrected, id: "" }),
  );
  assert.equal(state.status, "error");
  assert.equal(calls.transactions, 0);
});

test("the existing deletion guard still protects a client with reservations", async () => {
  const { actions, calls } = harness({ reservations: 1 });
  await assert.rejects(
    actions.deleteClient(form()),
    (error) =>
      error instanceof Redirect &&
      error.location === "/admin/clients?blocked=1",
  );
  assert.equal(calls.deletes.length, 0);
});
