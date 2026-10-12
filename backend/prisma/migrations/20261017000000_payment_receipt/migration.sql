-- Karta to'lovi cheki (Telegram file_id)
ALTER TABLE "Order" ADD COLUMN "receiptFileId" TEXT,
ADD COLUMN "receiptType" TEXT,
ADD COLUMN "receiptAt" TIMESTAMP(3);
