import { PrismaClient, SourceRegion } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // ── 섹터 4개 ──────────────────────────────────────
  const sectors = await Promise.all([
    prisma.sector.create({
      data: {
        label: "미국·이란 갈등",
        summary: "호르무즈 해협 긴장, 유가·안보 영향",
        deptTags: ["정치부", "국제부"],
        searchQueriesKR: ["이란 미국", "호르무즈 해협", "이란 제재"],
        searchQueriesUS: ["Iran US tensions", "Hormuz strait", "Iran sanctions"],
        classifyKeywords: [
          "이란",
          "호르무즈",
          "IRGC",
          "제재",
          "Iran",
          "sanctions",
          "Tehran",
          "Hormuz",
        ],
        sortOrder: 0,
      },
    }),
    prisma.sector.create({
      data: {
        label: "크립토 윈터",
        summary: "암호화폐 시장 침체기, 규제 동향",
        deptTags: ["경제부", "금융부"],
        searchQueriesKR: ["비트코인", "암호화폐 규제", "크립토"],
        searchQueriesUS: ["crypto winter", "bitcoin", "SEC crypto regulation"],
        classifyKeywords: [
          "비트코인",
          "이더리움",
          "암호화폐",
          "크립토",
          "Bitcoin",
          "Ethereum",
          "crypto",
          "SEC",
        ],
        sortOrder: 1,
      },
    }),
    prisma.sector.create({
      data: {
        label: "블루아울 환매중단",
        summary: "사모펀드 유동성 위기, 환매 중단 사태",
        deptTags: ["경제부", "금융부"],
        searchQueriesKR: ["블루아울", "환매 중단", "사모펀드 유동성"],
        searchQueriesUS: [
          "Blue Owl redemption",
          "private credit freeze",
          "fund redemption halt",
        ],
        classifyKeywords: [
          "블루아울",
          "환매",
          "사모펀드",
          "유동성",
          "Blue Owl",
          "redemption",
          "private credit",
        ],
        sortOrder: 2,
      },
    }),
    prisma.sector.create({
      data: {
        label: "AI 특이기사",
        summary: "인공지능 산업 주요 뉴스 트래킹",
        deptTags: ["산업부", "기술부"],
        searchQueriesKR: ["인공지능", "AI 반도체", "생성형 AI"],
        searchQueriesUS: [
          "artificial intelligence",
          "AI chip",
          "generative AI",
          "OpenAI",
        ],
        classifyKeywords: [
          "AI",
          "인공지능",
          "GPT",
          "LLM",
          "생성형",
          "OpenAI",
          "Anthropic",
          "NVIDIA",
        ],
        sortOrder: 3,
      },
    }),
  ]);

  console.log(`Created ${sectors.length} sectors`);

  // ── 뉴스 소스 ─────────────────────────────────────
  // 각 섹터에 공통 소스를 연결 (첫 번째 섹터 기준으로 생성)
  const sourceData = [
    // KR RSS
    {
      name: "한국경제",
      rssUrl: "https://www.hankyung.com/feed/all-news",
      apiType: "rss",
      region: SourceRegion.KR,
      priority: 1,
    },
    {
      name: "매일경제",
      rssUrl: "https://www.mk.co.kr/rss/30000001/",
      apiType: "rss",
      region: SourceRegion.KR,
      priority: 1,
    },
    {
      name: "서울경제",
      rssUrl: "https://www.sedaily.com/RSS/XMLNEWS",
      apiType: "rss",
      region: SourceRegion.KR,
      priority: 1,
    },
    {
      name: "연합뉴스",
      rssUrl: "https://www.yonhapnewstv.co.kr/category/news/economy/feed/",
      apiType: "rss",
      region: SourceRegion.KR,
      priority: 0,
    },
    {
      name: "이데일리",
      rssUrl: "https://www.edaily.co.kr/rss/edaily_news.xml",
      apiType: "rss",
      region: SourceRegion.KR,
      priority: 2,
    },
    {
      name: "머니투데이",
      rssUrl: "https://rss.mt.co.kr/mt_news.xml",
      apiType: "rss",
      region: SourceRegion.KR,
      priority: 2,
    },
    // KR API
    {
      name: "네이버 뉴스 검색",
      rssUrl: null,
      apiType: "naver_api",
      region: SourceRegion.KR,
      priority: 0,
    },
    // US RSS
    {
      name: "Reuters",
      rssUrl: "https://feeds.reuters.com/reuters/businessNews",
      apiType: "rss",
      region: SourceRegion.US,
      priority: 0,
    },
    {
      name: "CNBC",
      rssUrl: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114",
      apiType: "rss",
      region: SourceRegion.US,
      priority: 1,
    },
    {
      name: "CoinDesk",
      rssUrl: "https://www.coindesk.com/arc/outboundfeeds/rss/",
      apiType: "rss",
      region: SourceRegion.US,
      priority: 2,
    },
    {
      name: "TechCrunch",
      rssUrl: "https://techcrunch.com/feed/",
      apiType: "rss",
      region: SourceRegion.US,
      priority: 2,
    },
    {
      name: "Al Jazeera",
      rssUrl: "https://www.aljazeera.com/xml/rss/all.xml",
      apiType: "rss",
      region: SourceRegion.US,
      priority: 2,
    },
  ];

  // 모든 소스를 첫 번째 섹터에 연결 (나중에 수집 시 섹터 분류)
  for (const s of sourceData) {
    await prisma.source.create({
      data: { ...s, sectorId: sectors[0].id },
    });
  }

  console.log(`Created ${sourceData.length} sources`);
  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
