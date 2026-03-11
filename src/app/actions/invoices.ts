"use server";

import { prisma } from "@/lib/prisma";
import { InvoiceStatus, QuoteStatus } from "@/generated/prisma";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { sendMail } from "@/lib/mailer";
import { siteConfig } from "@/lib/site";
import PDFDocument from "pdfkit/js/pdfkit.standalone";
import { downloadBufferFromR2, getSignedUrlForKey, uploadBufferToR2 } from "@/lib/r2";

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

async function getNextInvoiceNumber() {
  const currentYear = new Date().getFullYear();
  const sequence = await prisma.numberSequence.upsert({
    where: { id: "invoice" },
    update: { value: { increment: 1 } },
    create: { id: "invoice", value: 1 },
  });
  return `FAC-${currentYear}-${String(sequence.value).padStart(4, "0")}`;
}

async function renderInvoicePdf(options: {
  invoiceNumber: string;
  issuedAt: Date;
  serviceDate?: Date | null;
  dueDate?: Date | null;
  companyName: string;
  companyAddress?: string | null;
  companyCity?: string | null;
  companyPostal?: string | null;
  companyPhone?: string | null;
  companyEmail?: string | null;
  companySiret?: string | null;
  companySiren?: string | null;
  companyLegalForm?: string | null;
  companyCapital?: string | null;
  companyVatNumber?: string | null;
  clientName: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  clientAddress?: string | null;
  clientCity?: string | null;
  clientPostal?: string | null;
  lines: { label: string; quantity: number; unitPriceCents: number }[];
  subtotalCents: number;
  taxRateBps: number;
  taxCents: number;
  totalCents: number;
  paymentTerms?: string | null;
  latePaymentPenalty?: string | null;
  recoveryFeeCents?: number | null;
  vatApplicable: boolean;
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
      [options.companyPostal, options.companyCity].filter(Boolean).join(" ") ||
        "",
      left
    )
    .text(options.companyPhone || "", left)
    .text(options.companyEmail || "", left);

  if (options.companySiren || options.companySiret) {
    doc.text(
      options.companySiren
        ? `SIREN : ${options.companySiren}`
        : `SIRET : ${options.companySiret}`,
      left
    );
  }
  if (options.companyLegalForm || options.companyCapital) {
    doc.text(
      [options.companyLegalForm, options.companyCapital]
        .filter(Boolean)
        .join(" - "),
      left
    );
  }
  if (options.companyVatNumber) {
    doc.text(`TVA : ${options.companyVatNumber}`, left);
  }

  doc
    .fontSize(20)
    .fillColor("#111")
    .text("FACTURE", right - 200, 50, { align: "right", width: 200 });
  doc
    .fontSize(9)
    .fillColor("#555")
    .text(`N° ${options.invoiceNumber}`, right - 200, 75, {
      align: "right",
      width: 200,
    })
    .text(`Date : ${formatDate(options.issuedAt)}`, right - 200, 90, {
      align: "right",
      width: 200,
    });

  if (options.serviceDate) {
    doc.text(`Date de prestation : ${formatDate(options.serviceDate)}`,
      right - 200,
      105,
      { align: "right", width: 200 }
    );
  }
  if (options.dueDate) {
    doc.text(
      `Echeance : ${formatDate(options.dueDate)}`,
      right - 200,
      options.serviceDate ? 120 : 105,
      { align: "right", width: 200 }
    );
  }

  doc.moveDown(4);

  doc.fontSize(11).fillColor("#111").text("Client", left).moveDown(0.3);

  doc
    .fontSize(10)
    .fillColor("#333")
    .text(options.clientName, left)
    .text(options.clientEmail ? `Email : ${options.clientEmail}` : "", left)
    .text(options.clientPhone ? `Telephone : ${options.clientPhone}` : "", left)
    .text(options.clientAddress ? options.clientAddress : "", left)
    .text(
      [options.clientPostal, options.clientCity].filter(Boolean).join(" ") || "",
      left
    );

  doc.moveDown();

  const tableTop = doc.y + 10;
  const colLabel = left;
  const colQty = left + 280;
  const colUnit = left + 340;
  const colTotal = left + 430;

  doc
    .fontSize(10)
    .fillColor("#111")
    .text("Designation", colLabel, tableTop)
    .text("Qte", colQty, tableTop)
    .text("PU", colUnit, tableTop)
    .text("Total", colTotal, tableTop);

  doc.moveTo(left, tableTop + 15).lineTo(right, tableTop + 15).strokeColor("#ddd").stroke();

  let y = tableTop + 25;
  doc.fontSize(9).fillColor("#333");

  options.lines.forEach((line) => {
    const lineTotal = line.quantity * line.unitPriceCents;
    const labelHeight = doc.heightOfString(line.label, { width: 260 });
    doc.text(line.label, colLabel, y, { width: 260 });
    doc.text(String(line.quantity), colQty, y);
    doc.text(`${formatPrice(line.unitPriceCents)} EUR`, colUnit, y);
    doc.text(`${formatPrice(lineTotal)} EUR`, colTotal, y);
    y += Math.max(labelHeight, 14) + 6;
  });

  doc.moveTo(left, y).lineTo(right, y).strokeColor("#ddd").stroke();

  y += 10;
  doc
    .fontSize(10)
    .fillColor("#111")
    .text(`Total HT : ${formatPrice(options.subtotalCents)} EUR`, colTotal - 80, y, {
      align: "right",
      width: 150,
    });

  y += 15;
  if (options.vatApplicable) {
    doc
      .fontSize(10)
      .fillColor("#111")
      .text(
        `TVA (${(options.taxRateBps / 100).toFixed(2)} %) : ${formatPrice(
          options.taxCents
        )} EUR`,
        colTotal - 80,
        y,
        { align: "right", width: 150 }
      );
    y += 15;
  } else {
    doc
      .fontSize(9)
      .fillColor("#666")
      .text("TVA non applicable, art. 293 B du CGI.", left, y);
    y += 15;
  }

  doc
    .fontSize(11)
    .fillColor("#111")
    .text(`Total TTC : ${formatPrice(options.totalCents)} EUR`, colTotal - 80, y, {
      align: "right",
      width: 150,
    });

  doc.moveDown(3);

  doc
    .fontSize(9)
    .fillColor("#555")
    .text(
      options.paymentTerms ||
        "Paiement a reception. Merci d'effectuer le reglement dans les delais.",
      left
    );

  if (options.latePaymentPenalty) {
    doc.text(options.latePaymentPenalty, left);
  }

  if (options.recoveryFeeCents && options.recoveryFeeCents > 0) {
    doc.text(
      `Indemnite forfaitaire pour frais de recouvrement (professionnels) : ${formatPrice(
        options.recoveryFeeCents
      )} EUR.`,
      left
    );
  }

  doc.end();
  await new Promise<void>((resolve) => doc.on("end", resolve));
  return Buffer.concat(chunks);
}

