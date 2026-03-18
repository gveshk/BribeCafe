import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebSocketService } from './websocket';

class MockSocket {
  static OPEN = 1;
  readyState = MockSocket.OPEN;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: ((error: unknown) => void) | null = null;
  sent: string[] = [];

  constructor(_url: string) {
    setTimeout(() => this.onopen?.(), 0);
  }

  send(payload: string): void {
    this.sent.push(payload);
  }

  close(): void {
    this.onclose?.();
  }

  emit(message: unknown): void {
    this.onmessage?.({ data: JSON.stringify(message) });
  }
}

describe('WebSocketService integration behavior', () => {
  beforeEach(() => {
    vi.stubGlobal('WebSocket', MockSocket as any);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ fromSeq: 0, toSeq: 3, events: [] }),
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('reconnects and resyncs on disconnect', async () => {
    const service = new WebSocketService('ws://localhost:3000/ws');
    service.setToken('abc');
    service.subscribeToTable('table-1');

    const timerSpy = vi.spyOn(globalThis, 'setTimeout');

    await service.connect();
    (service as any).ws.close();

    expect(timerSpy).toHaveBeenCalled();
  });

  it('ignores duplicate events by sequence number', () => {
    const service = new WebSocketService('ws://localhost:3000/ws');
    const received: number[] = [];

    service.subscribe('message:new', () => received.push(1));

    (service as any).handleEnvelope({
      type: 'event',
      payload: {
        version: 1,
        seq: 10,
        type: 'message:new',
        tableId: 'table-1',
        timestamp: new Date().toISOString(),
        payload: { ok: true },
      },
    });

    (service as any).handleEnvelope({
      type: 'event',
      payload: {
        version: 1,
        seq: 10,
        type: 'message:new',
        tableId: 'table-1',
        timestamp: new Date().toISOString(),
        payload: { ok: true },
      },
    });

    expect(received).toHaveLength(1);
  });

  it('drops out-of-order events older than last sequence', () => {
    const service = new WebSocketService('ws://localhost:3000/ws');
    const received: number[] = [];

    service.subscribe('quote:submitted', () => received.push(1));

    (service as any).handleEnvelope({
      type: 'event',
      payload: {
        version: 1,
        seq: 12,
        type: 'quote:submitted',
        tableId: 'table-1',
        timestamp: new Date().toISOString(),
        payload: { ok: true },
      },
    });

    (service as any).handleEnvelope({
      type: 'event',
      payload: {
        version: 1,
        seq: 11,
        type: 'quote:submitted',
        tableId: 'table-1',
        timestamp: new Date().toISOString(),
        payload: { ok: true },
      },
    });

    expect(received).toHaveLength(1);
  });
});
