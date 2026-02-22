import prisma from "@/lib/prisma";
import { SourceRegion } from "@prisma/client";
import { RawArticle, fetchAllFeeds } from "./rss-collector";
import { collectNaverNews } from "./naver-news";
import { eventBus } from "@/lib/sse/event-bus";

const BREAKING_KEYWORDS = ["속보", "긴급", "단독", "breaking", "flash"];

type SectorWithConfig = {
  id: string;
  label: string;
  classifyKeywords: string[];
  searchQueriesKR: string[];
  searchQueriesUS: string[];
  sources: {
    id: string;
    name: string;
    rssUrl: string | null;
    apiType: string | null;
    region: SourceRegion;
  }[];
};

// ── 키워드 매칭 (1단계 분류, 무료) ───────────────────
function matchSector(
  article: RawArticle,
  sectors: SectorWithConfig[]
): { sectorId: string; confidence: number } | null {
  const text = `${article.title} ${article.summary || ""}`.toLowerCase();

  let bestMatch: { sectorId: string; score: number } | null = null;

  for (const sector of sectors) {
    let score = 0;
    for (const kw of sector.classifyKeywords) {
      if (text.includes(kw.toLowerCase())) {
        score += 1;
      }
    }
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { sectorId: sector.id, score };
    }
  }

  if (!bestMatch) return null;

  const maxKeywords = Math.max(
    ...sectors.map((s) => s.classifyKeywords.length)
  );
  const confidence = Math.min(bestMatch.score / Math.max(maxKeywords / 2, 1), 1);

  return { sectorId: bestMatch.sectorId, confidence };
}

// ── 소스 ID 찾기 ────────────────────────────────────
function findSourceId(
  sourceName: string,
  sectors: SectorWithConfig[]
): string | null {
  for (const sector of sectors) {
    const source = sector.sources.find((s) => s.name === sourceName);
    if (source) return source.id;
  }
  return null;
}

// ── 메인 수집 파이프라인 ────────────────────────────
export type CollectResult = {
  total: number;
  saved: number;
  duplicates: number;
  unclassified: number;
};

export async function runCollectPipeline(
  options: {
    region?: "KR" | "US" | "ALL";
    includeNaver?: boolean;
  } = {}
): Promise<CollectResult> {
  const { region = "ALL", includeNaver = true } = options;

  // 1. 활성 섹터 + 소스 로드
  const sectors = (await prisma.sector.findMany({
    where: { active: true },
    include: { sources: { where: { active: true } } },
  })) as SectorWithConfig[];

  // 2. RSS 피드 수집
  const rssFeeds = sectors.flatMap((s) =>
    s.sources
      .filter((src) => src.apiType === "rss" && src.rssUrl)
      .filter(
        (src) =>
          region === "ALL" ||
          (region === "KR" && src.region === SourceRegion.KR) ||
          (region === "US" && src.region === SourceRegion.US)
      )
      .map((src) => ({
        name: src.name,
        rssUrl: src.rssUrl!,
        region: src.region,
      }))
  );

  // 소스 이름 중복 제거 (여러 섹터에 같은 소스가 있을 수 있음)
  const uniqueFeeds = Array.from(
    new Map(rssFeeds.map((f) => [f.rssUrl, f])).values()
  );

  console.log(`[Pipeline] RSS ${uniqueFeeds.length}개 피드 수집 시작`);
  const allArticles: RawArticle[] = await fetchAllFeeds(uniqueFeeds);

  // 3. 네이버 API 수집 (KR)
  if (includeNaver && (region === "ALL" || region === "KR")) {
    const naverQueries = sectors.flatMap((s) => s.searchQueriesKR);
    const uniqueQueries = Array.from(new Set(naverQueries));

    if (uniqueQueries.length > 0 && process.env.NAVER_CLIENT_ID) {
      console.log(
        `[Pipeline] 네이버 API ${uniqueQueries.length}개 키워드 검색`
      );
      const naverArticles = await collectNaverNews(uniqueQueries);
      allArticles.push(...naverArticles);
    }
  }

  console.log(`[Pipeline] 총 ${allArticles.length}건 수집 완료`);

  // 4. URL 기반 중복 제거 + 섹터 분류 + DB 저장
  let saved = 0;
  let duplicates = 0;
  let unclassified = 0;

  for (const article of allArticles) {
    if (!article.url) continue;

    // 키워드 매칭 분류
    const match = matchSector(article, sectors);
    if (!match) {
      unclassified++;
      continue;
    }

    const sourceId = findSourceId(article.sourceName, sectors);

    try {
      const result = await prisma.article.upsert({
        where: { url: article.url },
        update: {},
        create: {
          title: article.title,
          url: article.url,
          summary: article.summary || null,
          thumbnail: article.thumbnail || null,
          region: article.region,
          sectorId: match.sectorId,
          sourceId: sourceId,
          confidence: match.confidence,
          publishedAt: article.publishedAt,
          collectedAt: new Date(),
        },
      });
      saved++;

      // SSE: 새 기사 이벤트
      const isBreaking = BREAKING_KEYWORDS.some((kw) =>
        article.title.toLowerCase().includes(kw)
      );
      eventBus.emit({
        type: isBreaking ? "breaking" : "new_article",
        data: {
          id: result.id,
          title: article.title,
          url: article.url,
          region: article.region,
          sectorId: match.sectorId,
          sourceName: article.sourceName,
        },
      });
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes("Unique constraint")) {
        duplicates++;
      } else {
        console.error(`[Pipeline] 저장 실패 (${article.url}):`, msg);
      }
    }
  }

  const result: CollectResult = {
    total: allArticles.length,
    saved,
    duplicates,
    unclassified,
  };
  console.log(`[Pipeline] 결과:`, result);
  return result;
}
