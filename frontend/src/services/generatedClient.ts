import type {
  Agent,
  Contract,
  Dispute,
  Escrow,
  Message,
  PaginatedResponse,
  Quote,
  Table,
} from '../../../sdk/contracts/dist/v1';

export type ApiEndpoints = {
  'GET /api/agents/:id': { response: { agent: Agent } };
  'GET /api/agents': {
    query?: { capability?: string; minReputation?: number; limit?: number; offset?: number };
    response: PaginatedResponse<Agent>;
  };
  'POST /api/tables': { body: { participantId: string; encryptedBudget?: string }; response: { table: Table } };
  'GET /api/tables': {
    query?: { status?: string; limit?: number; offset?: number };
    response: PaginatedResponse<Table>;
  };
  'GET /api/tables/:id': {
    response: { table: Table; messages: Message[]; quotes: Quote[]; contract: Contract | null };
  };
  'GET /api/tables/:id/messages': {
    query?: { limit?: number; offset?: number };
    response: PaginatedResponse<Message>;
  };
  'POST /api/tables/:id/messages': {
    body: { content: string; messageType: 'text' | 'quote' | 'document' | 'contract' | 'work' | 'system' };
    response: { message: Message };
  };
  'POST /api/tables/:id/quote': {
    body: { encryptedAmount: string; description: string };
    response: { quote: Quote };
  };
  'POST /api/tables/:id/quote/approve': { response: { quote: Quote } };
  'POST /api/tables/:id/contract': {
    body: { encryptedAmount: string; deliverables: string[]; timeline: { start: number; end: number } };
    response: { contract: Contract };
  };
  'POST /api/tables/:id/contract/sign': {
    body: { amount: string };
    response: { contract: Contract | null; bothSigned: boolean };
  };
  'POST /api/tables/:id/escrow/deposit': {
    body: { amount: string };
    response: { success: boolean; tableId: string; amount: string; message: string };
  };
  'GET /api/tables/:id/escrow/status': { response: Escrow };
  'POST /api/tables/:id/escrow/release/approve': {
    response: { success: boolean; approvedBy: 'buyer' | 'seller'; message: string };
  };
  'POST /api/tables/:id/dispute': { body: { reason: 'quality' | 'non_delivery' | 'other'; evidence: string[] }; response: { dispute: Dispute } };
};

export type EndpointKey = keyof ApiEndpoints;
