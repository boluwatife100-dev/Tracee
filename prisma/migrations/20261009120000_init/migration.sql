-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "imageUrl" TEXT,
    "allergies" TEXT[],
    "dietary" TEXT[],
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "lastSignInAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "gtin" TEXT,
    "nafdacNo" TEXT,
    "nameKey" TEXT,
    "ingredientHash" TEXT,
    "name" TEXT,
    "brand" TEXT,
    "category" TEXT,
    "ingredientsRaw" TEXT,
    "ingredients" JSONB,
    "expiryText" TEXT,
    "verdicts" JSONB,
    "rulesetVersion" TEXT,
    "source" TEXT NOT NULL DEFAULT 'ai',
    "adminNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "productId" TEXT,
    "photoIds" JSONB NOT NULL,
    "ocrText" TEXT,
    "ocrConfidence" INTEGER,
    "ocrReviewedAt" TIMESTAMP(3),
    "mediaConsentAt" TIMESTAMP(3),
    "extraction" JSONB,
    "forced" BOOLEAN NOT NULL DEFAULT false,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AllergenProfile" (
    "userId" TEXT NOT NULL,
    "allergens" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AllergenProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "PlantDiagnosis" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "candidates" JSONB NOT NULL,
    "diagnosis" JSONB,
    "needsBetterPhoto" BOOLEAN NOT NULL DEFAULT false,
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlantDiagnosis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareTask" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "diagnosisId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "dueAt" TIMESTAMP(3),
    "recurrence" TEXT,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "doneAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CareTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClearanceRequest" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "adminVerdict" JSONB,
    "adminNote" TEXT,
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "ClearanceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NafdacLookup" (
    "id" TEXT NOT NULL,
    "queryKey" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "found" BOOLEAN NOT NULL,
    "records" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NafdacLookup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_gtin_key" ON "Product"("gtin");

-- CreateIndex
CREATE INDEX "Product_nafdacNo_idx" ON "Product"("nafdacNo");

-- CreateIndex
CREATE INDEX "Product_nameKey_idx" ON "Product"("nameKey");

-- CreateIndex
CREATE INDEX "Product_ingredientHash_idx" ON "Product"("ingredientHash");

-- CreateIndex
CREATE UNIQUE INDEX "Scan_idempotencyKey_key" ON "Scan"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Scan_userId_createdAt_idx" ON "Scan"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlantDiagnosis_scanId_key" ON "PlantDiagnosis"("scanId");

-- CreateIndex
CREATE INDEX "CareTask_userId_done_idx" ON "CareTask"("userId", "done");

-- CreateIndex
CREATE UNIQUE INDEX "ClearanceRequest_scanId_key" ON "ClearanceRequest"("scanId");

-- CreateIndex
CREATE INDEX "ClearanceRequest_status_createdAt_idx" ON "ClearanceRequest"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NafdacLookup_queryKey_key" ON "NafdacLookup"("queryKey");

-- AddForeignKey
ALTER TABLE "Scan" ADD CONSTRAINT "Scan_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantDiagnosis" ADD CONSTRAINT "PlantDiagnosis_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareTask" ADD CONSTRAINT "CareTask_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "PlantDiagnosis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClearanceRequest" ADD CONSTRAINT "ClearanceRequest_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
