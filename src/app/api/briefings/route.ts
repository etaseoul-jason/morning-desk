import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/briefings — 브리핑 목록
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const sectorId = searchParams.get("sectorId");
  const limit = Math.min(Number(searchParams.get("limit")) || 10, 50);

  const where = {
    ...(sectorId && { sectorId }),
  };

  const briefings = await prisma.briefing.findMany({
    where,
    orderBy: { generatedAt: "desc" },
    take: limit,
    include: {
      sector: { select: { id: true, label: true } },
    },
  });

  return NextResponse.json(briefings);
}
