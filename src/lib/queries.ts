import prisma from "@/lib/prisma";
import { SourceRegion } from "@prisma/client";

export async function getActiveSectorsWithLatestBriefing() {
  const sectors = await prisma.sector.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { articles: true } },
      briefings: {
        orderBy: { generatedAt: "desc" },
        take: 1,
      },
    },
  });

  return sectors.map((s) => ({
    id: s.id,
    label: s.label,
    summary: s.summary,
    deptTags: s.deptTags,
    active: s.active,
    articleCount: s._count.articles,
    latestBriefing: s.briefings[0] || null,
  }));
}

export async function getSectorDetail(id: string) {
  return prisma.sector.findUnique({
    where: { id },
    include: {
      sources: { where: { active: true }, orderBy: { priority: "asc" } },
      briefings: { orderBy: { generatedAt: "desc" }, take: 5 },
      _count: { select: { articles: true } },
    },
  });
}

export async function getSectorArticles(
  sectorId: string,
  opts: {
    region?: SourceRegion;
    limit?: number;
    offset?: number;
  } = {}
) {
  const { region, limit = 30, offset = 0 } = opts;
  const where = {
    sectorId,
    ...(region && { region }),
  };

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { collectedAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        source: { select: { name: true } },
      },
    }),
    prisma.article.count({ where }),
  ]);

  return { articles, total };
}

export async function getAllSectors() {
  return prisma.sector.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { articles: true, briefings: true, sources: true } },
    },
  });
}
