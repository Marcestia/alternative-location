import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import MailComposer from "nodemailer/lib/mail-composer/index.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
class Redirect extends Error {
  constructor(location) {
    super(location);
    this.location = location;
  }
}
const plain = (value) => JSON.parse(JSON.stringify(value));

function harness({ authorized = true } = {}) {
  const records = new Map();
  const state = {
    setting: {
      senderEmail: "ne-pas-repondre@example.test",
      bccEmail: "gerante@example.test",
    },
    sendError: null,
    accepted: null,
    rejected: [],
    gate: null,
    started: null,
    readCount: 0,
    sendCalls: [],
    transports: [],
    indicators: [],
    writes: 0,
  };
  function matches(row, where) {
    return Object.entries(where).every(([key, value]) => {
      if (key === "OR")
        return value.some((condition) => matches(row, condition));
      if (value instanceof Date) return row[key]?.getTime() === value.getTime();
      if (value && typeof value === "object") {
        if (value.in) return value.in.includes(row[key]);
        if (value.lt) return row[key] < value.lt;
      }
      return row[key] === value;
    });
  }
  async function create({ data }) {
    state.writes++;
    const row = {
      id: `email-${records.size + 1}`,
      status: "PENDING",
      attempts: 0,
      html: null,
      attachments: [],
      from: null,
      bcc: null,
      error: null,
      bccError: null,
      lastAttemptAt: null,
      sentAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    };
    records.set(row.id, row);
    return structuredClone(row);
  }
  const db = {
    emailSetting: {
      async findUnique() {
        state.readCount++;
        return structuredClone(state.setting);
      },
      async upsert({ create, update }) {
        state.writes++;
        state.setting = state.setting
          ? { ...state.setting, ...update }
          : { ...create };
        return state.setting;
      },
    },
    emailMessage: {
      create,
      async upsert(args) {
        const existing = [...records.values()].find(
          (row) => row.dedupeKey === args.where.dedupeKey,
        );
        return existing
          ? structuredClone(existing)
          : create({ data: args.create });
      },
      async findUnique({ where }) {
        state.readCount++;
        const row = where.id
          ? records.get(where.id)
          : [...records.values()].find(
              (entry) => entry.dedupeKey === where.dedupeKey,
            );
        return row ? structuredClone(row) : null;
      },
      async updateMany({ where, data }) {
        let count = 0;
        for (const row of records.values()) {
          if (!matches(row, where)) continue;
          count++;
          state.writes++;
          for (const [key, value] of Object.entries(data)) {
            row[key] =
              value && typeof value === "object" && "increment" in value
                ? row[key] + value.increment
                : value;
          }
          row.updatedAt = new Date(row.updatedAt.getTime() + 1);
        }
        return { count };
      },
    },
    contactRequest: {
      async findUnique({ where }) {
        state.readCount++;
        return {
          id: where.id,
          name: "Camille",
          email: "client@example.test",
          clientId: "client-1",
        };
      },
      async updateMany(args) {
        state.indicators.push({ model: "contactRequest", ...args });
        return { count: 1 };
      },
    },
    invoice: {
      async updateMany(args) {
        state.indicators.push({ model: "invoice", ...args });
        return { count: 1 };
      },
    },
    reservation: {
      async updateMany(args) {
        state.indicators.push({ model: "reservation", ...args });
        return { count: 1 };
      },
    },
  };
  const mocks = {
    "@/lib/prisma": { prisma: db },
    nodemailer: {
      createTransport(config) {
        state.transports.push(config);
        return {
          async sendMail(payload) {
            state.sendCalls.push(payload);
            state.started?.();
            if (state.gate) await state.gate;
            if (state.sendError) throw state.sendError;
            return {
              accepted: state.accepted ?? [
                payload.to,
                ...(payload.bcc ? [payload.bcc] : []),
              ],
              rejected: state.rejected,
              messageId: "<accepted@example.test>",
            };
          },
          async verify() {
            if (state.sendError) throw state.sendError;
            return true;
          },
          close() {},
        };
      },
    },
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
    "next/cache": { revalidatePath() {} },
  };
  const cache = new Map();
  function load(file) {
    if (cache.has(file)) return cache.get(file);
    const mod = { exports: {} };
    vm.runInNewContext(
      ts.transpileModule(fs.readFileSync(path.join(root, file), "utf8"), {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
          esModuleInterop: true,
        },
      }).outputText,
      {
        module: mod,
        exports: mod.exports,
        Date,
        Buffer,
        Error,
        process: {
          env: {
            ADMIN_TOKEN: "test-admin",
            SMTP_HOST: "smtp.example.test",
            SMTP_PORT: "465",
            SMTP_SECURE: "true",
            SMTP_USER: "obsolete@example.test",
            SMTP_FROM: "Old <obsolete@example.test>",
            SMTP_PASS: "test-secret-password",
            SMTP_BCC: "fallback@example.test",
          },
        },
        console: { error() {} },
        require(name) {
          if (name in mocks) return mocks[name];
          if (name.startsWith("@/lib/"))
            return load(`src/lib/${name.slice(6)}.ts`);
          throw new Error(`Unexpected dependency ${name}`);
        },
      },
    );
    cache.set(file, mod.exports);
    return mod.exports;
  }
  return {
    state,
    records,
    db,
    mailer: load("src/lib/mailer.ts"),
    actions: load("src/app/actions/emails.ts"),
    contact: load("src/lib/contactEmail.ts"),
  };
}

