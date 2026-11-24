CREATE TABLE IF NOT EXISTS "EmailSetting" (
  "id" TEXT NOT NULL DEFAULT 'company' PRIMARY KEY,
  "senderEmail" TEXT,
  "bccEmail" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "EmailMessage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "dedupeKey" TEXT,
  "kind" TEXT NOT NULL DEFAULT 'OTHER',
  "entityId" TEXT,
  "clientId" TEXT,
  "to" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "html" TEXT,
  "attachments" JSONB,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "from" TEXT,
  "bcc" TEXT,
  "messageId" TEXT,
  "error" TEXT,
  "bccError" TEXT,
  "lastAttemptAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "EmailMessage_dedupeKey_key" ON "EmailMessage"("dedupeKey");
CREATE INDEX IF NOT EXISTS "EmailMessage_status_createdAt_idx" ON "EmailMessage"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "EmailMessage_entityId_createdAt_idx" ON "EmailMessage"("entityId", "createdAt");
