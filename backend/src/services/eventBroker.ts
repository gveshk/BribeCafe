import type { LifecycleEvent, LifecycleEventType } from '../types/events';

type EventListener = (event: LifecycleEvent) => void;

const MAX_HISTORY = 5000;

class EventBroker {
  private seq = 0;
  private history: LifecycleEvent[] = [];
  private listeners = new Set<EventListener>();

  publish<T>(input: {
    type: LifecycleEventType;
    tableId: string;
    payload: T;
  }): LifecycleEvent<T> {
    const event: LifecycleEvent<T> = {
      version: 1,
      seq: ++this.seq,
      type: input.type,
      tableId: input.tableId,
      timestamp: new Date().toISOString(),
      payload: input.payload,
    };

    this.history.push(event);
    if (this.history.length > MAX_HISTORY) {
      this.history.shift();
    }

    for (const listener of this.listeners) {
      listener(event);
    }

    return event;
  }

  subscribe(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getEventsSince(seq: number, tableIds?: Set<string>): LifecycleEvent[] {
    return this.history.filter((event) => {
      if (event.seq <= seq) return false;
      if (tableIds && !tableIds.has(event.tableId)) return false;
      return true;
    });
  }

  getCurrentSeq(): number {
    return this.seq;
  }

  resetForTests(): void {
    this.seq = 0;
    this.history = [];
    this.listeners.clear();
  }
}

export const eventBroker = new EventBroker();
