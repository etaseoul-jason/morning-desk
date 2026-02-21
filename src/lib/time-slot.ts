export type TimeSlot =
  | "morning"
  | "forenoon"
  | "afternoon"
  | "evening"
  | "night";

export function getTimeSlot(hour?: number): TimeSlot {
  const h = hour ?? new Date().getHours();
  if (h >= 4 && h < 9) return "morning";
  if (h >= 9 && h < 12) return "forenoon";
  if (h >= 12 && h < 18) return "afternoon";
  if (h >= 18 && h < 22) return "evening";
  return "night";
}

const greetings: Record<TimeSlot, string> = {
  morning: "조간 브리핑",
  forenoon: "오전 브리핑",
  afternoon: "오후 브리핑",
  evening: "이브닝 브리핑",
  night: "나이트 브리핑",
};

const descriptions: Record<TimeSlot, string> = {
  morning: "오늘의 주요 뉴스를 한눈에 확인하세요",
  forenoon: "오전 시장 동향을 정리했습니다",
  afternoon: "오후 주요 이슈를 확인하세요",
  evening: "오늘 하루 경제 뉴스를 정리합니다",
  night: "미국 시장과 야간 뉴스를 정리합니다",
};

export function getGreeting(slot?: TimeSlot) {
  const s = slot ?? getTimeSlot();
  return { title: greetings[s], description: descriptions[s], slot: s };
}
