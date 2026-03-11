const { PrismaClient } = require("../src/generated/prisma");
const prisma = new PrismaClient();
prisma.item.count()
  .then((c) => console.log("count", c))
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
