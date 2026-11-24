import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import {
  decodeAttachments,
  emailErrorMessage,
  validEmail,
  EMAIL_COOLDOWN_MS,
  EMAIL_LEASE_MS,
} from "@/lib/email-utils";

type MailAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

type SendMailParams = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: MailAttachment[];
  kind?: string;
  entityId?: string;
  clientId?: string | null;
  dedupeKey?: string;
};

export async function getEmailSettings() {
  const saved = await prisma.emailSetting.findUnique({
    where: { id: "company" },
  });
  return {
    senderEmail: saved?.senderEmail || process.env.SMTP_USER || "",
    bccEmail: saved ? saved.bccEmail : process.env.SMTP_BCC || null,
    from: saved?.senderEmail
      ? `Alternative Location <${saved.senderEmail}>`
      : process.env.SMTP_FROM || process.env.SMTP_USER || "",
  };
}

export async function getTransport(
  snapshot?: Awaited<ReturnType<typeof getEmailSettings>>,
) {
  const settings = snapshot ?? (await getEmailSettings());
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 0);
  const secure = String(process.env.SMTP_SECURE || "true") === "true";
  const user = settings.senderEmail;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    throw Object.assign(new Error("SMTP configuration missing"), {
      code: "MAIL_CONFIG",
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 45000,
  });
}

export async function sendMail(params: SendMailParams) {
  const to = params.to.trim();
  if (!validEmail(to))
    throw Object.assign(new Error("Invalid recipient"), {
      code: "MAIL_RECIPIENT",
    });
  const data = {
    to,
    subject: params.subject,
    text: params.text,
    html: params.html,
    kind: params.kind || "OTHER",
    entityId: params.entityId,
    clientId: params.clientId,
    dedupeKey: params.dedupeKey,
    attachments: (params.attachments || []).map((attachment) => ({
      filename: attachment.filename,
      contentBase64: attachment.content.toString("base64"),
      ...(attachment.contentType
        ? { contentType: attachment.contentType }
        : {}),
    })),
  };
  const message = params.dedupeKey
    ? await prisma.emailMessage.upsert({
        where: { dedupeKey: params.dedupeKey },
        create: data,
        update: {},
      })
    : await prisma.emailMessage.create({ data });
  return deliverEmail(message.id);
}

export async function deliverEmail(
  id: string,
  options: { to?: string; allowSent?: boolean } = {},
) {
  const message = await prisma.emailMessage.findUnique({ where: { id } });
  if (!message) throw new Error("Email not found");
  if (message.status === "SENT" && !options.allowSent) return id;
  const to = (options.to ?? message.to).trim();
  if (!validEmail(to))
    throw Object.assign(new Error("Invalid recipient"), {
      code: "MAIL_RECIPIENT",
    });
  const now = new Date();
  const claim = await prisma.emailMessage.updateMany({
    where: {
      id,
      updatedAt: message.updatedAt,
      OR: [
        { status: { in: ["PENDING", "FAILED"] } },
        {
          status: "SENT",
          lastAttemptAt: { lt: new Date(now.getTime() - EMAIL_COOLDOWN_MS) },
        },
        {
          status: "SENDING",
          lastAttemptAt: { lt: new Date(now.getTime() - EMAIL_LEASE_MS) },
        },
      ],
    },
    data: {
      status: "SENDING",
      attempts: { increment: 1 },
      lastAttemptAt: now,
      to,
      error: null,
    },
  });
  if (!claim.count)
    throw Object.assign(new Error("Mail busy"), { code: "MAIL_BUSY" });
  let info;
  let settings;
  let bcc: string | null = null;
  try {
    settings = await getEmailSettings();
    bcc =
      settings.bccEmail && settings.bccEmail.toLowerCase() !== to.toLowerCase()
        ? settings.bccEmail
        : null;
    const transporter = await getTransport(settings);
    try {
      info = await transporter.sendMail({
        from: settings.from,
        to,
        bcc: bcc || undefined,
        subject: message.subject,
        text: message.text,
        html: message.html || undefined,
        attachments: decodeAttachments(message.attachments),
      });
    } finally {
      transporter.close();
    }
    const accepted = (info.accepted || []).map(
      (address: string | { address?: string }) =>
        (typeof address === "string"
          ? address
          : address.address || ""
        ).toLowerCase(),
    );
    if (!accepted.includes(to.toLowerCase()))
      throw Object.assign(new Error("Recipient rejected"), {
        code: "EENVELOPE",
      });
  } catch (error) {
    await prisma.emailMessage.updateMany({
      where: { id, status: "SENDING", lastAttemptAt: now },
      data: {
        status: "FAILED",
        error: emailErrorMessage(error),
        from: settings?.from,
        bcc,
      },
    });
    throw error;
  }
  const rejected = (info.rejected || []).map(
    (address: string | { address?: string }) =>
      (typeof address === "string"
        ? address
        : address.address || ""
      ).toLowerCase(),
  );
  // SMTP has accepted the client recipient. A later database error must never mark it as failed.
  await prisma.emailMessage.updateMany({
    where: { id, status: "SENDING", lastAttemptAt: now },
    data: {
      status: "SENT",
      sentAt: now,
      from: settings.from,
      bcc,
      messageId: info.messageId || null,
      error: null,
      bccError:
        bcc && rejected.includes(bcc.toLowerCase())
          ? "Le serveur a refusé la copie cachée. Le mail destiné au client a été accepté."
          : null,
    },
  });
  // Keep document indicators correct when an administrator retries a failed message.
  try {
    if (message.entityId && message.kind === "INVOICE")
      await prisma.invoice.updateMany({
        where: { id: message.entityId, status: { in: ["DRAFT", "SENT"] } },
        data: { status: "SENT", sentAt: now },
      });
    if (message.entityId && message.kind === "QUOTE")
      await prisma.contactRequest.updateMany({
        where: {
          id: message.entityId,
          status: { in: ["NEW", "CONTACTED", "QUOTE_RECEIVED", "PENDING"] },
        },
        data: { status: "PENDING" },
      });
    if (message.entityId && message.kind === "RESERVATION_CONFIRMATION")
      await prisma.reservation.updateMany({
        where: { id: message.entityId },
        data: { confirmationSentAt: now },
      });
  } catch {
    console.error("Email accepted; document indicator update failed", id);
  }
  return id;
}
