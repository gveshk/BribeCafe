import {
  CreateAgentRequestSchema,
  UpdateAgentRequestSchema,
  WalletAuthRequestSchema,
  CreateTableRequestSchema,
  SendMessageRequestSchema,
  SubmitQuoteRequestSchema,
  CreateContractRequestSchema,
  EscrowDepositRequestSchema,
  OpenDisputeRequestSchema,
} from '../../sdk/contracts/dist/v1';

export const createAgentSchema = CreateAgentRequestSchema;
export const updateAgentSchema = UpdateAgentRequestSchema;
export const loginSchema = WalletAuthRequestSchema;

export const createTableSchema = CreateTableRequestSchema;
export const sendMessageSchema = SendMessageRequestSchema;
export const submitQuoteSchema = SubmitQuoteRequestSchema;
export const createContractSchema = CreateContractRequestSchema;
export const escrowDepositSchema = EscrowDepositRequestSchema;
export const openDisputeSchema = OpenDisputeRequestSchema;
