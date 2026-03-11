const fs = require("node:fs/promises");
const path = require("node:path");
const { PrismaClient } = require("../src/generated/prisma");

const INPUT_PATH = path.join(__dirname, "..", "prisma", "export.json");

const prisma = new PrismaClient();

async function main() {
  const raw = await fs.readFile(INPUT_PATH, "utf8");
  const data = JSON.parse(raw);

  const createMany = async (model, rows) => {
    if (!rows || rows.length === 0) return;
    await model.createMany({ data: rows, skipDuplicates: true });
  };

  await createMany(prisma.user, data.users);
  await createMany(prisma.client, data.clients);
  await createMany(prisma.itemCategory, data.itemCategories);
  await createMany(prisma.item, data.items);
  await createMany(prisma.itemImage, data.itemImages);
  await createMany(prisma.spotlight, data.spotlights);
  await createMany(prisma.contactRequest, data.contactRequests);
  await createMany(prisma.quote, data.quotes);
  await createMany(prisma.quoteLine, data.quoteLines);
  await createMany(prisma.quoteItem, data.quoteItems);
  await createMany(prisma.reservation, data.reservations);
  await createMany(prisma.reservationItem, data.reservationItems);
  await createMany(prisma.invoice, data.invoices);
  await createMany(prisma.invoiceLine, data.invoiceLines);
  await createMany(prisma.companySetting, data.companySettings);
  await createMany(prisma.numberSequence, data.numberSequences);
  await createMany(prisma.review, data.reviews);
  await createMany(prisma.reviewImage, data.reviewImages);

  console.log("Import complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
