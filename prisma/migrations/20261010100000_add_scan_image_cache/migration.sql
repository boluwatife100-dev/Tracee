CREATE TABLE "ScanImage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanImage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ScanImage_userId_contentHash_key"
ON "ScanImage"("userId", "contentHash");
