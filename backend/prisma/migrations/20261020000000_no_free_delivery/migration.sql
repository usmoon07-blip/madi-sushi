-- Bepul yetkazib berish yo'q
ALTER TABLE "Settings" ALTER COLUMN "freeDeliveryFrom" SET DEFAULT 0;
UPDATE "Settings" SET "freeDeliveryFrom" = 0;
