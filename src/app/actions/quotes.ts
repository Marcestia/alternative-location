"use server";

import { prisma } from "@/lib/prisma";
import { ContactStatus, QuoteStatus, ReservationStatus } from "@/generated/prisma";
import { redirect } from "next/navigation";
import { siteConfig } from "@/lib/site";
import path from "node:path";
import PDFDocument from "pdfkit/js/pdfkit.standalone";
import { createInvoiceForQuoteId } from "@/app/actions/invoices";
import { headers } from "next/headers";
import { sendMail } from "@/lib/mailer";
import { CG_VERSION } from "@/lib/conditions";
import { getSignedUrlForKey, uploadBufferToR2 } from "@/lib/r2";

const SIGNED_URL_TTL = 60 * 60 * 24 * 7;

const formatPrice = (cents: number) =>
  (cents / 100).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (date: Date) =>
  date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const parseEuroToCents = (value: FormDataEntryValue | null) => {
  const raw = String(value || "").trim().replace(",", ".");
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return 0;
  return Math.round(parsed * 100);
};

function parseDataUrl(dataUrl?: string | null) {
  if (!dataUrl) return null;
  const [meta, base64] = dataUrl.split(",");
  if (!base64 || !meta) return null;
  if (!meta.includes("image/png") && !meta.includes("image/jpeg")) {
    return null;
  }
  return Buffer.from(base64, "base64");
}


async function getNextQuoteNumber() {
  const currentYear = new Date().getFullYear();
  const sequence = await prisma.numberSequence.upsert({
    where: { id: "quote" },
    update: { value: { increment: 1 } },
    create: { id: "quote", value: 1 },
  });
  return `DEV-${currentYear}-${String(sequence.value).padStart(4, "0")}`;
}

