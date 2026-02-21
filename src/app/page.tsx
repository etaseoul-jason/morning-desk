import { SectorCard } from "@/components/sector-card";
import { getGreeting } from "@/lib/time-slot";
import { SectorWithCounts } from "@/lib/types";

async function getSectors(): Promise<SectorWithCounts[]> {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${base}/api/sectors?active=true`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function Home() {
  const sectors = await getSectors();
  const { title, description } = getGreeting();

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">모닝데스크</h1>
              <p className="text-sm text-muted-foreground">
                경제부 뉴스 대시보드
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium">{title}</p>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Sector Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sectors.map((sector) => (
            <SectorCard key={sector.id} sector={sector} />
          ))}
        </div>

        {sectors.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">등록된 섹터가 없습니다</p>
            <p className="text-sm mt-1">섹터 관리에서 새 섹터를 추가하세요</p>
          </div>
        )}
      </div>
    </main>
  );
}
