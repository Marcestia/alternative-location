import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const normalizeEmail = (value: string | null) =>
  String(value || "").trim().toLowerCase();

async function findEligiblePaidInvoice(email: string) {
  if (!email) return null;

  const paidInvoices = await prisma.invoice.findMany({
    where: {
      status: "PAID",
      client: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    },
    orderBy: [{ paidAt: "desc" }, { createdAt: "desc" }],
    select: { id: true },
    take: 20,
  });

  if (!paidInvoices.length) return null;

  for (const invoice of paidInvoices) {
    const existingReview = await prisma.review.findFirst({
      where: { verifiedInvoiceId: invoice.id },
      select: { id: true },
    });
    if (!existingReview) return invoice.id;
  }

  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = normalizeEmail(searchParams.get("email"));

  if (!email || !email.includes("@")) {
    return NextResponse.json({ ok: false, reason: "invalid-email" });
  }

  const invoiceId = await findEligiblePaidInvoice(email);
  if (!invoiceId) {
    return NextResponse.json({ ok: false, reason: "not-eligible" });
  }

  return NextResponse.json({ ok: true });
}
