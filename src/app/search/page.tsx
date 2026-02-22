import { Header } from "@/components/header";
import { getGreeting } from "@/lib/time-slot";
import { SearchPageClient } from "@/components/search-page-client";
import prisma from "@/lib/prisma";

export const revalidate = 120; // ISR: 2분마다 갱신 (섹터 목록은 자주 안 바뀜)

export default async function SearchPage() {
  const { title, description } = getGreeting();

  const sectors = await prisma.sector.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, label: true },
  });

  return (
    <>
      <Header greeting={title} description={description} />
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 pb-24 md:pb-6">
        <SearchPageClient sectors={sectors} />
      </main>
    </>
  );
}
