import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function safeFetch<T>(fn: () => Promise<T>, fallback: T) {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export async function GET() {
  const store = await cookies();
  const token = store.get("al_admin")?.value;
  const adminToken = process.env.ADMIN_TOKEN ?? "change-me";

  if (!token || token !== adminToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = {
    users: await safeFetch(() => prisma.user.findMany(), []),
    clients: await safeFetch(() => prisma.client.findMany(), []),
    itemCategories: await safeFetch(() => prisma.itemCategory.findMany(), []),
    items: await safeFetch(() => prisma.item.findMany(), []),
    itemImages: await safeFetch(() => prisma.itemImage.findMany(), []),
    spotlights: await safeFetch(() => prisma.spotlight.findMany(), []),
    galleryMedia: await safeFetch(() => prisma.galleryMedia.findMany(), []),
    contactRequests: await safeFetch(() => prisma.contactRequest.findMany(), []),
    quotes: await safeFetch(() => prisma.quote.findMany(), []),
    quoteLines: await safeFetch(() => prisma.quoteLine.findMany(), []),
    quoteItems: await safeFetch(() => prisma.quoteItem.findMany(), []),
    reservations: await safeFetch(() => prisma.reservation.findMany(), []),
    reservationItems: await safeFetch(() => prisma.reservationItem.findMany(), []),
    invoices: await safeFetch(() => prisma.invoice.findMany(), []),
    invoiceLines: await safeFetch(() => prisma.invoiceLine.findMany(), []),
    companySettings: await safeFetch(() => prisma.companySetting.findMany(), []),
    numberSequences: await safeFetch(() => prisma.numberSequence.findMany(), []),
    reviews: await safeFetch(() => prisma.review.findMany(), []),
    reviewImages: await safeFetch(() => prisma.reviewImage.findMany(), []),
  };

  const body = JSON.stringify(data, null, 2);
  const filename = `export-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename=\"${filename}\"`,
    },
  });
}
