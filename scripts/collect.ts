/**
 * GitHub Actions용 뉴스 수집 스크립트
 * 사용: npx tsx scripts/collect.ts [--region KR|US|ALL] [--naver]
 */
import { runCollectPipeline } from "../src/lib/collectors/pipeline";
import { classifyUnmatchedArticles } from "../src/lib/ai/classifier";
import { clusterArticles } from "../src/lib/clustering";

async function main() {
  const args = process.argv.slice(2);
  const region = (args.find((a) => a.startsWith("--region="))?.split("=")[1] ||
    "ALL") as "KR" | "US" | "ALL";
  const includeNaver = args.includes("--naver");

  console.log(`[Collect] region=${region}, naver=${includeNaver}`);

  // 1. 수집
  const result = await runCollectPipeline({ region, includeNaver });
  console.log("[Collect] 결과:", result);

  // 2. AI 분류 (키 있을 때만, 실패해도 파이프라인 계속)
  if (process.env.GEMINI_API_KEY) {
    try {
      console.log("[Collect] AI 분류 시작...");
      await classifyUnmatchedArticles(20);
    } catch (err) {
      console.warn("[Collect] AI 분류 실패 (스킵):", (err as Error).message);
    }
  }

  // 3. 클러스터링
  console.log("[Collect] 클러스터링...");
  await clusterArticles();

  console.log("[Collect] 완료");
  process.exit(0);
}

main().catch((err) => {
  console.error("[Collect] 치명적 에러:", err);
  process.exit(1);
});
