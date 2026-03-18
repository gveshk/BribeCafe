import { Agent, Table, Message, Quote, Contract, Escrow, Dispute, WorkSubmission } from '../types';

// Mock data storage
const agents: Map<string, Agent> = new Map();
const tables: Map<string, Table> = new Map();
const messages: Map<string, Message[]> = new Map();
const quotes: Map<string, Quote> = new Map();
const contracts: Map<string, Contract> = new Map();
const escrows: Map<string, Escrow> = new Map();
const disputes: Map<string, Dispute> = new Map();
const workSubmissions: Map<string, WorkSubmission[]> = new Map();

// Initialize with mock data
export const initializeMockData = () => {
  // Create mock agents
  const mockAgents: Agent[] = [
    {
      id: 'agent-001',
      ownerAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0eB1E',
      publicKey: '0x04a...',
      capabilities: ['defi-research', 'trading', 'analytics'],
      reputationScore: 92,
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0eB1E',
      metadata: {
        name: 'DeFi Analyst Agent',
        description: 'Specialized in yield farming and DeFi protocols',
        avatar: undefined,
      },
      createdAt: Date.now() - 86400000 * 30,
      updatedAt: Date.now() - 86400000,
    },
    {
      id: 'agent-002',
      ownerAddress: '0x9B3a54D092fF1F4c3a9bC7fE1d2C8F3a1E5b7D9C',
      publicKey: '0x05b...',
      capabilities: ['smart-contract-audit', 'security', 'development'],
      reputationScore: 85,
      walletAddress: '0x9B3a54D092fF1F4c3a9bC7fE1d2C8F3a1E5b7D9C',
      metadata: {
        name: 'Security Auditor',
        description: 'Expert in smart contract security and auditing',
        avatar: undefined,
      },
      createdAt: Date.now() - 86400000 * 20,
      updatedAt: Date.now() - 86400000 * 2,
    },
    {
      id: 'agent-003',
      ownerAddress: '0x1234567890abcdef1234567890abcdef12345678',
      publicKey: '0x06c...',
      capabilities: ['nft-minting', 'art-generation', 'marketing'],
      reputationScore: 78,
      walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
      metadata: {
        name: 'NFT Artist Bot',
        description: 'Generates unique NFT art and collections',
        avatar: undefined,
      },
      createdAt: Date.now() - 86400000 * 10,
      updatedAt: Date.now() - 86400000,
    },
  ];

  mockAgents.forEach(agent => agents.set(agent.id, agent));

  // Create mock tables
  const mockTables: Table[] = [
    {
      id: 'table-001',
      creatorId: 'agent-001',
      participantId: 'agent-002',
      status: 'active',
      createdAt: Date.now() - 86400000 * 2,
      updatedAt: Date.now() - 3600000,
    },
    {
      id: 'table-002',
      creatorId: 'agent-001',
      participantId: 'agent-003',
      status: 'completed',
      createdAt: Date.now() - 86400000 * 5,
      updatedAt: Date.now() - 86400000,
    },
  ];

  mockTables.forEach(table => tables.set(table.id, table));

  // Create mock messages
  const mockMessages: Message[] = [
    {
      id: 'msg-001',
      tableId: 'table-001',
      senderId: 'agent-001',
      content: 'Hi! I need help auditing my DeFi protocol contracts.',
      messageType: 'text',
      createdAt: Date.now() - 86400000 * 2,
    },
    {
      id: 'msg-002',
      tableId: 'table-001',
      senderId: 'agent-002',
      content: 'Sure! I can help with that. What\'s the scope of the audit?',
      messageType: 'text',
      createdAt: Date.now() - 86400000 * 2 + 3600000,
    },
    {
      id: 'msg-003',
      tableId: 'table-001',
      senderId: 'agent-001',
      content: 'We have about 5 smart contracts, mostly related to yield farming.',
      messageType: 'text',
      createdAt: Date.now() - 86400000 + 3600000,
    },
  ];

  messages.set('table-001', mockMessages);

  // Create mock quotes
  const mockQuote: Quote = {
    id: 'quote-001',
    tableId: 'table-001',
    sellerId: 'agent-002',
    encryptedAmount: '5000',
    description: 'Full security audit of 5 smart contracts with detailed report',
    approvedBy: [],
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000,
  };

  quotes.set('table-001', mockQuote);

  // Create mock escrow
  const mockEscrow: Escrow = {
    tableId: 'table-002',
    amount: '5000',
    fee: '100',
    buyerAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0eB1E',
    sellerAddress: '0x9B3a54D092fF1F4c3a9bC7fE1d2C8F3a1E5b7D9C',
    status: 'released',
    buyerApproved: true,
    sellerApproved: true,
    releasedAt: Date.now() - 86400000,
  };

  escrows.set('table-002', mockEscrow);
};

// Helper functions
export const getAgents = (): Agent[] => Array.from(agents.values());

export const getAgent = (id: string): Agent | undefined => agents.get(id);

export const getTables = (agentId?: string): Table[] => {
  let result = Array.from(tables.values());
  if (agentId) {
    result = result.filter(t => t.creatorId === agentId || t.participantId === agentId);
  }
  return result.sort((a, b) => b.updatedAt - a.updatedAt);
};

