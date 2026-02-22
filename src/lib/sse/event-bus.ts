export type SSEEvent = {
  type: "new_article" | "new_briefing" | "breaking";
  data: Record<string, unknown>;
};

type Listener = (event: SSEEvent) => void;

class EventBus {
  private listeners = new Set<Listener>();

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(event: SSEEvent) {
    this.listeners.forEach((fn) => {
      try {
        fn(event);
      } catch {
        // ignore dead listeners
      }
    });
  }

  get connectionCount() {
    return this.listeners.size;
  }
}

// 싱글톤 — 프로세스 내 공유
const globalBus = globalThis as unknown as { __eventBus: EventBus };
export const eventBus = globalBus.__eventBus || (globalBus.__eventBus = new EventBus());
