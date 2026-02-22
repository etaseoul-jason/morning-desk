"use client";

import { Badge } from "@/components/ui/badge";
import { SourceRegion } from "@prisma/client";
import { getRelativeTime } from "@/lib/relative-time";

type ArticleItem = {
  id: string;
  title: string;
  url: string;
  summary: string | null;
  thumbnail: string | null;
  region: SourceRegion;
  confidence: number | null;
  publishedAt: Date | null;
  collectedAt: Date;
  source: { name: string } | null;
};

export function ArticleList({ articles }: { articles: ArticleItem[] }) {
  if (articles.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        기사가 없습니다
      </p>
    );
  }

  return (
    <div className="divide-y divide-border">
      {articles.map((article) => (
        <ArticleRow key={article.id} article={article} />
      ))}
    </div>
  );
}

function ArticleRow({ article }: { article: ArticleItem }) {
  const time = article.publishedAt
    ? new Date(article.publishedAt)
    : new Date(article.collectedAt);
  const relativeTime = getRelativeTime(time);

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-3 py-3 hover:bg-muted/50 transition-colors -mx-1 px-1 rounded"
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
        <div className="flex items-center gap-2 mt-1.5">
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
          {article.source && (
            <span className="text-[11px] text-muted-foreground">
              {article.source.name}
            </span>
          )}
          <span className="text-[11px] text-muted-foreground">
            {relativeTime}
          </span>
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
  );
}
