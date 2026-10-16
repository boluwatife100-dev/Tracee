-- AlterTable
ALTER TABLE "User" ADD COLUMN "credits" INTEGER NOT NULL DEFAULT 10;

-- AlterTable
ALTER TABLE "Scan" ADD COLUMN "creditDeducted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "AuthenticityCheck" ADD COLUMN "creditDeducted" BOOLEAN NOT NULL DEFAULT false;
