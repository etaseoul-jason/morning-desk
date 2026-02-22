import { SectorCard } from "@/components/sector-card";
import { getGreeting } from "@/lib/time-slot";
import { getActiveSectorsWithLatestBriefing } from "@/lib/queries";
import { Header } from "@/components/header";

export const revalidate = 60; // ISR: 60초마다 갱신

export default async function Home() {
  const sectors = await getActiveSectorsWithLatestBriefing();
  const { title, description } = getGreeting();

  return (
    <>
      <Header greeting={title} description={description} />
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 pb-24 md:pb-6">
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
      </main>
    </>
  );
}
