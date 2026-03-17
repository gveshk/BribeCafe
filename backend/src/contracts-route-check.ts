import { z } from 'zod';
import {
  CreateAgentRequestSchema,
  WalletAuthRequestSchema,
  CreateTableRequestSchema,
  SendMessageRequestSchema,
  SubmitQuoteRequestSchema,
  CreateContractRequestSchema,
  EscrowDepositRequestSchema,
  OpenDisputeRequestSchema,
} from '../../sdk/contracts/dist/v1';
import {
  createAgentSchema,
  loginSchema,
  createTableSchema,
  sendMessageSchema,
  submitQuoteSchema,
  createContractSchema,
  escrowDepositSchema,
  openDisputeSchema,
} from './route-contracts';

type Assert<T extends true> = T;
type IsEqual<A, B> =
  (<G>() => G extends A ? 1 : 2) extends (<G>() => G extends B ? 1 : 2)
    ? true
    : false;

type _CreateAgentMatches = Assert<IsEqual<z.infer<typeof createAgentSchema>, z.infer<typeof CreateAgentRequestSchema>>>;
type _LoginMatches = Assert<IsEqual<z.infer<typeof loginSchema>, z.infer<typeof WalletAuthRequestSchema>>>;
type _CreateTableMatches = Assert<IsEqual<z.infer<typeof createTableSchema>, z.infer<typeof CreateTableRequestSchema>>>;
type _SendMessageMatches = Assert<IsEqual<z.infer<typeof sendMessageSchema>, z.infer<typeof SendMessageRequestSchema>>>;
type _SubmitQuoteMatches = Assert<IsEqual<z.infer<typeof submitQuoteSchema>, z.infer<typeof SubmitQuoteRequestSchema>>>;
type _CreateContractMatches = Assert<IsEqual<z.infer<typeof createContractSchema>, z.infer<typeof CreateContractRequestSchema>>>;
type _EscrowDepositMatches = Assert<IsEqual<z.infer<typeof escrowDepositSchema>, z.infer<typeof EscrowDepositRequestSchema>>>;
type _OpenDisputeMatches = Assert<IsEqual<z.infer<typeof openDisputeSchema>, z.infer<typeof OpenDisputeRequestSchema>>>;

export const contractsRouteCheck = true;
