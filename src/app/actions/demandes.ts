"use server";

import { prisma } from "@/lib/prisma";
import { ContactStatus, QuoteStatus } from "@/generated/prisma";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { sendMail } from "@/lib/mailer";
import { downloadBufferFromR2, getSignedUrlForKey } from "@/lib/r2";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

export async function createQuoteLink(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  if (!id) {
    redirect("/admin/demandes");
  }

  const request = await prisma.contactRequest.findUnique({
    where: { id },
  });

  if (!request || !request.clientId) {
    redirect("/admin/demandes?error=1");
  }

  const startDate = request.startDate ?? request.endDate ?? request.eventDate;
  const endDate = request.endDate ?? request.startDate ?? request.eventDate;

  if (!startDate || !endDate) {
    redirect("/admin/demandes?error=dates");
  }

  const existing = await prisma.quote.findFirst({
    where: { contactRequestId: request.id },
  });

  if (!existing) {
    await prisma.quote.create({
      data: {
        token: crypto.randomBytes(24).toString("hex"),
        status: QuoteStatus.DRAFT,
        startDate,
        endDate,
        eventDate: request.eventDate,
        clientId: request.clientId,
        contactRequestId: request.id,
      },
    });
  }

  await prisma.contactRequest.update({
    where: { id: request.id },
    data: { status: ContactStatus.QUOTE_RECEIVED },
  });

  redirect("/admin/demandes");
}

export async function refuseContact(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  if (!id) {
    redirect("/admin/demandes");
  }

  const request = await prisma.contactRequest.findUnique({
    where: { id },
  });

  if (!request) {
    redirect("/admin/demandes");
  }

  await prisma.contactRequest.update({
    where: { id },
    data: { status: ContactStatus.REFUSED },
  });

  if (request.email) {
    const subject = "Votre demande - Alternative Location";
    const text = `Bonjour ${request.name || "madame/monsieur"},\n\nAlternative Location vous contacte pour votre demande.\nMalheureusement, nous ne pouvons pas donner suite a cette date.\nN'hesitez pas a nous recontacter pour d'autres disponibilites.\n\nBien a vous,\nAlternative Location`;
    const html = `
      <p>Bonjour ${request.name || "madame/monsieur"},</p>
      <p>Alternative Location vous contacte pour votre demande.</p>
      <p>Malheureusement, nous ne pouvons pas donner suite a cette date.</p>
      <p>N'hesitez pas a nous recontacter pour d'autres disponibilites.</p>
      <p>Bien a vous,<br/>Alternative Location</p>
    `;
    await sendMail({
      to: request.email,
      subject,
      text,
      html,
    });
  }

  if (request.clientId) {
    const [reservations, invoices, quotes, requests] = await Promise.all([
      prisma.reservation.count({ where: { clientId: request.clientId } }),
      prisma.invoice.count({ where: { clientId: request.clientId } }),
      prisma.quote.count({ where: { clientId: request.clientId } }),
      prisma.contactRequest.count({ where: { clientId: request.clientId } }),
    ]);

    if (reservations === 0 && invoices === 0 && quotes === 0 && requests <= 1) {
      await prisma.contactRequest.update({
        where: { id },
        data: { clientId: null },
      });
      await prisma.client.delete({ where: { id: request.clientId } });
    }
  }

  redirect("/admin/demandes");
}

export async function markContacted(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  const contactNotes = String(formData.get("contactNotes") || "").trim();
  if (!id) {
    redirect("/admin/demandes");
  }

  await prisma.contactRequest.update({
    where: { id },
    data: {
      status: ContactStatus.CONTACTED,
      contactNotes: contactNotes || null,
    },
  });

  redirect("/admin/demandes");
}

