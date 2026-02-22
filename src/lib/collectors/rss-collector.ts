import RSSParser from "rss-parser";
import { SourceRegion } from "@prisma/client";

const parser = new RSSParser({
  timeout: 10_000,
  headers: {
    "User-Agent": "MorningDesk/1.0 (news-aggregator)",
  },
});

export type RawArticle = {
  title: string;
  url: string;
  summary: string | null;
  thumbnail: string | null;
  publishedAt: Date | null;
  sourceName: string;
  region: SourceRegion;
};

type FeedConfig = {
  name: string;
  rssUrl: string;
  region: SourceRegion;
};

export async function fetchFeed(feed: FeedConfig): Promise<RawArticle[]> {
  try {
    const parsed = await parser.parseURL(feed.rssUrl);
    return (parsed.items || []).map((item) => {
      // RSS 피드에서 썸네일 추출 (media:content, enclosure, content 내 img)
      const thumbnail = extractThumbnail(item);
      return {
        title: cleanHtml(item.title || ""),
        url: item.link || "",
        summary: cleanHtml(item.contentSnippet || item.content || ""),
        thumbnail,
        publishedAt: item.pubDate ? new Date(item.pubDate) : null,
        sourceName: feed.name,
        region: feed.region,
      };
    });
  } catch (err) {
    console.error(`[RSS] ${feed.name} 실패:`, (err as Error).message);
    return [];
  }
}

export async function fetchAllFeeds(
  feeds: FeedConfig[]
): Promise<RawArticle[]> {
  const results = await Promise.allSettled(feeds.map((f) => fetchFeed(f)));
  const articles: RawArticle[] = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      articles.push(...result.value);
    }
  }

  return articles;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractThumbnail(item: any): string | null {
  // media:content or media:thumbnail
  if (item["media:content"]?.$.url) return item["media:content"].$.url;
  if (item["media:thumbnail"]?.$.url) return item["media:thumbnail"].$.url;
  // enclosure (image type)
  if (item.enclosure?.url && item.enclosure.type?.startsWith("image/")) {
    return item.enclosure.url;
  }
  // img tag in content
  const content = item.content || item["content:encoded"] || "";
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/);
  if (imgMatch) return imgMatch[1];
  return null;
}

function cleanHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .trim();
}
