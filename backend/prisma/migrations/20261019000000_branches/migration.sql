-- Filiallar
CREATE TABLE "Branch" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "nameRu" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lon" DOUBLE PRECISION,
    "phone" TEXT NOT NULL DEFAULT '',
    "workHours" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Order" ADD COLUMN "branchId" INTEGER;
ALTER TABLE "Order" ADD CONSTRAINT "Order_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Mavjud olib ketish manzili birinchi filial bo'ladi
INSERT INTO "Branch" ("name", "nameRu", "address", "phone", "workHours", "updatedAt")
SELECT 'Foziltepa', 'Фозилтепа', "pickupAddress", COALESCE("contactPhone", ''), COALESCE("workHours", ''), CURRENT_TIMESTAMP
FROM "Settings" WHERE "id" = 1 AND COALESCE("pickupAddress", '') <> '';
