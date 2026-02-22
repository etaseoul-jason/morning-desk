import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function jsonWithCache(data: unknown) {
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
  });
}

// GET /api/search?q=keyword&sectorId=xxx&from=2026-01-01&to=2026-02-22&limit=30
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim();
  const sectorId = sp.get("sectorId");
  const from = sp.get("from");
  const to = sp.get("to");
  const limit = Math.min(Number(sp.get("limit")) || 30, 100);

  if (!q && !sectorId && !from) {
    return NextResponse.json({ articles: [], total: 0 });
  }

  // tsvector 전문검색 (키워드 있을 때)
  if (q && q.length >= 2) {
    // 공백을 & 로 연결 (AND 검색)
    const tsQuery = q
      .split(/\s+/)
      .filter((w) => w.length >= 1)
      .join(" & ");

    const conditions: string[] = [
      `a.search_vec @@ TO_TSQUERY('simple', $1)`,
    ];
    const params: (string | number)[] = [tsQuery];
    let paramIdx = 2;

    if (sectorId) {
      conditions.push(`a.sector_id = $${paramIdx}`);
      params.push(sectorId);
      paramIdx++;
    }
    if (from) {
      conditions.push(`a.published_at >= $${paramIdx}::timestamptz`);
      params.push(from);
      paramIdx++;
    }
    if (to) {
      conditions.push(`a.published_at <= $${paramIdx}::timestamptz`);
      params.push(to + "T23:59:59Z");
      paramIdx++;
    }

    const whereClause = conditions.join(" AND ");

    const articles = await prisma.$queryRawUnsafe(
      `SELECT a.id, a.title, a.url, a.summary, a.thumbnail, a.region,
              a.confidence, a.published_at AS "publishedAt",
              a.collected_at AS "collectedAt",
              s.name AS "sourceName",
              sec.id AS "sectorId", sec.label AS "sectorLabel",
              TS_RANK(a.search_vec, TO_TSQUERY('simple', $1)) AS relevance
       FROM articles a
       LEFT JOIN sources s ON a.source_id = s.id
       LEFT JOIN sectors sec ON a.sector_id = sec.id
       WHERE ${whereClause}
       ORDER BY relevance DESC, a.collected_at DESC
       LIMIT $${paramIdx}`,
      ...params,
      limit
    );

    const countResult = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*) as count FROM articles a WHERE ${whereClause}`,
      ...params
    );
    const total = Number(countResult[0]?.count || 0);

    return jsonWithCache({ articles, total });
  }

  // 키워드 없이 필터만 (Prisma ORM 사용)
  const where: Record<string, unknown> = {};
  if (sectorId) where.sectorId = sectorId;
  if (from || to) {
    where.publishedAt = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to + "T23:59:59Z") }),
    };
  }

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { collectedAt: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        url: true,
        summary: true,
        thumbnail: true,
        region: true,
        confidence: true,
        publishedAt: true,
        collectedAt: true,
        source: { select: { name: true } },
        sector: { select: { id: true, label: true } },
      },
    }),
    prisma.article.count({ where }),
  ]);

  return jsonWithCache({ articles, total });
}
