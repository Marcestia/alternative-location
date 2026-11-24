// Add only the email tables; never replay migrations against the legacy database.
import fs from "node:fs";
import nextEnv from "@next/env";
import generatedPrisma from "../src/generated/prisma/index.js";
nextEnv.loadEnvConfig(process.cwd());
const { PrismaClient } = generatedPrisma;
const prisma = new PrismaClient({ log: [] });
try {
  const sql = fs.readFileSync(
    new URL(
      "../prisma/migrations/20261124120000_add_email_tracking/migration.sql",
      import.meta.url,
    ),
    "utf8",
  );
  await prisma.$transaction(async (tx) => {
    // Statements come exclusively from the reviewed repository migration.
    for (const statement of sql
      .split(";")
      .map((value) => value.trim())
      .filter(Boolean)) {
      await tx.$executeRawUnsafe(statement);
    }
  });
  console.log("Email tracking storage is ready.");
} catch (error) {
  console.error("Email storage setup failed:", error.code || error.name);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