async function buildInvoiceDataFromQuote(quoteId: string) {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      client: true,
      items: { include: { item: true } },
      lines: true,
      contactRequest: true,
    },
  });

  if (!quote || quote.status !== QuoteStatus.ACCEPTED) {
    return null;
  }

  const lineItems = [
    ...quote.items.map((entry, index) => ({
      label: entry.item.name,
      quantity: entry.quantity,
      unitPriceCents: entry.unitPriceCents,
      sortOrder: index,
    })),
    ...quote.lines.map((line, index) => ({
      label: line.label,
      quantity: line.quantity,
      unitPriceCents: line.unitPriceCents,
      sortOrder: 100 + index,
    })),
  ];

  const subtotalCents = lineItems.reduce(
    (acc, entry) => acc + entry.quantity * entry.unitPriceCents,
    0
  );

  const company = await prisma.companySetting.findUnique({
    where: { id: "company" },
  });

  const vatApplicable = company?.vatApplicable ?? false;
  const taxRateBps = vatApplicable ? company?.vatRateBps || 0 : 0;
  const taxAmountCents = vatApplicable
    ? Math.round((subtotalCents * taxRateBps) / 10000)
    : 0;
  const totalAmountCents = subtotalCents + taxAmountCents;

  const serviceDate = quote.eventDate ?? quote.endDate ?? quote.startDate;
  const dueDate = quote.eventDate ?? quote.endDate ?? quote.startDate;

  const reservation = await prisma.reservation.findFirst({
    where: {
      clientId: quote.clientId,
      startDate: quote.startDate,
      endDate: quote.endDate,
    },
  });

  return {
    quote,
    company,
    lineItems,
    subtotalCents,
    taxRateBps,
    taxAmountCents,
    totalAmountCents,
    vatApplicable,
    serviceDate,
    dueDate,
    reservationId: reservation?.id ?? null,
  };
}

