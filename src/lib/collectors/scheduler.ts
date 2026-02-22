import cron from "node-cron";
import { runCollectPipeline, CollectResult } from "./pipeline";

let isRunning = false;

async function safeRun(
  label: string,
  options: Parameters<typeof runCollectPipeline>[0]
): Promise<CollectResult | null> {
  if (isRunning) {
    console.log(`[Scheduler] ${label} 스킵 (이전 작업 진행 중)`);
    return null;
  }

  isRunning = true;
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
    isRunning = false;
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
    safeRun("속보폴링", { region: "KR", includeNaver: false });
  });

  // ── KR 뉴스 수집 (시간대별 차등) ──
  // 05~09 KST: 10분 간격
  cron.schedule("*/10 * * * *", () => {
    const h = getKSTHour();
    if (h >= 5 && h < 9) {
      safeRun("KR-출근전(10분)", { region: "KR", includeNaver: true });
    }
  });

  // 09~18 KST: 15분 간격
  cron.schedule("*/15 * * * *", () => {
    const h = getKSTHour();
    if (h >= 9 && h < 18) {
      safeRun("KR-업무중(15분)", { region: "KR", includeNaver: true });
    }
  });

  // ── US 뉴스 수집 ──
  // 22~02 KST: 10분 간격 (미국장)
  cron.schedule("*/10 * * * *", () => {
    const h = getKSTHour();
    if (h >= 22 || h < 2) {
      safeRun("US-미국장(10분)", { region: "US", includeNaver: false });
    }
  });

  // ── 풀배치 ──
  // 04:00 KST 조간 풀배치 (cron은 UTC → KST-9 = UTC 19:00)
  cron.schedule("0 19 * * *", () => {
    safeRun("조간풀배치", { region: "ALL", includeNaver: true });
  });

  console.log("[Scheduler] 스케줄 등록 완료");
}