async function renderQuotePdf(options: {
  quoteNumber: string;
  issuedAt: Date;
  validUntil: Date;
  companyName: string;
  companyAddress?: string | null;
  companyCity?: string | null;
  companyPostal?: string | null;
  companyPhone?: string | null;
  companyEmail?: string | null;
  companySiret?: string | null;
  clientName: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  period: string;
  lines: { label: string; quantity: number; unitPriceCents: number }[];
  totalCents: number;
  depositCents?: number;
  signatureName?: string | null;
  signatureDate?: Date | null;
  signatureData?: string | null;
  signatureImagePath?: string | null;
}) {
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  const chunks: Buffer[] = [];

  doc.on("data", (chunk) => chunks.push(chunk));

  const pageWidth = doc.page.width;
  const left = doc.page.margins.left;
  const right = pageWidth - doc.page.margins.right;

  doc.fontSize(18).fillColor("#111").text(options.companyName, left, 50);
  doc
    .fontSize(9)
    .fillColor("#555")
    .text(options.companyAddress || "", left)
    .text(
      [options.companyPostal, options.companyCity].filter(Boolean).join(" ") || "",
      left
    )
    .text(options.companyPhone || "", left)
    .text(options.companyEmail || "", left)
    .text(options.companySiret ? `SIRET : ${options.companySiret}` : "", left);

  doc
    .fontSize(20)
    .fillColor("#111")
    .text("DEVIS", right - 200, 50, { align: "right", width: 200 });
  doc
    .fontSize(9)
    .fillColor("#555")
    .text(`N° ${options.quoteNumber}`, right - 200, 75, { align: "right", width: 200 })
    .text(`Date : ${formatDate(options.issuedAt)}`, right - 200, 90, { align: "right", width: 200 })
    .text(`Valable jusqu'au : ${formatDate(options.validUntil)}`, right - 200, 105, { align: "right", width: 200 });

  doc.moveDown(4);

  doc
    .fontSize(11)
    .fillColor("#111")
    .text("Client", left)
    .moveDown(0.3);

  doc
    .fontSize(10)
    .fillColor("#333")
    .text(options.clientName, left)
    .text(options.clientEmail ? `Email : ${options.clientEmail}` : "", left)
    .text(options.clientPhone ? `Téléphone : ${options.clientPhone}` : "", left)
    .text(`Période : ${options.period}`, left);

  doc.moveDown();

  const tableTop = doc.y + 10;
  const colLabel = left;
  const colQty = left + 280;
  const colUnit = left + 340;
  const colTotal = left + 430;

  doc
    .fontSize(10)
    .fillColor("#111")
    .text("Désignation", colLabel, tableTop)
    .text("Qté", colQty, tableTop)
    .text("PU", colUnit, tableTop)
    .text("Total", colTotal, tableTop);

  doc
    .moveTo(left, tableTop + 15)
    .lineTo(right, tableTop + 15)
    .strokeColor("#ddd")
    .stroke();

  let y = tableTop + 25;
  doc.fontSize(9).fillColor("#333");

  options.lines.forEach((line) => {
    const lineTotal = line.quantity * line.unitPriceCents;
    const labelHeight = doc.heightOfString(line.label, { width: 260 });
    doc.text(line.label, colLabel, y, { width: 260 });
    doc.text(String(line.quantity), colQty, y);
    doc.text(`${formatPrice(line.unitPriceCents)} €`, colUnit, y);
    doc.text(`${formatPrice(lineTotal)} €`, colTotal, y);
    y += Math.max(labelHeight, 14) + 6;
  });

  doc
    .moveTo(left, y)
    .lineTo(right, y)
    .strokeColor("#ddd")
    .stroke();

  y += 10;
  doc
    .fontSize(11)
    .fillColor("#111")
    .text(`Total : ${formatPrice(options.totalCents)} €`, colTotal - 60, y, {
      align: "right",
      width: 120,
    });

  if (options.depositCents && options.depositCents > 0) {
    y += 18;
    doc
      .fontSize(10)
      .fillColor("#333")
      .text(`Caution : ${formatPrice(options.depositCents)} €`, colTotal - 60, y, {
        align: "right",
        width: 120,
      });
  }

  doc.moveDown(3);

  const signatureY = doc.y + 10;
  doc
    .fontSize(10)
    .fillColor("#111")
    .text("Bon pour accord", left, signatureY);

  doc
    .fontSize(9)
    .fillColor("#666")
    .text(
      "En signant, le client accepte le devis et les conditions générales.",
      left,
      signatureY + 15
    );

  const signatureBoxTop = signatureY + 35;
  const signatureBoxWidth = 260;
  const signatureBoxHeight = 110;
  doc
    .rect(left, signatureBoxTop, signatureBoxWidth, signatureBoxHeight)
    .strokeColor("#ccc")
    .stroke();
  doc
    .fontSize(8)
    .fillColor("#999")
    .text("Signature client", left + 6, signatureBoxTop + signatureBoxHeight - 12);

  const signatureImage = parseDataUrl(options.signatureData);
  const signaturePath = options.signatureImagePath;
  if (signaturePath || signatureImage) {
    try {
      if (signaturePath) {
        const normalizedPath = path.resolve(signaturePath);
        doc.image(normalizedPath, left + 10, signatureBoxTop + 10, {
          width: signatureBoxWidth - 20,
          height: signatureBoxHeight - 30,
          fit: [signatureBoxWidth - 20, signatureBoxHeight - 30],
        });
      } else if (signatureImage) {
        doc.image(signatureImage, left + 10, signatureBoxTop + 10, {
          width: signatureBoxWidth - 20,
          height: signatureBoxHeight - 30,
          fit: [signatureBoxWidth - 20, signatureBoxHeight - 30],
        });
      }
    } catch {
      // Ignore signature rendering errors to avoid breaking PDF generation.
    }
  } else if (options.signatureName) {
    doc
      .fontSize(18)
      .fillColor("#333")
      .font("Helvetica-Oblique")
      .text(
        options.signatureName,
        left + 12,
        signatureBoxTop + 26,
        { width: signatureBoxWidth - 24, align: "left" }
      )
      .font("Helvetica");
  }

  if (options.signatureName) {
    doc
      .fontSize(9)
      .fillColor("#333")
      .text(`Signé par : ${options.signatureName}`, left + signatureBoxWidth + 20, signatureBoxTop);
  }
  if (options.signatureDate) {
    doc
      .fontSize(9)
      .fillColor("#333")
      .text(`Le : ${formatDate(options.signatureDate)}`, left + signatureBoxWidth + 20, signatureBoxTop + 14);
  }

  doc
    .fontSize(8)
    .fillColor("#666")
    .text(
      "Conditions : Devis valable jusqu'a la date de location. Reservation confirmee apres acceptation en ligne et acompte de 30% sous 7 jours.",
      left,
      signatureBoxTop + signatureBoxHeight + 20
    )
    .text("Conditions generales disponibles sur le site.", left)
    .text("Aucun paiement en ligne n'est demandé pour le moment.", left);

  doc.end();

  await new Promise<void>((resolve) => doc.on("end", resolve));

  return Buffer.concat(chunks);
}

