"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
type SectorData = {
  id?: string;
  label: string;
  summary: string;
  deptTags: string[];
  searchQueriesKR: string[];
  searchQueriesUS: string[];
  classifyKeywords: string[];
  active: boolean;
};

export function SectorForm({
  initial,
  onClose,
}: {
  initial?: SectorData;
  onClose: () => void;
}) {
  const router = useRouter();
  const isEdit = !!initial?.id;
  const [saving, setSaving] = useState(false);

  const [label, setLabel] = useState(initial?.label || "");
  const [summary, setSummary] = useState(initial?.summary || "");
  const [deptTags, setDeptTags] = useState(initial?.deptTags?.join(", ") || "");
  const [searchKR, setSearchKR] = useState(
    initial?.searchQueriesKR?.join("\n") || ""
  );
  const [searchUS, setSearchUS] = useState(
    initial?.searchQueriesUS?.join("\n") || ""
  );
  const [keywords, setKeywords] = useState(
    initial?.classifyKeywords?.join(", ") || ""
  );
  const [active, setActive] = useState(initial?.active ?? true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const body = {
      label,
      summary,
      deptTags: deptTags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      searchQueriesKR: searchKR
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      searchQueriesUS: searchUS
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      classifyKeywords: keywords
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      active,
    };

    const url = isEdit ? `/api/sectors/${initial!.id}` : "/api/sectors";
    const method = isEdit ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);
    router.refresh();
    onClose();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">섹터 이름 *</label>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="예: 미국·이란 갈등"
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium">설명</label>
        <Input
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="한줄 설명"
        />
      </div>

      <div>
        <label className="text-sm font-medium">담당 부서 (쉼표 구분)</label>
        <Input
          value={deptTags}
          onChange={(e) => setDeptTags(e.target.value)}
          placeholder="경제부, 금융부"
        />
      </div>

      <div>
        <label className="text-sm font-medium">KR 검색 키워드 (줄바꿈 구분)</label>
        <Textarea
          value={searchKR}
          onChange={(e) => setSearchKR(e.target.value)}
          placeholder={"비트코인\n암호화폐 규제"}
          rows={3}
        />
      </div>

      <div>
        <label className="text-sm font-medium">US 검색 키워드 (줄바꿈 구분)</label>
        <Textarea
          value={searchUS}
          onChange={(e) => setSearchUS(e.target.value)}
          placeholder={"crypto winter\nbitcoin regulation"}
          rows={3}
        />
      </div>

      <div>
        <label className="text-sm font-medium">분류 키워드 (쉼표 구분)</label>
        <Textarea
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="비트코인, 이더리움, Bitcoin, crypto"
          rows={2}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          id="active"
          className="rounded"
        />
        <label htmlFor="active" className="text-sm">
          활성 상태
        </label>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={saving || !label}>
          {saving ? "저장 중..." : isEdit ? "수정" : "추가"}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          취소
        </Button>
      </div>
    </form>
  );
}
