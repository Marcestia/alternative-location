import fs from "node:fs";
import path from "node:path";

function loadDotEnvFile() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) continue;

    const separatorIndex = trimmedLine.indexOf("=");
    if (separatorIndex <= 0) continue;

    const key = trimmedLine.slice(0, separatorIndex).trim();
    if (!key || process.env[key]) continue;

    let value = trimmedLine.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

loadDotEnvFile();

async function main() {
  const { prisma } = await import("@/lib/prisma");
  const {
    searchCatalogSemantically,
    syncAllItemSemanticEmbeddings,
  } = await import("@/lib/catalogSemanticCore");

  const summary = await syncAllItemSemanticEmbeddings();
  const result = await searchCatalogSemantically("verre a vin", 5);
  const count = await prisma.itemEmbedding.count();

  console.log(
    JSON.stringify(
      {
        indexedItems: summary.totalItems,
        storedEmbeddings: count,
        testMode: result.mode,
        testResults: result.itemIds.length,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error("Catalog semantic reindex failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    const { prisma } = await import("@/lib/prisma");
    await prisma.$disconnect();
  });
