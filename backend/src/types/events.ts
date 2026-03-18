export type LifecycleEntity = 'table' | 'message' | 'quote' | 'contract' | 'escrow' | 'dispute';

export type LifecycleAction =
  | 'created'
  | 'updated'
  | 'new'
  | 'submitted'
  | 'approved'
  | 'signed'
  | 'deposited'
  | 'released'
  | 'opened'
  | 'resolved';

export type LifecycleEventType = `${LifecycleEntity}:${LifecycleAction}`;

export interface LifecycleEvent<T = unknown> {
  version: 1;
  seq: number;
  type: LifecycleEventType;
  tableId: string;
  timestamp: string;
  payload: T;
}

export interface WsClientMessage {
  type: 'subscribe' | 'unsubscribe' | 'ping';
  tableId?: string;
}

export interface WsServerMessage {
  type: 'connected' | 'subscribed' | 'unsubscribed' | 'error' | 'event' | 'pong';
  payload?: unknown;
}
