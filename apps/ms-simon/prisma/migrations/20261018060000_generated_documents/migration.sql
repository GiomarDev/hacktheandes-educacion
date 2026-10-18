-- CreateEnum
CREATE TYPE "DocumentFormat" AS ENUM ('WORD', 'EXCEL');

-- CreateEnum
CREATE TYPE "DocumentSource" AS ENUM ('WHATSAPP');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "generated_documents" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "category" VARCHAR(80),
    "format" "DocumentFormat" NOT NULL,
    "source" "DocumentSource" NOT NULL DEFAULT 'WHATSAPP',
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_at" TIMESTAMPTZ(6),
    "correction_file_name" VARCHAR(200),
    "correction_mime_type" VARCHAR(120),
    "correction_size_bytes" INTEGER,
    "correction_uploaded_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "generated_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "generated_documents_owner_user_id_status_idx" ON "generated_documents"("owner_user_id", "status");

-- CreateIndex
CREATE INDEX "generated_documents_school_id_status_idx" ON "generated_documents"("school_id", "status");

