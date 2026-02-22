import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/search/briefings?q=keyword&from=2026-01-01&to=2026-02-22
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim();
  const from = sp.get("from");
  const to = sp.get("to");

  if (q && q.length >= 2) {
    const tsQuery = q
      .split(/\s+/)
      .filter((w) => w.length >= 1)
      .join(" & ");

    const conditions: string[] = [
      `b.search_vec @@ TO_TSQUERY('simple', $1)`,
    ];
    const params: (string | number)[] = [tsQuery];
    let paramIdx = 2;

    if (from) {
      conditions.push(`b.generated_at >= $${paramIdx}::timestamptz`);
      params.push(from);
      paramIdx++;
    }
    if (to) {
      conditions.push(`b.generated_at <= $${paramIdx}::timestamptz`);
      params.push(to + "T23:59:59Z");
      paramIdx++;
    }

    const whereClause = conditions.join(" AND ");

    const briefings = await prisma.$queryRawUnsafe(
      `SELECT b.id, b.headline, b.summary, b.trend, b.trend_note AS "trendNote",
              b.market_impact AS "marketImpact", b.reporting_tip AS "reportingTip",
              b.key_figures AS "keyFigures", b.sentiment, b.article_count AS "articleCount",
              b.time_slot AS "timeSlot", b.generated_at AS "generatedAt",
              s.id AS "sectorId", s.label AS "sectorLabel",
              TS_RANK(b.search_vec, TO_TSQUERY('simple', $1)) AS relevance
       FROM briefings b
       LEFT JOIN sectors s ON b.sector_id = s.id
       WHERE ${whereClause}
       ORDER BY relevance DESC, b.generated_at DESC
       LIMIT 30`,
      ...params
    );

    return NextResponse.json({ briefings });
  }

  // 키워드 없이 날짜 필터만
  const where: Record<string, unknown> = {};
  if (from || to) {
    where.generatedAt = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to + "T23:59:59Z") }),
    };
  }

  const briefings = await prisma.briefing.findMany({
    where,
    orderBy: { generatedAt: "desc" },
    take: 30,
    include: { sector: { select: { id: true, label: true } } },
  });

  return NextResponse.json({ briefings });
}
