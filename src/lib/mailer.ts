import nodemailer from "nodemailer";

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
};

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 0);
  const secure = String(process.env.SMTP_SECURE || "true") === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    throw new Error("SMTP configuration missing");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

export async function sendMail({
  to,
  subject,
  text,
  html,
  attachments,
}: SendMailParams) {
  const transporter = getTransport();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply";

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
    attachments,
  });
}
