import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendBadge } from "@/components/trend-badge";
import { BriefingTrend } from "@prisma/client";

type SectorCardProps = {
  id: string;
  label: string;
  summary: string | null;
  deptTags: string[];
  articleCount: number;
  latestBriefing: {
    headline: string;
    trend: BriefingTrend;
    reportingTip: string | null;
    generatedAt: Date;
  } | null;
};

export function SectorCard({ sector }: { sector: SectorCardProps }) {
  const b = sector.latestBriefing;

  return (
    <Link href={`/sector/${sector.id}`}>
      <Card className="hover:shadow-md transition-shadow h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-semibold leading-tight">
              {sector.label}
            </CardTitle>
            {b && <TrendBadge trend={b.trend} />}
          </div>
          {b ? (
            <p className="text-sm font-medium mt-1">{b.headline}</p>
          ) : (
            sector.summary && (
              <p className="text-sm text-muted-foreground mt-1">
                {sector.summary}
              </p>
            )
          )}
        </CardHeader>
        <CardContent className="pt-0">
          {b?.reportingTip && (
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
              {b.reportingTip}
            </p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {sector.deptTags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                  {tag}
                </Badge>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {sector.articleCount}건
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
