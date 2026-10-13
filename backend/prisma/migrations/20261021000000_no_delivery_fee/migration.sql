-- Yetkazib berish narxi buyurtmaga qo'shilmaydi
ALTER TABLE "Settings" ALTER COLUMN "deliveryFee" SET DEFAULT 0;
UPDATE "Settings" SET "deliveryFee" = 0;
