import { NextRequest, NextResponse } from "next/server";
import { runCollectPipeline } from "@/lib/collectors/pipeline";

// POST /api/collect — 수동 수집 트리거
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const region = body.region || "ALL";
  const includeNaver = body.includeNaver !== false;

  try {
    const result = await runCollectPipeline({ region, includeNaver });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