export async function submitQuote(formData: FormData) {
  const token = String(formData.get("token") || "").trim();
  if (!token) {
    redirect("/devis/invalid");
  }

  const quote = await prisma.quote.findUnique({
    where: { token },
    include: { contactRequest: true },
  });

  if (!quote || quote.status !== QuoteStatus.DRAFT) {
    redirect("/devis/merci");
  }

  const reservations = await prisma.reservationItem.findMany({
    where: {
      reservation: {
        status: {
          in: [
            ReservationStatus.PENDING,
            ReservationStatus.CONFIRMED,
            ReservationStatus.IN_PROGRESS,
          ],
        },
        startDate: { lte: quote.endDate },
        endDate: { gte: quote.startDate },
      },
    },
  });

  const reservedMap = reservations.reduce<Record<string, number>>(
    (acc, entry) => {
      acc[entry.itemId] = (acc[entry.itemId] || 0) + entry.quantity;
      return acc;
    },
    {}
  );

  const items = await prisma.item.findMany({
    where: { active: true },
  });

  const selected = items
    .map((item) => {
      const raw = formData.get(`item_${item.id}`);
      const qty = Number(raw || 0);
      const reserved = reservedMap[item.id] || 0;
      const available = Math.max(0, item.totalQty - reserved);
      return {
        item,
        quantity: Number.isFinite(qty) ? Math.max(0, qty) : 0,
        available,
      };
    })
    .filter((entry) => entry.quantity > 0);

  if (selected.length === 0) {
    redirect(`/devis/${token}?error=1`);
  }

  const invalid = selected.find((entry) => entry.quantity > entry.available);
  if (invalid) {
    redirect(`/devis/${token}?error=2`);
  }

  await prisma.quoteItem.deleteMany({ where: { quoteId: quote.id } });

  let total = 0;
  for (const entry of selected) {
    total += entry.quantity * entry.item.rentalPriceCents;
    await prisma.quoteItem.create({
      data: {
        quoteId: quote.id,
        itemId: entry.item.id,
        quantity: entry.quantity,
        unitPriceCents: entry.item.rentalPriceCents,
      },
    });
  }

  await prisma.quote.update({
    where: { id: quote.id },
    data: {
      status: QuoteStatus.SUBMITTED,
      totalAmountCents: total,
    },
  });

  await prisma.contactRequest.update({
    where: { id: quote.contactRequestId },
    data: { status: ContactStatus.QUOTE_RECEIVED },
  });

  redirect("/devis/merci");
}

export async function approveQuote(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  if (!id) {
    redirect("/admin/demandes");
  }

  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { items: true, contactRequest: true },
  });

  if (!quote) {
    redirect("/admin/demandes");
  }

  const reservation = await prisma.reservation.create({
    data: {
      code: `RES-${Date.now()}`,
      status: ReservationStatus.CONFIRMED,
      startDate: quote.startDate,
      endDate: quote.endDate,
      eventDate: quote.eventDate,
      notes: quote.contactRequest.message,
      clientId: quote.clientId,
    },
  });

  for (const item of quote.items) {
    await prisma.reservationItem.create({
      data: {
        reservationId: reservation.id,
        itemId: item.itemId,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
      },
    });
  }

  await prisma.quote.update({
    where: { id: quote.id },
    data: { status: QuoteStatus.ACCEPTED },
  });

  await prisma.contactRequest.update({
    where: { id: quote.contactRequestId },
    data: { status: ContactStatus.CONFIRMED },
  });

  await createInvoiceForQuoteId(quote.id);

  redirect("/admin/reservations");
}

