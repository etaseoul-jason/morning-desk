import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/sectors — 전체 섹터 목록
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const activeOnly = searchParams.get("active") === "true";

  const sectors = await prisma.sector.findMany({
    where: activeOnly ? { active: true } : undefined,
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { articles: true, briefings: true } },
    },
  });

  return NextResponse.json(sectors);
}

// POST /api/sectors — 섹터 생성
export async function POST(req: NextRequest) {
  const body = await req.json();

  const sector = await prisma.sector.create({
    data: {
      label: body.label,
      summary: body.summary ?? null,
      since: body.since ? new Date(body.since) : new Date(),
      deptTags: body.deptTags ?? [],
      searchQueriesKR: body.searchQueriesKR ?? [],
      searchQueriesUS: body.searchQueriesUS ?? [],
      classifyKeywords: body.classifyKeywords ?? [],
      active: body.active ?? true,
      sortOrder: body.sortOrder ?? 0,
    },
  });

  return NextResponse.json(sector, { status: 201 });
}
