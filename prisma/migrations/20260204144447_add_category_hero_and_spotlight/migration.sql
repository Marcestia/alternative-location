-- AlterTable
ALTER TABLE "ItemCategory" ADD COLUMN "heroImageUrl" TEXT;
ALTER TABLE "ItemCategory" ADD COLUMN "heroTitle" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CompanySetting" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'company',
    "businessName" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "siret" TEXT,
    "logoUrl" TEXT,
    "spotlightTitle" TEXT,
    "spotlightDescription" TEXT,
    "spotlightImageUrl" TEXT,
    "spotlightActive" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_CompanySetting" ("address", "businessName", "city", "email", "id", "logoUrl", "phone", "postalCode", "siret", "updatedAt") SELECT "address", "businessName", "city", "email", "id", "logoUrl", "phone", "postalCode", "siret", "updatedAt" FROM "CompanySetting";
DROP TABLE "CompanySetting";
ALTER TABLE "new_CompanySetting" RENAME TO "CompanySetting";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
