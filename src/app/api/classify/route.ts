import { NextRequest, NextResponse } from "next/server";
import { classifyUnmatchedArticles } from "@/lib/ai/classifier";

// POST /api/classify — 수동 Claude 분류 트리거
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const batchSize = Math.min(body.batchSize || 20, 50);

  try {
    const result = await classifyUnmatchedArticles(batchSize);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
