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
    "legalForm" TEXT,
    "capital" TEXT,
    "siren" TEXT,
    "siret" TEXT,
    "vatNumber" TEXT,
    "vatApplicable" BOOLEAN NOT NULL DEFAULT false,
    "vatRateBps" INTEGER NOT NULL DEFAULT 0,
    "paymentTerms" TEXT,
    "latePaymentPenalty" TEXT,
    "recoveryFeeCents" INTEGER NOT NULL DEFAULT 4000,
    "bankIban" TEXT,
    "bankBic" TEXT,
    "logoUrl" TEXT,
    "spotlightTitle" TEXT,
    "spotlightDescription" TEXT,
    "spotlightImageUrl" TEXT,
    "spotlightActive" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_CompanySetting" ("address", "businessName", "city", "email", "id", "logoUrl", "phone", "postalCode", "siret", "spotlightActive", "spotlightDescription", "spotlightImageUrl", "spotlightTitle", "updatedAt") SELECT "address", "businessName", "city", "email", "id", "logoUrl", "phone", "postalCode", "siret", "spotlightActive", "spotlightDescription", "spotlightImageUrl", "spotlightTitle", "updatedAt" FROM "CompanySetting";
DROP TABLE "CompanySetting";
ALTER TABLE "new_CompanySetting" RENAME TO "CompanySetting";
CREATE TABLE "new_Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "issueDate" DATETIME NOT NULL,
    "serviceDate" DATETIME,
    "dueDate" DATETIME,
    "subtotalAmountCents" INTEGER NOT NULL DEFAULT 0,
    "taxRateBps" INTEGER NOT NULL DEFAULT 0,
    "taxAmountCents" INTEGER NOT NULL DEFAULT 0,
    "totalAmountCents" INTEGER NOT NULL DEFAULT 0,
    "paymentTerms" TEXT,
    "paymentMethod" TEXT,
    "latePaymentPenalty" TEXT,
    "recoveryFeeCents" INTEGER NOT NULL DEFAULT 4000,
    "notes" TEXT,
    "pdfUrl" TEXT,
    "sentAt" DATETIME,
    "paidAt" DATETIME,
    "cancelledAt" DATETIME,
    "clientId" TEXT NOT NULL,
    "reservationId" TEXT,
    "quoteId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invoice_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Invoice_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Invoice" ("clientId", "createdAt", "dueDate", "id", "issueDate", "notes", "number", "reservationId", "status", "totalAmountCents", "updatedAt") SELECT "clientId", "createdAt", "dueDate", "id", "issueDate", "notes", "number", "reservationId", "status", "totalAmountCents", "updatedAt" FROM "Invoice";
DROP TABLE "Invoice";
ALTER TABLE "new_Invoice" RENAME TO "Invoice";
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");
CREATE UNIQUE INDEX "Invoice_quoteId_key" ON "Invoice"("quoteId");
CREATE INDEX "Invoice_clientId_idx" ON "Invoice"("clientId");
CREATE INDEX "Invoice_reservationId_idx" ON "Invoice"("reservationId");
CREATE INDEX "Invoice_quoteId_idx" ON "Invoice"("quoteId");
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");
CREATE TABLE "new_InvoiceLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPriceCents" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "InvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_InvoiceLine" ("id", "invoiceId", "label", "quantity", "unitPriceCents") SELECT "id", "invoiceId", "label", "quantity", "unitPriceCents" FROM "InvoiceLine";
DROP TABLE "InvoiceLine";
ALTER TABLE "new_InvoiceLine" RENAME TO "InvoiceLine";
CREATE INDEX "InvoiceLine_invoiceId_idx" ON "InvoiceLine"("invoiceId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