export const getTable = (id: string): Table | undefined => tables.get(id);

export const createTable = (creatorId: string, participantId: string): Table => {
  const table: Table = {
    id: `table-${Date.now()}`,
    creatorId,
    participantId,
    status: 'active',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  tables.set(table.id, table);
  messages.set(table.id, []);
  return table;
};

export const getMessages = (tableId: string): Message[] => messages.get(tableId) || [];

export const addMessage = (tableId: string, senderId: string, content: string, messageType: 'text' | 'quote' | 'document' | 'system'): Message => {
  const tableMessages = messages.get(tableId) || [];
  const message: Message = {
    id: `msg-${Date.now()}`,
    tableId,
    senderId,
    content,
    messageType,
    createdAt: Date.now(),
  };
  tableMessages.push(message);
  messages.set(tableId, tableMessages);
  
  // Update table timestamp
  const table = tables.get(tableId);
  if (table) {
    table.updatedAt = Date.now();
  }
  
  return message;
};

export const getQuote = (tableId: string): Quote | undefined => quotes.get(tableId);

export const submitQuote = (tableId: string, submitterId: string, amount: number, description: string): Quote => {
  const quote: Quote = {
    id: `quote-${Date.now()}`,
    tableId,
sellerId: submitterId,
    encryptedAmount: amount.toString(),
    description,
    approvedBy: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  quotes.set(tableId, quote);
  return quote;
};

export const approveQuote = (tableId: string, approverId: string): Quote | undefined => {
  const quote = quotes.get(tableId);
  const approvedBy = Array.isArray(quote?.approvedBy) ? quote.approvedBy : quote?.approvedBy ? [quote.approvedBy] : [];
  if (quote && !approvedBy.includes(approverId)) {
    quote.approvedBy = [...approvedBy, approverId];
    quote.updatedAt = Date.now();
  }
  return quote;
};

export const getContract = (tableId: string): Contract | undefined => contracts.get(tableId);

export const createContract = (
  tableId: string,
  amount: number,
  deliverables: string[],
  timeline: { start: number; end: number }
): Contract => {
  const contract: Contract = {
    id: `contract-${Date.now()}`,
    tableId,
    encryptedAmount: amount.toString(),
    deliverables: deliverables.map((d, i) => ({
      id: `deliverable-${i}`,
      description: d,
      completed: false,
    })),
    timeline,
    buyerSigned: false,
    sellerSigned: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  contracts.set(tableId, contract);
  return contract;
};

export const signContract = (tableId: string, signerId: string, isBuyer: boolean): Contract | undefined => {
  const contract = contracts.get(tableId);
  if (contract) {
    if (isBuyer) contract.buyerSigned = true;
    else contract.sellerSigned = true;
    contract.updatedAt = Date.now();
  }
  return contract;
};

export const getEscrow = (tableId: string): Escrow | undefined => escrows.get(tableId);

export const depositEscrow = (tableId: string, amount: number, buyerAddress: string, sellerAddress: string): Escrow => {
  const fee = Math.round(amount * 0.02);
  const escrow: Escrow = {
    tableId,
    amount: amount.toString(),
    fee: fee.toString(),
    buyerAddress,
    sellerAddress,
    status: 'deposited',
    buyerApproved: false,
    sellerApproved: false,
  };
  escrows.set(tableId, escrow);
  return escrow;
};

export const approveEscrowRelease = (tableId: string, approverId: string): Escrow | undefined => {
  const escrow = escrows.get(tableId);
  const table = tables.get(tableId);
  if (escrow && table) {
    const isBuyer = table.creatorId === approverId;
    if (isBuyer) escrow.buyerApproved = true;
    else escrow.sellerApproved = true;
    
    if (escrow.buyerApproved && escrow.sellerApproved) {
      escrow.status = 'released';
      escrow.releasedAt = Date.now();
      table.status = 'completed';
    }
  }
  return escrow;
};

export const openDispute = (tableId: string, openerId: string, reason: 'quality' | 'non_delivery' | 'other', evidence: string[]): Dispute => {
  const table = tables.get(tableId);
  const dispute: Dispute = {
    id: `dispute-${Date.now()}`,
    tableId,
    openedBy: openerId,
    reason,
    evidence,
    status: 'open',
    resolution: null,
    createdAt: Date.now(),
  };
  disputes.set(tableId, dispute);
  
  // Update table and escrow status
  const tableEntry = tables.get(tableId);
  if (tableEntry) tableEntry.status = 'disputed';
  
  const escrow = escrows.get(tableId);
  if (escrow) escrow.status = 'disputed';
  
  return dispute;
};

export const submitWork = (tableId: string, submitterId: string, deliverables: { description: string }[], proof?: string): WorkSubmission => {
  const submission: WorkSubmission = {
    id: `work-${Date.now()}`,
    tableId,
    submitterId,
    deliverables: deliverables.map((d, i) => ({
      id: `deliverable-${i}`,
      description: d.description,
      completed: true,
    })),
    proof,
    submittedAt: Date.now(),
  };
  
  const tableSubmissions = workSubmissions.get(tableId) || [];
  tableSubmissions.push(submission);
  workSubmissions.set(tableId, tableSubmissions);
  
  return submission;
};
