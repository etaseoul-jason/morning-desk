import { BriefingSlot, BriefingTrend } from "@prisma/client";
import { callClaude } from "./claude-client";
import prisma from "@/lib/prisma";
import { eventBus } from "@/lib/sse/event-bus";

type BriefingOutput = {
  headline: string;
  summary: string;
  trend: "escalating" | "stable" | "cooling";
  trendNote: string;
  marketImpact: string;
  reportingTip: string;
  keyFigures: string[];
  sentiment: number;
};

const SYSTEM_PROMPT = `당신은 경제지 데스크 에디터 "모닝데스크"입니다.

역할: 경제부 기자를 위한 섹터별 뉴스 브리핑 생성
원칙:
- 팩트 기반 분석
- What → Why → So what 구조
- 시장 연결성 강조
- 한국 경제에 미치는 영향 포함

금지:
- 투자 권유나 매매 추천
- 미확인 루머 포함
- 정치적 입장 표명

반드시 아래 JSON 형식으로만 응답:
{
  "headline": "15자 이내 핵심 헤드라인",
  "summary": "3~5문장 핵심 요약. What→Why→So what 구조",
  "trend": "escalating | stable | cooling",
  "trendNote": "추세 변화 근거 1문장",
  "marketImpact": "시장 영향 분석 1~2문장",
  "reportingTip": "기자를 위한 취재 포인트 1~2문장",
  "keyFigures": ["핵심 인물/기관 최대 5개"],
  "sentiment": -1.0~1.0 (부정~긍정)
}`;

const TREND_MAP: Record<string, BriefingTrend> = {
  escalating: BriefingTrend.ESCALATING,
  stable: BriefingTrend.STABLE,
  cooling: BriefingTrend.COOLING,
};

/**
 * 특정 섹터의 브리핑 생성
 */
export async function generateSectorBriefing(
  sectorId: string,
  timeSlot: BriefingSlot
): Promise<string | null> {
  const sector = await prisma.sector.findUnique({
    where: { id: sectorId },
  });
  if (!sector) return null;

  // 최근 기사 가져오기 (마지막 브리핑 이후 또는 최근 12시간)
  const lastBriefing = await prisma.briefing.findFirst({
    where: { sectorId },
    orderBy: { generatedAt: "desc" },
  });

  const since = lastBriefing
    ? lastBriefing.generatedAt
    : new Date(Date.now() - 12 * 60 * 60 * 1000);

  const articles = await prisma.article.findMany({
    where: {
      sectorId,
      collectedAt: { gt: since },
    },
    orderBy: { collectedAt: "desc" },
    take: 30,
    select: { title: true, summary: true, region: true, publishedAt: true },
  });

  if (articles.length === 0) {
    console.log(`[Briefing] ${sector.label}: 새 기사 없음, 스킵`);
    return null;
  }

  const articleList = articles
    .map(
      (a, i) =>
        `${i + 1}. [${a.region}] ${a.title}\n   ${(a.summary || "").slice(0, 150)}`
    )
    .join("\n\n");

  const result = await callClaude<BriefingOutput>({
    system: SYSTEM_PROMPT,
    prompt: `## 섹터: ${sector.label}
## 설명: ${sector.summary || ""}
## 시간대: ${timeSlot === "MORNING" ? "조간 (04:30)" : "야간 (02:30)"}
## 기사 ${articles.length}건

${articleList}

위 기사들을 바탕으로 브리핑을 생성하세요.`,
    maxTokens: 1024,
  });

  const briefing = await prisma.briefing.create({
    data: {
      sectorId,
      timeSlot,
      headline: result.headline.slice(0, 50),
      summary: result.summary,
      trend: TREND_MAP[result.trend] || BriefingTrend.STABLE,
      trendNote: result.trendNote,
      marketImpact: result.marketImpact,
      reportingTip: result.reportingTip,
      keyFigures: result.keyFigures || [],
      sentiment: result.sentiment,
      articleCount: articles.length,
    },
  });

  console.log(
    `[Briefing] ${sector.label}: "${result.headline}" (기사 ${articles.length}건)`
  );

  // SSE: 새 브리핑 이벤트
  eventBus.emit({
    type: "new_briefing",
    data: {
      id: briefing.id,
      sectorId,
      sectorLabel: sector.label,
      headline: result.headline,
      trend: result.trend,
    },
  });

  return briefing.id;
}

/**
 * 전체 활성 섹터 브리핑 일괄 생성
 */
export async function generateAllBriefings(
  timeSlot: BriefingSlot
): Promise<{ generated: number; skipped: number }> {
  const sectors = await prisma.sector.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  let generated = 0;
  let skipped = 0;

  for (const sector of sectors) {
    const id = await generateSectorBriefing(sector.id, timeSlot);
    if (id) {
      generated++;
    } else {
      skipped++;
    }
  }

  console.log(
    `[Briefing] 전체 결과: ${generated}건 생성, ${skipped}건 스킵`
  );
  return { generated, skipped };
}
