"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { deliverEmail, getTransport } from "@/lib/mailer";
import { sendContactAcknowledgement } from "@/lib/contactEmail";
import {
  emailErrorMessage,
  validEmail,
  EMAIL_LEASE_MS,
  type EmailActionState,
} from "@/lib/email-utils";

export async function saveEmailSettings(
  _state: EmailActionState,
  form: FormData,
): Promise<EmailActionState> {
  await requireAdmin();
  const senderEmail = String(form.get("senderEmail") || "").trim();
  const bccEmail = String(form.get("bccEmail") || "").trim();
  if (!validEmail(senderEmail) || (bccEmail && !validEmail(bccEmail)))
    return {
      status: "error",
      message:
        "Saisissez des adresses e-mail valides, sans nom ni liste de destinataires.",
    };
  try {
    await prisma.emailSetting.upsert({
      where: { id: "company" },
      create: { id: "company", senderEmail, bccEmail: bccEmail || null },
      update: { senderEmail, bccEmail: bccEmail || null },
    });
  } catch {
    return {
      status: "error",
      message: "Les paramètres n’ont pas pu être enregistrés. Réessayez.",
    };
  }
  revalidatePath("/admin/emails");
  return {
    status: "success",
    message: "Paramètres enregistrés. Ils s’appliquent aux prochains envois.",
  };
}

export async function verifyEmailConfiguration(
  _state: EmailActionState,
): Promise<EmailActionState> {
  await requireAdmin();
  try {
    const transport = await getTransport();
    try {
      await transport.verify();
    } finally {
      transport.close();
    }
    return {
      status: "success",
      message:
        "Connexion et authentification validées. Aucun e-mail n’a été envoyé.",
    };
  } catch (error) {
    return { status: "error", message: emailErrorMessage(error) };
  }
}

export async function resendEmail(
  _state: EmailActionState,
  form: FormData,
): Promise<EmailActionState> {
  await requireAdmin();
  const id = String(form.get("id") || "").trim();
  const to = String(form.get("to") || "").trim();
  if (!id || id.length > 128 || !validEmail(to))
    return {
      status: "error",
      message: "Vérifiez le destinataire et le message.",
    };
  const message = await prisma.emailMessage.findUnique({ where: { id } });
  if (!message)
    return { status: "error", message: "Ce message n’existe plus." };
  const uncertain =
    message.status === "SENDING" &&
    message.lastAttemptAt &&
    Date.now() - message.lastAttemptAt.getTime() > EMAIL_LEASE_MS;
  if (
    (message.status === "SENT" || uncertain) &&
    form.get("confirmResend") !== "on"
  )
    return {
      status: "error",
      message: "Confirmez le renvoi pour éviter un doublon involontaire.",
    };
  try {
    await deliverEmail(id, {
      to,
      allowSent: message.status === "SENT" || Boolean(uncertain),
    });
  } catch (error) {
    revalidatePath("/admin/emails");
    return { status: "error", message: emailErrorMessage(error) };
  }
  revalidatePath("/admin/emails");
  revalidatePath("/admin/demandes");
  revalidatePath("/admin/factures");
  revalidatePath("/admin/reservations");
  redirect(`/admin/emails/${encodeURIComponent(id)}?sent=1`);
}

export async function sendRequestAcknowledgement(
  _state: EmailActionState,
  form: FormData,
): Promise<EmailActionState> {
  await requireAdmin();
  const id = String(form.get("requestId") || "").trim();
  if (!id || id.length > 128)
    return { status: "error", message: "Demande introuvable." };
  const request = await prisma.contactRequest.findUnique({ where: { id } });
  if (!request || !validEmail(request.email))
    return {
      status: "error",
      message: "Vérifiez l’adresse e-mail du client dans sa fiche.",
    };
  let messageId;
  try {
    const existing = await prisma.emailMessage.findUnique({
      where: { dedupeKey: `acknowledgement:${id}` },
    });
    messageId = existing
      ? await deliverEmail(existing.id, { to: request.email, allowSent: true })
      : await sendContactAcknowledgement(request);
  } catch (error) {
    revalidatePath("/admin/emails");
    return { status: "error", message: emailErrorMessage(error) };
  }
  revalidatePath("/admin/emails");
  redirect(`/admin/emails/${encodeURIComponent(messageId)}?sent=1`);
}
