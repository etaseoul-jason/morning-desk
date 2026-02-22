import { NextRequest, NextResponse } from "next/server";
import { clusterArticles } from "@/lib/clustering";

// POST /api/cluster — 수동 클러스터링 트리거
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  try {
    const result = await clusterArticles({
      sectorId: body.sectorId,
      hoursBack: body.hoursBack || 12,
      threshold: body.threshold || 0.4,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
