"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getRelativeTime } from "@/lib/relative-time";

type Sector = { id: string; label: string };

type ArticleResult = {
  id: string;
  title: string;
  url: string;
  summary: string | null;
  thumbnail: string | null;
  region: string;
  publishedAt: string | null;
  collectedAt: string;
  sourceName?: string;
  source?: { name: string } | null;
  sectorLabel?: string;
  sector?: { id: string; label: string } | null;
  relevance?: number;
};

type BriefingResult = {
  id: string;
  headline: string;
  summary: string;
  trend: string;
  trendNote?: string | null;
  marketImpact?: string | null;
  reportingTip?: string | null;
  timeSlot: string;
  generatedAt: string;
  sectorLabel?: string;
  sector?: { id: string; label: string } | null;
};

export function SearchPageClient({ sectors }: { sectors: Sector[] }) {
  const [keyword, setKeyword] = useState("");
  const [sectorId, setSectorId] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [articles, setArticles] = useState<ArticleResult[]>([]);
  const [articleTotal, setArticleTotal] = useState(0);
  const [briefings, setBriefings] = useState<BriefingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // 브리핑 비교
  const [compareMode, setCompareMode] = useState(false);
  const [compareA, setCompareA] = useState<number | null>(null);
  const [compareB, setCompareB] = useState<number | null>(null);

  const searchArticles = useCallback(async () => {
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      if (keyword.trim()) params.set("q", keyword.trim());
      if (sectorId !== "all") params.set("sectorId", sectorId);
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      params.set("limit", "50");

      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();
      setArticles(data.articles || []);
      setArticleTotal(data.total || 0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [keyword, sectorId, dateFrom, dateTo]);

  const searchBriefings = useCallback(async () => {
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      if (keyword.trim()) params.set("q", keyword.trim());
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);

      const res = await fetch(`/api/search/briefings?${params}`);
      const data = await res.json();
      setBriefings(data.briefings || []);
      setCompareA(null);
      setCompareB(null);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [keyword, dateFrom, dateTo]);

  function handleSearch(tab: string) {
    if (tab === "articles") searchArticles();
    else searchBriefings();
  }

  function getSourceName(a: ArticleResult) {
    return a.sourceName || a.source?.name || "";
  }
  function getSectorLabel(a: ArticleResult | BriefingResult) {
    return a.sectorLabel || a.sector?.label || "";
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">검색</h2>

      {/* 검색 필터 */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Input
          type="search"
          placeholder="키워드 입력..."
          className="w-full sm:w-64 bg-muted/50"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") searchArticles();
          }}
        />
        <Select value={sectorId} onValueChange={setSectorId}>
          <SelectTrigger className="w-40 bg-muted/50">
            <SelectValue placeholder="섹터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 섹터</SelectItem>
            {sectors.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          className="w-40 bg-muted/50"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
        <span className="self-center text-muted-foreground text-sm">~</span>
        <Input
          type="date"
          className="w-40 bg-muted/50"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />
      </div>

      <Tabs defaultValue="articles">
        <div className="flex items-center justify-between mb-3">
          <TabsList>
            <TabsTrigger value="articles">기사 검색</TabsTrigger>
            <TabsTrigger value="briefings">브리핑 검색</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Tabs defaultValue="articles">
              {/* Search buttons handled by tab switch */}
            </Tabs>
            <Button
              size="sm"
              onClick={() => handleSearch("articles")}
              disabled={loading}
            >
              {loading ? "검색 중..." : "검색"}
            </Button>
          </div>
        </div>

        {/* 기사 검색 결과 */}
        <TabsContent value="articles">
          {searched && (
            <p className="text-sm text-muted-foreground mb-3">
              {articleTotal}건 검색됨
            </p>
          )}
          {articles.length === 0 && searched && !loading && (
            <p className="text-center py-12 text-muted-foreground">
              검색 결과가 없습니다
            </p>
          )}
          <div className="divide-y divide-border">
            {articles.map((article) => (
              <a
                key={article.id}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-3 py-3 hover:bg-muted/50 transition-colors px-1 rounded"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug line-clamp-2">
                    {article.title}
                  </p>
                  {article.summary && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {article.summary}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {getSectorLabel(article) && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 border-primary/30 text-primary"
                      >
                        {getSectorLabel(article)}
                      </Badge>
                    )}
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1 py-0 ${
                        article.region === "US"
                          ? "border-blue-400/30 text-blue-400"
                          : "border-border"
                      }`}
                    >
                      {article.region}
                    </Badge>
                    {getSourceName(article) && (
                      <span className="text-[11px] text-muted-foreground">
                        {getSourceName(article)}
                      </span>
                    )}
                    <span className="text-[11px] text-muted-foreground">
                      {getRelativeTime(
                        article.publishedAt || article.collectedAt
                      )}
                    </span>
                    {article.relevance != null && (
                      <span className="text-[10px] text-primary/60">
                        관련도 {(article.relevance * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
                {article.thumbnail && (
                  <div className="flex-shrink-0 w-24 h-16 rounded overflow-hidden bg-muted">
                    <img
                      src={article.thumbnail}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </a>
            ))}
          </div>
        </TabsContent>

        {/* 브리핑 검색 결과 */}
        <TabsContent value="briefings">
          <div className="flex items-center justify-between mb-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => searchBriefings()}
              disabled={loading}
            >
              브리핑 검색
            </Button>
            {briefings.length >= 2 && (
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={compareMode}
                  onChange={(e) => {
                    setCompareMode(e.target.checked);
                    setCompareA(null);
                    setCompareB(null);
                  }}
                  className="rounded"
                />
                비교 모드
              </label>
            )}
          </div>

          {briefings.length === 0 && searched && !loading && (
            <p className="text-center py-12 text-muted-foreground">
              브리핑 검색 결과가 없습니다
            </p>
          )}

          {/* 비교 모드 */}
          {compareMode && compareA !== null && compareB !== null && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <BriefingCompareCard briefing={briefings[compareA]} />
                <BriefingCompareCard briefing={briefings[compareB]} />
              </div>
              <Separator className="mb-4" />
            </>
          )}

          <div className="space-y-3">
            {briefings.map((b, idx) => (
              <Card
                key={b.id}
                className={`${
                  compareMode ? "cursor-pointer" : ""
                } ${
                  compareA === idx || compareB === idx
                    ? "ring-2 ring-primary"
                    : ""
                }`}
                onClick={() => {
                  if (!compareMode) return;
                  if (compareA === null) setCompareA(idx);
                  else if (compareB === null && compareA !== idx)
                    setCompareB(idx);
                  else {
                    setCompareA(idx);
                    setCompareB(null);
                  }
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">
                      {b.headline}
                    </CardTitle>
                    <Badge
                      variant={
                        b.trend === "ESCALATING"
                          ? "destructive"
                          : b.trend === "COOLING"
                          ? "secondary"
                          : "outline"
                      }
                      className="text-[10px]"
                    >
                      {b.trend}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{getSectorLabel(b)}</span>
                    <span>{b.timeSlot === "MORNING" ? "조간" : "야간"}</span>
                    <span>
                      {new Date(b.generatedAt).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {b.summary}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BriefingCompareCard({ briefing }: { briefing: BriefingResult }) {
  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{briefing.headline}</CardTitle>
        <div className="flex gap-2 text-[11px] text-muted-foreground">
          <Badge variant="outline" className="text-[10px]">
            {briefing.trend}
          </Badge>
          <span>
            {new Date(briefing.generatedAt).toLocaleDateString("ko-KR")}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        <p className="text-xs">{briefing.summary}</p>
        {briefing.marketImpact && (
          <div>
            <p className="text-[10px] text-muted-foreground font-medium">
              시장 영향
            </p>
            <p className="text-xs">{briefing.marketImpact}</p>
          </div>
        )}
        {briefing.reportingTip && (
          <div>
            <p className="text-[10px] text-muted-foreground font-medium">
              취재 포인트
            </p>
            <p className="text-xs">{briefing.reportingTip}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
