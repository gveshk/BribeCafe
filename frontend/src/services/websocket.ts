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

interface WebSocketMessage {
  type: EventType;
  payload: unknown;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<EventType, Set<EventCallback<unknown>>> = new Map();
  private isConnecting = false;
  private shouldReconnect = true;
  private token: string | null = null;

  constructor(url?: string) {
    this.url = url || import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws';
  }

  /**
   * Set authentication token
   */
  setToken(token: string): void {
    this.token = token;
    // Reconnect with new token if already connected
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendAuth();
    }
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
        resolve();
        return;
      }

      this.isConnecting = true;

      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('[WS] Connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.sendAuth();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (err) {
            console.error('[WS] Failed to parse message:', err);
          }
        };

        this.ws.onclose = () => {
          console.log('[WS] Disconnected');
          this.isConnecting = false;
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('[WS] Error:', error);
          this.isConnecting = false;
          if (this.reconnectAttempts === 0) {
            reject(error);
          }
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Send authentication message
   */
  private sendAuth(): void {
    if (this.token && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'auth',
        token: this.token,
      }));
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (!this.shouldReconnect || this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[WS] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch(() => {
        // Will retry automatically
      });
    }, delay);
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(message: WebSocketMessage): void {
    const callbacks = this.listeners.get(message.type);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(message.payload as never);
        } catch (err) {
          console.error(`[WS] Callback error for ${message.type}:`, err);
        }
      });
    }
  }

  /**
   * Subscribe to an event
   */
  subscribe<T>(type: EventType, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback as EventCallback<unknown>);

    // Return unsubscribe function
    return () => {
      this.listeners.get(type)?.delete(callback as EventCallback<unknown>);
    };
  }

  /**
   * Subscribe to table events
   */
  onTableCreated(callback: EventCallback<{ table: Table }>): () => void {
    return this.subscribe('table:created', callback);
  }

  onTableUpdated(callback: EventCallback<{ table: Table }>): () => void {
    return this.subscribe('table:updated', callback);
  }

  /**
   * Subscribe to message events
   */
  onNewMessage(callback: EventCallback<{ message: Message; tableId: string }>): () => void {
    return this.subscribe('message:new', callback);
  }

  /**
   * Subscribe to quote events
   */
  onQuoteSubmitted(callback: EventCallback<{ quote: Quote; tableId: string }>): () => void {
    return this.subscribe('quote:submitted', callback);
  }

  onQuoteApproved(callback: EventCallback<{ quote: Quote; tableId: string }>): () => void {
    return this.subscribe('quote:approved', callback);
  }

  /**
   * Subscribe to contract events
   */
  onContractCreated(callback: EventCallback<{ contract: Contract; tableId: string }>): () => void {
    return this.subscribe('contract:created', callback);
  }

  onContractSigned(callback: EventCallback<{ contract: Contract; tableId: string; signer: string }>): () => void {
    return this.subscribe('contract:signed', callback);
  }

  /**
   * Subscribe to escrow events
   */
  onEscrowDeposited(callback: EventCallback<{ escrow: Escrow; tableId: string }>): () => void {
    return this.subscribe('escrow:deposited', callback);
  }

  onEscrowReleased(callback: EventCallback<{ escrow: Escrow; tableId: string }>): () => void {
    return this.subscribe('escrow:released', callback);
  }

  /**
   * Subscribe to dispute events
   */
  onDisputeOpened(callback: EventCallback<{ dispute: unknown; tableId: string }>): () => void {
    return this.subscribe('dispute:opened', callback);
  }

  onDisputeResolved(callback: EventCallback<{ dispute: unknown; tableId: string }>): () => void {
    return this.subscribe('dispute:resolved', callback);
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Subscribe to connection status changes
   */
  onConnectionChange(callback: (connected: boolean) => void): () => void {
    const checkConnection = () => callback(this.isConnected());
    
    // Check periodically
    const interval = setInterval(checkConnection, 1000);
    
    // Cleanup
    return () => clearInterval(interval);
  }
}

// Export singleton instance
export const wsService = new WebSocketService();
export default wsService;
