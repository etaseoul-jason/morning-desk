"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getRelativeTime } from "@/lib/relative-time";

type SearchResult = {
  id: string;
  title: string;
  url: string;
  summary: string | null;
  thumbnail: string | null;
  region: string;
  publishedAt: string | null;
  collectedAt: string;
  source: { name: string } | null;
  sector: { id: string; label: string } | null;
};

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults([]);
      setTotal(0);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value.trim())}`);
        const data = await res.json();
        setResults(data.articles || []);
        setTotal(data.total || 0);
        setOpen(true);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  return (
    <div ref={ref} className="relative">
      <Input
        type="search"
        placeholder="뉴스 검색..."
        className="h-8 w-40 sm:w-56 text-sm bg-muted/50 border-border"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && query.trim()) {
            setOpen(false);
            router.push(`/search?q=${encodeURIComponent(query.trim())}`);
          }
        }}
        onFocus={() => {
          if (results.length > 0) setOpen(true);
        }}
      />
      {loading && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <div className="w-3.5 h-3.5 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 right-0 w-80 sm:w-96 bg-card border border-border rounded-lg shadow-lg z-[60] max-h-96 overflow-y-auto">
          <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border">
            {total}건 검색됨
          </div>
          {results.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-2 px-3 py-2.5 hover:bg-muted/50 transition-colors border-b border-border"
              onClick={() => setOpen(false)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-2 leading-snug">
                  {item.title}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  {item.sector && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                      {item.sector.label}
                    </Badge>
                  )}
                  {item.source && (
                    <span className="text-[10px] text-muted-foreground">
                      {item.source.name}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {getRelativeTime(item.publishedAt || item.collectedAt)}
                  </span>
                </div>
              </div>
              {item.thumbnail && (
                <div className="flex-shrink-0 w-16 h-11 rounded overflow-hidden bg-muted">
                  <img
                    src={item.thumbnail}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}
            </a>
          ))}
          {total > results.length && (
            <button
              className="w-full px-3 py-2 text-xs text-primary hover:bg-muted/50 transition-colors text-center"
              onClick={() => {
                setOpen(false);
                router.push(`/search?q=${encodeURIComponent(query.trim())}`);
              }}
            >
              전체 {total}건 보기
            </button>
          )}
        </div>
      )}

      {open && query.trim().length >= 2 && results.length === 0 && !loading && (
        <div className="absolute top-full mt-1 right-0 w-80 bg-card border border-border rounded-lg shadow-lg z-[60] px-3 py-4 text-center text-sm text-muted-foreground">
          검색 결과가 없습니다
        </div>
      )}
    </div>
  );
}
