import { z } from 'zod';

const EthAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);

export const AgentMetadataSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(''),
  avatar: z.string().optional(),
});

export const AgentSchema = z.object({
  id: z.string(),
  ownerAddress: EthAddressSchema,
  owner: EthAddressSchema.optional(),
  publicKey: z.string(),
  capabilities: z.array(z.string()),
  reputationScore: z.number(),
  walletAddress: EthAddressSchema,
  metadata: AgentMetadataSchema,
  createdAt: z.union([z.date(), z.number()]),
  updatedAt: z.union([z.date(), z.number()]),
});

export const TableStatusSchema = z.enum(['negotiation', 'quoted', 'quote_approved', 'contract_created', 'funded', 'in_progress', 'delivery_submitted', 'accepted', 'released', 'disputed', 'cancelled']);
export const TableSchema = z.object({
  id: z.string(),
  creatorId: z.string(),
  participantId: z.string(),
  status: TableStatusSchema,
  encryptedBudget: z.string().optional(),
  encryptedQuote: z.string().optional(),
  contractHash: z.string().optional(),
  createdAt: z.union([z.date(), z.number()]),
  updatedAt: z.union([z.date(), z.number()]),
});

export const MessageTypeSchema = z.enum(['text', 'quote', 'document', 'contract', 'work', 'system']);
export const MessageSchema = z.object({
  id: z.string(),
  tableId: z.string(),
  senderId: z.string(),
  content: z.string(),
  messageType: MessageTypeSchema,
  createdAt: z.union([z.date(), z.number()]),
});

export const DeliverableSchema = z.object({
  id: z.string().optional(),
  description: z.string(),
  completed: z.boolean().optional(),
});

export const QuoteSchema = z.object({
  id: z.string(),
  tableId: z.string(),
  sellerId: z.string(),
  submitterId: z.string().optional(),
  encryptedAmount: z.string(),
  amount: z.number().optional(),
  description: z.string(),
  approved: z.boolean().optional(),
  approvedBy: z.union([z.string(), z.array(z.string())]).optional(),
  approvedAt: z.union([z.date(), z.number()]).optional(),
  createdAt: z.union([z.date(), z.number()]),
  updatedAt: z.union([z.date(), z.number()]).optional(),
});

export const ContractTimelineSchema = z.object({
  start: z.number(),
  end: z.number(),
});

export const ContractSchema = z.object({
  id: z.string(),
  tableId: z.string(),
  buyerId: z.string().optional(),
  sellerId: z.string().optional(),
  encryptedAmount: z.string().optional(),
  amount: z.number().optional(),
  deliverables: z.union([z.array(z.string()), z.array(DeliverableSchema)]),
  timeline: ContractTimelineSchema,
  buyerSigned: z.boolean(),
  sellerSigned: z.boolean(),
  buyerSignedAt: z.union([z.date(), z.number()]).optional(),
  sellerSignedAt: z.union([z.date(), z.number()]).optional(),
  createdAt: z.union([z.date(), z.number()]),
  updatedAt: z.union([z.date(), z.number()]).optional(),
});

export const EscrowStatusValueSchema = z.enum(['pending', 'deposited', 'released', 'cancelled', 'disputed']);
export const EscrowStatusSchema = z.object({
  tableId: z.string(),
  amount: z.union([z.string(), z.number()]),
  fee: z.union([z.string(), z.number()]),
  buyerAddress: z.string().optional(),
  sellerAddress: z.string().optional(),
  status: EscrowStatusValueSchema.optional(),
  buyerApproved: z.boolean(),
  sellerApproved: z.boolean(),
  released: z.boolean().optional(),
  cancelled: z.boolean().optional(),
  disputed: z.boolean().optional(),
  releasedAt: z.union([z.date(), z.number()]).optional(),
});

export const EscrowEventTypeSchema = z.enum(['created', 'deposited', 'released', 'cancelled', 'disputed']);
export const EscrowEventSchema = z.object({
  id: z.string(),
  tableId: z.string(),
  eventType: EscrowEventTypeSchema,
  amount: z.string(),
  fee: z.string(),
  txHash: z.string(),
  createdAt: z.union([z.date(), z.number()]),
});

