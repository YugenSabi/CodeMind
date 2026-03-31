-- CreateTable
CREATE TABLE "app"."Room" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "joinCode" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app"."_RoomMembers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RoomMembers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Room_joinCode_key" ON "app"."Room"("joinCode");

-- CreateIndex
CREATE INDEX "Room_ownerId_idx" ON "app"."Room"("ownerId");

-- CreateIndex
CREATE INDEX "_RoomMembers_B_index" ON "app"."_RoomMembers"("B");

-- AddForeignKey
ALTER TABLE "app"."Room"
ADD CONSTRAINT "Room_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "app"."User"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."_RoomMembers"
ADD CONSTRAINT "_RoomMembers_A_fkey"
FOREIGN KEY ("A") REFERENCES "app"."Room"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."_RoomMembers"
ADD CONSTRAINT "_RoomMembers_B_fkey"
FOREIGN KEY ("B") REFERENCES "app"."User"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app"."ProjectFile"
ADD CONSTRAINT "ProjectFile_roomId_fkey"
FOREIGN KEY ("roomId") REFERENCES "app"."Room"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