export async function acceptQuoteByToken(formData: FormData) {
  const token = String(formData.get("token") || "").trim();
  const signatureName = String(formData.get("signatureName") || "").trim();
  const acceptTerms = String(formData.get("acceptTerms") || "").trim();
  if (!token) {
    redirect("/devis/invalid");
  }
  if (!signatureName || acceptTerms !== "on") {
    redirect(`/devis/accept/${token}?error=1`);
  }

  const quote = await prisma.quote.findUnique({
    where: { token },
    include: { items: true, contactRequest: true, lines: true, client: true },
  });

  if (!quote) {
    redirect("/devis/invalid");
  }

  if (quote.status === QuoteStatus.ACCEPTED) {
    redirect("/devis/merci");
  }

  if (quote.status === QuoteStatus.REJECTED) {
    redirect("/devis/invalid");
  }

  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for") || "";
  const ip = forwardedFor.split(",")[0]?.trim() || headerList.get("x-real-ip");
  const userAgent = headerList.get("user-agent");
  const host = headerList.get("host") || "localhost:3001";
  const proto = headerList.get("x-forwarded-proto") || "http";
  const baseUrl = `${proto}://${host}`;

  const reservation = await prisma.reservation.create({
    data: {
      code: `RES-${Date.now()}`,
      status: ReservationStatus.CONFIRMED,
      startDate: quote.startDate,
      endDate: quote.endDate,
      eventDate: quote.eventDate,
      notes: quote.contactRequest?.message ?? null,
      clientId: quote.clientId,
    },
  });

  for (const item of quote.items) {
    await prisma.reservationItem.create({
      data: {
        reservationId: reservation.id,
        itemId: item.itemId,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
      },
    });
  }

  const signedAt = new Date();
  await prisma.quote.update({
    where: { id: quote.id },
    data: {
      status: QuoteStatus.ACCEPTED,
      signedAt,
      signedName: signatureName,
      signatureData: null,
    },
  });
  try {
    await prisma.$executeRaw`
      UPDATE Quote
      SET cgAcceptedAt = ${signedAt},
          cgAcceptedIp = ${ip ?? null},
          cgAcceptedUserAgent = ${userAgent ?? null},
          cgAcceptedVersion = ${CG_VERSION}
      WHERE id = ${quote.id}
    `;
  } catch (error) {
    console.warn("CG acceptance proof update failed.", error);
  }

  await prisma.contactRequest.update({
    where: { id: quote.contactRequestId },
    data: { status: ContactStatus.CONFIRMED },
  });

  await createInvoiceForQuoteId(quote.id);

  const company = await prisma.companySetting.findUnique({
    where: { id: "company" },
  });

  const quoteNumber = quote.quoteNumber || (await getNextQuoteNumber());
  const lineItems = [
    ...quote.items.map((entry) => ({
      label: entry.itemId,
      quantity: entry.quantity,
      unitPriceCents: entry.unitPriceCents,
    })),
    ...quote.lines.map((line) => ({
      label: line.label,
      quantity: line.quantity,
      unitPriceCents: line.unitPriceCents,
    })),
  ];

  const itemsWithNames = await prisma.item.findMany({
    where: { id: { in: quote.items.map((entry) => entry.itemId) } },
  });
  const nameById = itemsWithNames.reduce<Record<string, string>>((acc, item) => {
    acc[item.id] = item.name;
    return acc;
  }, {});

  const resolvedLines = lineItems.map((line) => ({
    ...line,
    label: nameById[line.label] || line.label,
  }));

  const pdfBuffer = await renderQuotePdf({
    quoteNumber,
    issuedAt: quote.updatedAt,
    validUntil: quote.eventDate ?? quote.startDate,
    companyName: company?.businessName || siteConfig.name,
    companyAddress: company?.address || siteConfig.address,
    companyCity: company?.city || null,
    companyPostal: company?.postalCode || null,
    companyPhone: company?.phone || siteConfig.phone,
    companyEmail: company?.email || siteConfig.email,
    companySiret: company?.siret || null,
    clientName: signatureName,
    clientEmail: quote.contactRequest?.email || null,
    clientPhone: quote.contactRequest?.phone || null,
    period: `${formatDate(quote.startDate)} - ${formatDate(quote.endDate)}`,
    lines: resolvedLines,
    totalCents: quote.totalAmountCents,
    depositCents: quote.depositAmountCents,
    signatureName,
    signatureDate: signedAt,
    signatureData: null,
    signatureImagePath: null,
  });

  const signedFileName = `documents/devis-${quote.id}-signed.pdf`;
  await uploadBufferToR2({
    key: signedFileName,
    body: pdfBuffer,
    contentType: "application/pdf",
  });

  await prisma.quote.update({
    where: { id: quote.id },
    data: { pdfUrl: signedFileName, quoteNumber },
  });

  try {
    const ribUrl = process.env.R2_PUBLIC_BASE_URL
      ? `${process.env.R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/documents/IBAN.pdf`
      : `${baseUrl}/rib-placeholder.pdf`;

    const attachments = [
      {
        filename: "devis-signe.pdf",
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ];

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

    const recipient = quote.client?.email || quote.contactRequest?.email;
    if (recipient) {
      const subject = "Confirmation de reservation - Alternative Location";
      const signedLink = await getSignedUrlForKey({
        key: signedFileName,
        expiresInSeconds: SIGNED_URL_TTL,
      });
      const text = `Bonjour ${signatureName},\n\nVotre reservation est confirmee.\n\nDevis signe (PDF) :\n${signedLink}\n\nRIB / IBAN (pour l'acompte) :\n${ribUrl}\n\nNous vous recontacterons pour organiser la livraison ou la recuperation du materiel.\n\nMerci,\nAlternative Location`;
      const html = `
        <p>Bonjour ${signatureName},</p>
        <p>Votre reservation est confirmee.</p>
        <p><strong>Devis signe (PDF)</strong> : <a href="${signedLink}">Devis signe</a></p>
        <p><strong>RIB / IBAN (pour l'acompte)</strong> : <a href="${ribUrl}">RIB / IBAN</a></p>
        <p>Nous vous recontacterons pour organiser la livraison ou la recuperation du materiel.</p>
        <p>Merci,<br/>Alternative Location</p>
      `;

      await sendMail({
        to: recipient,
        subject,
        text,
        html,
        attachments,
      });

      await prisma.reservation.update({
        where: { id: reservation.id },
        data: { confirmationSentAt: new Date() },
      });
    }
  } catch (error) {
    console.warn("Failed to send confirmation email after signature.", error);
  }

  redirect("/devis/merci");
}

export async function rejectQuote(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  if (!id) {
    redirect("/admin/demandes");
  }

  const quote = await prisma.quote.findUnique({
    where: { id },
  });

  if (!quote) {
    redirect("/admin/demandes");
  }

  await prisma.quote.update({
    where: { id: quote.id },
    data: { status: QuoteStatus.REJECTED },
  });

  await prisma.contactRequest.update({
    where: { id: quote.contactRequestId },
    data: { status: ContactStatus.REFUSED },
  });

  const [reservations, invoices] = await Promise.all([
    prisma.reservation.count({ where: { clientId: quote.clientId } }),
    prisma.invoice.count({ where: { clientId: quote.clientId } }),
  ]);

  if (reservations === 0 && invoices === 0) {
    await prisma.client.delete({ where: { id: quote.clientId } });
  }

  redirect("/admin/demandes");
}

export async function updateQuoteAdmin(formData: FormData) {
  const quoteId = String(formData.get("quoteId") || "").trim();
  if (!quoteId) {
    redirect("/admin/demandes");
  }

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: { startDate: true, endDate: true },
  });

  if (!quote) {
    redirect("/admin/demandes");
  }

  const itemIds = formData.getAll("itemId").map((value) => String(value));
  const itemQtys = formData.getAll("itemQty");
  const itemPrices = formData.getAll("itemPrice");
  const newItemIds = formData.getAll("newItemId").map((value) => String(value));
  const newItemQtys = formData.getAll("newItemQty");
  const newItemPrices = formData.getAll("newItemPrice");
  const depositAmountCents = parseEuroToCents(formData.get("depositAmount"));
  const discountAmountCents = parseEuroToCents(formData.get("discountAmount"));

  const lineLabels = formData.getAll("lineLabel").map((value) => String(value));
  const lineQtys = formData.getAll("lineQty");
  const linePrices = formData.getAll("linePrice");

  const allItemIds = Array.from(
    new Set(
      [...itemIds, ...newItemIds]
        .map((id) => id.trim())
        .filter((id) => id.length > 0)
    )
  );

  const [reservations, heldQuotes] = await Promise.all([
    prisma.reservationItem.findMany({
      where: {
        reservation: {
          status: {
            in: [
              ReservationStatus.PENDING,
              ReservationStatus.CONFIRMED,
              ReservationStatus.IN_PROGRESS,
            ],
          },
          startDate: { lte: quote.endDate },
          endDate: { gte: quote.startDate },
        },
      },
    }),
    prisma.quote.findMany({
      where: {
        status: QuoteStatus.SUBMITTED,
        id: { not: quoteId },
        startDate: { lte: quote.endDate },
        endDate: { gte: quote.startDate },
      },
      include: { items: true },
    }),
  ]);

  const reservedMap = reservations.reduce<Record<string, number>>(
    (acc, entry) => {
      acc[entry.itemId] = (acc[entry.itemId] || 0) + entry.quantity;
      return acc;
    },
    {}
  );
  heldQuotes.forEach((held) => {
    held.items.forEach((entry) => {
      reservedMap[entry.itemId] = (reservedMap[entry.itemId] || 0) + entry.quantity;
    });
  });

  const items = await prisma.item.findMany({
    where: { id: { in: allItemIds } },
  });
  const priceById = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.id] = item.rentalPriceCents;
    return acc;
  }, {});
  const availableById = items.reduce<Record<string, number>>((acc, item) => {
    const reserved = reservedMap[item.id] || 0;
    acc[item.id] = Math.max(0, item.totalQty - reserved);
    return acc;
  }, {});

  const byItemId = new Map<string, { quantity: number; unitPriceCents: number }>();
  const addItemEntry = (id: string, qtyRaw: FormDataEntryValue | undefined, priceRaw: FormDataEntryValue | undefined) => {
    const qty = Number(qtyRaw || 0);
    if (!id || !Number.isFinite(qty) || qty <= 0) return;
    const available = availableById[id] ?? 0;
    if (available <= 0) return;
    const priceInput = parseEuroToCents(priceRaw ?? null);
    const unitPriceCents = priceInput > 0 ? priceInput : priceById[id] || 0;
    const existing = byItemId.get(id);
    if (!existing) {
      byItemId.set(id, { quantity: qty, unitPriceCents });
      return;
    }
    byItemId.set(id, {
      quantity: existing.quantity + qty,
      unitPriceCents: existing.unitPriceCents || unitPriceCents,
    });
  };

  itemIds.forEach((id, index) => {
    addItemEntry(id, itemQtys[index], itemPrices[index]);
  });
  newItemIds.forEach((id, index) => {
    addItemEntry(id, newItemQtys[index], newItemPrices[index]);
  });

  const quoteItems: { itemId: string; quantity: number; unitPriceCents: number }[] = [];
  byItemId.forEach((entry, itemId) => {
    const available = availableById[itemId] ?? 0;
    const finalQty = Math.min(entry.quantity, available);
    if (finalQty <= 0) return;
    quoteItems.push({
      itemId,
      quantity: finalQty,
      unitPriceCents: entry.unitPriceCents,
    });
  });

  const quoteLines: { label: string; quantity: number; unitPriceCents: number }[] =
    [];

  lineLabels.forEach((label, index) => {
    const cleanLabel = label.trim();
    if (!cleanLabel) return;
    const qty = Number(lineQtys[index] || 0);
    const priceInput = parseEuroToCents(linePrices[index] ?? null);
    if (!Number.isFinite(qty) || qty <= 0) return;
    quoteLines.push({
      label: cleanLabel,
      quantity: qty,
      unitPriceCents: priceInput,
    });
  });

  if (discountAmountCents > 0) {
    quoteLines.push({
      label: "Remise",
      quantity: 1,
      unitPriceCents: -Math.abs(discountAmountCents),
    });
  }

  const total = quoteItems.reduce((acc, entry) => acc + entry.quantity * entry.unitPriceCents, 0) +
    quoteLines.reduce((acc, entry) => acc + entry.quantity * entry.unitPriceCents, 0);

  await prisma.$transaction(async (tx) => {
    await tx.quoteItem.deleteMany({ where: { quoteId } });
    await tx.quoteLine.deleteMany({ where: { quoteId } });

    if (quoteItems.length > 0) {
      await tx.quoteItem.createMany({
        data: quoteItems.map((entry) => ({
          quoteId,
          itemId: entry.itemId,
          quantity: entry.quantity,
          unitPriceCents: entry.unitPriceCents,
        })),
      });
    }

    if (quoteLines.length > 0) {
      await tx.quoteLine.createMany({
        data: quoteLines.map((entry) => ({
          quoteId,
          label: entry.label,
          quantity: entry.quantity,
          unitPriceCents: entry.unitPriceCents,
        })),
      });
    }

    await tx.quote.update({
      where: { id: quoteId },
      data: { totalAmountCents: total, depositAmountCents },
    });
  });

  redirect("/admin/demandes");
}

