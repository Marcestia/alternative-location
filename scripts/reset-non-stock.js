const { PrismaClient } = require("../src/generated/prisma");
const prisma = new PrismaClient();

async function main() {
  console.log("Resetting non-stock data...");
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
  await prisma.numberSequence.deleteMany();

  await prisma.client.deleteMany();

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
