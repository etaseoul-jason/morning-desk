/**
 * 3개월 이전 데이터 롤링 삭제
 * 사용: npx tsx scripts/cleanup.ts [--days 90]
 */
import prisma from "../src/lib/prisma";

async function main() {
  const args = process.argv.slice(2);
  const days = Number(
    args.find((a) => a.startsWith("--days="))?.split("=")[1] || 90
  );

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  console.log(`[Cleanup] ${days}일 이전 데이터 삭제 (기준: ${cutoff.toISOString()})`);

  const deleted = await prisma.article.deleteMany({
    where: { collectedAt: { lt: cutoff } },
  });

  console.log(`[Cleanup] 기사 ${deleted.count}건 삭제`);

  const briefingsDeleted = await prisma.briefing.deleteMany({
    where: { generatedAt: { lt: cutoff } },
  });

  console.log(`[Cleanup] 브리핑 ${briefingsDeleted.count}건 삭제`);
  console.log("[Cleanup] 완료");
  process.exit(0);
}

main().catch((err) => {
  console.error("[Cleanup] 에러:", err);
  process.exit(1);
});
