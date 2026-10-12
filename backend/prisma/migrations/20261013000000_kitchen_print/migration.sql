-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "printedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "paperWidth" INTEGER NOT NULL DEFAULT 80,
ADD COLUMN     "printCopies" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "printMode" TEXT NOT NULL DEFAULT 'NEW',
ADD COLUMN     "printerIp" TEXT NOT NULL DEFAULT '';


-- Eski buyurtmalar uchun chek qayta chiqmasin
UPDATE "Order" SET "printedAt" = CURRENT_TIMESTAMP WHERE "printedAt" IS NULL;
