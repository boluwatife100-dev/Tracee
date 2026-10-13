CREATE TABLE "AuthenticityCheck" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "imagePublicIds" JSONB NOT NULL,
    "extractedFields" JSONB,
    "matchedRecord" JSONB,
    "registrySource" TEXT,
    "registryAvailable" BOOLEAN,
    "nafdacRegNumber" TEXT,
    "barcodeValue" TEXT,
    "state" TEXT NOT NULL DEFAULT 'INSUFFICIENT_EVIDENCE',
    "status" TEXT NOT NULL DEFAULT 'queued',
    "reasons" JSONB NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "mediaConsentAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AuthenticityCheck_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductReport" (
    "id" TEXT NOT NULL,
    "checkId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "extraPhotoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductReport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AuthenticityCheck_userId_idempotencyKey_key"
ON "AuthenticityCheck"("userId", "idempotencyKey");
CREATE INDEX "AuthenticityCheck_userId_createdAt_idx"
ON "AuthenticityCheck"("userId", "createdAt");
CREATE INDEX "AuthenticityCheck_nafdacRegNumber_idx"
ON "AuthenticityCheck"("nafdacRegNumber");
CREATE INDEX "ProductReport_checkId_createdAt_idx"
ON "ProductReport"("checkId", "createdAt");
CREATE INDEX "ProductReport_userId_createdAt_idx"
ON "ProductReport"("userId", "createdAt");
ALTER TABLE "ProductReport"
ADD CONSTRAINT "ProductReport_checkId_fkey"
FOREIGN KEY ("checkId") REFERENCES "AuthenticityCheck"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
