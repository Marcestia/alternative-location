"use server";

import { prisma } from "@/lib/prisma";
import { ReservationStatus } from "@/generated/prisma";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { sendMail } from "@/lib/mailer";
import { QuoteStatus } from "@/generated/prisma";
import { downloadBufferFromR2, getSignedUrlForKey } from "@/lib/r2";

const SIGNED_URL_TTL = 60 * 60 * 24 * 7;

function toDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function addReservation(formData: FormData) {
  const clientId = String(formData.get("clientId") || "").trim();
  const clientName = String(formData.get("clientName") || "").trim();
  const clientEmail = String(formData.get("clientEmail") || "").trim();
  const clientPhone = String(formData.get("clientPhone") || "").trim();
  const startDateValue = String(formData.get("startDate") || "").trim();
  const endDateValue = String(formData.get("endDate") || "").trim();
  const eventDateValue = String(formData.get("eventDate") || "").trim();
  const eventLocation = String(formData.get("eventLocation") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const statusValue = String(formData.get("status") || "PENDING").trim();

  const startDate = toDate(startDateValue);
  const endDate = toDate(endDateValue);
  const eventDate = eventDateValue ? toDate(eventDateValue) : null;

  if (!startDate || !endDate || (!clientId && !clientName)) {
    redirect("/admin/reservations?saved=0");
  }

  let resolvedClientId = clientId;
  if (!resolvedClientId) {
    const client = await prisma.client.create({
      data: {
        name: clientName,
        email: clientEmail || null,
        phone: clientPhone || null,
      },
    });
    resolvedClientId = client.id;
  }

  const status = Object.values(ReservationStatus).includes(
    statusValue as ReservationStatus
  )
    ? (statusValue as ReservationStatus)
    : ReservationStatus.PENDING;

  await prisma.reservation.create({
    data: {
      code: `RES-${Date.now()}`,
      status,
      startDate,
      endDate,
      eventDate: eventDate ?? null,
      eventLocation: eventLocation || null,
      notes: notes || null,
      clientId: resolvedClientId,
    },
  });

  redirect("/admin/reservations?saved=1");
}

export async function deleteReservation(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  if (!id) {
    redirect("/admin/reservations");
  }

  await prisma.reservationItem.deleteMany({ where: { reservationId: id } });
  await prisma.reservation.delete({ where: { id } });
  redirect("/admin/reservations");
}

export async function markConfirmationSent(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  if (!id) {
    redirect("/admin/reservations");
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: { client: true },
  });

  if (!reservation?.client?.email) {
    redirect("/admin/reservations?error=email");
  }

  const signedQuote = await prisma.quote.findFirst({
    where: {
      clientId: reservation.clientId,
      status: QuoteStatus.ACCEPTED,
      startDate: reservation.startDate,
      endDate: reservation.endDate,
    },
  });

  if (!signedQuote?.pdfUrl) {
    redirect("/admin/reservations?error=pdf");
  }

  const headerList = await headers();
  const host = headerList.get("host") || "localhost:3001";
  const proto = headerList.get("x-forwarded-proto") || "http";
  const baseUrl = `${proto}://${host}`;

  const ribUrl = process.env.R2_PUBLIC_BASE_URL
    ? `${process.env.R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/documents/IBAN.pdf`
    : `${baseUrl}/rib-placeholder.pdf`;

  const attachments = [];
  try {
    if (!signedQuote.pdfUrl.startsWith("/pdfs/")) {
      const pdfBuffer = await downloadBufferFromR2({ key: signedQuote.pdfUrl });
      if (pdfBuffer.length) {
        attachments.push({
          filename: "devis-signe.pdf",
          content: pdfBuffer,
          contentType: "application/pdf",
        });
      }
    }
  } catch {
    // If file missing, keep link in email.
  }

  try {
    const ribResponse = await fetch(ribUrl);
    if (ribResponse.ok) {
      const ribBuffer = Buffer.from(await ribResponse.arrayBuffer());
      attachments.push({
        filename: "RIB-IBAN.pdf",
        content: ribBuffer,
        contentType: "application/pdf",
      });
    }
  } catch {
    // Ignore attachment download failures.
  }

  const subject = "Confirmation de reservation - Alternative Location";
  const signedLink =
    signedQuote.pdfUrl && !signedQuote.pdfUrl.startsWith("/pdfs/")
      ? await getSignedUrlForKey({ key: signedQuote.pdfUrl, expiresInSeconds: SIGNED_URL_TTL })
      : `${baseUrl}${signedQuote.pdfUrl}`;
  const text = `Bonjour ${reservation.client.name || "madame/monsieur"},\n\nVotre reservation est confirmee.\n\nDevis signe (PDF) :\n${signedLink}\n\nRIB / IBAN (pour l'acompte) :\n${ribUrl}\n\nNous vous recontacterons pour organiser la livraison ou la recuperation du materiel.\n\nMerci,\nAlternative Location`;
  const html = `
    <p>Bonjour ${reservation.client.name || "madame/monsieur"},</p>
    <p>Votre reservation est confirmee.</p>
    <p><strong>Devis signe (PDF)</strong> : <a href="${signedLink}">Devis signe</a></p>
    <p><strong>RIB / IBAN (pour l'acompte)</strong> : <a href="${ribUrl}">RIB / IBAN</a></p>
    <p>Nous vous recontacterons pour organiser la livraison ou la recuperation du materiel.</p>
    <p>Merci,<br/>Alternative Location</p>
  `;

  await sendMail({
    to: reservation.client.email,
    subject,
    text,
    html,
    attachments,
  });

  await prisma.reservation.update({
    where: { id },
    data: { confirmationSentAt: new Date() },
  });

  redirect("/admin/reservations");
}
