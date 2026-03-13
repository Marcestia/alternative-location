"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { sendMail } from "@/lib/mailer";

function toDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseNumber(value: string) {
  const normalized = value.replace(",", ".").replace(/[^0-9.]/g, "");
  const parsed = Number.parseFloat(normalized);
  return Number.isNaN(parsed) ? null : parsed;
}

async function sendAcknowledgementEmail({
  to,
  name,
}: {
  to: string;
  name: string;
}) {
  const host = process.env.SMTP_HOST;
  const from = process.env.SMTP_FROM;
  if (!host || !from) {
    return;
  }

  await sendMail({
    to,
    subject: "Demande reçue - Alternative Location",
    text: `Bonjour ${name},\n\nMerci pour votre demande. Nous l'avons bien reçue et revenons vers vous rapidement pour préciser les détails.\n\nÀ bientôt,\nAlternative Location`,
  });
}

export async function createContactRequest(formData: FormData) {
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
  const turnstileToken = String(formData.get("cf-turnstile-response") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const eventLocation = String(formData.get("eventLocation") || "").trim();
  const guestCountValue = String(formData.get("guestCount") || "").trim();
  const budgetValue = String(formData.get("budget") || "").trim();
  const startDateValue = String(formData.get("startDate") || "").trim();
  const endDateValue = String(formData.get("endDate") || "").trim();
  const eventDateValue = String(formData.get("eventDate") || "").trim();
  const eventType = String(formData.get("eventType") || "").trim();
  const message = String(formData.get("message") || "").trim();

  if (!name || !email || !message || !startDateValue || !endDateValue) {
    redirect("/?sent=0#contact");
  }

  if (turnstileSecret) {
    if (!turnstileToken) {
      redirect("/?sent=2#contact");
    }
    try {
      const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: turnstileSecret,
          response: turnstileToken,
        }),
      });
      const result = (await verifyRes.json()) as { success?: boolean };
      if (!result?.success) {
        redirect("/?sent=2#contact");
      }
    } catch {
      redirect("/?sent=2#contact");
    }
  }

  const startDate = startDateValue ? toDate(startDateValue) : null;
  const endDate = endDateValue ? toDate(endDateValue) : null;
  const eventDate = eventDateValue ? toDate(eventDateValue) : null;
  const guestCount = guestCountValue ? Number.parseInt(guestCountValue, 10) : null;
  const budget = budgetValue ? parseNumber(budgetValue) : null;
  const budgetCents = budget != null ? Math.round(budget * 100) : null;

  let client = await prisma.client.findFirst({
    where: { email },
  });

  if (client) {
    client = await prisma.client.update({
      where: { id: client.id },
      data: {
        name,
        phone: phone || client.phone,
      },
    });
  } else {
    client = await prisma.client.create({
      data: {
        name,
        email,
        phone: phone || null,
      },
    });
  }

  await prisma.contactRequest.create({
    data: {
      name,
      email,
      phone: phone || null,
      eventLocation: eventLocation || null,
      guestCount: guestCount && guestCount > 0 ? guestCount : null,
      budgetCents: budgetCents && budgetCents > 0 ? budgetCents : null,
      startDate,
      endDate,
      eventDate,
      eventType: eventType || null,
      message,
      clientId: client.id,
    },
  });

  try {
    await sendAcknowledgementEmail({ to: email, name });
  } catch (error) {
    console.error("Contact acknowledgement failed", error);
  }

  redirect("/?sent=1#contact");
}