export async function createInvoiceForQuoteId(quoteId: string) {
  const data = await buildInvoiceDataFromQuote(quoteId);
  if (!data) {
    return null;
  }

  const {
    quote,
    company,
    lineItems,
    subtotalCents,
    taxRateBps,
    taxAmountCents,
    totalAmountCents,
    vatApplicable,
    serviceDate,
    dueDate,
    reservationId,
  } = data;

  const existing = await prisma.invoice.findUnique({
    where: { quoteId: quote.id },
  });

  const invoiceNumber = existing?.number || (await getNextInvoiceNumber());
  const issueDate = existing?.issueDate || new Date();

  const invoice = await prisma.invoice.upsert({
    where: { quoteId: quote.id },
    update: {
      issueDate,
      serviceDate,
      dueDate,
      subtotalAmountCents: subtotalCents,
      taxRateBps,
      taxAmountCents,
      totalAmountCents,
      paymentTerms: company?.paymentTerms || null,
      paymentMethod: null,
      latePaymentPenalty: company?.latePaymentPenalty || null,
      recoveryFeeCents: company?.recoveryFeeCents ?? 4000,
      clientId: quote.clientId,
      reservationId,
      notes: null,
    },
    create: {
      number: invoiceNumber,
      status: InvoiceStatus.DRAFT,
      issueDate,
      serviceDate,
      dueDate,
      subtotalAmountCents: subtotalCents,
      taxRateBps,
      taxAmountCents,
      totalAmountCents,
      paymentTerms: company?.paymentTerms || null,
      paymentMethod: null,
      latePaymentPenalty: company?.latePaymentPenalty || null,
      recoveryFeeCents: company?.recoveryFeeCents ?? 4000,
      clientId: quote.clientId,
      quoteId: quote.id,
      reservationId,
    },
  });

  await prisma.invoiceLine.deleteMany({ where: { invoiceId: invoice.id } });
  if (lineItems.length > 0) {
    await prisma.invoiceLine.createMany({
      data: lineItems.map((line) => ({
        invoiceId: invoice.id,
        label: line.label,
        quantity: line.quantity,
        unitPriceCents: line.unitPriceCents,
        sortOrder: line.sortOrder,
      })),
    });
  }

  const pdfBuffer = await renderInvoicePdf({
    invoiceNumber,
    issuedAt: issueDate,
    serviceDate,
    dueDate,
    companyName: company?.businessName || siteConfig.name,
    companyAddress: company?.address || siteConfig.address,
    companyCity: company?.city || null,
    companyPostal: company?.postalCode || null,
    companyPhone: company?.phone || siteConfig.phone,
    companyEmail: company?.email || siteConfig.email,
    companySiret: company?.siret || null,
    companySiren: company?.siren || null,
    companyLegalForm: company?.legalForm || null,
    companyCapital: company?.capital || null,
    companyVatNumber: company?.vatNumber || null,
    clientName: quote.client.name,
    clientEmail: quote.client.email,
    clientPhone: quote.client.phone,
    clientAddress: quote.client.address,
    clientCity: null,
    clientPostal: null,
    lines: lineItems,
    subtotalCents,
    taxRateBps,
    taxCents: taxAmountCents,
    totalCents: totalAmountCents,
    paymentTerms: company?.paymentTerms || null,
    latePaymentPenalty: company?.latePaymentPenalty || null,
    recoveryFeeCents: company?.recoveryFeeCents ?? 4000,
    vatApplicable,
  });

  const fileName = `documents/facture-${invoice.id}.pdf`;
  await uploadBufferToR2({
    key: fileName,
    body: pdfBuffer,
    contentType: "application/pdf",
  });

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { pdfUrl: fileName },
  });

  return invoice;
}

export async function createInvoiceFromQuote(formData: FormData) {
  const quoteId = String(formData.get("quoteId") || "").trim();
  if (!quoteId) {
    redirect("/admin/factures?saved=0");
  }

  const invoice = await createInvoiceForQuoteId(quoteId);
  if (!invoice) {
    redirect("/admin/factures?saved=0");
  }

  redirect("/admin/factures?saved=1");
}

export async function markInvoiceSent(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  if (!id) {
    redirect("/admin/factures");
  }
  await prisma.invoice.update({
    where: { id },
    data: { status: InvoiceStatus.SENT, sentAt: new Date() },
  });
  redirect("/admin/factures");
}

