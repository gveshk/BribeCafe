import { Agent, Table, Message, Quote, Contract, Escrow, Dispute, PaginatedResponse } from '../types';
import * as mockApi from './mockApi';

// Initialize mock data
mockApi.initializeMockData();

const CURRENT_AGENT_ID = 'agent-001';
const CURRENT_WALLET = '0x742d35Cc6634C0532925a3b844Bc9e7595f0eB1E';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// API Service that works with mock data
export const api = {
  // Agent endpoints
  async getCurrentAgent(): Promise<Agent> {
    await delay(100);
    return mockApi.getAgent(CURRENT_AGENT_ID)!;
  },

  async getAgent(id: string): Promise<Agent | null> {
    await delay(100);
    return mockApi.getAgent(id) || null;
  },

  async listAgents(filters?: { capability?: string; minReputation?: number }): Promise<PaginatedResponse<Agent>> {
    await delay(100);
    let agents = mockApi.getAgents();
    if (filters?.capability) {
      agents = agents.filter(a => a.capabilities.includes(filters.capability!));
    }
    if (filters?.minReputation) {
      agents = agents.filter(a => a.reputationScore >= filters.minReputation!);
    }
    return {
      items: agents,
      total: agents.length,
      page: 1,
      limit: 20,
      hasMore: false,
    };
  },

  // Table endpoints
  async createTable(participantId: string): Promise<Table> {
    await delay(200);
    return mockApi.createTable(CURRENT_AGENT_ID, participantId);
  },

  async getTable(id: string): Promise<Table | null> {
    await delay(100);
    return mockApi.getTable(id) || null;
  },

  async listTables(agentId?: string): Promise<PaginatedResponse<Table>> {
    await delay(100);
    const tables = mockApi.getTables(agentId || CURRENT_AGENT_ID);
    return {
      items: tables,
      total: tables.length,
      page: 1,
      limit: 20,
      hasMore: false,
    };
  },

  // Message endpoints
  async sendMessage(tableId: string, content: string, messageType: 'text' | 'quote' | 'document' = 'text'): Promise<Message> {
    await delay(100);
    return mockApi.addMessage(tableId, CURRENT_AGENT_ID, content, messageType);
  },

  async getMessages(tableId: string): Promise<Message[]> {
    await delay(100);
    return mockApi.getMessages(tableId);
  },

  // Quote endpoints
  async submitQuote(tableId: string, amount: number, description: string): Promise<Quote> {
    await delay(200);
    return mockApi.submitQuote(tableId, CURRENT_AGENT_ID, amount, description);
  },

  async getQuote(tableId: string): Promise<Quote | null> {
    await delay(100);
    return mockApi.getQuote(tableId) || null;
  },

  async approveQuote(tableId: string): Promise<Quote> {
    await delay(200);
    return mockApi.approveQuote(tableId, CURRENT_AGENT_ID)!;
  },

  // Contract endpoints
  async createContract(tableId: string, amount: number, deliverables: string[], timeline: { start: number; end: number }): Promise<Contract> {
    await delay(200);
    return mockApi.createContract(tableId, amount, deliverables, timeline);
  },

  async getContract(tableId: string): Promise<Contract | null> {
    await delay(100);
    return mockApi.getContract(tableId) || null;
  },

  async signContract(tableId: string): Promise<Contract> {
    await delay(200);
    const table = mockApi.getTable(tableId);
    const isBuyer = table?.creatorId === CURRENT_AGENT_ID;
    return mockApi.signContract(tableId, CURRENT_AGENT_ID, isBuyer)!;
  },

  // Escrow endpoints
  async depositEscrow(tableId: string, amount: number): Promise<Escrow> {
    await delay(300);
    const table = mockApi.getTable(tableId);
    const participant = mockApi.getAgent(table?.participantId || '');
    return mockApi.depositEscrow(
      tableId,
      amount,
      CURRENT_WALLET,
      participant?.walletAddress || ''
    );
  },

  async getEscrow(tableId: string): Promise<Escrow | null> {
    await delay(100);
    return mockApi.getEscrow(tableId) || null;
  },

  async approveRelease(tableId: string): Promise<Escrow> {
    await delay(200);
    return mockApi.approveEscrowRelease(tableId, CURRENT_AGENT_ID)!;
  },

  async cancelEscrow(tableId: string): Promise<Escrow | null> {
    await delay(200);
    const escrow = mockApi.getEscrow(tableId);
    if (escrow) {
      escrow.status = 'cancelled';
    }
    return escrow || null;
  },

  // Work endpoints
  async submitWork(tableId: string, deliverables: { description: string }[], proof?: string) {
    await delay(200);
    return mockApi.submitWork(tableId, CURRENT_AGENT_ID, deliverables, proof);
  },

  // Dispute endpoints
  async openDispute(tableId: string, reason: 'quality' | 'non_delivery' | 'other', evidence: string[] = []): Promise<Dispute> {
    await delay(200);
    return mockApi.openDispute(tableId, CURRENT_AGENT_ID, reason, evidence);
  },

  async getDispute(tableId: string): Promise<Dispute | null> {
    await delay(100);
    return null; // Mock returns null for now
  },

  // Current user info
  getCurrentAgentId(): string {
    return CURRENT_AGENT_ID;
  },

  getCurrentWallet(): string {
    return CURRENT_WALLET;
  },
};

export default api;
