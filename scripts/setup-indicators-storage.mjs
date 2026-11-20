// Bootstrap only this additive table; do not replay the legacy migrations.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";
import generatedPrisma from "../src/generated/prisma/index.js";
nextEnv.loadEnvConfig(process.cwd());
const { PrismaClient } = generatedPrisma;
const prisma = new PrismaClient({ log: [] });
const sql = fs.readFileSync(
  path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "../prisma/migrations/20261120120000_add_saved_indicators/migration.sql",
  ),
  "utf8",
);

async function setup() {
  // The SQL is a reviewed repository file, never user input.
  await prisma.$executeRawUnsafe(sql);
  await prisma.$queryRaw`SELECT "id", "name", "definition", "createdAt", "updatedAt" FROM "SavedIndicator" LIMIT 0`;
  console.log("Saved indicator storage is ready.");
}
setup()
  .catch((error) => {
    console.error("Indicator storage setup failed:", error.code || error.name);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
