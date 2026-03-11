-- CreateTable
CREATE TABLE "Spotlight" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Spotlight_active_idx" ON "Spotlight"("active");

-- CreateIndex
CREATE INDEX "Spotlight_sortOrder_idx" ON "Spotlight"("sortOrder");
