// Agent Types
export interface Agent {
  id: string;
  ownerAddress: string;
  publicKey: string;
  capabilities: string[];
  reputationScore: number;
  walletAddress: string;
  metadata: AgentMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentMetadata {
  name: string;
  description: string;
  avatar?: string;
}

export interface CreateAgentInput {
  ownerAddress: string;
  publicKey: string;
  capabilities: string[];
  walletAddress: string;
  metadata: AgentMetadata;
}

// Table Types
export type TableStatus = 'active' | 'completed' | 'cancelled' | 'disputed';

export interface Table {
  id: string;
  creatorId: string;
  participantId: string;
  status: TableStatus;
  encryptedBudget?: string;
  encryptedQuote?: string;
  contractHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTableInput {
  creatorId: string;
  participantId: string;
  encryptedBudget?: string;
}

// Message Types
export type MessageType = 'text' | 'quote' | 'document' | 'contract' | 'work' | 'system';

export interface Message {
  id: string;
  tableId: string;
  senderId: string;
  content: string;
  messageType: MessageType;
  createdAt: Date;
}

export interface CreateMessageInput {
  tableId: string;
  senderId: string;
  content: string;
  messageType: MessageType;
}

// Quote Types
export interface Quote {
  id: string;
  tableId: string;
  sellerId: string;
  encryptedAmount: string;
  description: string;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
}

export interface CreateQuoteInput {
  tableId: string;
  sellerId: string;
  encryptedAmount: string;
  description: string;
}

// Contract Types
export interface Contract {
  id: string;
  tableId: string;
  buyerId: string;
  sellerId: string;
  encryptedAmount: string;
  deliverables: string[];
  timeline: ContractTimeline;
  buyerSigned: boolean;
  sellerSigned: boolean;
  buyerSignedAt?: Date;
  sellerSignedAt?: Date;
  createdAt: Date;
}

export interface ContractTimeline {
  start: number;
  end: number;
}

export interface CreateContractInput {
  tableId: string;
  buyerId: string;
  sellerId: string;
  encryptedAmount: string;
  deliverables: string[];
  timeline: ContractTimeline;
}

// Escrow Types
export type EscrowEventType = 'created' | 'deposited' | 'released' | 'cancelled' | 'disputed';

export interface EscrowEvent {
  id: string;
  tableId: string;
  eventType: EscrowEventType;
  amount: string;
  fee: string;
  txHash: string;
  createdAt: Date;
}

export interface EscrowStatus {
  tableId: string;
  amount: string;
  fee: string;
  buyerApproved: boolean;
  sellerApproved: boolean;
  released: boolean;
  cancelled: boolean;
  disputed: boolean;
}

// Dispute Types
export type DisputeReason = 'quality' | 'non_delivery' | 'other';
export type DisputeDecision = 'buyer_wins' | 'seller_wins' | 'split';

export interface Dispute {
  id: string;
  tableId: string;
  openedBy: string;
  reason: DisputeReason;
  evidence: string[];
  decision?: DisputeDecision;
  decidedBy?: string;
  decidedAt?: Date;
  createdAt: Date;
}

export interface CreateDisputeInput {
  tableId: string;
  openedBy: string;
  reason: DisputeReason;
  evidence: string[];
}

export interface ResolveDisputeInput {
  disputeId: string;
  decidedBy: string;
  decision: DisputeDecision;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// Auth Types
export interface AuthPayload {
  agentId: string;
  ownerAddress: string;
}

export interface WalletAuthRequest {
  address: string;
  signature: string;
  message: string;
}
