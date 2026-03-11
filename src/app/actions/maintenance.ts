"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function deleteContactRequestById(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  if (!id) {
    redirect("/admin/nettoyage");
  }

  const request = await prisma.contactRequest.findUnique({
    where: { id },
    include: { quote: true },
  });

  if (!request) {
    redirect("/admin/nettoyage");
  }

  if (request.quote?.id) {
    await prisma.quoteItem.deleteMany({ where: { quoteId: request.quote.id } });
    await prisma.quoteLine.deleteMany({ where: { quoteId: request.quote.id } });
    await prisma.quote.delete({ where: { id: request.quote.id } });
  }

  await prisma.contactRequest.delete({ where: { id: request.id } });

  if (request.clientId) {
    const [reservations, invoices, quotes, requests] = await Promise.all([
      prisma.reservation.count({ where: { clientId: request.clientId } }),
      prisma.invoice.count({ where: { clientId: request.clientId } }),
      prisma.quote.count({ where: { clientId: request.clientId } }),
      prisma.contactRequest.count({ where: { clientId: request.clientId } }),
    ]);

    if (reservations === 0 && invoices === 0 && quotes === 0 && requests === 0) {
      await prisma.client.delete({ where: { id: request.clientId } });
    }
  }

  redirect("/admin/nettoyage");
}

export async function deleteQuoteById(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  if (!id) {
    redirect("/admin/nettoyage");
  }

  await prisma.quoteItem.deleteMany({ where: { quoteId: id } });
  await prisma.quoteLine.deleteMany({ where: { quoteId: id } });
  await prisma.quote.delete({ where: { id } });

  redirect("/admin/nettoyage");
}

export async function deleteReviewById(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  if (!id) {
    redirect("/admin/nettoyage");
  }

  await prisma.reviewImage.deleteMany({ where: { reviewId: id } });
  await prisma.review.delete({ where: { id } });

  redirect("/admin/nettoyage");
}

export async function deleteQuotePdf(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  if (!id) {
    redirect("/admin/nettoyage");
  }

  await prisma.quote.update({
    where: { id },
    data: { pdfUrl: null },
  });

  redirect("/admin/nettoyage");
}

export async function deleteInvoicePdf(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  if (!id) {
    redirect("/admin/nettoyage");
  }

  await prisma.invoice.update({
    where: { id },
    data: { pdfUrl: null },
  });

  redirect("/admin/nettoyage");
}
