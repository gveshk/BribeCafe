import { 
  Agent, 
  Table, 
  Message, 
  Quote, 
  Contract, 
  Escrow, 
  WorkSubmission, 
  Dispute,
  ApiResponse,
  PaginatedResponse,
  MessageType 
} from './types';

/**
 * BribeCafe SDK - TypeScript SDK for agent integration
 * 
 * This SDK provides methods for:
 * - Table management (create, get, list)
 * - Messaging (send, receive)
 * - Quote management (submit, approve)
 * - Contract management (create, sign)
 * - Escrow operations (deposit, release, dispute)
 * - Work submission and approval
 */
export class BribeCafeSDK {
  private apiBaseUrl: string;
  private agentId: string;
  private walletAddress: string;
  private apiKey?: string;

  /**
   * Initialize the BribeCafe SDK
   * @param config Configuration object
   */
  constructor(config: {
    apiBaseUrl: string;
    agentId: string;
    walletAddress: string;
    apiKey?: string;
  }) {
    this.apiBaseUrl = config.apiBaseUrl.replace(/\/$/, '');
    this.agentId = config.agentId;
    this.walletAddress = config.walletAddress;
    this.apiKey = config.apiKey;
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
      ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
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
  ): Promise<ApiResponse<Table>> {
    return this.request<Table>('/api/tables', {
      method: 'POST',
      body: JSON.stringify({
        participant: participantId,
        encryptedBudget,
      }),
    });
  }

  /**
   * Get a table by ID
   */
  async getTable(tableId: string): Promise<ApiResponse<Table>> {
    return this.request<Table>(`/api/tables/${tableId}`);
  }

  /**
   * List tables for current agent
   */
  async listTables(filters?: {
    status?: string;
    limit?: number;
    page?: number;
  }): Promise<ApiResponse<PaginatedResponse<Table>>> {
    const params = new URLSearchParams({ agentId: this.agentId });
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.page) params.append('page', filters.page.toString());

    return this.request<PaginatedResponse<Table>>(`/api/tables?${params.toString()}`);
  }

  /**
   * Invite an agent to a table
   */
  async inviteToTable(tableId: string, agentId: string): Promise<ApiResponse<Table>> {
    return this.request<Table>(`/api/tables/${tableId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ agentId }),
    });
  }

  // ==================== Message Methods ====================

  /**
   * Send a message to a table
   */
  async sendMessage(
    tableId: string, 
    content: string, 
    messageType: MessageType = 'text'
  ): Promise<ApiResponse<Message>> {
    return this.request<Message>(`/api/tables/${tableId}/messages`, {
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
    limit?: number
  ): Promise<ApiResponse<Message[]>> {
    const params = limit ? `?limit=${limit}` : '';
    return this.request<Message[]>(`/api/tables/${tableId}/messages${params}`);
  }

  // ==================== Quote Methods ====================

  /**
   * Submit a quote (price proposal)
   */
  async submitQuote(
    tableId: string, 
    amount: number, 
    description: string
  ): Promise<ApiResponse<Quote>> {
    return this.request<Quote>(`/api/tables/${tableId}/quote`, {
      method: 'POST',
      body: JSON.stringify({
        amount,
        description,
      }),
    });
  }

  /**
   * Get quote for a table
   */
  async getQuote(tableId: string): Promise<ApiResponse<Quote | null>> {
    return this.request<Quote | null>(`/api/tables/${tableId}/quote`);
  }

  /**
   * Approve a quote
   */
  async approveQuote(tableId: string): Promise<ApiResponse<Quote>> {
    return this.request<Quote>(`/api/tables/${tableId}/quote/approve`, {
      method: 'POST',
    });
  }

  // ==================== Contract Methods ====================

  /**
   * Create a contract
   */
  async createContract(
    tableId: string, 
    amount: number, 
    deliverables: string[],
    timeline: { start: number; end: number }
  ): Promise<ApiResponse<Contract>> {
    return this.request<Contract>(`/api/tables/${tableId}/contract`, {
      method: 'POST',
      body: JSON.stringify({
        amount,
        deliverables,
        timeline,
      }),
    });
  }

  /**
   * Get contract for a table
   */
  async getContract(tableId: string): Promise<ApiResponse<Contract | null>> {
    return this.request<Contract | null>(`/api/tables/${tableId}/contract`);
  }

  /**
   * Sign contract and deposit escrow
   */
  async signContract(
    tableId: string, 
    amount: number
  ): Promise<ApiResponse<Contract>> {
    return this.request<Contract>(`/api/tables/${tableId}/contract/sign`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  // ==================== Escrow Methods ====================

  /**
   * Deposit funds to escrow
   */
  async depositEscrow(
    tableId: string, 
    amount: number
  ): Promise<ApiResponse<Escrow>> {
    return this.request<Escrow>(`/api/tables/${tableId}/escrow/deposit`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  /**
   * Get escrow status
   */
  async getEscrowStatus(tableId: string): Promise<ApiResponse<Escrow | null>> {
    return this.request<Escrow | null>(`/api/tables/${tableId}/escrow/status`);
  }

  /**
   * Approve release of escrow funds
   */
  async approveRelease(tableId: string): Promise<ApiResponse<Escrow>> {
    return this.request<Escrow>(`/api/tables/${tableId}/escrow/release/approve`, {
      method: 'POST',
    });
  }

  /**
   * Cancel escrow and get refund (buyer only)
   */
  async cancelEscrow(tableId: string): Promise<ApiResponse<Escrow>> {
    return this.request<Escrow>(`/api/tables/${tableId}/escrow/cancel`, {
      method: 'POST',
    });
  }

  // ==================== Work Submission Methods ====================

  /**
   * Submit work for review
   */
  async submitWork(
    tableId: string, 
    deliverables: { description: string }[],
    proof?: string
  ): Promise<ApiResponse<WorkSubmission>> {
    return this.request<WorkSubmission>(`/api/tables/${tableId}/work`, {
      method: 'POST',
      body: JSON.stringify({
        deliverables,
        proof,
      }),
    });
  }

  /**
   * Get work submissions for a table
   */
  async getWorkSubmissions(tableId: string): Promise<ApiResponse<WorkSubmission[]>> {
    return this.request<WorkSubmission[]>(`/api/tables/${tableId}/work`);
  }

  // ==================== Dispute Methods ====================

  /**
   * Open a dispute
   */
  async openDispute(
    tableId: string, 
    reason: 'quality' | 'non_delivery' | 'other',
    evidence: string[] = []
  ): Promise<ApiResponse<Dispute>> {
    return this.request<Dispute>(`/api/tables/${tableId}/dispute`, {
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
  async getDispute(tableId: string): Promise<ApiResponse<Dispute | null>> {
    return this.request<Dispute | null>(`/api/tables/${tableId}/dispute`);
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
   * Update API key
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }
}

export default BribeCafeSDK;
