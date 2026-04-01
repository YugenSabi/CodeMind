-- CreateEnum
CREATE TYPE "RoomAiInteractionKind" AS ENUM ('CURSOR_COMPLETE', 'SELECTION_EXPLAIN', 'SELECTION_REVIEW', 'SELECTION_IMPROVE', 'GENERATE_FROM_INSTRUCTION', 'ALGORITHM_TASK_GENERATED', 'ALGORITHM_SOLUTION_REVIEWED');

-- CreateEnum
CREATE TYPE "AlgorithmDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateTable
CREATE TABLE "RoomAiInteraction" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "fileId" TEXT,
    "actorId" TEXT,
    "kind" "RoomAiInteractionKind" NOT NULL,
    "prompt" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomAiInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomAlgorithmTask" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "createdById" TEXT,
    "difficulty" "AlgorithmDifficulty" NOT NULL,
    "title" TEXT NOT NULL,
    "problemStatement" TEXT NOT NULL,
    "inputFormat" TEXT,
    "outputFormat" TEXT,
    "constraints" TEXT,
    "starterCode" TEXT,
    "examples" JSONB,
    "hints" JSONB,
    "evaluationCriteria" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomAlgorithmTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoomAiInteraction_roomId_createdAt_idx" ON "RoomAiInteraction"("roomId", "createdAt");

-- CreateIndex
CREATE INDEX "RoomAiInteraction_fileId_idx" ON "RoomAiInteraction"("fileId");

-- CreateIndex
CREATE INDEX "RoomAiInteraction_actorId_idx" ON "RoomAiInteraction"("actorId");

-- CreateIndex
CREATE INDEX "RoomAlgorithmTask_roomId_isActive_idx" ON "RoomAlgorithmTask"("roomId", "isActive");

-- CreateIndex
CREATE INDEX "RoomAlgorithmTask_createdById_idx" ON "RoomAlgorithmTask"("createdById");

-- AddForeignKey
ALTER TABLE "RoomAiInteraction" ADD CONSTRAINT "RoomAiInteraction_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomAiInteraction" ADD CONSTRAINT "RoomAiInteraction_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "ProjectFile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomAiInteraction" ADD CONSTRAINT "RoomAiInteraction_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomAlgorithmTask" ADD CONSTRAINT "RoomAlgorithmTask_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomAlgorithmTask" ADD CONSTRAINT "RoomAlgorithmTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