export async function markInvoiceSentAndEmail(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  if (!id) {
    redirect("/admin/factures");
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { client: true },
  });

  if (!invoice?.client?.email || !invoice.pdfUrl) {
    redirect("/admin/factures?error=email");
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
    if (invoice.pdfUrl.startsWith("/pdfs/")) {
      // legacy local PDF
    } else {
      const pdfBuffer = await downloadBufferFromR2({ key: invoice.pdfUrl });
      if (pdfBuffer.length) {
        attachments.push({
          filename: "facture.pdf",
          content: pdfBuffer,
          contentType: "application/pdf",
        });
      }
    }
  } catch {
    // ignore
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
    // ignore
  }

  const subject = "Votre facture - Alternative Location";
  const pdfLink =
    invoice.pdfUrl && !invoice.pdfUrl.startsWith("/pdfs/")
      ? await getSignedUrlForKey({ key: invoice.pdfUrl, expiresInSeconds: SIGNED_URL_TTL })
      : `${baseUrl}${invoice.pdfUrl}`;
  const text = `Bonjour ${invoice.client.name},\n\nAlternative Location vous contacte pour votre facture.\n\nFacture (PDF) :\n${pdfLink}\n\nRIB / IBAN :\n${ribUrl}\n\nPaiement possible par cheque, espece ou virement, et en plusieurs fois si necessaire, avant la remise du materiel.\n\nBien a vous,\nAlternative Location`;
  const html = `
    <p>Bonjour ${invoice.client.name},</p>
    <p>Alternative Location vous contacte pour votre facture.</p>
    <p><strong>Facture (PDF)</strong> : <a href="${pdfLink}">Facture</a></p>
    <p><strong>RIB / IBAN</strong> : <a href="${ribUrl}">RIB / IBAN</a></p>
    <p>Paiement possible par cheque, espece ou virement, et en plusieurs fois si necessaire, avant la remise du materiel.</p>
    <p>Bien a vous,<br/>Alternative Location</p>
  `;

  await sendMail({
    to: invoice.client.email,
    subject,
    text,
    html,
    attachments,
  });

  await prisma.invoice.update({
    where: { id },
    data: { status: InvoiceStatus.SENT, sentAt: new Date() },
  });

  redirect("/admin/factures");
}

export async function markInvoicePaid(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  if (!id) {
    redirect("/admin/factures");
  }
  await prisma.invoice.update({
    where: { id },
    data: { status: InvoiceStatus.PAID, paidAt: new Date() },
  });
  redirect("/admin/factures");
}

export async function regenerateInvoicePdf(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  if (!id) {
    redirect("/admin/factures");
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { client: true, lines: { orderBy: { sortOrder: "asc" } }, quote: true },
  });
  if (!invoice) {
    redirect("/admin/factures");
  }

  const company = await prisma.companySetting.findUnique({
    where: { id: "company" },
  });

  const pdfBuffer = await renderInvoicePdf({
    invoiceNumber: invoice.number,
    issuedAt: invoice.issueDate,
    serviceDate: invoice.serviceDate,
    dueDate: invoice.dueDate,
    companyName: company?.businessName || siteConfig.name,
    companyAddress: company?.address || siteConfig.address,
    companyCity: company?.city || null,
    companyPostal: company?.postalCode || null,
    companyPhone: company?.phone || siteConfig.phone,
    companyEmail: company?.email || siteConfig.email,
    companySiret: company?.siret || null,
    companySiren: company?.siren || null,
    companyLegalForm: company?.legalForm || null,
    companyCapital: company?.capital || null,
    companyVatNumber: company?.vatNumber || null,
    clientName: invoice.client.name,
    clientEmail: invoice.client.email,
    clientPhone: invoice.client.phone,
    clientAddress: invoice.client.address,
    clientCity: null,
    clientPostal: null,
    lines: invoice.lines.map((line) => ({
      label: line.label,
      quantity: line.quantity,
      unitPriceCents: line.unitPriceCents,
    })),
    subtotalCents: invoice.subtotalAmountCents,
    taxRateBps: invoice.taxRateBps,
    taxCents: invoice.taxAmountCents,
    totalCents: invoice.totalAmountCents,
    paymentTerms: invoice.paymentTerms,
    latePaymentPenalty: invoice.latePaymentPenalty,
    recoveryFeeCents: invoice.recoveryFeeCents,
    vatApplicable: (company?.vatApplicable ?? false) && invoice.taxRateBps > 0,
  });

  const fileName = `documents/facture-${invoice.id}.pdf`;
  await uploadBufferToR2({
    key: fileName,
    body: pdfBuffer,
    contentType: "application/pdf",
  });

  await prisma.invoice.update({
    where: { id },
    data: { pdfUrl: fileName },
  });

  redirect("/admin/factures");
}

export async function deleteInvoice(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  if (!id) {
    redirect("/admin/factures");
  }

  await prisma.invoiceLine.deleteMany({ where: { invoiceId: id } });
  await prisma.invoice.delete({ where: { id } });
  redirect("/admin/factures");
}
