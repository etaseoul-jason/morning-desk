/**
 * GitHub Actions용 브리핑 생성 스크립트
 * 사용: npx tsx scripts/briefing.ts [--slot MORNING|NIGHT]
 */
import { generateAllBriefings } from "../src/lib/ai/briefing-generator";
import { BriefingSlot } from "@prisma/client";

async function main() {
  const args = process.argv.slice(2);
  const slotArg = args
    .find((a) => a.startsWith("--slot="))
    ?.split("=")[1]
    ?.toUpperCase();

  const slot =
    slotArg === "NIGHT" ? BriefingSlot.NIGHT : BriefingSlot.MORNING;

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("[Briefing] ANTHROPIC_API_KEY 필요");
    process.exit(1);
  }

  console.log(`[Briefing] ${slot} 브리핑 생성 시작...`);
  await generateAllBriefings(slot);
  console.log("[Briefing] 완료");
  process.exit(0);
}

main().catch((err) => {
  console.error("[Briefing] 치명적 에러:", err);
  process.exit(1);
});
