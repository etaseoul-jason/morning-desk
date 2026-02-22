import { NextRequest, NextResponse } from "next/server";
import { BriefingSlot } from "@prisma/client";
import { generateAllBriefings, generateSectorBriefing } from "@/lib/ai/briefing-generator";

// POST /api/briefings/generate — 수동 브리핑 생성
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const timeSlot: BriefingSlot = body.timeSlot === "NIGHT"
    ? BriefingSlot.NIGHT
    : BriefingSlot.MORNING;

  try {
    if (body.sectorId) {
      // 특정 섹터만
      const id = await generateSectorBriefing(body.sectorId, timeSlot);
      if (!id) {
        return NextResponse.json(
          { error: "새 기사가 없거나 섹터를 찾을 수 없습니다" },
          { status: 404 }
        );
      }
      return NextResponse.json({ briefingId: id });
    }

    // 전체 섹터
    const result = await generateAllBriefings(timeSlot);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
