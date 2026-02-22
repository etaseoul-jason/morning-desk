"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

export type SSEMessage = {
  type: "new_article" | "new_briefing" | "breaking" | "connected";
  data: Record<string, unknown>;
};

export function useSSE() {
  const router = useRouter();
  const esRef = useRef<EventSource | null>(null);
  const [breaking, setBreaking] = useState<SSEMessage | null>(null);
  const [connected, setConnected] = useState(false);

  const dismissBreaking = useCallback(() => setBreaking(null), []);

  useEffect(() => {
    const es = new EventSource("/api/sse");
    esRef.current = es;

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    // 기본 메시지 (connected)
    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "connected") setConnected(true);
      } catch {
        // ignore
      }
    };

    // 새 기사
    es.addEventListener("new_article", () => {
      router.refresh();
    });

    // 새 브리핑
    es.addEventListener("new_briefing", () => {
      router.refresh();
    });

    // 속보
    es.addEventListener("breaking", (e) => {
      try {
        const data = JSON.parse(e.data);
        setBreaking({ type: "breaking", data });
        router.refresh();
      } catch {
        // ignore
      }
    });

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [router]);

  return { connected, breaking, dismissBreaking };
}
