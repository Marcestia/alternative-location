"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { uploadImageDataToR2 } from "@/lib/r2";

async function saveImageData(imageData: string, baseName: string) {
  return uploadImageDataToR2(imageData, { prefix: "reviews", baseName });
}

const normalizeEmail = (value: FormDataEntryValue | string | null) =>
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

export async function canLeaveVerifiedReview(emailInput: string) {
  const email = normalizeEmail(emailInput);
  if (!email || !email.includes("@")) {
    return { ok: false as const, reason: "invalid-email" as const };
  }
  const invoiceId = await findEligiblePaidInvoice(email);
  if (!invoiceId) {
    return { ok: false as const, reason: "not-eligible" as const };
  }
  return { ok: true as const };
}

const clampRating = (value: FormDataEntryValue | null) => {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed)) return 5;
  return Math.min(5, Math.max(1, Math.round(parsed)));
};

export async function submitReviewPublic(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = normalizeEmail(formData.get("email"));
  const text = String(formData.get("text") || "").trim();
  const rating = clampRating(formData.get("rating"));
  const imageDataList = formData
    .getAll("imageData")
    .map((value) => String(value || "").trim())
    .filter((value) => value.length > 0);

  if (!name || !text || !email || !email.includes("@")) {
    redirect("/?review=0");
  }

  const verifiedInvoiceId = await findEligiblePaidInvoice(email);
  if (!verifiedInvoiceId) {
    redirect("/?review=not-eligible");
  }

  const savedImages = (
    await Promise.all(imageDataList.map((data) => saveImageData(data, name)))
  ).filter((value): value is string => Boolean(value));

  await prisma.review.create({
    data: {
      name,
      email,
      text,
      rating,
      status: "APPROVED",
      verifiedPurchase: true,
      verifiedInvoiceId,
      images: savedImages.length
        ? {
            create: savedImages.map((url, index) => ({
              url,
              sortOrder: index,
            })),
          }
        : undefined,
    },
  });

  redirect("/?review=1");
}

export async function addReview(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = normalizeEmail(formData.get("email"));
  const text = String(formData.get("text") || "").trim();
  const rating = clampRating(formData.get("rating"));
  const sortOrder = Number(formData.get("sortOrder") || 0);
  const imageDataList = formData
    .getAll("imageData")
    .map((value) => String(value || "").trim())
    .filter((value) => value.length > 0);

  if (!name) {
    redirect("/admin/avis?saved=0");
  }

  const savedImages = (
    await Promise.all(imageDataList.map((data) => saveImageData(data, name)))
  ).filter((value): value is string => Boolean(value));

  await prisma.review.create({
    data: {
      name,
      email: email || null,
      text: text || null,
      rating,
      status: "APPROVED",
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
      images: savedImages.length
        ? {
            create: savedImages.map((url, index) => ({
              url,
              sortOrder: index,
            })),
          }
        : undefined,
    },
  });

  redirect("/admin/avis?saved=1");
}

export async function updateReview(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const email = normalizeEmail(formData.get("email"));
  const text = String(formData.get("text") || "").trim();
  const rating = clampRating(formData.get("rating"));
  const sortOrder = Number(formData.get("sortOrder") || 0);
  const imageDataList = formData
    .getAll("imageData")
    .map((value) => String(value || "").trim())
    .filter((value) => value.length > 0);

  if (!id || !name) {
    redirect("/admin/avis");
  }

  const savedImages = (
    await Promise.all(imageDataList.map((data) => saveImageData(data, name)))
  ).filter((value): value is string => Boolean(value));

  await prisma.review.update({
    where: { id },
    data: {
      name,
      email: email || null,
      text: text || null,
      rating,
      status: "APPROVED",
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    },
  });

  if (savedImages.length > 0) {
    const existingCount = await prisma.reviewImage.count({
      where: { reviewId: id },
    });
    await prisma.reviewImage.createMany({
      data: savedImages.map((url, index) => ({
        reviewId: id,
        url,
        sortOrder: existingCount + index,
      })),
    });
  }

  redirect("/admin/avis");
}

export async function deleteReview(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  if (!id) {
    redirect("/admin/avis");
  }
  await prisma.reviewImage.deleteMany({ where: { reviewId: id } });
  await prisma.review.delete({ where: { id } });
  redirect("/admin/avis");
}
