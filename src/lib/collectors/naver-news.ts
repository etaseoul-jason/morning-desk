import { SourceRegion } from "@prisma/client";
import { RawArticle } from "./rss-collector";

const NAVER_API_URL = "https://openapi.naver.com/v1/search/news.json";

type NaverNewsItem = {
  title: string;
  originallink: string;
  link: string;
  description: string;
  pubDate: string;
};

type NaverSearchResponse = {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: NaverNewsItem[];
};

export async function searchNaverNews(
  query: string,
  options: { display?: number; start?: number; sort?: "date" | "sim" } = {}
): Promise<NaverSearchResponse> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 환경변수 필요");
  }

  const params = new URLSearchParams({
    query,
    display: String(Math.min(options.display || 100, 100)),
    start: String(Math.min(options.start || 1, 1000)),
    sort: options.sort || "date",
  });

  const res = await fetch(`${NAVER_API_URL}?${params}`, {
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
    },
  });

  if (!res.ok) {
    throw new Error(`네이버 API 에러: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function collectNaverNews(
  queries: string[]
): Promise<RawArticle[]> {
  const articles: RawArticle[] = [];
  const seenUrls = new Set<string>();

  for (const query of queries) {
    try {
      const data = await searchNaverNews(query, { display: 100, sort: "date" });

      for (const item of data.items) {
        const url = item.originallink || item.link;
        if (seenUrls.has(url)) continue;
        seenUrls.add(url);

        articles.push({
          title: cleanNaverHtml(item.title),
          url,
          summary: cleanNaverHtml(item.description),
          publishedAt: item.pubDate ? new Date(item.pubDate) : null,
          sourceName: "네이버뉴스",
          region: SourceRegion.KR,
        });
      }

      // API 부하 방지
      await sleep(100);
    } catch (err) {
      console.error(`[Naver] "${query}" 검색 실패:`, (err as Error).message);
    }
  }

  return articles;
}

function cleanNaverHtml(text: string): string {
  return text
    .replace(/<\/?b>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&apos;/g, "'")
    .trim();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
