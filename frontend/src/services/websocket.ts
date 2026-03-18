// WebSocket Service for real-time updates
import { Table, Message, Quote, Contract, Escrow } from '../types';

type EventType =
  | 'table:created'
  | 'table:updated'
  | 'message:new'
  | 'quote:submitted'
  | 'quote:approved'
  | 'contract:created'
  | 'contract:signed'
  | 'escrow:deposited'
  | 'escrow:released'
  | 'dispute:opened'
  | 'dispute:resolved';

type EventCallback<T> = (data: T) => void;

interface VersionedEvent {
  version: 1;
  seq: number;
  type: EventType;
  tableId: string;
  timestamp: string;
  payload: unknown;
}

interface WebSocketServerEnvelope {
  type: 'connected' | 'subscribed' | 'unsubscribed' | 'error' | 'event' | 'pong';
  payload?: unknown;
}

interface DeltaResponse {
  fromSeq: number;
  toSeq: number;
  events: VersionedEvent[];
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<EventType, Set<EventCallback<unknown>>> = new Map();
  private isConnecting = false;
  private shouldReconnect = true;
  private token: string | null = null;
  private subscribedTables = new Set<string>();
  private lastSeq = 0;
  private seenSeq = new Set<number>();

  constructor(url?: string) {
    this.url = url || import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws';
  }

  setToken(token: string): void {
    this.token = token;
  }

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      const wsUrl = this.token ? `${this.url}?token=${encodeURIComponent(this.token)}` : this.url;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.resubscribeAll();
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketServerEnvelope = JSON.parse(event.data);
          this.handleEnvelope(message);
        } catch (err) {
          console.error('[WS] Failed to parse message:', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        this.isConnecting = false;
        reject(error);
      };
    });
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private attemptReconnect(): void {
    if (!this.shouldReconnect || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(async () => {
      try {
        await this.connect();
        await this.resync();
      } catch {
        // retry via onclose
      }
    }, delay);
  }

  private async resync(): Promise<void> {
    if (!this.token) {
      return;
    }

    const base = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const response = await fetch(`${base}/api/events/since/${this.lastSeq}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      return;
    }

    const delta = (await response.json()) as DeltaResponse;
    for (const event of delta.events) {
      this.acceptEvent(event);
    }
  }

  private handleEnvelope(message: WebSocketServerEnvelope): void {
    if (message.type !== 'event' || !message.payload) {
      return;
    }

    this.acceptEvent(message.payload as VersionedEvent);
  }

  private acceptEvent(event: VersionedEvent): void {
    if (event.version !== 1) {
      return;
    }

    if (this.seenSeq.has(event.seq)) {
      return;
    }

    if (event.seq <= this.lastSeq) {
      return;
    }

    this.seenSeq.add(event.seq);
    this.lastSeq = Math.max(this.lastSeq, event.seq);

    const callbacks = this.listeners.get(event.type);
    if (callbacks) {
      callbacks.forEach((callback) => callback(event.payload as never));
    }
  }

  subscribe<T>(type: EventType, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }

    this.listeners.get(type)!.add(callback as EventCallback<unknown>);
    return () => {
      this.listeners.get(type)?.delete(callback as EventCallback<unknown>);
    };
  }

  subscribeToTable(tableId: string): void {
    this.subscribedTables.add(tableId);
    this.send({ type: 'subscribe', tableId });
  }

  unsubscribeFromTable(tableId: string): void {
    this.subscribedTables.delete(tableId);
    this.send({ type: 'unsubscribe', tableId });
  }

  private resubscribeAll(): void {
    for (const tableId of this.subscribedTables) {
      this.send({ type: 'subscribe', tableId });
    }
  }

  private send(payload: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  onTableCreated(callback: EventCallback<{ table: Table }>): () => void {
    return this.subscribe('table:created', callback);
  }

  onTableUpdated(callback: EventCallback<{ tableId: string; status: string }>): () => void {
    return this.subscribe('table:updated', callback);
  }

  onNewMessage(callback: EventCallback<{ message: Message; tableId: string }>): () => void {
    return this.subscribe('message:new', callback);
  }

  onQuoteSubmitted(callback: EventCallback<{ quote: Quote; tableId: string }>): () => void {
    return this.subscribe('quote:submitted', callback);
  }

  onQuoteApproved(callback: EventCallback<{ quote: Quote; tableId: string }>): () => void {
    return this.subscribe('quote:approved', callback);
  }

  onContractCreated(callback: EventCallback<{ contract: Contract; tableId: string }>): () => void {
    return this.subscribe('contract:created', callback);
  }

  onContractSigned(callback: EventCallback<{ contract: Contract; tableId: string; signer: string }>): () => void {
    return this.subscribe('contract:signed', callback);
  }

  onEscrowDeposited(callback: EventCallback<{ escrow: Escrow; tableId: string }>): () => void {
    return this.subscribe('escrow:deposited', callback);
  }

  onEscrowReleased(callback: EventCallback<{ escrow: Escrow; tableId: string }>): () => void {
    return this.subscribe('escrow:released', callback);
  }

  onDisputeOpened(callback: EventCallback<{ dispute: unknown; tableId: string }>): () => void {
    return this.subscribe('dispute:opened', callback);
  }

  onDisputeResolved(callback: EventCallback<{ dispute: unknown; tableId: string }>): () => void {
    return this.subscribe('dispute:resolved', callback);
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const wsService = new WebSocketService();
export default wsService;
