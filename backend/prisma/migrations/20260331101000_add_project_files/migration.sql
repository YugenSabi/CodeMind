-- CreateEnum
CREATE TYPE "app"."FileLanguage" AS ENUM ('PLAINTEXT', 'JAVASCRIPT', 'TYPESCRIPT', 'JSON', 'HTML', 'CSS', 'MARKDOWN');

-- CreateTable
CREATE TABLE "app"."ProjectFile" (
    "id" TEXT NOT NULL,
    "roomId" TEXT,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT,
    "language" "app"."FileLanguage" NOT NULL DEFAULT 'PLAINTEXT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."FileSnapshot" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "state" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FileSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectFile_roomId_idx" ON "app"."ProjectFile"("roomId");

-- CreateIndex
CREATE INDEX "ProjectFile_ownerId_idx" ON "app"."ProjectFile"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "FileSnapshot_fileId_key" ON "app"."FileSnapshot"("fileId");

-- AddForeignKey
ALTER TABLE "app"."ProjectFile" ADD CONSTRAINT "ProjectFile_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "app"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."FileSnapshot" ADD CONSTRAINT "FileSnapshot_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "app"."ProjectFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
