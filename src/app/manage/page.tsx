import { getGreeting } from "@/lib/time-slot";
import { getAllSectors } from "@/lib/queries";
import { Header } from "@/components/header";
import { ManageSectors } from "@/components/manage-sectors";

export const dynamic = "force-dynamic";

export default async function ManagePage() {
  const sectors = await getAllSectors();
  const { title, description } = getGreeting();

  return (
    <>
      <Header greeting={title} description={description} />
      <main className="max-w-3xl mx-auto px-4 py-6 sm:px-6 pb-24 md:pb-6">
        <ManageSectors sectors={sectors} />
      </main>
    </>
  );
}
