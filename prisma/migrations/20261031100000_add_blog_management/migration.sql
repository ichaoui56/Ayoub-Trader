CREATE TABLE "BlogCatalogItem" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogCatalogItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BlogSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogSetting_pkey" PRIMARY KEY ("key")
);

CREATE UNIQUE INDEX "BlogCatalogItem_slug_key" ON "BlogCatalogItem"("slug");
CREATE INDEX "BlogCatalogItem_isPublished_publishedAt_sortOrder_idx" ON "BlogCatalogItem"("isPublished", "publishedAt", "sortOrder");