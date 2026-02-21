-- CreateEnum
CREATE TYPE "SourceRegion" AS ENUM ('KR', 'US');

-- CreateEnum
CREATE TYPE "BriefingSlot" AS ENUM ('MORNING', 'NIGHT');

-- CreateEnum
CREATE TYPE "BriefingTrend" AS ENUM ('ESCALATING', 'STABLE', 'COOLING');

-- CreateTable
CREATE TABLE "sectors" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "summary" TEXT,
    "since" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deptTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "searchQueriesKR" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "searchQueriesUS" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "classifyKeywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rss_url" TEXT,
    "api_type" TEXT,
    "region" "SourceRegion" NOT NULL DEFAULT 'KR',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sector_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "summary" TEXT,
    "region" "SourceRegion" NOT NULL DEFAULT 'KR',
    "confidence" DOUBLE PRECISION,
    "cluster_id" TEXT,
    "published_at" TIMESTAMP(3),
    "collected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sector_id" TEXT NOT NULL,
    "source_id" TEXT,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "briefings" (
    "id" TEXT NOT NULL,
    "time_slot" "BriefingSlot" NOT NULL,
    "headline" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "trend" "BriefingTrend" NOT NULL DEFAULT 'STABLE',
    "trend_note" TEXT,
    "market_impact" TEXT,
    "reporting_tip" TEXT,
    "key_figures" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sentiment" DOUBLE PRECISION,
    "article_count" INTEGER NOT NULL DEFAULT 0,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sector_id" TEXT NOT NULL,

    CONSTRAINT "briefings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "articles_url_key" ON "articles"("url");

-- CreateIndex
CREATE INDEX "articles_sector_id_collected_at_idx" ON "articles"("sector_id", "collected_at" DESC);

-- CreateIndex
CREATE INDEX "articles_cluster_id_idx" ON "articles"("cluster_id");

-- CreateIndex
CREATE INDEX "briefings_sector_id_generated_at_idx" ON "briefings"("sector_id", "generated_at" DESC);

-- AddForeignKey
ALTER TABLE "sources" ADD CONSTRAINT "sources_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "sectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "sectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "briefings" ADD CONSTRAINT "briefings_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "sectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
