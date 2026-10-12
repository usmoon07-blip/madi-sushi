-- Til, kategoriyalar (rasm bilan), xit, yoqtirilganlar, otzivlar

-- User: til
ALTER TABLE "User" ADD COLUMN "lang" TEXT;

-- Category jadvali
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "nameUz" TEXT NOT NULL,
    "nameRu" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- Mavjud mahsulotlardagi kategoriyalarni ko'chirish (ma'lumot yo'qolmaydi)
INSERT INTO "Category" ("nameUz", "sortOrder")
SELECT "category", MIN("sortOrder") FROM "Product" GROUP BY "category" ORDER BY MIN("sortOrder");

-- Product: yangi ustunlar
ALTER TABLE "Product"
ADD COLUMN "categoryId" INTEGER,
ADD COLUMN "nameRu" TEXT NOT NULL DEFAULT '',
ADD COLUMN "descriptionRu" TEXT NOT NULL DEFAULT '',
ADD COLUMN "ingredientsRu" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "isHit" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Product" p SET "categoryId" = c."id" FROM "Category" c WHERE c."nameUz" = p."category";

DROP INDEX "Product_isActive_category_idx";
ALTER TABLE "Product" DROP COLUMN "category";
CREATE INDEX "Product_isActive_categoryId_idx" ON "Product"("isActive", "categoryId");
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Settings: filial ma'lumotlari va seed versiyasi
ALTER TABLE "Settings"
ADD COLUMN "workHours" TEXT NOT NULL DEFAULT '10:00 – 02:00',
ADD COLUMN "instagram" TEXT NOT NULL DEFAULT '',
ADD COLUMN "aboutUz" TEXT NOT NULL DEFAULT '',
ADD COLUMN "aboutRu" TEXT NOT NULL DEFAULT '',
ADD COLUMN "seedVersion" INTEGER NOT NULL DEFAULT 0;

-- Yoqtirilganlar
CREATE TABLE "Favorite" (
    "userId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("userId","productId")
);
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Otzivlar
CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "text" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Review_createdAt_idx" ON "Review"("createdAt");
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
