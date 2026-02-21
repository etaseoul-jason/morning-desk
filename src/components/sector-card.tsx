"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectorWithCounts } from "@/lib/types";

export function SectorCard({ sector }: { sector: SectorWithCounts }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold">
            {sector.label}
          </CardTitle>
          {!sector.active && (
            <Badge variant="secondary" className="text-xs">
              비활성
            </Badge>
          )}
        </div>
        {sector.summary && (
          <p className="text-sm text-muted-foreground">{sector.summary}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {sector.deptTags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>기사 {sector._count.articles}건</span>
          <span>브리핑 {sector._count.briefings}건</span>
        </div>
      </CardContent>
    </Card>
  );
}
