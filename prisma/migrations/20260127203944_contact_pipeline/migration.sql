-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ContactRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "eventDate" DATETIME,
    "eventType" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "clientId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContactRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ContactRequest" ("createdAt", "email", "eventDate", "eventType", "id", "message", "name", "phone", "status", "updatedAt") SELECT "createdAt", "email", "eventDate", "eventType", "id", "message", "name", "phone", "status", "updatedAt" FROM "ContactRequest";
DROP TABLE "ContactRequest";
ALTER TABLE "new_ContactRequest" RENAME TO "ContactRequest";
CREATE INDEX "ContactRequest_clientId_idx" ON "ContactRequest"("clientId");
CREATE INDEX "ContactRequest_status_idx" ON "ContactRequest"("status");
CREATE INDEX "ContactRequest_createdAt_idx" ON "ContactRequest"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
