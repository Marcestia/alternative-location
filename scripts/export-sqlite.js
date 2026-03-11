const fs = require("node:fs/promises");
const path = require("node:path");
const { PrismaClient } = require("../src/generated/prisma");

const OUTPUT_PATH = path.join(__dirname, "..", "prisma", "export.json");

const prisma = new PrismaClient();

async function safeFetch(label, fn) {
  try {
    const data = await fn();
    return data;
  } catch (error) {
    console.warn(`Skip ${label}: ${error.message}`);
    return [];
  }
}

async function main() {
  const data = {
    users: await safeFetch("users", () => prisma.user.findMany()),
    clients: await safeFetch("clients", () => prisma.client.findMany()),
    itemCategories: await safeFetch("itemCategories", () => prisma.itemCategory.findMany()),
    items: await safeFetch("items", () => prisma.item.findMany()),
    itemImages: await safeFetch("itemImages", () => prisma.itemImage.findMany()),
    spotlights: await safeFetch("spotlights", () => prisma.spotlight.findMany()),
    contactRequests: await safeFetch("contactRequests", () => prisma.contactRequest.findMany()),
    quotes: await safeFetch("quotes", () => prisma.quote.findMany()),
    quoteLines: await safeFetch("quoteLines", () => prisma.quoteLine.findMany()),
    quoteItems: await safeFetch("quoteItems", () => prisma.quoteItem.findMany()),
    reservations: await safeFetch("reservations", () => prisma.reservation.findMany()),
    reservationItems: await safeFetch("reservationItems", () => prisma.reservationItem.findMany()),
    invoices: await safeFetch("invoices", () => prisma.invoice.findMany()),
    invoiceLines: await safeFetch("invoiceLines", () => prisma.invoiceLine.findMany()),
    companySettings: await safeFetch("companySettings", () => prisma.companySetting.findMany()),
    numberSequences: await safeFetch("numberSequences", () => prisma.numberSequence.findMany()),
    reviews: await safeFetch("reviews", () => prisma.review.findMany()),
    reviewImages: await safeFetch("reviewImages", () => prisma.reviewImage.findMany()),
  };

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(data, null, 2));
  console.log(`Exported to ${OUTPUT_PATH}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
