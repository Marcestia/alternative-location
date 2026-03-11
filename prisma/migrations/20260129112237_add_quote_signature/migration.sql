-- AlterTable
ALTER TABLE "Quote" ADD COLUMN "signatureData" TEXT;
ALTER TABLE "Quote" ADD COLUMN "signedAt" DATETIME;
ALTER TABLE "Quote" ADD COLUMN "signedName" TEXT;
