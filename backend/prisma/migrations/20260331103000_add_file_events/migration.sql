-- CreateEnum
CREATE TYPE "app"."FileEventType" AS ENUM (
    'FILE_CREATED',
    'FILE_UPDATED',
    'FILE_DELETED',
    'FILE_OPENED',
    'FILE_COLLABORATION_JOINED',
    'FILE_COLLABORATION_LEFT',
    'FILE_SNAPSHOT_STORED'
);

-- AlterEnum
ALTER TYPE "app"."FileLanguage" ADD VALUE 'PYTHON';

-- CreateTable
CREATE TABLE "app"."FileEvent" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" "app"."FileEventType" NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FileEvent_fileId_createdAt_idx" ON "app"."FileEvent"("fileId", "createdAt");

-- CreateIndex
CREATE INDEX "FileEvent_actorId_idx" ON "app"."FileEvent"("actorId");

-- AddForeignKey
ALTER TABLE "app"."FileEvent"
ADD CONSTRAINT "FileEvent_fileId_fkey"
FOREIGN KEY ("fileId") REFERENCES "app"."ProjectFile"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."FileEvent"
ADD CONSTRAINT "FileEvent_actorId_fkey"
FOREIGN KEY ("actorId") REFERENCES "app"."User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
