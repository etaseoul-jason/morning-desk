import { Badge } from "@/components/ui/badge";
import { BriefingTrend } from "@prisma/client";

const config: Record<BriefingTrend, { label: string; className: string }> = {
  ESCALATING: {
    label: "확대",
    className: "bg-red-100 text-red-700 border-red-200",
  },
  STABLE: {
    label: "유지",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  COOLING: {
    label: "완화",
    className: "bg-green-100 text-green-700 border-green-200",
  },
};

export function TrendBadge({ trend }: { trend: BriefingTrend }) {
  const c = config[trend];
  return (
    <Badge variant="outline" className={`text-xs ${c.className}`}>
      {c.label}
    </Badge>
  );
}
