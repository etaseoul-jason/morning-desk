import cron from "node-cron";
import { runCollectPipeline, CollectResult } from "./pipeline";
import { classifyUnmatchedArticles } from "@/lib/ai/classifier";
import { generateAllBriefings } from "@/lib/ai/briefing-generator";
import { clusterArticles } from "@/lib/clustering";
import { BriefingSlot } from "@prisma/client";

let isCollecting = false;

async function safeCollect(
  label: string,
  options: Parameters<typeof runCollectPipeline>[0]
): Promise<CollectResult | null> {
  if (isCollecting) {
    console.log(`[Scheduler] ${label} 스킵 (이전 작업 진행 중)`);
    return null;
  }

  isCollecting = true;
  const start = Date.now();
  console.log(`[Scheduler] ${label} 시작`);

  try {
    const result = await runCollectPipeline(options);
    console.log(
      `[Scheduler] ${label} 완료 (${Date.now() - start}ms)`,
      result
    );
    return result;
  } catch (err) {
    console.error(`[Scheduler] ${label} 에러:`, err);
    return null;
  } finally {
    isCollecting = false;
  }
}

async function safeClassify() {
  try {
    if (!process.env.GEMINI_API_KEY) return;
    await classifyUnmatchedArticles(20);
  } catch (err) {
    console.error("[Scheduler] 분류 에러:", err);
  }
}

async function safeBriefing(slot: BriefingSlot) {
  try {
    if (!process.env.GEMINI_API_KEY) return;
    await generateAllBriefings(slot);
  } catch (err) {
    console.error("[Scheduler] 브리핑 생성 에러:", err);
  }
}

function getKSTHour(): number {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.getUTCHours();
}

export function startScheduler() {
  console.log("[Scheduler] 스케줄러 시작");

  // ── 연합뉴스 속보 2분 폴링 (상시) ──
  cron.schedule("*/2 * * * *", () => {
    safeCollect("속보폴링", { region: "KR", includeNaver: false });
  });

  // ── KR 뉴스 수집 (시간대별 차등) ──
  // 05~09 KST: 10분 간격
  cron.schedule("*/10 * * * *", () => {
    const h = getKSTHour();
    if (h >= 5 && h < 9) {
      safeCollect("KR-출근전(10분)", { region: "KR", includeNaver: true });
    }
  });

  // 09~18 KST: 15분 간격
  cron.schedule("*/15 * * * *", () => {
    const h = getKSTHour();
    if (h >= 9 && h < 18) {
      safeCollect("KR-업무중(15분)", { region: "KR", includeNaver: true });
    }
  });

  // ── US 뉴스 수집 ──
  // 22~02 KST: 10분 간격 (미국장)
  cron.schedule("*/10 * * * *", () => {
    const h = getKSTHour();
    if (h >= 22 || h < 2) {
      safeCollect("US-미국장(10분)", { region: "US", includeNaver: false });
    }
  });

  // ── 풀배치 + 분류 + 브리핑 ──

  // 04:00 KST 조간 풀배치 (UTC 19:00)
  cron.schedule("0 19 * * *", async () => {
    await safeCollect("조간풀배치", { region: "ALL", includeNaver: true });
    await safeClassify();
    await clusterArticles().catch((e) =>
      console.error("[Scheduler] 클러스터링 에러:", e)
    );
  });

  // 04:30 KST 조간 브리핑 생성 (UTC 19:30)
  cron.schedule("30 19 * * *", () => {
    safeBriefing(BriefingSlot.MORNING);
  });

  // 02:30 KST 야간 브리핑 생성 (UTC 17:30)
  cron.schedule("30 17 * * *", () => {
    safeBriefing(BriefingSlot.NIGHT);
  });

  // ── 정기 AI 분류 (매 3시간) ──
  cron.schedule("0 */3 * * *", () => {
    safeClassify();
  });

  console.log("[Scheduler] 스케줄 등록 완료 (수집 + 분류 + 브리핑)");
}
