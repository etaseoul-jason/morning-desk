import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { SourceRegion } from "@prisma/client";

// GET /api/articles — 기사 목록 (필터 지원)
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const sectorId = searchParams.get("sectorId");
  const region = searchParams.get("region") as SourceRegion | null;
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);
  const offset = Number(searchParams.get("offset")) || 0;

  const where = {
    ...(sectorId && { sectorId }),
    ...(region && { region }),
  };

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { collectedAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        sector: { select: { id: true, label: true } },
        source: { select: { id: true, name: true } },
      },
    }),
    prisma.article.count({ where }),
  ]);

  return NextResponse.json({ articles, total, limit, offset }, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
  });
}
