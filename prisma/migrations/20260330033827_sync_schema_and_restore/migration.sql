-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "restorationDateTime" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Creator" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Creator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Element" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Element_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Creator_name_key" ON "Creator"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Element_name_key" ON "Element"("name");
