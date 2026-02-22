/**
 * 기존 소스를 새 섹터에 공유 연결
 * 모든 KR 소스는 모든 활성 섹터에 연결
 */
import prisma from "../src/lib/prisma";

const COMMON_FEEDS_KR = [
  { name: "한국경제", rssUrl: "https://www.hankyung.com/feed/all-news", region: "KR" as const },
  { name: "매일경제", rssUrl: "https://www.mk.co.kr/rss/30000001/", region: "KR" as const },
  { name: "연합뉴스", rssUrl: "https://www.yna.co.kr/rss/economy.xml", region: "KR" as const },
  { name: "머니투데이", rssUrl: "https://rss.mt.co.kr/mt/economy.xml", region: "KR" as const },
];

const COMMON_FEEDS_US = [
  { name: "CNBC", rssUrl: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114", region: "US" as const },
  { name: "CoinDesk", rssUrl: "https://www.coindesk.com/arc/outboundfeeds/rss/", region: "US" as const },
  { name: "TechCrunch", rssUrl: "https://techcrunch.com/feed/", region: "US" as const },
  { name: "Al Jazeera", rssUrl: "https://www.aljazeera.com/xml/rss/all.xml", region: "US" as const },
];

async function main() {
  const activeSectors = await prisma.sector.findMany({
    where: { active: true },
    select: { id: true, label: true },
  });

  console.log(`[LinkSources] ${activeSectors.length}개 활성 섹터에 소스 연결`);

  for (const sector of activeSectors) {
    const allFeeds = [...COMMON_FEEDS_KR, ...COMMON_FEEDS_US];

    for (const feed of allFeeds) {
      // 이미 연결된 소스 확인
      const exists = await prisma.source.findFirst({
        where: { sectorId: sector.id, rssUrl: feed.rssUrl },
      });
      if (exists) continue;

      await prisma.source.create({
        data: {
          name: feed.name,
          rssUrl: feed.rssUrl,
          apiType: "rss",
          region: feed.region,
          sectorId: sector.id,
          active: true,
        },
      });
    }
    console.log(`  + "${sector.label}" — ${allFeeds.length}개 소스 연결`);
  }

  console.log("[LinkSources] 완료");
  process.exit(0);
}

main().catch((err) => {
  console.error("[LinkSources] 에러:", err);
  process.exit(1);
});