export async function generateQuotePdf(formData: FormData) {
  const quoteId = String(formData.get("quoteId") || "").trim();
  if (!quoteId) {
    redirect("/admin/demandes");
  }

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      client: true,
      items: { include: { item: true } },
      lines: true,
    },
  });

  if (!quote) {
    redirect("/admin/demandes");
  }

  const company = await prisma.companySetting.findUnique({
    where: { id: "company" },
  });

  const lineItems = [
    ...quote.items.map((entry) => ({
      label: entry.item.name,
      quantity: entry.quantity,
      unitPriceCents: entry.unitPriceCents,
    })),
    ...quote.lines.map((line) => ({
      label: line.label,
      quantity: line.quantity,
      unitPriceCents: line.unitPriceCents,
    })),
  ];

  const total = lineItems.reduce(
    (acc, entry) => acc + entry.quantity * entry.unitPriceCents,
    0
  );

  const period = `${formatDate(quote.startDate)} - ${formatDate(quote.endDate)}`;
  const issuedAt = quote.updatedAt;
  const validUntil = quote.eventDate ?? quote.startDate;

  const quoteNumber = quote.quoteNumber || (await getNextQuoteNumber());

  const pdfBuffer = await renderQuotePdf({
    quoteNumber,
    issuedAt,
    validUntil,
    companyName: company?.businessName || siteConfig.name,
    companyAddress: company?.address || siteConfig.address,
    companyCity: company?.city || null,
    companyPostal: company?.postalCode || null,
    companyPhone: company?.phone || siteConfig.phone,
    companyEmail: company?.email || siteConfig.email,
    companySiret: company?.siret || null,
    clientName: quote.client.name,
    clientEmail: quote.client.email,
    clientPhone: quote.client.phone,
    period,
    lines: lineItems,
    totalCents: total,
    depositCents: quote.depositAmountCents,
    signatureName: quote.signedName,
    signatureDate: quote.signedAt,
    signatureData: quote.signatureData,
  });

  const fileName = `documents/devis-${quote.id}.pdf`;
  await uploadBufferToR2({
    key: fileName,
    body: pdfBuffer,
    contentType: "application/pdf",
  });

  const pdfUrl = fileName;
  await prisma.quote.update({
    where: { id: quote.id },
    data: { pdfUrl, totalAmountCents: total, quoteNumber, status: QuoteStatus.SUBMITTED },
  });

  // Ne pas changer le statut ici: la génération du PDF ne signifie pas "devis envoyé".

  redirect("/admin/demandes");
}
