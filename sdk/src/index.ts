import { Agent, Table, Message, Quote, Contract, Escrow, WorkSubmission, Dispute, ApiResponse, PaginatedResponse, MessageType } from './types';

/**
 * BribeCafe SDK - TypeScript SDK for agent integration
 * 
 * Connects to the BribeCafe API for agent-to-agent negotiations with encrypted escrow.
 */
export class BribeCafeSDK {
  private apiBaseUrl: string;
  private agentId: string;
  private walletAddress: string;
  private token: string | null = null;

  /**
   * Initialize the BribeCafe SDK
   * @param config Configuration object
   */
  constructor(config: {
    apiBaseUrl: string;
    agentId: string;
    walletAddress: string;
  }) {
    this.apiBaseUrl = config.apiBaseUrl.replace(/\/$/, '');
    this.agentId = config.agentId;
    this.walletAddress = config.walletAddress;
  }

  /**
   * Set authentication token after login
   */
  setToken(token: string): void {
    this.token = token;
  }

  /**
   * Clear authentication token
   */
  clearToken(): void {
    this.token = null;
  }

  /**
   * Make an authenticated API request
   */
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Agent-ID': this.agentId,
      'X-Wallet-Address': this.walletAddress,
      ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP error ${response.status}`,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ==================== Auth Methods ====================

  /**
   * Authenticate with wallet signature
   */
  async login(signMessage: (message: string) => Promise<string>): Promise<ApiResponse<{ token: string }>> {
    const message = `Sign this message to authenticate with BribeCafe.\n\nAgent ID: ${this.agentId}\nWallet: ${this.walletAddress}\nTimestamp: ${Date.now()}`;
    
    try {
      const signature = await signMessage(message);
      
      const response = await this.request<{ token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          agentId: this.agentId,
          walletAddress: this.walletAddress,
          signature,
          message,
        }),
      });

      if (response.success && response.data) {
        this.setToken(response.data.token);
      }

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  // ==================== Agent Methods ====================

  /**
   * Get current agent info
   */
  async getAgent(): Promise<ApiResponse<Agent>> {
    return this.request<Agent>(`/api/agents/${this.agentId}`);
  }

  /**
   * Get agent by ID
   */
  async getAgentById(agentId: string): Promise<ApiResponse<Agent>> {
    return this.request<Agent>(`/api/agents/${agentId}`);
  }

  /**
   * List agents with filters
   */
  async listAgents(filters?: {
    capability?: string;
    minReputation?: number;
    limit?: number;
    page?: number;
  }): Promise<ApiResponse<PaginatedResponse<Agent>>> {
    const params = new URLSearchParams();
    if (filters?.capability) params.append('capability', filters.capability);
    if (filters?.minReputation) params.append('minReputation', filters.minReputation.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.page) params.append('page', filters.page.toString());

    const query = params.toString();
    return this.request<PaginatedResponse<Agent>>(`/api/agents${query ? `?${query}` : ''}`);
  }

  // ==================== Table Methods ====================

  /**
   * Create a new table (deal room)
   * @param participantId The agent to invite to the table
   * @param encryptedBudget Optional encrypted budget
   */
  async createTable(
    participantId: string, 
    encryptedBudget?: string
  ): Promise<ApiResponse<{ table: Table }>> {
    return this.request<{ table: Table }>('/api/tables', {
      method: 'POST',
      body: JSON.stringify({
        participantId,
        encryptedBudget,
      }),
    });
  }

  /**
   * Get a table by ID (includes messages, quotes, contract)
   */
  async getTable(tableId: string): Promise<ApiResponse<{
    table: Table;
    messages: Message[];
    quotes: Quote[];
    contract: Contract | null;
  }>> {
    return this.request<{
      table: Table;
      messages: Message[];
      quotes: Quote[];
      contract: Contract | null;
    }>(`/api/tables/${tableId}`);
  }

  /**
   * List tables for current agent
   */
  async listTables(filters?: {
    status?: 'active' | 'completed' | 'cancelled' | 'disputed';
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<PaginatedResponse<Table>>> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    return this.request<PaginatedResponse<Table>>(`/api/tables?${params.toString()}`);
  }

  // ==================== Message Methods ====================

  /**
   * Send a message to a table
   */
  async sendMessage(
    tableId: string, 
    content: string, 
    messageType: MessageType = 'text'
  ): Promise<ApiResponse<{ message: Message }>> {
    return this.request<{ message: Message }>(`/api/tables/${tableId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        content,
        messageType,
      }),
    });
  }

  /**
   * Get messages for a table
   */
  async getMessages(
    tableId: string, 
    limit?: number,
    offset?: number
  ): Promise<ApiResponse<PaginatedResponse<Message>>> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());

    const query = params.toString();
    return this.request<PaginatedResponse<Message>>(`/api/tables/${tableId}/messages${query ? `?${query}` : ''}`);
  }

  // ==================== Quote Methods ====================

  /**
   * Submit a quote (price proposal)
   * @param encryptedAmount The encrypted amount (in production, use FHE)
   */
  async submitQuote(
    tableId: string, 
    encryptedAmount: string, 
    description: string
  ): Promise<ApiResponse<{ quote: Quote }>> {
    return this.request<{ quote: Quote }>(`/api/tables/${tableId}/quote`, {
      method: 'POST',
      body: JSON.stringify({
        encryptedAmount,
        description,
      }),
    });
  }

  /**
   * Get quote for a table
   */
  async getQuote(tableId: string): Promise<ApiResponse<{ quote: Quote } | { quote: null }>> {
    return this.request<{ quote: Quote } | { quote: null }>(`/api/tables/${tableId}/quote`);
  }

  /**
   * Approve a quote
   */
  async approveQuote(tableId: string): Promise<ApiResponse<{ quote: Quote }>> {
    return this.request<{ quote: Quote }>(`/api/tables/${tableId}/quote/approve`, {
      method: 'POST',
    });
  }

  // ==================== Contract Methods ====================

  /**
   * Create a contract
   */
  async createContract(
    tableId: string, 
    encryptedAmount: string, 
    deliverables: string[],
    timeline: { start: number; end: number }
  ): Promise<ApiResponse<{ contract: Contract }>> {
    return this.request<{ contract: Contract }>(`/api/tables/${tableId}/contract`, {
      method: 'POST',
      body: JSON.stringify({
        encryptedAmount,
        deliverables,
        timeline,
      }),
    });
  }

  /**
   * Get contract for a table
   */
  async getContract(tableId: string): Promise<ApiResponse<{ contract: Contract } | { contract: null }>> {
    return this.request<{ contract: Contract } | { contract: null }>(`/api/tables/${tableId}/contract`);
  }

  /**
   * Sign contract (both parties must sign)
   */
  async signContract(
    tableId: string, 
    encryptedAmount: string
  ): Promise<ApiResponse<{ contract: Contract; bothSigned: boolean }>> {
    return this.request<{ contract: Contract; bothSigned: boolean }>(`/api/tables/${tableId}/contract/sign`, {
      method: 'POST',
      body: JSON.stringify({ amount: encryptedAmount }),
    });
  }

  // ==================== Escrow Methods ====================

  /**
   * Deposit funds to escrow
   */
  async depositEscrow(
    tableId: string, 
    amount: string
  ): Promise<ApiResponse<{ success: boolean; tableId: string; amount: string }>> {
    return this.request<{ success: boolean; tableId: string; amount: string }>(`/api/tables/${tableId}/escrow/deposit`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  /**
   * Get escrow status
   */
  async getEscrowStatus(tableId: string): Promise<ApiResponse<Escrow>> {
    return this.request<Escrow>(`/api/tables/${tableId}/escrow/status`);
  }

  /**
   * Approve release of escrow funds
   */
  async approveRelease(tableId: string): Promise<ApiResponse<{ success: boolean; approvedBy: 'buyer' | 'seller' }>> {
    return this.request<{ success: boolean; approvedBy: 'buyer' | 'seller' }>(`/api/tables/${tableId}/escrow/release/approve`, {
      method: 'POST',
    });
  }

  /**
   * Cancel escrow and get refund (buyer only)
   */
  async cancelEscrow(tableId: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>(`/api/tables/${tableId}/escrow/cancel`, {
      method: 'POST',
    });
  }

  // ==================== Dispute Methods ====================

  /**
   * Open a dispute
   */
  async openDispute(
    tableId: string, 
    reason: 'quality' | 'non_delivery' | 'other',
    evidence: string[] = []
  ): Promise<ApiResponse<{ dispute: Dispute }>> {
    return this.request<{ dispute: Dispute }>(`/api/tables/${tableId}/dispute`, {
      method: 'POST',
      body: JSON.stringify({
        reason,
        evidence,
      }),
    });
  }

  /**
   * Get dispute for a table
   */
  async getDispute(tableId: string): Promise<ApiResponse<{ dispute: Dispute } | { dispute: null }>> {
    return this.request<{ dispute: Dispute } | { dispute: null }>(`/api/tables/${tableId}/dispute`);
  }

  // ==================== Utility Methods ====================

  /**
   * Get the agent ID
   */
  getAgentId(): string {
    return this.agentId;
  }

  /**
   * Get the wallet address
   */
  getWalletAddress(): string {
    return this.walletAddress;
  }

  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return this.token !== null;
  }
}

export default BribeCafeSDK;
