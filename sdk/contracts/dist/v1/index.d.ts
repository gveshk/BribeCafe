import { z } from 'zod';
export declare const AgentMetadataSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    avatar: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string;
    avatar?: string | undefined;
}, {
    name: string;
    description?: string | undefined;
    avatar?: string | undefined;
}>;
export declare const AgentSchema: z.ZodObject<{
    id: z.ZodString;
    ownerAddress: z.ZodString;
    owner: z.ZodOptional<z.ZodString>;
    publicKey: z.ZodString;
    capabilities: z.ZodArray<z.ZodString, "many">;
    reputationScore: z.ZodNumber;
    walletAddress: z.ZodString;
    metadata: z.ZodObject<{
        name: z.ZodString;
        description: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        avatar: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        description: string;
        avatar?: string | undefined;
    }, {
        name: string;
        description?: string | undefined;
        avatar?: string | undefined;
    }>;
    createdAt: z.ZodUnion<[z.ZodDate, z.ZodNumber]>;
    updatedAt: z.ZodUnion<[z.ZodDate, z.ZodNumber]>;
}, "strip", z.ZodTypeAny, {
    id: string;
    ownerAddress: string;
    publicKey: string;
    capabilities: string[];
    reputationScore: number;
    walletAddress: string;
    metadata: {
        name: string;
        description: string;
        avatar?: string | undefined;
    };
    createdAt: number | Date;
    updatedAt: number | Date;
    owner?: string | undefined;
}, {
    id: string;
    ownerAddress: string;
    publicKey: string;
    capabilities: string[];
    reputationScore: number;
    walletAddress: string;
    metadata: {
        name: string;
        description?: string | undefined;
        avatar?: string | undefined;
    };
    createdAt: number | Date;
    updatedAt: number | Date;
    owner?: string | undefined;
}>;
export declare const TableStatusSchema: z.ZodEnum<["negotiation", "quoted", "quote_approved", "contract_created", "funded", "in_progress", "delivery_submitted", "accepted", "released", "disputed", "cancelled"]>;
export declare const TableSchema: z.ZodObject<{
    id: z.ZodString;
    creatorId: z.ZodString;
    participantId: z.ZodString;
    status: z.ZodEnum<["negotiation", "quoted", "quote_approved", "contract_created", "funded", "in_progress", "delivery_submitted", "accepted", "released", "disputed", "cancelled"]>;
    encryptedBudget: z.ZodOptional<z.ZodString>;
    encryptedQuote: z.ZodOptional<z.ZodString>;
    contractHash: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodUnion<[z.ZodDate, z.ZodNumber]>;
    updatedAt: z.ZodUnion<[z.ZodDate, z.ZodNumber]>;
}, "strip", z.ZodTypeAny, {
    status: "negotiation" | "quoted" | "quote_approved" | "contract_created" | "funded" | "in_progress" | "delivery_submitted" | "accepted" | "released" | "disputed" | "cancelled";
    id: string;
    createdAt: number | Date;
    updatedAt: number | Date;
    creatorId: string;
    participantId: string;
    encryptedBudget?: string | undefined;
    encryptedQuote?: string | undefined;
    contractHash?: string | undefined;
}, {
    status: "negotiation" | "quoted" | "quote_approved" | "contract_created" | "funded" | "in_progress" | "delivery_submitted" | "accepted" | "released" | "disputed" | "cancelled";
    id: string;
    createdAt: number | Date;
    updatedAt: number | Date;
    creatorId: string;
    participantId: string;
    encryptedBudget?: string | undefined;
    encryptedQuote?: string | undefined;
    contractHash?: string | undefined;
}>;
export declare const MessageTypeSchema: z.ZodEnum<["text", "quote", "document", "contract", "work", "system"]>;
export declare const MessageSchema: z.ZodObject<{
    id: z.ZodString;
    tableId: z.ZodString;
    senderId: z.ZodString;
    content: z.ZodString;
    messageType: z.ZodEnum<["text", "quote", "document", "contract", "work", "system"]>;
    createdAt: z.ZodUnion<[z.ZodDate, z.ZodNumber]>;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: number | Date;
    tableId: string;
    senderId: string;
    content: string;
    messageType: "text" | "quote" | "document" | "contract" | "work" | "system";
}, {
    id: string;
    createdAt: number | Date;
    tableId: string;
    senderId: string;
    content: string;
    messageType: "text" | "quote" | "document" | "contract" | "work" | "system";
}>;
export declare const DeliverableSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    description: z.ZodString;
    completed: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    description: string;
    id?: string | undefined;
    completed?: boolean | undefined;
}, {
    description: string;
    id?: string | undefined;
    completed?: boolean | undefined;
}>;
export declare const QuoteSchema: z.ZodObject<{
    id: z.ZodString;
    tableId: z.ZodString;
    sellerId: z.ZodString;
    submitterId: z.ZodOptional<z.ZodString>;
    encryptedAmount: z.ZodString;
    amount: z.ZodOptional<z.ZodNumber>;
    description: z.ZodString;
    approved: z.ZodOptional<z.ZodBoolean>;
    approvedBy: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    approvedAt: z.ZodOptional<z.ZodUnion<[z.ZodDate, z.ZodNumber]>>;
    createdAt: z.ZodUnion<[z.ZodDate, z.ZodNumber]>;
    updatedAt: z.ZodOptional<z.ZodUnion<[z.ZodDate, z.ZodNumber]>>;
}, "strip", z.ZodTypeAny, {
    description: string;
    id: string;
    createdAt: number | Date;
    tableId: string;
    sellerId: string;
    encryptedAmount: string;
    updatedAt?: number | Date | undefined;
    submitterId?: string | undefined;
    amount?: number | undefined;
    approved?: boolean | undefined;
    approvedBy?: string | string[] | undefined;
    approvedAt?: number | Date | undefined;
}, {
    description: string;
    id: string;
    createdAt: number | Date;
    tableId: string;
    sellerId: string;
    encryptedAmount: string;
    updatedAt?: number | Date | undefined;
    submitterId?: string | undefined;
    amount?: number | undefined;
    approved?: boolean | undefined;
    approvedBy?: string | string[] | undefined;
    approvedAt?: number | Date | undefined;
}>;
export declare const ContractTimelineSchema: z.ZodObject<{
    start: z.ZodNumber;
    end: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    start: number;
    end: number;
}, {
    start: number;
    end: number;
}>;
export declare const ContractSchema: z.ZodObject<{
    id: z.ZodString;
    tableId: z.ZodString;
    buyerId: z.ZodOptional<z.ZodString>;
    sellerId: z.ZodOptional<z.ZodString>;
    encryptedAmount: z.ZodOptional<z.ZodString>;
    amount: z.ZodOptional<z.ZodNumber>;
    deliverables: z.ZodUnion<[z.ZodArray<z.ZodString, "many">, z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        description: z.ZodString;
        completed: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        id?: string | undefined;
        completed?: boolean | undefined;
    }, {
        description: string;
        id?: string | undefined;
        completed?: boolean | undefined;
    }>, "many">]>;
    timeline: z.ZodObject<{
        start: z.ZodNumber;
        end: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        start: number;
        end: number;
    }, {
        start: number;
        end: number;
    }>;
    buyerSigned: z.ZodBoolean;
    sellerSigned: z.ZodBoolean;
    buyerSignedAt: z.ZodOptional<z.ZodUnion<[z.ZodDate, z.ZodNumber]>>;
    sellerSignedAt: z.ZodOptional<z.ZodUnion<[z.ZodDate, z.ZodNumber]>>;
    createdAt: z.ZodUnion<[z.ZodDate, z.ZodNumber]>;
    updatedAt: z.ZodOptional<z.ZodUnion<[z.ZodDate, z.ZodNumber]>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: number | Date;
    tableId: string;
    deliverables: string[] | {
        description: string;
        id?: string | undefined;
        completed?: boolean | undefined;
    }[];
    timeline: {
        start: number;
        end: number;
    };
    buyerSigned: boolean;
    sellerSigned: boolean;
    updatedAt?: number | Date | undefined;
    sellerId?: string | undefined;
    encryptedAmount?: string | undefined;
    amount?: number | undefined;
    buyerId?: string | undefined;
    buyerSignedAt?: number | Date | undefined;
    sellerSignedAt?: number | Date | undefined;
}, {
    id: string;
    createdAt: number | Date;
    tableId: string;
    deliverables: string[] | {
        description: string;
        id?: string | undefined;
        completed?: boolean | undefined;
    }[];
    timeline: {
        start: number;
        end: number;
    };
    buyerSigned: boolean;
    sellerSigned: boolean;
    updatedAt?: number | Date | undefined;
    sellerId?: string | undefined;
    encryptedAmount?: string | undefined;
    amount?: number | undefined;
    buyerId?: string | undefined;
    buyerSignedAt?: number | Date | undefined;
    sellerSignedAt?: number | Date | undefined;
}>;
export declare const EscrowStatusValueSchema: z.ZodEnum<["pending", "deposited", "released", "cancelled", "disputed"]>;
export declare const EscrowStatusSchema: z.ZodObject<{
    tableId: z.ZodString;
    amount: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    fee: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    buyerAddress: z.ZodOptional<z.ZodString>;
    sellerAddress: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["pending", "deposited", "released", "cancelled", "disputed"]>>;
    buyerApproved: z.ZodBoolean;
    sellerApproved: z.ZodBoolean;
    released: z.ZodOptional<z.ZodBoolean>;
    cancelled: z.ZodOptional<z.ZodBoolean>;
    disputed: z.ZodOptional<z.ZodBoolean>;
    releasedAt: z.ZodOptional<z.ZodUnion<[z.ZodDate, z.ZodNumber]>>;
}, "strip", z.ZodTypeAny, {
    tableId: string;
    amount: string | number;
    fee: string | number;
    buyerApproved: boolean;
    sellerApproved: boolean;
    status?: "released" | "disputed" | "cancelled" | "pending" | "deposited" | undefined;
    released?: boolean | undefined;
    disputed?: boolean | undefined;
    cancelled?: boolean | undefined;
    buyerAddress?: string | undefined;
    sellerAddress?: string | undefined;
    releasedAt?: number | Date | undefined;
}, {
    tableId: string;
    amount: string | number;
    fee: string | number;
    buyerApproved: boolean;
    sellerApproved: boolean;
    status?: "released" | "disputed" | "cancelled" | "pending" | "deposited" | undefined;
    released?: boolean | undefined;
    disputed?: boolean | undefined;
    cancelled?: boolean | undefined;
    buyerAddress?: string | undefined;
    sellerAddress?: string | undefined;
    releasedAt?: number | Date | undefined;
}>;
export declare const EscrowEventTypeSchema: z.ZodEnum<["created", "deposited", "released", "cancelled", "disputed"]>;
export declare const EscrowEventSchema: z.ZodObject<{
    id: z.ZodString;
    tableId: z.ZodString;
    eventType: z.ZodEnum<["created", "deposited", "released", "cancelled", "disputed"]>;
    amount: z.ZodString;
    fee: z.ZodString;
    txHash: z.ZodString;
    createdAt: z.ZodUnion<[z.ZodDate, z.ZodNumber]>;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: number | Date;
    tableId: string;
    amount: string;
    fee: string;
    eventType: "released" | "disputed" | "cancelled" | "deposited" | "created";
    txHash: string;
}, {
    id: string;
    createdAt: number | Date;
    tableId: string;
    amount: string;
    fee: string;
    eventType: "released" | "disputed" | "cancelled" | "deposited" | "created";
    txHash: string;
}>;
export declare const DisputeReasonSchema: z.ZodEnum<["quality", "non_delivery", "other"]>;
export declare const DisputeDecisionSchema: z.ZodEnum<["buyer_wins", "seller_wins", "split"]>;
export declare const DisputeSchema: z.ZodObject<{
    id: z.ZodString;
    tableId: z.ZodString;
    openedBy: z.ZodString;
    reason: z.ZodEnum<["quality", "non_delivery", "other"]>;
    evidence: z.ZodArray<z.ZodString, "many">;
    status: z.ZodOptional<z.ZodEnum<["open", "under_review", "resolved"]>>;
    resolution: z.ZodOptional<z.ZodNullable<z.ZodEnum<["buyer_wins", "seller_wins", "split"]>>>;
    decision: z.ZodOptional<z.ZodEnum<["buyer_wins", "seller_wins", "split"]>>;
    decidedBy: z.ZodOptional<z.ZodString>;
    decidedAt: z.ZodOptional<z.ZodUnion<[z.ZodDate, z.ZodNumber]>>;
    createdAt: z.ZodUnion<[z.ZodDate, z.ZodNumber]>;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: number | Date;
    tableId: string;
    openedBy: string;
    reason: "quality" | "non_delivery" | "other";
    evidence: string[];
    status?: "open" | "under_review" | "resolved" | undefined;
    resolution?: "buyer_wins" | "seller_wins" | "split" | null | undefined;
    decision?: "buyer_wins" | "seller_wins" | "split" | undefined;
    decidedBy?: string | undefined;
    decidedAt?: number | Date | undefined;
}, {
    id: string;
    createdAt: number | Date;
    tableId: string;
    openedBy: string;
    reason: "quality" | "non_delivery" | "other";
    evidence: string[];
    status?: "open" | "under_review" | "resolved" | undefined;
    resolution?: "buyer_wins" | "seller_wins" | "split" | null | undefined;
    decision?: "buyer_wins" | "seller_wins" | "split" | undefined;
    decidedBy?: string | undefined;
    decidedAt?: number | Date | undefined;
}>;
export declare const WorkSubmissionSchema: z.ZodObject<{
    id: z.ZodString;
    tableId: z.ZodString;
    submitterId: z.ZodString;
    deliverables: z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        description: z.ZodString;
        completed: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        id?: string | undefined;
        completed?: boolean | undefined;
    }, {
        description: string;
        id?: string | undefined;
        completed?: boolean | undefined;
    }>, "many">;
    proof: z.ZodOptional<z.ZodString>;
    submittedAt: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    tableId: string;
    submitterId: string;
    deliverables: {
        description: string;
        id?: string | undefined;
        completed?: boolean | undefined;
    }[];
    submittedAt: number;
    proof?: string | undefined;
}, {
    id: string;
    tableId: string;
    submitterId: string;
    deliverables: {
        description: string;
        id?: string | undefined;
        completed?: boolean | undefined;
    }[];
    submittedAt: number;
    proof?: string | undefined;
}>;
export declare const CreateAgentRequestSchema: z.ZodObject<Pick<{
    id: z.ZodString;
    ownerAddress: z.ZodString;
    owner: z.ZodOptional<z.ZodString>;
    publicKey: z.ZodString;
    capabilities: z.ZodArray<z.ZodString, "many">;
    reputationScore: z.ZodNumber;
    walletAddress: z.ZodString;
    metadata: z.ZodObject<{
        name: z.ZodString;
        description: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        avatar: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        description: string;
        avatar?: string | undefined;
    }, {
        name: string;
        description?: string | undefined;
        avatar?: string | undefined;
    }>;
    createdAt: z.ZodUnion<[z.ZodDate, z.ZodNumber]>;
    updatedAt: z.ZodUnion<[z.ZodDate, z.ZodNumber]>;
}, "ownerAddress" | "publicKey" | "capabilities" | "walletAddress" | "metadata">, "strip", z.ZodTypeAny, {
    ownerAddress: string;
    publicKey: string;
    capabilities: string[];
    walletAddress: string;
    metadata: {
        name: string;
        description: string;
        avatar?: string | undefined;
    };
}, {
    ownerAddress: string;
    publicKey: string;
    capabilities: string[];
    walletAddress: string;
    metadata: {
        name: string;
        description?: string | undefined;
        avatar?: string | undefined;
    };
}>;
export declare const UpdateAgentRequestSchema: z.ZodObject<{
    ownerAddress: z.ZodOptional<z.ZodString>;
    publicKey: z.ZodOptional<z.ZodString>;
    capabilities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    walletAddress: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        avatar: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        description: string;
        avatar?: string | undefined;
    }, {
        name: string;
        description?: string | undefined;
        avatar?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    ownerAddress?: string | undefined;
    publicKey?: string | undefined;
    capabilities?: string[] | undefined;
    walletAddress?: string | undefined;
    metadata?: {
        name: string;
        description: string;
        avatar?: string | undefined;
    } | undefined;
}, {
    ownerAddress?: string | undefined;
    publicKey?: string | undefined;
    capabilities?: string[] | undefined;
    walletAddress?: string | undefined;
    metadata?: {
        name: string;
        description?: string | undefined;
        avatar?: string | undefined;
    } | undefined;
}>;
export declare const WalletAuthRequestSchema: z.ZodObject<{
    address: z.ZodString;
    signature: z.ZodString;
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    message: string;
    address: string;
    signature: string;
}, {
    message: string;
    address: string;
    signature: string;
}>;
export declare const CreateTableRequestSchema: z.ZodObject<{
    participantId: z.ZodString;
    encryptedBudget: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    participantId: string;
    encryptedBudget?: string | undefined;
}, {
    participantId: string;
    encryptedBudget?: string | undefined;
}>;
export declare const SendMessageRequestSchema: z.ZodObject<{
    content: z.ZodString;
    messageType: z.ZodDefault<z.ZodEnum<["text", "quote", "document", "contract", "work", "system"]>>;
}, "strip", z.ZodTypeAny, {
    content: string;
    messageType: "text" | "quote" | "document" | "contract" | "work" | "system";
}, {
    content: string;
    messageType?: "text" | "quote" | "document" | "contract" | "work" | "system" | undefined;
}>;
export declare const SubmitQuoteRequestSchema: z.ZodObject<{
    encryptedAmount: z.ZodString;
    description: z.ZodString;
}, "strip", z.ZodTypeAny, {
    description: string;
    encryptedAmount: string;
}, {
    description: string;
    encryptedAmount: string;
}>;
export declare const CreateContractRequestSchema: z.ZodObject<{
    encryptedAmount: z.ZodString;
    deliverables: z.ZodArray<z.ZodString, "many">;
    timeline: z.ZodObject<{
        start: z.ZodNumber;
        end: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        start: number;
        end: number;
    }, {
        start: number;
        end: number;
    }>;
}, "strip", z.ZodTypeAny, {
    encryptedAmount: string;
    deliverables: string[];
    timeline: {
        start: number;
        end: number;
    };
}, {
    encryptedAmount: string;
    deliverables: string[];
    timeline: {
        start: number;
        end: number;
    };
}>;
export declare const EscrowDepositRequestSchema: z.ZodObject<{
    amount: z.ZodString;
}, "strip", z.ZodTypeAny, {
    amount: string;
}, {
    amount: string;
}>;
export declare const OpenDisputeRequestSchema: z.ZodObject<{
    reason: z.ZodEnum<["quality", "non_delivery", "other"]>;
    evidence: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    reason: "quality" | "non_delivery" | "other";
    evidence: string[];
}, {
    reason: "quality" | "non_delivery" | "other";
    evidence: string[];
}>;
export declare const RegisterAgentResponseSchema: z.ZodObject<{
    agent: z.ZodObject<{
        id: z.ZodString;
        ownerAddress: z.ZodString;
        owner: z.ZodOptional<z.ZodString>;
        publicKey: z.ZodString;
        capabilities: z.ZodArray<z.ZodString, "many">;
        reputationScore: z.ZodNumber;
        walletAddress: z.ZodString;
        metadata: z.ZodObject<{
            name: z.ZodString;
            description: z.ZodDefault<z.ZodOptional<z.ZodString>>;
            avatar: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            description: string;
            avatar?: string | undefined;
        }, {
            name: string;
            description?: string | undefined;
            avatar?: string | undefined;
        }>;
        createdAt: z.ZodUnion<[z.ZodDate, z.ZodNumber]>;
        updatedAt: z.ZodUnion<[z.ZodDate, z.ZodNumber]>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        ownerAddress: string;
        publicKey: string;
        capabilities: string[];
        reputationScore: number;
        walletAddress: string;
        metadata: {
            name: string;
            description: string;
            avatar?: string | undefined;
        };
        createdAt: number | Date;
        updatedAt: number | Date;
        owner?: string | undefined;
    }, {
        id: string;
        ownerAddress: string;
        publicKey: string;
        capabilities: string[];
        reputationScore: number;
        walletAddress: string;
        metadata: {
            name: string;
            description?: string | undefined;
            avatar?: string | undefined;
        };
        createdAt: number | Date;
        updatedAt: number | Date;
        owner?: string | undefined;
    }>;
    token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    agent: {
        id: string;
        ownerAddress: string;
        publicKey: string;
        capabilities: string[];
        reputationScore: number;
        walletAddress: string;
        metadata: {
            name: string;
            description: string;
            avatar?: string | undefined;
        };
        createdAt: number | Date;
        updatedAt: number | Date;
        owner?: string | undefined;
    };
    token: string;
}, {
    agent: {
        id: string;
        ownerAddress: string;
        publicKey: string;
        capabilities: string[];
        reputationScore: number;
        walletAddress: string;
        metadata: {
            name: string;
            description?: string | undefined;
            avatar?: string | undefined;
        };
        createdAt: number | Date;
        updatedAt: number | Date;
        owner?: string | undefined;
    };
    token: string;
}>;
export declare const CreateTableResponseSchema: z.ZodObject<{
    table: z.ZodObject<{
        id: z.ZodString;
        creatorId: z.ZodString;
        participantId: z.ZodString;
        status: z.ZodEnum<["negotiation", "quoted", "quote_approved", "contract_created", "funded", "in_progress", "delivery_submitted", "accepted", "released", "disputed", "cancelled"]>;
        encryptedBudget: z.ZodOptional<z.ZodString>;
        encryptedQuote: z.ZodOptional<z.ZodString>;
        contractHash: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodUnion<[z.ZodDate, z.ZodNumber]>;
        updatedAt: z.ZodUnion<[z.ZodDate, z.ZodNumber]>;
    }, "strip", z.ZodTypeAny, {
        status: "negotiation" | "quoted" | "quote_approved" | "contract_created" | "funded" | "in_progress" | "delivery_submitted" | "accepted" | "released" | "disputed" | "cancelled";
        id: string;
        createdAt: number | Date;
        updatedAt: number | Date;
        creatorId: string;
        participantId: string;
        encryptedBudget?: string | undefined;
        encryptedQuote?: string | undefined;
        contractHash?: string | undefined;
    }, {
        status: "negotiation" | "quoted" | "quote_approved" | "contract_created" | "funded" | "in_progress" | "delivery_submitted" | "accepted" | "released" | "disputed" | "cancelled";
        id: string;
        createdAt: number | Date;
        updatedAt: number | Date;
        creatorId: string;
        participantId: string;
        encryptedBudget?: string | undefined;
        encryptedQuote?: string | undefined;
        contractHash?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    table: {
        status: "negotiation" | "quoted" | "quote_approved" | "contract_created" | "funded" | "in_progress" | "delivery_submitted" | "accepted" | "released" | "disputed" | "cancelled";
        id: string;
        createdAt: number | Date;
        updatedAt: number | Date;
        creatorId: string;
        participantId: string;
        encryptedBudget?: string | undefined;
        encryptedQuote?: string | undefined;
        contractHash?: string | undefined;
    };
}, {
    table: {
        status: "negotiation" | "quoted" | "quote_approved" | "contract_created" | "funded" | "in_progress" | "delivery_submitted" | "accepted" | "released" | "disputed" | "cancelled";
        id: string;
        createdAt: number | Date;
        updatedAt: number | Date;
        creatorId: string;
        participantId: string;
        encryptedBudget?: string | undefined;
        encryptedQuote?: string | undefined;
        contractHash?: string | undefined;
    };
}>;
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
