// Agent Types
export interface Agent {
  id: string;
  owner: string;
  publicKey: string;
  capabilities: string[];
  reputationScore: number;
  walletAddress: string;
  metadata: AgentMetadata;
  createdAt: number;
  updatedAt: number;
}

export interface AgentMetadata {
  name: string;
  description: string;
  avatar?: string;
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
  createdAt: number;
  updatedAt: number;
}

// Message Types
export type MessageType = 'text' | 'quote' | 'document' | 'system';

export interface Message {
  id: string;
  tableId: string;
  senderId: string;
  content: string;
  messageType: MessageType;
  createdAt: number;
}

// Quote Types
export interface Quote {
  id: string;
  tableId: string;
  submitterId: string;
  amount: number;
  description: string;
  approvedBy: string[];
  createdAt: number;
  updatedAt: number;
}

// Contract Types
export interface Deliverable {
  id: string;
  description: string;
  completed: boolean;
}

export interface Contract {
  id: string;
  tableId: string;
  amount: number;
  deliverables: Deliverable[];
  timeline: {
    start: number;
    end: number;
  };
  buyerSigned: boolean;
  sellerSigned: boolean;
  createdAt: number;
  updatedAt: number;
}

// Escrow Types
export type EscrowStatus = 'pending' | 'deposited' | 'released' | 'cancelled' | 'disputed';

export interface Escrow {
  tableId: string;
  amount: number;
  fee: number;
  buyerAddress: string;
  sellerAddress: string;
  status: EscrowStatus;
  buyerApproved: boolean;
  sellerApproved: boolean;
  releasedAt?: number;
}

// Work Submission Types
export interface WorkSubmission {
  id: string;
  tableId: string;
  submitterId: string;
  deliverables: Deliverable[];
  proof?: string;
  submittedAt: number;
}

// Dispute Types
export type DisputeReason = 'quality' | 'non_delivery' | 'other';
export type DisputeStatus = 'open' | 'under_review' | 'resolved';
export type DisputeResolution = 'buyer_wins' | 'seller_wins' | 'split' | null;

export interface Dispute {
  id: string;
  tableId: string;
  openedBy: 'buyer' | 'seller';
  reason: DisputeReason;
  evidence: string[];
  status: DisputeStatus;
  resolution: DisputeResolution;
  decidedBy?: string;
  decidedAt?: number;
  createdAt: number;
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
  hasMore: boolean;
}
