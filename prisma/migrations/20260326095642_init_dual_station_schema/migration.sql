-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'OPERATOR', 'VIEWER');

-- CreateTable
CREATE TABLE "Substation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "voltageKV" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Transmission',

    CONSTRAINT "Substation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'OPERATOR',
    "substationId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "elementName" TEXT NOT NULL,
    "elementType" TEXT NOT NULL DEFAULT 'Transmission Line',
    "trippingDateTime" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPENED',
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "fromSubstationId" TEXT NOT NULL,
    "fromFIR" TEXT,
    "fromDR" TEXT,
    "fromEL" TEXT,
    "toSubstationId" TEXT NOT NULL,
    "toFIR" TEXT,
    "toDR" TEXT,
    "toEL" TEXT,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Substation_name_key" ON "Substation"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_substationId_fkey" FOREIGN KEY ("substationId") REFERENCES "Substation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_fromSubstationId_fkey" FOREIGN KEY ("fromSubstationId") REFERENCES "Substation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_toSubstationId_fkey" FOREIGN KEY ("toSubstationId") REFERENCES "Substation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
