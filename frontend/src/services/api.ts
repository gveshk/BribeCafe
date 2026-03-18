// Real API Service - connects to BribeCafe backend
import { Agent, Table, Message, Quote, Contract, Escrow, Dispute, PaginatedResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
}

export const normalizeApiError = (error: unknown): ApiError => {
  if (error instanceof Error) {
    return { message: error.message };
  }

  if (typeof error === 'string') {
    return { message: error };
  }

  if (error && typeof error === 'object') {
    const maybeError = error as { message?: string; error?: string; status?: number; code?: string; details?: unknown };
    return {
      message: maybeError.message || maybeError.error || 'Something went wrong. Please try again.',
      status: maybeError.status,
      code: maybeError.code,
      details: maybeError.details,
    };
  }

  return { message: 'Something went wrong. Please try again.' };
};

interface AuthState {
  agentId: string | null;
  walletAddress: string | null;
  token: string | null;
}

class ApiService {
  private auth: AuthState = {
    agentId: null,
    walletAddress: null,
    token: null,
  };

  // Auth methods
  setAuth(agentId: string, walletAddress: string, token?: string): void {
    this.auth = { agentId, walletAddress, token };
  }

  clearAuth(): void {
    this.auth = { agentId: null, walletAddress: null, token: null };
  }

  getAuth(): AuthState {
    return { ...this.auth };
  }

  isAuthenticated(): boolean {
    return !!this.auth.token && !!this.auth.agentId;
  }

  // Private request handler
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const { agentId, walletAddress, token } = this.auth;

    if (!agentId || !walletAddress) {
      throw new Error('Not authenticated');
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Agent-ID': agentId,
      'X-Wallet-Address': walletAddress,
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({ error: 'Request failed' }));
      throw normalizeApiError({
        ...payload,
        status: response.status,
        message: payload.error || payload.message || `HTTP ${response.status}` ,
      });
    }

    return response.json();
  }

  // Agent endpoints
  async getCurrentAgent(): Promise<Agent> {
    const data = await this.request<{ agent: Agent }>(`/api/agents/${this.auth.agentId}`);
    return data.agent;
  }

  async getAgent(id: string): Promise<Agent> {
    const data = await this.request<{ agent: Agent }>(`/api/agents/${id}`);
    return data.agent;
  }

  async listAgents(filters?: { capability?: string; minReputation?: number; limit?: number }): Promise<PaginatedResponse<Agent>> {
    const params = new URLSearchParams();
    if (filters?.capability) params.append('capability', filters.capability);
    if (filters?.minReputation) params.append('minReputation', filters.minReputation.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const query = params.toString();
    return this.request<PaginatedResponse<Agent>>(`/api/agents${query ? `?${query}` : ''}`);
  }

  // Table endpoints
  async createTable(participantId: string, encryptedBudget?: string): Promise<{ table: Table }> {
    return this.request<{ table: Table }>('/api/tables', {
      method: 'POST',
      body: JSON.stringify({ participantId, encryptedBudget }),
    });
  }

  async getTable(id: string): Promise<{
    table: Table;
    messages: Message[];
    quotes: Quote[];
    contract: Contract | null;
  }> {
    return this.request<{
      table: Table;
      messages: Message[];
      quotes: Quote[];
      contract: Contract | null;
    }>(`/api/tables/${id}`);
  }

  async listTables(filters?: { status?: string; limit?: number; offset?: number }): Promise<PaginatedResponse<Table>> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    return this.request<PaginatedResponse<Table>>(`/api/tables?${params.toString()}`);
  }

  // Message endpoints
  async sendMessage(tableId: string, content: string, messageType: 'text' | 'quote' | 'document' = 'text'): Promise<{ message: Message }> {
    return this.request<{ message: Message }>(`/api/tables/${tableId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, messageType }),
    });
  }

  async getMessages(tableId: string, limit?: number, offset?: number): Promise<PaginatedResponse<Message>> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());

    const query = params.toString();
    return this.request<PaginatedResponse<Message>>(`/api/tables/${tableId}/messages${query ? `?${query}` : ''}`);
  }

  // Quote endpoints
  async submitQuote(tableId: string, amount: number, description: string): Promise<{ quote: Quote }> {
    // In production, encrypt this with FHE
    const encryptedAmount = amount.toString();
    return this.request<{ quote: Quote }>(`/api/tables/${tableId}/quote`, {
      method: 'POST',
      body: JSON.stringify({ encryptedAmount, description }),
    });
  }

  async getQuote(tableId: string): Promise<Quote | null> {
    const data = await this.request<{ quote: Quote | null }>(`/api/tables/${tableId}/quote`);
    return data.quote;
  }

  async approveQuote(tableId: string): Promise<{ quote: Quote }> {
    return this.request<{ quote: Quote }>(`/api/tables/${tableId}/quote/approve`, {
      method: 'POST',
    });
  }

  // Contract endpoints
  async createContract(
    tableId: string,
    amount: number,
    deliverables: string[],
    timeline: { start: number; end: number }
  ): Promise<{ contract: Contract }> {
    const encryptedAmount = amount.toString();
    return this.request<{ contract: Contract }>(`/api/tables/${tableId}/contract`, {
      method: 'POST',
      body: JSON.stringify({ encryptedAmount, deliverables, timeline }),
    });
  }

  async getContract(tableId: string): Promise<Contract | null> {
    const data = await this.request<{ contract: Contract | null }>(`/api/tables/${tableId}/contract`);
    return data.contract;
  }

  async signContract(tableId: string, amount: number): Promise<{ contract: Contract; bothSigned: boolean }> {
    return this.request<{ contract: Contract; bothSigned: boolean }>(`/api/tables/${tableId}/contract/sign`, {
      method: 'POST',
      body: JSON.stringify({ amount: amount.toString() }),
    });
  }

  // Escrow endpoints
  async depositEscrow(tableId: string, amount: number): Promise<{ success: boolean; tableId: string; amount: string }> {
    return this.request<{ success: boolean; tableId: string; amount: string }>(`/api/tables/${tableId}/escrow/deposit`, {
      method: 'POST',
      body: JSON.stringify({ amount: amount.toString() }),
    });
  }

  async getEscrow(tableId: string): Promise<Escrow> {
    return this.request<Escrow>(`/api/tables/${tableId}/escrow/status`);
  }

  async approveRelease(tableId: string): Promise<{ success: boolean; approvedBy: 'buyer' | 'seller' }> {
    return this.request<{ success: boolean; approvedBy: 'buyer' | 'seller' }>(`/api/tables/${tableId}/escrow/release/approve`, {
      method: 'POST',
    });
  }

  async cancelEscrow(tableId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/tables/${tableId}/escrow/cancel`, {
      method: 'POST',
    });
  }

  // Dispute endpoints
  async openDispute(tableId: string, reason: 'quality' | 'non_delivery' | 'other', evidence: string[] = []): Promise<{ dispute: Dispute }> {
    return this.request<{ dispute: Dispute }>(`/api/tables/${tableId}/dispute`, {
      method: 'POST',
      body: JSON.stringify({ reason, evidence }),
    });
  }

  async getDispute(tableId: string): Promise<Dispute | null> {
    const data = await this.request<{ dispute: Dispute | null }>(`/api/tables/${tableId}/dispute`);
    return data.dispute;
  }

  // Get current IDs
  getCurrentAgentId(): string | null {
    return this.auth.agentId;
  }

  getCurrentWallet(): string | null {
    return this.auth.walletAddress;
  }
}

export const api = new ApiService();
export default api;
