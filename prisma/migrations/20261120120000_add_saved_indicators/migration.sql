-- Additive and idempotent: the legacy database was installed without a migration history.
-- This script only creates storage for saved indicator definitions.
CREATE TABLE IF NOT EXISTS "SavedIndicator" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "definition" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SavedIndicator_pkey" PRIMARY KEY ("id")
);
