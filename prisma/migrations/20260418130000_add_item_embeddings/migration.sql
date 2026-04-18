-- CreateTable
CREATE TABLE "ItemEmbedding" (
    "itemId" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "embeddingModel" TEXT NOT NULL,
    "sourceText" TEXT NOT NULL,
    "embedding" JSONB NOT NULL,
    "dimensions" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemEmbedding_pkey" PRIMARY KEY ("itemId")
);

-- AddForeignKey
ALTER TABLE "ItemEmbedding"
ADD CONSTRAINT "ItemEmbedding_itemId_fkey"
FOREIGN KEY ("itemId") REFERENCES "Item"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
