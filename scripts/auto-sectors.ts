/**
 * 미분류 기사를 분석해 자동으로 섹터를 생성하고 분류
 * 사용: DATABASE_URL=... ANTHROPIC_API_KEY=... npx tsx scripts/auto-sectors.ts
 */
import prisma from "../src/lib/prisma";
import { callClaude } from "../src/lib/ai/claude-client";

type AutoSectorResult = {
  sectors: {
    label: string;
    summary: string;
    classifyKeywords: string[];
    deptTags: string[];
  }[];
  assignments: {
    articleTitle: string;
    sectorLabel: string;
  }[];
};

async function main() {
  // 1. 기존 섹터 확인
  const existingSectors = await prisma.sector.findMany({
    select: { id: true, label: true, classifyKeywords: true },
  });
  console.log(`[AutoSector] 기존 섹터 ${existingSectors.length}개`);

  // 2. 최근 수집된 전체 기사 제목 수집 (분류 여부 무관)
  const recentArticles = await prisma.article.findMany({
    orderBy: { collectedAt: "desc" },
    take: 200,
    select: { id: true, title: true, summary: true, sectorId: true },
  });

  console.log(`[AutoSector] 최근 기사 ${recentArticles.length}건 분석 중...`);

  const titleList = recentArticles
    .map((a, i) => `${i + 1}. ${a.title}`)
    .join("\n");

  const existingList = existingSectors.length > 0
    ? existingSectors.map((s) => `- "${s.label}" (키워드: ${s.classifyKeywords.join(", ")})`).join("\n")
    : "없음";

  // 3. Claude에게 섹터 자동 생성 요청
  const result = await callClaude<AutoSectorResult>({
    system: `당신은 경제 뉴스 에디터입니다.
기사 제목 목록을 분석하여 자연스러운 뉴스 섹터(카테고리)를 도출하세요.

규칙:
- 실제 뉴스 흐름에 맞는 5~8개 섹터 생성
- 경제부 기자가 사용할 섹터명 (예: 국내증시, 거시경제, 산업·기업, 부동산, 가상자산 등)
- 각 섹터에 매칭 키워드 5~15개 부여
- deptTags는 해당 섹터 담당 부서/분야 (예: ["증권부", "산업1팀"])
- 모든 기사를 가장 적합한 섹터에 배정
- 반드시 JSON만 출력`,
    prompt: `## 기존 섹터 (참고만, 새로 만들어도 됨)
${existingList}

## 최근 수집 기사 제목 (${recentArticles.length}건)
${titleList}

위 기사들을 분석하여:
1. 적절한 섹터 5~8개를 생성하고
2. 모든 기사를 섹터에 배정하세요

JSON 형식:
\`\`\`json
{
  "sectors": [
    {
      "label": "섹터명",
      "summary": "이 섹터의 설명 (1줄)",
      "classifyKeywords": ["키워드1", "키워드2", ...],
      "deptTags": ["담당부서1"]
    }
  ],
  "assignments": [
    { "articleTitle": "기사 제목 (정확히)", "sectorLabel": "배정할 섹터명" }
  ]
}
\`\`\``,
    maxTokens: 8000,
  });

  console.log(`[AutoSector] Claude 분석 완료: ${result.sectors.length}개 섹터 제안`);

  // 4. 기존 섹터 비활성화
  await prisma.sector.updateMany({
    data: { active: false },
  });

  // 5. 새 섹터 생성
  const sectorMap = new Map<string, string>(); // label -> id

  for (let i = 0; i < result.sectors.length; i++) {
    const s = result.sectors[i];
    const sector = await prisma.sector.create({
      data: {
        label: s.label,
        summary: s.summary,
        classifyKeywords: s.classifyKeywords,
        deptTags: s.deptTags,
        sortOrder: i,
        active: true,
      },
    });
    sectorMap.set(s.label, sector.id);
    console.log(`  + "${s.label}" (키워드 ${s.classifyKeywords.length}개)`);
  }

  // 6. 기사 분류
  let assigned = 0;
  let missed = 0;

  for (const assignment of result.assignments) {
    const sectorId = sectorMap.get(assignment.sectorLabel);
    if (!sectorId) {
      missed++;
      continue;
    }

    // 제목으로 기사 찾기
    const article = recentArticles.find((a) => a.title === assignment.articleTitle);
    if (!article) {
      missed++;
      continue;
    }

    await prisma.article.update({
      where: { id: article.id },
      data: { sectorId, confidence: 0.8 },
    });
    assigned++;
  }

  console.log(`[AutoSector] 완료: ${result.sectors.length}개 섹터 생성, ${assigned}건 분류, ${missed}건 미매칭`);

  // 7. 남은 미분류 기사를 키워드 매칭으로 추가 분류
  const newSectors = await prisma.sector.findMany({
    where: { active: true },
    select: { id: true, classifyKeywords: true },
  });

  const unassigned = await prisma.article.findMany({
    where: {
      sectorId: { in: existingSectors.map((s) => s.id) },
    },
    select: { id: true, title: true, summary: true },
  });

  let keywordMatched = 0;
  for (const article of unassigned) {
    const text = `${article.title} ${article.summary || ""}`.toLowerCase();
    let bestSector: { id: string; score: number } | null = null;

    for (const sector of newSectors) {
      let score = 0;
      for (const kw of sector.classifyKeywords) {
        if (text.includes(kw.toLowerCase())) score++;
      }
      if (score > 0 && (!bestSector || score > bestSector.score)) {
        bestSector = { id: sector.id, score };
      }
    }

    if (bestSector) {
      await prisma.article.update({
        where: { id: article.id },
        data: { sectorId: bestSector.id, confidence: 0.6 },
      });
      keywordMatched++;
    }
  }

  console.log(`[AutoSector] 키워드 추가 매칭: ${keywordMatched}건`);
  process.exit(0);
}

main().catch((err) => {
  console.error("[AutoSector] 에러:", err);
  process.exit(1);
});
