"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

const parsePercentToBps = (value: FormDataEntryValue | null) => {
  const raw = String(value || "").trim().replace(",", ".");
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return 0;
  return Math.round(parsed * 100);
};

const parseEuroToCents = (value: FormDataEntryValue | null) => {
  const raw = String(value || "").trim().replace(",", ".");
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return 0;
  return Math.round(parsed * 100);
};

export async function saveCompanySettings(formData: FormData) {
  const businessName = String(formData.get("businessName") || "").trim();
  if (!businessName) {
    redirect("/admin/parametres?saved=0");
  }

  const vatApplicable = String(formData.get("vatApplicable") || "") === "on";
  const catalogRequestEnabled =
    String(formData.get("catalogRequestEnabled") || "") === "on";
  const vatRateBps = parsePercentToBps(formData.get("vatRate"));
  const recoveryFeeCents = parseEuroToCents(formData.get("recoveryFee"));

  await prisma.companySetting.upsert({
    where: { id: "company" },
    update: {
      businessName,
      address: String(formData.get("address") || "").trim() || null,
      city: String(formData.get("city") || "").trim() || null,
      postalCode: String(formData.get("postalCode") || "").trim() || null,
      phone: String(formData.get("phone") || "").trim() || null,
      email: String(formData.get("email") || "").trim() || null,
      legalForm: String(formData.get("legalForm") || "").trim() || null,
      capital: String(formData.get("capital") || "").trim() || null,
      siren: String(formData.get("siren") || "").trim() || null,
      siret: String(formData.get("siret") || "").trim() || null,
      nafCode: String(formData.get("nafCode") || "").trim() || null,
      vatNumber: String(formData.get("vatNumber") || "").trim() || null,
      vatApplicable,
      vatRateBps: vatApplicable ? vatRateBps : 0,
      paymentTerms: String(formData.get("paymentTerms") || "").trim() || null,
      latePaymentPenalty:
        String(formData.get("latePaymentPenalty") || "").trim() || null,
      recoveryFeeCents: recoveryFeeCents > 0 ? recoveryFeeCents : 4000,
      bankIban: String(formData.get("bankIban") || "").trim() || null,
      bankBic: String(formData.get("bankBic") || "").trim() || null,
      catalogRequestEnabled,
    },
    create: {
      id: "company",
      businessName,
      address: String(formData.get("address") || "").trim() || null,
      city: String(formData.get("city") || "").trim() || null,
      postalCode: String(formData.get("postalCode") || "").trim() || null,
      phone: String(formData.get("phone") || "").trim() || null,
      email: String(formData.get("email") || "").trim() || null,
      legalForm: String(formData.get("legalForm") || "").trim() || null,
      capital: String(formData.get("capital") || "").trim() || null,
      siren: String(formData.get("siren") || "").trim() || null,
      siret: String(formData.get("siret") || "").trim() || null,
      nafCode: String(formData.get("nafCode") || "").trim() || null,
      vatNumber: String(formData.get("vatNumber") || "").trim() || null,
      vatApplicable,
      vatRateBps: vatApplicable ? vatRateBps : 0,
      paymentTerms: String(formData.get("paymentTerms") || "").trim() || null,
      latePaymentPenalty:
        String(formData.get("latePaymentPenalty") || "").trim() || null,
      recoveryFeeCents: recoveryFeeCents > 0 ? recoveryFeeCents : 4000,
      bankIban: String(formData.get("bankIban") || "").trim() || null,
      bankBic: String(formData.get("bankBic") || "").trim() || null,
      catalogRequestEnabled,
    },
  });

  redirect("/admin/parametres?saved=1");
}

export async function resetNonStockData() {
  await prisma.reviewImage.deleteMany();
  await prisma.review.deleteMany();
  await prisma.invoiceLine.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.reservationItem.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.quoteItem.deleteMany();
  await prisma.quoteLine.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.contactRequest.deleteMany();
  await prisma.spotlight.deleteMany();
  await prisma.galleryMedia.deleteMany();
  await prisma.gallerySection.deleteMany();
  await prisma.numberSequence.deleteMany();
  await prisma.client.deleteMany();

  redirect("/admin/parametres?reset=1");
}
