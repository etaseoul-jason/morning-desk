import { notFound } from "next/navigation";
import Link from "next/link";
import { SourceRegion } from "@prisma/client";
import { getSectorDetail, getSectorArticles } from "@/lib/queries";
import { getGreeting } from "@/lib/time-slot";
import { Header } from "@/components/header";
import { BriefingCard } from "@/components/briefing-card";
import { ArticleList } from "@/components/article-list";
import { ArticleFilter } from "@/components/article-filter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const revalidate = 60; // ISR: 60초마다 갱신

type Props = {
  params: { id: string };
  searchParams: { region?: string; offset?: string };
};

export default async function SectorPage({ params, searchParams }: Props) {
  const sector = await getSectorDetail(params.id);
  if (!sector) notFound();

  const region = (searchParams.region as SourceRegion) || undefined;
  const offset = Number(searchParams.offset) || 0;
  const limit = 30;
  const { articles, total } = await getSectorArticles(sector.id, {
    region,
    limit,
    offset,
  });

  const { title, description } = getGreeting();
  return (
    <>
      <Header greeting={title} description={description} />
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 pb-24 md:pb-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link href="/" className="hover:text-foreground">
            대시보드
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">{sector.label}</span>
        </div>

        {/* Sector Info */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold">{sector.label}</h2>
          {sector.summary && (
            <p className="text-muted-foreground mt-1">{sector.summary}</p>
          )}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {sector.deptTags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            <span className="text-xs text-muted-foreground ml-2">
              기사 {sector._count.articles}건
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Briefings */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="font-semibold text-sm">최근 브리핑</h3>
            {sector.briefings.length > 0 ? (
              sector.briefings.map((b) => (
                <BriefingCard key={b.id} briefing={b} />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                아직 생성된 브리핑이 없습니다
              </p>
            )}
          </div>

          {/* Right: Articles */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">
                기사 목록 ({total}건)
              </h3>
              <ArticleFilter />
            </div>
            <Separator className="mb-3" />
            <ArticleList articles={articles} />

            {/* Pagination */}
            {total > limit && (
              <div className="flex items-center justify-center gap-2 mt-6">
                {offset > 0 && (
                  <Link
                    href={`?${new URLSearchParams({
                      ...(region ? { region } : {}),
                      offset: String(Math.max(0, offset - limit)),
                    })}`}
                  >
                    <Button variant="outline" size="sm">
                      이전
                    </Button>
                  </Link>
                )}
                <span className="text-xs text-muted-foreground">
                  {offset + 1}~{Math.min(offset + limit, total)} / {total}
                </span>
                {offset + limit < total && (
                  <Link
                    href={`?${new URLSearchParams({
                      ...(region ? { region } : {}),
                      offset: String(offset + limit),
                    })}`}
                  >
                    <Button variant="outline" size="sm">
                      다음
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