export async function createManualDemand(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const eventType = String(formData.get("eventType") || "").trim();
  const startDateValue = String(formData.get("startDate") || "").trim();
  const endDateValue = String(formData.get("endDate") || "").trim();
  const eventDateValue = String(formData.get("eventDate") || "").trim();

  if (!name || !email || !startDateValue || !endDateValue) {
    redirect("/admin/reservations?saved=0");
  }

  const startDate = new Date(startDateValue);
  const endDate = new Date(endDateValue);
  const eventDate = eventDateValue ? new Date(eventDateValue) : null;

  const recentCutoff = new Date(Date.now() - 5 * 60 * 1000);
  const recentRequest = await prisma.contactRequest.findFirst({
    where: {
      email,
      startDate,
      endDate,
      createdAt: { gte: recentCutoff },
    },
  });

  if (recentRequest) {
    redirect("/admin/demandes");
  }

  const existingClient = await prisma.client.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" },
  });

  const client =
    existingClient ??
    (await prisma.client.create({
      data: {
        name,
        email,
        phone: phone || null,
      },
    }));

  const request = await prisma.contactRequest.create({
    data: {
      name,
      email,
      phone: phone || null,
      startDate,
      endDate,
      eventDate,
      eventType: eventType || null,
      message: message || "Demande créée manuellement.",
      status: ContactStatus.NEW,
      clientId: client.id,
    },
  });

  await prisma.quote.create({
    data: {
      token: crypto.randomBytes(24).toString("hex"),
      status: QuoteStatus.DRAFT,
      startDate,
      endDate,
      eventDate,
      clientId: client.id,
      contactRequestId: request.id,
    },
  });

  redirect("/admin/demandes");
}

export async function markQuoteSent(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  if (!id) {
    redirect("/admin/demandes");
  }

  const request = await prisma.contactRequest.findUnique({
    where: { id },
    include: {
      client: true,
      quote: true,
    },
  });

  if (!request?.email || !request.quote) {
    redirect("/admin/demandes?error=mail");
  }

  const headerList = await headers();
  const host = headerList.get("host") || "localhost:3001";
  const proto = headerList.get("x-forwarded-proto") || "http";
  const baseUrl = `${proto}://${host}`;
  const acceptLink = `${baseUrl}/devis/accept/${request.quote.token}`;

  const attachments = [];
  if (request.quote.pdfUrl) {
    try {
      if (request.quote.pdfUrl.startsWith("/pdfs/")) {
        const pdfPath = path.join(process.cwd(), "public", request.quote.pdfUrl);
        const pdfBuffer = await fs.readFile(pdfPath);
        attachments.push({
          filename: "devis.pdf",
          content: pdfBuffer,
          contentType: "application/pdf",
        });
      } else {
        const pdfBuffer = await downloadBufferFromR2({ key: request.quote.pdfUrl });
        if (pdfBuffer.length) {
          attachments.push({
            filename: "devis.pdf",
            content: pdfBuffer,
            contentType: "application/pdf",
          });
        }
      }
    } catch {
      // ignore
    }
  }

  const subject = "Votre devis - Alternative Location";
  const pdfLink =
    request.quote.pdfUrl && !request.quote.pdfUrl.startsWith("/pdfs/")
      ? await getSignedUrlForKey({ key: request.quote.pdfUrl, expiresInSeconds: 60 * 60 * 24 * 7 })
      : request.quote.pdfUrl
        ? `${baseUrl}${request.quote.pdfUrl}`
        : "";
  const text = `Bonjour ${request.name},\n\nAlternative Location vous contacte pour votre devis.\nPour valider votre devis, merci de cliquer ici :\n${acceptLink}\n${pdfLink ? `\nDevis (PDF) :\n${pdfLink}\n` : ""}\nMerci de bien vouloir prendre connaissance des conditions generales. La signature du devis vaut acceptation des conditions generales.\n\nEn signant, vous vous engagez a verser l'acompte de 30% sous 7 jours.\n\nBien a vous,\nAlternative Location`;
  const html = `
    <p>Bonjour ${request.name},</p>
    <p>Alternative Location vous contacte pour votre devis.</p>
    <p><strong>Valider votre devis</strong> : <a href="${acceptLink}">Voir et signer le devis</a></p>
    ${pdfLink ? `<p><strong>Devis (PDF)</strong> : <a href="${pdfLink}">Télécharger le devis</a></p>` : ""}
    <p>Merci de bien vouloir prendre connaissance des conditions generales. La signature du devis vaut acceptation des conditions generales.</p>
    <p>En signant, vous vous engagez a verser l'acompte de 30% sous 7 jours.</p>
    <p>Bien a vous,<br/>Alternative Location</p>
  `;

  try {
    await sendMail({
      to: request.email,
      subject,
      text,
      html,
      attachments,
    });
  } catch (error) {
    console.error("markQuoteSent mail error", error);
    redirect("/admin/demandes?error=smtp");
  }

  await prisma.contactRequest.update({
    where: { id },
    data: { status: ContactStatus.PENDING },
  });

  redirect("/admin/demandes");
}

export async function reopenQuote(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  if (!id) {
    redirect("/admin/demandes");
  }

  await prisma.contactRequest.update({
    where: { id },
    data: { status: ContactStatus.QUOTE_RECEIVED },
  });

  redirect("/admin/demandes");
}
