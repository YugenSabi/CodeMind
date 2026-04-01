-- AlterTable
ALTER TABLE "ProjectFile" ADD COLUMN     "directoryId" TEXT;

-- CreateTable
CREATE TABLE "ProjectDirectory" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectDirectory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectDirectory_roomId_idx" ON "ProjectDirectory"("roomId");

-- CreateIndex
CREATE INDEX "ProjectDirectory_parentId_idx" ON "ProjectDirectory"("parentId");

-- CreateIndex
CREATE INDEX "ProjectFile_directoryId_idx" ON "ProjectFile"("directoryId");

-- AddForeignKey
ALTER TABLE "ProjectDirectory" ADD CONSTRAINT "ProjectDirectory_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectDirectory" ADD CONSTRAINT "ProjectDirectory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ProjectDirectory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectFile" ADD CONSTRAINT "ProjectFile_directoryId_fkey" FOREIGN KEY ("directoryId") REFERENCES "ProjectDirectory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
