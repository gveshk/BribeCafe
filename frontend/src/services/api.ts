import { Agent, Table, Message, Quote, Contract, Escrow, Dispute, PaginatedResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface AuthState {
  agentId: string | null;
  walletAddress: string | null;
  token: string | null;
  refreshToken: string | null;
}

interface AuthChallengeResponse {
  challengeId: string;
  nonce: string;
  expiresAt: string;
  message: string;
}

class ApiService {
  private auth: AuthState = {
    agentId: null,
    walletAddress: null,
    token: null,
    refreshToken: null,
  };

  setAuth(agentId: string, walletAddress: string, token?: string, refreshToken?: string): void {
    this.auth = { agentId, walletAddress, token: token ?? null, refreshToken: refreshToken ?? null };
  }

  clearAuth(): void {
    this.auth = { agentId: null, walletAddress: null, token: null, refreshToken: null };
  }

  getAuth(): AuthState {
    return { ...this.auth };
  }

  isAuthenticated(): boolean {
    return !!this.auth.token && !!this.auth.agentId;
  }

  private async requestPublic<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, retry = true): Promise<T> {
    const { token } = this.auth;
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (response.status === 401 && retry && this.auth.refreshToken) {
      await this.refreshAccessToken();
      return this.request<T>(endpoint, options, false);
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async createAuthChallenge(address: string): Promise<AuthChallengeResponse> {
    return this.requestPublic<AuthChallengeResponse>('/api/agents/auth-challenge', {
      method: 'POST',
      body: JSON.stringify({ address }),
    });
  }

  async loginWithWallet(input: {
    address: string;
    signature: string;
    challengeId: string;
    nonce: string;
  }): Promise<{ agent: Agent; token: string; refreshToken: string }> {
    return this.requestPublic<{ agent: Agent; token: string; refreshToken: string }>('/api/agents/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async refreshAccessToken(): Promise<string> {
    if (!this.auth.refreshToken) throw new Error('No refresh token available');

    const data = await this.requestPublic<{ token: string }>('/api/agents/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: this.auth.refreshToken }),
    });

    this.auth.token = data.token;
    return data.token;
  }

  async logout(): Promise<void> {
    if (this.auth.token) {
      await this.request('/api/agents/logout', { method: 'POST' }).catch(() => undefined);
    }
    this.clearAuth();
  }

  async getCurrentAgent(): Promise<Agent> {
    const data = await this.request<{ agent: Agent }>(`/api/agents/me`);
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

  async createTable(participantId: string, encryptedBudget?: string): Promise<{ table: Table }> {
    return this.request<{ table: Table }>('/api/tables', { method: 'POST', body: JSON.stringify({ participantId, encryptedBudget }) });
  }

  async getTable(id: string): Promise<{ table: Table; messages: Message[]; quotes: Quote[]; contract: Contract | null }> {
    return this.request<{ table: Table; messages: Message[]; quotes: Quote[]; contract: Contract | null }>(`/api/tables/${id}`);
  }

  async listTables(filters?: { status?: string; limit?: number; offset?: number }): Promise<PaginatedResponse<Table>> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    return this.request<PaginatedResponse<Table>>(`/api/tables?${params.toString()}`);
  }

  async sendMessage(tableId: string, content: string, messageType: 'text' | 'quote' | 'document' = 'text'): Promise<{ message: Message }> {
    return this.request<{ message: Message }>(`/api/tables/${tableId}/messages`, { method: 'POST', body: JSON.stringify({ content, messageType }) });
  }

  async getMessages(tableId: string, limit?: number, offset?: number): Promise<PaginatedResponse<Message>> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());

    const query = params.toString();
    return this.request<PaginatedResponse<Message>>(`/api/tables/${tableId}/messages${query ? `?${query}` : ''}`);
  }

  async submitQuote(tableId: string, amount: number, description: string): Promise<{ quote: Quote }> {
    const encryptedAmount = amount.toString();
    return this.request<{ quote: Quote }>(`/api/tables/${tableId}/quote`, { method: 'POST', body: JSON.stringify({ encryptedAmount, description }) });
  }

  async getQuote(tableId: string): Promise<Quote | null> {
    const data = await this.request<{ quote: Quote | null }>(`/api/tables/${tableId}/quote`);
    return data.quote;
  }

  async approveQuote(tableId: string): Promise<{ quote: Quote }> {
    return this.request<{ quote: Quote }>(`/api/tables/${tableId}/quote/approve`, { method: 'POST' });
  }

  async createContract(tableId: string, amount: number, deliverables: string[], timeline: { start: number; end: number }): Promise<{ contract: Contract }> {
    const encryptedAmount = amount.toString();
    return this.request<{ contract: Contract }>(`/api/tables/${tableId}/contract`, { method: 'POST', body: JSON.stringify({ encryptedAmount, deliverables, timeline }) });
  }

  async getContract(tableId: string): Promise<Contract | null> {
    const data = await this.request<{ contract: Contract | null }>(`/api/tables/${tableId}/contract`);
    return data.contract;
  }

  async signContract(tableId: string, amount: number): Promise<{ contract: Contract; bothSigned: boolean }> {
    return this.request<{ contract: Contract; bothSigned: boolean }>(`/api/tables/${tableId}/contract/sign`, { method: 'POST', body: JSON.stringify({ amount: amount.toString() }) });
  }

  async depositEscrow(tableId: string, amount: number): Promise<{ success: boolean; tableId: string; amount: string }> {
    return this.request<{ success: boolean; tableId: string; amount: string }>(`/api/tables/${tableId}/escrow/deposit`, { method: 'POST', body: JSON.stringify({ amount: amount.toString() }) });
  }

  async getEscrow(tableId: string): Promise<Escrow> {
    return this.request<Escrow>(`/api/tables/${tableId}/escrow/status`);
  }

  async approveRelease(tableId: string): Promise<{ success: boolean; approvedBy: 'buyer' | 'seller' }> {
    return this.request<{ success: boolean; approvedBy: 'buyer' | 'seller' }>(`/api/tables/${tableId}/escrow/release/approve`, { method: 'POST' });
  }

  async cancelEscrow(tableId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/tables/${tableId}/escrow/cancel`, { method: 'POST' });
  }

  async openDispute(tableId: string, reason: 'quality' | 'non_delivery' | 'other', evidence: string[] = []): Promise<{ dispute: Dispute }> {
    return this.request<{ dispute: Dispute }>(`/api/tables/${tableId}/dispute`, { method: 'POST', body: JSON.stringify({ reason, evidence }) });
  }

  async getDispute(tableId: string): Promise<Dispute | null> {
    const data = await this.request<{ dispute: Dispute | null }>(`/api/tables/${tableId}/dispute`);
    return data.dispute;
  }

  getCurrentAgentId(): string | null {
    return this.auth.agentId;
  }

  getCurrentWallet(): string | null {
    return this.auth.walletAddress;
  }
}

export const api = new ApiService();
export default api;
