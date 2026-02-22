"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SectorForm } from "@/components/sector-form";

type SectorManageItem = {
  id: string;
  label: string;
  summary: string | null;
  deptTags: string[];
  searchQueriesKR: string[];
  searchQueriesUS: string[];
  classifyKeywords: string[];
  active: boolean;
  sortOrder: number;
  _count: { articles: number; briefings: number; sources: number };
};

export function ManageSectors({
  sectors,
}: {
  sectors: SectorManageItem[];
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editSector, setEditSector] = useState<SectorManageItem | null>(null);

  function openAdd() {
    setEditSector(null);
    setDialogOpen(true);
  }

  function openEdit(sector: SectorManageItem) {
    setEditSector(sector);
    setDialogOpen(true);
  }

  async function handleDelete(id: string, label: string) {
    if (!confirm(`"${label}" 섹터를 삭제하시겠습니까? 관련 기사와 브리핑도 삭제됩니다.`)) {
      return;
    }
    await fetch(`/api/sectors/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/sectors/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">섹터 관리</h2>
        <Button size="sm" onClick={openAdd}>
          + 섹터 추가
        </Button>
      </div>

      <div className="space-y-3">
        {sectors.map((sector) => (
          <Card
            key={sector.id}
            className={!sector.active ? "opacity-60" : ""}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{sector.label}</CardTitle>
                  {sector.summary && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {sector.summary}
                    </p>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => toggleActive(sector.id, sector.active)}
                  >
                    {sector.active ? "비활성" : "활성"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => openEdit(sector)}
                  >
                    수정
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-destructive"
                    onClick={() => handleDelete(sector.id, sector.label)}
                  >
                    삭제
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-1 mb-2">
                {sector.deptTags.map((t) => (
                  <Badge key={t} variant="outline" className="text-[10px]">
                    {t}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>키워드 {sector.classifyKeywords.length}개</span>
                <span>소스 {sector._count.sources}개</span>
                <span>기사 {sector._count.articles}건</span>
                <span>브리핑 {sector._count.briefings}건</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editSector ? "섹터 수정" : "새 섹터 추가"}
            </DialogTitle>
          </DialogHeader>
          <SectorForm
            initial={
              editSector
                ? {
                    id: editSector.id,
                    label: editSector.label,
                    summary: editSector.summary || "",
                    deptTags: editSector.deptTags,
                    searchQueriesKR: editSector.searchQueriesKR,
                    searchQueriesUS: editSector.searchQueriesUS,
                    classifyKeywords: editSector.classifyKeywords,
                    active: editSector.active,
                  }
                : undefined
            }
            onClose={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
