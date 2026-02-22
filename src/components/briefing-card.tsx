import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendBadge } from "@/components/trend-badge";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { BriefingTrend, BriefingSlot } from "@prisma/client";

type BriefingProps = {
  headline: string;
  summary: string;
  trend: BriefingTrend;
  trendNote: string | null;
  marketImpact: string | null;
  reportingTip: string | null;
  keyFigures: string[];
  sentiment: number | null;
  articleCount: number;
  timeSlot: BriefingSlot;
  generatedAt: Date;
};

export function BriefingCard({ briefing }: { briefing: BriefingProps }) {
  const slotLabel = briefing.timeSlot === "MORNING" ? "조간" : "야간";
  const time = new Date(briefing.generatedAt).toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">
                {slotLabel}
              </Badge>
              <span className="text-xs text-muted-foreground">{time}</span>
            </div>
            <CardTitle className="text-lg leading-snug">
              {briefing.headline}
            </CardTitle>
          </div>
          <TrendBadge trend={briefing.trend} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 요약 */}
        <p className="text-sm leading-relaxed">{briefing.summary}</p>

        <Separator />

        {/* 추세 */}
        {briefing.trendNote && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-0.5">
              추세 분석
            </p>
            <p className="text-sm">{briefing.trendNote}</p>
          </div>
        )}

        {/* 시장 영향 */}
        {briefing.marketImpact && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-0.5">
              시장 영향
            </p>
            <p className="text-sm">{briefing.marketImpact}</p>
          </div>
        )}

        {/* 취재 포인트 */}
        {briefing.reportingTip && (
          <div className="bg-muted/50 rounded-md p-3">
            <p className="text-xs font-medium mb-0.5">취재 포인트</p>
            <p className="text-sm">{briefing.reportingTip}</p>
          </div>
        )}

        {/* 핵심 인물 */}
        {briefing.keyFigures.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {briefing.keyFigures.map((kf) => (
              <Badge key={kf} variant="outline" className="text-xs">
                {kf}
              </Badge>
            ))}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          분석 기사 {briefing.articleCount}건
        </div>
      </CardContent>
    </Card>
  );
}