export const DisputeReasonSchema = z.enum(['quality', 'non_delivery', 'other']);
export const DisputeDecisionSchema = z.enum(['buyer_wins', 'seller_wins', 'split']);
export const DisputeSchema = z.object({
  id: z.string(),
  tableId: z.string(),
  openedBy: z.string(),
  reason: DisputeReasonSchema,
  evidence: z.array(z.string()),
  status: z.enum(['open', 'under_review', 'resolved']).optional(),
  resolution: DisputeDecisionSchema.nullable().optional(),
  decision: DisputeDecisionSchema.optional(),
  decidedBy: z.string().optional(),
  decidedAt: z.union([z.date(), z.number()]).optional(),
  createdAt: z.union([z.date(), z.number()]),
});

export const WorkSubmissionSchema = z.object({
  id: z.string(),
  tableId: z.string(),
  submitterId: z.string(),
  deliverables: z.array(DeliverableSchema),
  proof: z.string().optional(),
  submittedAt: z.number(),
});

export const CreateAgentRequestSchema = AgentSchema.pick({
  ownerAddress: true,
  publicKey: true,
  capabilities: true,
  walletAddress: true,
  metadata: true,
});

export const UpdateAgentRequestSchema = CreateAgentRequestSchema.partial();

export const WalletAuthRequestSchema = z.object({
  address: EthAddressSchema,
  signature: z.string(),
  message: z.string(),
});

export const CreateTableRequestSchema = z.object({
  participantId: z.string().uuid(),
  encryptedBudget: z.string().optional(),
});

export const SendMessageRequestSchema = z.object({
  content: z.string().min(1),
  messageType: MessageTypeSchema.default('text'),
});

export const SubmitQuoteRequestSchema = z.object({
  encryptedAmount: z.string().min(1),
  description: z.string().min(1),
});

export const CreateContractRequestSchema = z.object({
  encryptedAmount: z.string().min(1),
  deliverables: z.array(z.string()).min(1),
  timeline: ContractTimelineSchema,
});

export const EscrowDepositRequestSchema = z.object({
  amount: z.string().min(1),
});

export const OpenDisputeRequestSchema = z.object({
  reason: DisputeReasonSchema,
  evidence: z.array(z.string()),
});

export const RegisterAgentResponseSchema = z.object({
  agent: AgentSchema,
  token: z.string(),
});

export const CreateTableResponseSchema = z.object({ table: TableSchema });

export type Agent = z.infer<typeof AgentSchema>;
export type AgentMetadata = z.infer<typeof AgentMetadataSchema>;
export type TableStatus = z.infer<typeof TableStatusSchema>;
export type Table = z.infer<typeof TableSchema>;
export type MessageType = z.infer<typeof MessageTypeSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type Deliverable = z.infer<typeof DeliverableSchema>;
export type Quote = z.infer<typeof QuoteSchema>;
export type ContractTimeline = z.infer<typeof ContractTimelineSchema>;
export type Contract = z.infer<typeof ContractSchema>;
export type EscrowStatusValue = z.infer<typeof EscrowStatusValueSchema>;
export type EscrowStatus = z.infer<typeof EscrowStatusSchema>;
export type Escrow = EscrowStatus;
export type EscrowEventType = z.infer<typeof EscrowEventTypeSchema>;
export type EscrowEvent = z.infer<typeof EscrowEventSchema>;
export type DisputeReason = z.infer<typeof DisputeReasonSchema>;
export type DisputeDecision = z.infer<typeof DisputeDecisionSchema>;
export type Dispute = z.infer<typeof DisputeSchema>;
export type WorkSubmission = z.infer<typeof WorkSubmissionSchema>;

export type CreateAgentInput = z.infer<typeof CreateAgentRequestSchema>;
export type UpdateAgentInput = z.infer<typeof UpdateAgentRequestSchema>;
export type WalletAuthRequest = z.infer<typeof WalletAuthRequestSchema>;
export type CreateTableInput = {
  creatorId: string;
  participantId: string;
  encryptedBudget?: string;
};
export type CreateMessageInput = {
  tableId: string;
  senderId: string;
} & z.infer<typeof SendMessageRequestSchema>;
export type CreateQuoteInput = {
  tableId: string;
  sellerId: string;
} & z.infer<typeof SubmitQuoteRequestSchema>;
export type CreateContractInput = {
  tableId: string;
  buyerId: string;
  sellerId: string;
  encryptedAmount: string;
  deliverables: string[];
  timeline: Record<string, unknown>;
};
export type CreateDisputeInput = {
  tableId: string;
  openedBy: string;
} & z.infer<typeof OpenDisputeRequestSchema>;

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
};

export type AuthPayload = {
  agentId: string;
  ownerAddress: string;
};
