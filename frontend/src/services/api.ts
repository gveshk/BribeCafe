import {
  Agent,
  Contract,
  Dispute,
  Escrow,
  Message,
  PaginatedResponse,
  Quote,
  Table,
} from '../types';
import type { ApiEndpoints, EndpointKey } from './generatedClient';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

type PathParams = { id?: string };

interface AuthState {
  agentId: string | null;
  walletAddress: string | null;
  token: string | null;
}

export class ApiService {
  private auth: AuthState = {
    agentId: null,
    walletAddress: null,
    token: null,
  };

  setAuth(agentId: string, walletAddress: string, token?: string): void {
    this.auth = { agentId, walletAddress, token: token ?? null };
  }

  clearAuth(): void {
    this.auth = { agentId: null, walletAddress: null, token: null };
  }

  getAuth(): AuthState {
    return { ...this.auth };
  }

  private buildUrl(endpoint: string, pathParams?: PathParams, query?: Record<string, string | number | undefined>): string {
    let path = endpoint;
    if (pathParams?.id) {
      path = path.replace(':id', pathParams.id);
    }

    const params = new URLSearchParams();
    Object.entries(query ?? {}).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });

    return `${API_BASE_URL}${path}${params.size > 0 ? `?${params.toString()}` : ''}`;
  }

  private async call<K extends EndpointKey>(
    endpoint: K,
    options: {
      method: string;
      pathParams?: PathParams;
      query?: ApiEndpoints[K] extends { query?: infer Q } ? Q : never;
      body?: ApiEndpoints[K] extends { body: infer B } ? B : never;
    }
  ): Promise<ApiEndpoints[K]['response']> {
    const { agentId, walletAddress, token } = this.auth;
    if (!agentId || !walletAddress) throw new Error('Not authenticated');

    const response = await fetch(this.buildUrl(endpoint.split(' ')[1], options.pathParams, options.query as Record<string, string | number | undefined>), {
      method: options.method,
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-ID': agentId,
        'X-Wallet-Address': walletAddress,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json() as Promise<ApiEndpoints[K]['response']>;
  }

  async getCurrentAgent(): Promise<Agent> {
    const data = await this.call('GET /api/agents/:id', { method: 'GET', pathParams: { id: this.auth.agentId ?? '' } });
    return data.agent;
  }

  async getAgent(id: string): Promise<Agent> {
    const data = await this.call('GET /api/agents/:id', { method: 'GET', pathParams: { id } });
    return data.agent;
  }

  async listAgents(filters?: { capability?: string; minReputation?: number; limit?: number; offset?: number }): Promise<PaginatedResponse<Agent>> {
    return this.call('GET /api/agents', { method: 'GET', query: filters });
  }

  async createTable(participantId: string, encryptedBudget?: string): Promise<{ table: Table }> {
    return this.call('POST /api/tables', { method: 'POST', body: { participantId, encryptedBudget } });
  }

  async getTable(id: string): Promise<{ table: Table; messages: Message[]; quotes: Quote[]; contract: Contract | null }> {
    return this.call('GET /api/tables/:id', { method: 'GET', pathParams: { id } });
  }

  async listTables(filters?: { status?: string; limit?: number; offset?: number }): Promise<PaginatedResponse<Table>> {
    return this.call('GET /api/tables', { method: 'GET', query: filters });
  }

  async sendMessage(tableId: string, content: string, messageType: 'text' | 'quote' | 'document' = 'text'): Promise<{ message: Message }> {
    return this.call('POST /api/tables/:id/messages', { method: 'POST', pathParams: { id: tableId }, body: { content, messageType } });
  }

  async getMessages(tableId: string, limit?: number, offset?: number): Promise<PaginatedResponse<Message>> {
    return this.call('GET /api/tables/:id/messages', { method: 'GET', pathParams: { id: tableId }, query: { limit, offset } });
  }

  async submitQuote(tableId: string, encryptedAmount: string, description: string): Promise<{ quote: Quote }> {
    return this.call('POST /api/tables/:id/quote', { method: 'POST', pathParams: { id: tableId }, body: { encryptedAmount, description } });
  }

  async approveQuote(tableId: string): Promise<{ quote: Quote }> {
    return this.call('POST /api/tables/:id/quote/approve', { method: 'POST', pathParams: { id: tableId } });
  }

  async createContract(tableId: string, encryptedAmount: string, deliverables: string[], timeline: { start: number; end: number }): Promise<{ contract: Contract }> {
    return this.call('POST /api/tables/:id/contract', { method: 'POST', pathParams: { id: tableId }, body: { encryptedAmount, deliverables, timeline } });
  }

  async signContract(tableId: string, amount: string): Promise<{ contract: Contract | null; bothSigned: boolean }> {
    return this.call('POST /api/tables/:id/contract/sign', { method: 'POST', pathParams: { id: tableId }, body: { amount } });
  }

  async depositEscrow(tableId: string, amount: string): Promise<{ success: boolean; tableId: string; amount: string; message: string }> {
    return this.call('POST /api/tables/:id/escrow/deposit', { method: 'POST', pathParams: { id: tableId }, body: { amount } });
  }

  async getEscrow(tableId: string): Promise<Escrow> {
    return this.call('GET /api/tables/:id/escrow/status', { method: 'GET', pathParams: { id: tableId } });
  }

  async approveRelease(tableId: string): Promise<{ success: boolean; approvedBy: 'buyer' | 'seller'; message: string }> {
    return this.call('POST /api/tables/:id/escrow/release/approve', { method: 'POST', pathParams: { id: tableId } });
  }

  async openDispute(tableId: string, reason: 'quality' | 'non_delivery' | 'other', evidence: string[] = []): Promise<{ dispute: Dispute }> {
    return this.call('POST /api/tables/:id/dispute', { method: 'POST', pathParams: { id: tableId }, body: { reason, evidence } });
  }

  getCurrentAgentId(): string | null {
    return this.auth.agentId;
  }
}

export const api = new ApiService();
export default api;
