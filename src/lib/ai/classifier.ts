import { callClaude } from "./claude-client";
import prisma from "@/lib/prisma";

type ClassifyResult = {
  assignments: {
    articleId: string;
    sectorId: string | null;
    confidence: number;
  }[];
};

const SYSTEM_PROMPT = `당신은 경제 뉴스 분류 전문가입니다.
주어진 기사 목록을 섹터별로 분류하세요.

규칙:
- 각 기사를 가장 적합한 섹터 하나에 배정
- 어떤 섹터에도 해당하지 않으면 sectorId를 null로
- confidence는 0~1 (1이 가장 확신)
- 반드시 JSON만 출력`;

/**
 * 키워드 매칭 실패한 미분류 기사를 Claude로 분류 (2단계)
 * 배치 단위로 처리하여 API 호출 최소화
 */
export async function classifyUnmatchedArticles(
  batchSize: number = 20
): Promise<{ classified: number; skipped: number }> {
  // 미분류 기사 = sectorId가 있지만 confidence가 낮은 기사는 이미 1단계에서 처리됨
  // 여기서는 파이프라인에서 unclassified로 빠진 기사를 처리할 수 없으므로,
  // 대신 confidence가 매우 낮은 기사를 재분류
  const lowConfArticles = await prisma.article.findMany({
    where: {
      confidence: { lt: 0.3 },
    },
    orderBy: { collectedAt: "desc" },
    take: batchSize,
    select: { id: true, title: true, summary: true },
  });

  if (lowConfArticles.length === 0) {
    return { classified: 0, skipped: 0 };
  }

  const sectors = await prisma.sector.findMany({
    where: { active: true },
    select: { id: true, label: true, classifyKeywords: true },
  });

  const sectorList = sectors
    .map((s) => `- ID: "${s.id}" | 이름: "${s.label}" | 키워드: ${s.classifyKeywords.join(", ")}`)
    .join("\n");

  const articleList = lowConfArticles
    .map((a) => `- ID: "${a.id}" | 제목: "${a.title}" | 요약: "${(a.summary || "").slice(0, 100)}"`)
    .join("\n");

  const result = await callClaude<ClassifyResult>({
    system: SYSTEM_PROMPT,
    prompt: `## 섹터 목록
${sectorList}

## 분류할 기사 (${lowConfArticles.length}건)
${articleList}

JSON 형식으로 응답:
\`\`\`json
{
  "assignments": [
    { "articleId": "...", "sectorId": "..." or null, "confidence": 0.0~1.0 }
  ]
}
\`\`\``,
  });

  let classified = 0;
  let skipped = 0;

  for (const a of result.assignments) {
    if (a.sectorId && a.confidence > 0.5) {
      await prisma.article.update({
        where: { id: a.articleId },
        data: { sectorId: a.sectorId, confidence: a.confidence },
      });
      classified++;
    } else {
      skipped++;
    }
  }

  console.log(`[Classifier] ${classified}건 재분류, ${skipped}건 스킵`);
  return { classified, skipped };
}
