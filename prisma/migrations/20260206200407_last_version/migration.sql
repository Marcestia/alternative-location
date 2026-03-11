-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Quote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "holdStock" BOOLEAN NOT NULL DEFAULT false,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "eventDate" DATETIME,
    "clientId" TEXT NOT NULL,
    "contactRequestId" TEXT NOT NULL,
    "notes" TEXT,
    "totalAmountCents" INTEGER NOT NULL DEFAULT 0,
    "depositAmountCents" INTEGER NOT NULL DEFAULT 0,
    "pdfUrl" TEXT,
    "quoteNumber" TEXT,
    "signedAt" DATETIME,
    "signedName" TEXT,
    "signatureData" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Quote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Quote_contactRequestId_fkey" FOREIGN KEY ("contactRequestId") REFERENCES "ContactRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Quote" ("clientId", "contactRequestId", "createdAt", "depositAmountCents", "endDate", "eventDate", "id", "notes", "pdfUrl", "quoteNumber", "signatureData", "signedAt", "signedName", "startDate", "status", "token", "totalAmountCents", "updatedAt") SELECT "clientId", "contactRequestId", "createdAt", "depositAmountCents", "endDate", "eventDate", "id", "notes", "pdfUrl", "quoteNumber", "signatureData", "signedAt", "signedName", "startDate", "status", "token", "totalAmountCents", "updatedAt" FROM "Quote";
DROP TABLE "Quote";
ALTER TABLE "new_Quote" RENAME TO "Quote";
CREATE UNIQUE INDEX "Quote_token_key" ON "Quote"("token");
CREATE UNIQUE INDEX "Quote_contactRequestId_key" ON "Quote"("contactRequestId");
CREATE UNIQUE INDEX "Quote_quoteNumber_key" ON "Quote"("quoteNumber");
CREATE INDEX "Quote_status_idx" ON "Quote"("status");
CREATE INDEX "Quote_clientId_idx" ON "Quote"("clientId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
