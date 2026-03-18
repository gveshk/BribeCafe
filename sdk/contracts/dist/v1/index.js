"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTableResponseSchema = exports.RegisterAgentResponseSchema = exports.OpenDisputeRequestSchema = exports.EscrowDepositRequestSchema = exports.CreateContractRequestSchema = exports.SubmitQuoteRequestSchema = exports.SendMessageRequestSchema = exports.CreateTableRequestSchema = exports.WalletAuthRequestSchema = exports.UpdateAgentRequestSchema = exports.CreateAgentRequestSchema = exports.WorkSubmissionSchema = exports.DisputeSchema = exports.DisputeDecisionSchema = exports.DisputeReasonSchema = exports.EscrowEventSchema = exports.EscrowEventTypeSchema = exports.EscrowStatusSchema = exports.EscrowStatusValueSchema = exports.ContractSchema = exports.ContractTimelineSchema = exports.QuoteSchema = exports.DeliverableSchema = exports.MessageSchema = exports.MessageTypeSchema = exports.TableSchema = exports.TableStatusSchema = exports.AgentSchema = exports.AgentMetadataSchema = void 0;
const zod_1 = require("zod");
const EthAddressSchema = zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/);
exports.AgentMetadataSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional().default(''),
    avatar: zod_1.z.string().optional(),
});
exports.AgentSchema = zod_1.z.object({
    id: zod_1.z.string(),
    ownerAddress: EthAddressSchema,
    owner: EthAddressSchema.optional(),
    publicKey: zod_1.z.string(),
    capabilities: zod_1.z.array(zod_1.z.string()),
    reputationScore: zod_1.z.number(),
    walletAddress: EthAddressSchema,
    metadata: exports.AgentMetadataSchema,
    createdAt: zod_1.z.union([zod_1.z.date(), zod_1.z.number()]),
    updatedAt: zod_1.z.union([zod_1.z.date(), zod_1.z.number()]),
});
exports.TableStatusSchema = zod_1.z.enum(['negotiation', 'quoted', 'quote_approved', 'contract_created', 'funded', 'in_progress', 'delivery_submitted', 'accepted', 'released', 'disputed', 'cancelled']);
exports.TableSchema = zod_1.z.object({
    id: zod_1.z.string(),
    creatorId: zod_1.z.string(),
    participantId: zod_1.z.string(),
    status: exports.TableStatusSchema,
    encryptedBudget: zod_1.z.string().optional(),
    encryptedQuote: zod_1.z.string().optional(),
    contractHash: zod_1.z.string().optional(),
    createdAt: zod_1.z.union([zod_1.z.date(), zod_1.z.number()]),
    updatedAt: zod_1.z.union([zod_1.z.date(), zod_1.z.number()]),
});
exports.MessageTypeSchema = zod_1.z.enum(['text', 'quote', 'document', 'contract', 'work', 'system']);
exports.MessageSchema = zod_1.z.object({
    id: zod_1.z.string(),
    tableId: zod_1.z.string(),
    senderId: zod_1.z.string(),
    content: zod_1.z.string(),
    messageType: exports.MessageTypeSchema,
    createdAt: zod_1.z.union([zod_1.z.date(), zod_1.z.number()]),
});
exports.DeliverableSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    description: zod_1.z.string(),
    completed: zod_1.z.boolean().optional(),
});
exports.QuoteSchema = zod_1.z.object({
    id: zod_1.z.string(),
    tableId: zod_1.z.string(),
    sellerId: zod_1.z.string(),
    submitterId: zod_1.z.string().optional(),
    encryptedAmount: zod_1.z.string(),
    amount: zod_1.z.number().optional(),
    description: zod_1.z.string(),
    approved: zod_1.z.boolean().optional(),
    approvedBy: zod_1.z.union([zod_1.z.string(), zod_1.z.array(zod_1.z.string())]).optional(),
    approvedAt: zod_1.z.union([zod_1.z.date(), zod_1.z.number()]).optional(),
    createdAt: zod_1.z.union([zod_1.z.date(), zod_1.z.number()]),
    updatedAt: zod_1.z.union([zod_1.z.date(), zod_1.z.number()]).optional(),
});
exports.ContractTimelineSchema = zod_1.z.object({
    start: zod_1.z.number(),
    end: zod_1.z.number(),
});
exports.ContractSchema = zod_1.z.object({
    id: zod_1.z.string(),
    tableId: zod_1.z.string(),
    buyerId: zod_1.z.string().optional(),
    sellerId: zod_1.z.string().optional(),
    encryptedAmount: zod_1.z.string().optional(),
    amount: zod_1.z.number().optional(),
    deliverables: zod_1.z.union([zod_1.z.array(zod_1.z.string()), zod_1.z.array(exports.DeliverableSchema)]),
    timeline: exports.ContractTimelineSchema,
    buyerSigned: zod_1.z.boolean(),
    sellerSigned: zod_1.z.boolean(),
    buyerSignedAt: zod_1.z.union([zod_1.z.date(), zod_1.z.number()]).optional(),
    sellerSignedAt: zod_1.z.union([zod_1.z.date(), zod_1.z.number()]).optional(),
    createdAt: zod_1.z.union([zod_1.z.date(), zod_1.z.number()]),
    updatedAt: zod_1.z.union([zod_1.z.date(), zod_1.z.number()]).optional(),
});
exports.EscrowStatusValueSchema = zod_1.z.enum(['pending', 'deposited', 'released', 'cancelled', 'disputed']);
exports.EscrowStatusSchema = zod_1.z.object({
    tableId: zod_1.z.string(),
    amount: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]),
    fee: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]),
    buyerAddress: zod_1.z.string().optional(),
    sellerAddress: zod_1.z.string().optional(),
    status: exports.EscrowStatusValueSchema.optional(),
    buyerApproved: zod_1.z.boolean(),
    sellerApproved: zod_1.z.boolean(),
    released: zod_1.z.boolean().optional(),
    cancelled: zod_1.z.boolean().optional(),
    disputed: zod_1.z.boolean().optional(),
    releasedAt: zod_1.z.union([zod_1.z.date(), zod_1.z.number()]).optional(),
});
exports.EscrowEventTypeSchema = zod_1.z.enum(['created', 'deposited', 'released', 'cancelled', 'disputed']);
exports.EscrowEventSchema = zod_1.z.object({
    id: zod_1.z.string(),
    tableId: zod_1.z.string(),
    eventType: exports.EscrowEventTypeSchema,
    amount: zod_1.z.string(),
    fee: zod_1.z.string(),
    txHash: zod_1.z.string(),
    createdAt: zod_1.z.union([zod_1.z.date(), zod_1.z.number()]),
});
exports.DisputeReasonSchema = zod_1.z.enum(['quality', 'non_delivery', 'other']);
exports.DisputeDecisionSchema = zod_1.z.enum(['buyer_wins', 'seller_wins', 'split']);
exports.DisputeSchema = zod_1.z.object({
    id: zod_1.z.string(),
    tableId: zod_1.z.string(),
    openedBy: zod_1.z.string(),
    reason: exports.DisputeReasonSchema,
    evidence: zod_1.z.array(zod_1.z.string()),
    status: zod_1.z.enum(['open', 'under_review', 'resolved']).optional(),
    resolution: exports.DisputeDecisionSchema.nullable().optional(),
    decision: exports.DisputeDecisionSchema.optional(),
    decidedBy: zod_1.z.string().optional(),
    decidedAt: zod_1.z.union([zod_1.z.date(), zod_1.z.number()]).optional(),
    createdAt: zod_1.z.union([zod_1.z.date(), zod_1.z.number()]),
});
exports.WorkSubmissionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    tableId: zod_1.z.string(),
    submitterId: zod_1.z.string(),
    deliverables: zod_1.z.array(exports.DeliverableSchema),
    proof: zod_1.z.string().optional(),
    submittedAt: zod_1.z.number(),
});
exports.CreateAgentRequestSchema = exports.AgentSchema.pick({
    ownerAddress: true,
    publicKey: true,
    capabilities: true,
    walletAddress: true,
    metadata: true,
});
exports.UpdateAgentRequestSchema = exports.CreateAgentRequestSchema.partial();
exports.WalletAuthRequestSchema = zod_1.z.object({
    address: EthAddressSchema,
    signature: zod_1.z.string(),
    message: zod_1.z.string(),
});
exports.CreateTableRequestSchema = zod_1.z.object({
    participantId: zod_1.z.string().uuid(),
    encryptedBudget: zod_1.z.string().optional(),
});
exports.SendMessageRequestSchema = zod_1.z.object({
    content: zod_1.z.string().min(1),
    messageType: exports.MessageTypeSchema.default('text'),
});
exports.SubmitQuoteRequestSchema = zod_1.z.object({
    encryptedAmount: zod_1.z.string().min(1),
    description: zod_1.z.string().min(1),
});
exports.CreateContractRequestSchema = zod_1.z.object({
    encryptedAmount: zod_1.z.string().min(1),
    deliverables: zod_1.z.array(zod_1.z.string()).min(1),
    timeline: exports.ContractTimelineSchema,
});
exports.EscrowDepositRequestSchema = zod_1.z.object({
    amount: zod_1.z.string().min(1),
});
exports.OpenDisputeRequestSchema = zod_1.z.object({
    reason: exports.DisputeReasonSchema,
    evidence: zod_1.z.array(zod_1.z.string()),
});
exports.RegisterAgentResponseSchema = zod_1.z.object({
    agent: exports.AgentSchema,
    token: zod_1.z.string(),
});
exports.CreateTableResponseSchema = zod_1.z.object({ table: exports.TableSchema });
