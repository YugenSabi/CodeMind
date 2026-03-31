-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "app";

-- CreateEnum
CREATE TYPE "app"."UserRole" AS ENUM ('ADMIN', 'USER');

-- CreateTable
CREATE TABLE "app"."User" (
    "id" TEXT NOT NULL,
    "kratosIdentityId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" "app"."UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_kratosIdentityId_key" ON "app"."User"("kratosIdentityId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "app"."User"("email");
