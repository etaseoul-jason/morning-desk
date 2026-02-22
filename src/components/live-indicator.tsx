"use client";

import { useSSE } from "@/hooks/use-sse";
import { Button } from "@/components/ui/button";

export function LiveIndicator() {
  const { connected, breaking, dismissBreaking } = useSSE();

  return (
    <>
      {/* 연결 상태 */}
      <div className="flex items-center gap-1.5">
        <span
          className={`w-2 h-2 rounded-full ${
            connected ? "bg-green-500 animate-pulse" : "bg-gray-300"
          }`}
        />
        <span className="text-[10px] text-muted-foreground">
          {connected ? "LIVE" : "연결 중..."}
        </span>
      </div>

      {/* 속보 배너 */}
      {breaking && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-red-600 text-white px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded">
                속보
              </span>
              <a
                href={breaking.data.url as string}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium hover:underline"
              >
                {breaking.data.title as string}
              </a>
              <span className="text-xs opacity-75">
                {breaking.data.sourceName as string}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 h-6 px-2"
              onClick={dismissBreaking}
            >
              닫기
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
