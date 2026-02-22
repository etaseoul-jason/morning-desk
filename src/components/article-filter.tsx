"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

const regions = [
  { value: "", label: "전체" },
  { value: "KR", label: "국내" },
  { value: "US", label: "해외" },
];

export function ArticleFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const currentRegion = params.get("region") || "";

  function setRegion(region: string) {
    const sp = new URLSearchParams(params.toString());
    if (region) {
      sp.set("region", region);
    } else {
      sp.delete("region");
    }
    sp.delete("offset");
    router.push(`?${sp.toString()}`);
  }

  return (
    <div className="flex gap-1.5">
      {regions.map((r) => (
        <Button
          key={r.value}
          variant={currentRegion === r.value ? "default" : "outline"}
          size="sm"
          className="h-7 text-xs"
          onClick={() => setRegion(r.value)}
        >
          {r.label}
        </Button>
      ))}
    </div>
  );
}