const message = {
  to: "client@example.test",
  subject: "Votre devis",
  text: "Bonjour Camille",
  html: "<p>Bonjour Camille</p>",
  kind: "QUOTE",
  entityId: "request-1",
  clientId: "client-1",
};
const form = (data) => {
  const value = new FormData();
  for (const [key, item] of Object.entries(data)) value.set(key, item);
  return value;
};
const idle = { status: "idle" };

test("logs accepted client delivery and uses current sender/BCC without exposing the password", async () => {
  const h = harness();
  const id = await h.mailer.sendMail(message);
  const row = h.records.get(id);
  assert.equal(row.status, "SENT");
  assert.equal(row.attempts, 1);
  assert(row.sentAt instanceof Date);
  assert.equal(h.state.transports[0].auth.user, "ne-pas-repondre@example.test");
  assert.equal(h.state.sendCalls[0].bcc, "gerante@example.test");
  assert(!JSON.stringify(row).includes("test-secret-password"));
});
test("BCC remains in the SMTP envelope and absent from the MIME message", async () => {
  // Use the SMTP message composer; StreamTransport deliberately retains BCC for debugging.
  const mail = new MailComposer({
    from: "sender@example.test",
    to: message.to,
    bcc: "gerante@example.test",
    subject: message.subject,
    text: message.text,
  }).compile();
  const raw = await mail.build();
  assert(mail.getEnvelope().to.includes("gerante@example.test"));
  assert(!/^bcc:/im.test(raw.toString()));
});
test("a refused client recipient is failed even when BCC was accepted", async () => {
  const h = harness();
  h.state.accepted = ["gerante@example.test"];
  h.state.rejected = [message.to];
  await assert.rejects(
    h.mailer.sendMail(message),
    (e) => e.code === "EENVELOPE",
  );
  assert.equal(h.records.get("email-1").status, "FAILED");
  assert.equal(h.records.get("email-1").sentAt, null);
});
test("a refused BCC does not claim that the accepted client mail failed", async () => {
  const h = harness();
  h.state.accepted = [message.to];
  h.state.rejected = ["gerante@example.test"];
  await h.mailer.sendMail(message);
  const row = h.records.get("email-1");
  assert.equal(row.status, "SENT");
  assert.match(row.bccError, /copie cachée/);
});
test("authentication failure is saved with actionable text, and no secrets", async () => {
  const h = harness();
  h.state.sendError = Object.assign(new Error("secret upstream content"), {
    code: "EAUTH",
  });
  await assert.rejects(h.mailer.sendMail(message));
  const row = h.records.get("email-1");
  assert.equal(row.status, "FAILED");
  assert.match(row.error, /OVH/);
  assert(!row.error.includes("upstream"));
});
test("manual retry preserves exact text, HTML and binary attachments, using the latest BCC", async () => {
  const h = harness();
  h.state.sendError = Object.assign(new Error(), { code: "EAUTH" });
  const pdf = Buffer.from([0, 255, 3, 25, 87]);
  await assert.rejects(
    h.mailer.sendMail({
      ...message,
      attachments: [
        { filename: "devis.pdf", content: pdf, contentType: "application/pdf" },
      ],
    }),
  );
  h.state.sendError = null;
  h.state.setting.bccEmail = "nouvelle@example.test";
  await h.mailer.deliverEmail("email-1", {
    to: "corrige@example.test",
    allowSent: true,
  });
  const payload = h.state.sendCalls[1];
  assert.equal(payload.to, "corrige@example.test");
  assert.equal(payload.bcc, "nouvelle@example.test");
  assert.equal(payload.text, message.text);
  assert.equal(payload.html, message.html);
  assert.deepEqual(payload.attachments[0].content, pdf);
  assert.equal(h.records.get("email-1").attempts, 2);
  assert.equal(h.records.get("email-1").status, "SENT");
});
test("concurrent retries cannot send the same message twice", async () => {
  const h = harness();
  await h.db.emailMessage.create({ data: message });
  let release, started;
  h.state.gate = new Promise((resolve) => {
    release = resolve;
  });
  const ready = new Promise((resolve) => {
    started = resolve;
  });
  h.state.started = started;
  const first = h.mailer.deliverEmail("email-1");
  await ready;
  await assert.rejects(
    h.mailer.deliverEmail("email-1"),
    (e) => e.code === "MAIL_BUSY",
  );
  release();
  await first;
  assert.equal(h.state.sendCalls.length, 1);
  assert.equal(h.records.get("email-1").attempts, 1);
});
test("successful messages require explicit retry and obey a short cooldown", async () => {
  const h = harness();
  await h.mailer.sendMail(message);
  await h.mailer.deliverEmail("email-1");
  assert.equal(h.state.sendCalls.length, 1);
  await assert.rejects(
    h.mailer.deliverEmail("email-1", { allowSent: true }),
    (e) => e.code === "MAIL_BUSY",
  );
  h.records.get("email-1").lastAttemptAt = new Date(Date.now() - 60000);
  await h.mailer.deliverEmail("email-1", { allowSent: true });
  assert.equal(h.state.sendCalls.length, 2);
});
test("expired send leases can be retried, while active sends remain blocked", async () => {
  const h = harness();
  await h.db.emailMessage.create({
    data: { ...message, status: "SENDING", lastAttemptAt: new Date() },
  });
  await assert.rejects(
    h.mailer.deliverEmail("email-1"),
    (e) => e.code === "MAIL_BUSY",
  );
  h.records.get("email-1").lastAttemptAt = new Date(Date.now() - 11 * 60000);
  await h.mailer.deliverEmail("email-1", { allowSent: true });
  assert.equal(h.records.get("email-1").status, "SENT");
});
test("acknowledgement idempotency prevents duplicate automatic deliveries", async () => {
  const h = harness();
  const request = {
    id: "request-1",
    email: message.to,
    name: "Camille",
    clientId: "client-1",
  };
  await h.contact.sendContactAcknowledgement(request);
  await h.contact.sendContactAcknowledgement(request);
  assert.equal(h.records.size, 1);
  assert.equal(h.state.sendCalls.length, 1);
});
test("BCC can be disabled and is not duplicated when it matches the client", async () => {
  const h = harness();
  h.state.setting.bccEmail = null;
  await h.mailer.sendMail(message);
  assert.equal(h.state.sendCalls[0].bcc, undefined);
  h.state.setting.bccEmail = message.to;
  await h.mailer.sendMail(message);
  assert.equal(h.state.sendCalls[1].bcc, undefined);
});
test("invalid recipients and header injection never reach SMTP", async () => {
  const h = harness();
  await assert.rejects(
    h.mailer.sendMail({
      ...message,
      to: "x@example.test\r\nBcc: other@example.test",
    }),
  );
  assert.equal(h.records.size, 0);
  assert.equal(h.state.sendCalls.length, 0);
  assert.equal(
    (
      await h.actions.saveEmailSettings(
        idle,
        form({
          senderEmail: "a@example.test",
          bccEmail: "a@example.test,b@example.test",
        }),
      )
    ).status,
    "error",
  );
});
test("all administrative mail mutations reject unauthenticated requests before database access", async () => {
  const h = harness({ authorized: false });
  for (const action of [
    h.actions.saveEmailSettings,
    h.actions.verifyEmailConfiguration,
    h.actions.resendEmail,
    h.actions.sendRequestAcknowledgement,
  ])
    await assert.rejects(
      action(idle, form({ id: "email-1" })),
      (e) => e instanceof Redirect && e.location === "/login",
    );
  assert.equal(h.state.readCount, 0);
  assert.equal(h.state.writes, 0);
  assert.equal(h.state.sendCalls.length, 0);
});
test("connection verification authenticates without sending or creating a message", async () => {
  const h = harness();
  assert.equal(
    (await h.actions.verifyEmailConfiguration(idle)).status,
    "success",
  );
  assert.equal(h.state.sendCalls.length, 0);
  assert.equal(h.records.size, 0);
});
test("already-sent messages require confirmation before manual resend", async () => {
  const h = harness();
  await h.mailer.sendMail(message);
  const result = await h.actions.resendEmail(
    idle,
    form({ id: "email-1", to: message.to }),
  );
  assert.equal(result.status, "error");
  assert.equal(h.state.sendCalls.length, 1);
});
test("successful invoice retry updates only draft/sent invoices, preserving paid/cancelled statuses", async () => {
  const h = harness();
  await h.mailer.sendMail({
    ...message,
    kind: "INVOICE",
    entityId: "invoice-1",
  });
  assert.deepEqual(plain(h.state.indicators[0].where), {
    id: "invoice-1",
    status: { in: ["DRAFT", "SENT"] },
  });
});
test("legacy demands can send an acknowledgement manually without creating a new demand", async () => {
  const h = harness();
  await assert.rejects(
    h.actions.sendRequestAcknowledgement(idle, form({ requestId: "legacy-1" })),
    (e) =>
      e instanceof Redirect && e.location === "/admin/emails/email-1?sent=1",
  );
  assert.equal(h.records.size, 1);
  assert.equal(h.records.get("email-1").kind, "ACKNOWLEDGEMENT");
});
