import { useMemo } from 'react';
import { Agent, Contract, Escrow, Message, Quote, Table } from '../types';
import api from '../services/api';
import { invalidateQueries, useApiMutation, useApiQuery } from './apiHooks';

export const queryKeys = {
  tables: ['tables'] as const,
  agents: ['agents'] as const,
  messages: (tableId?: string) => ['messages', tableId] as const,
  quote: (tableId?: string) => ['quote', tableId] as const,
  contract: (tableId?: string) => ['contract', tableId] as const,
  escrow: (tableId?: string) => ['escrow', tableId] as const,
};

export const useTablesQuery = (enabled: boolean) => useApiQuery(
  queryKeys.tables,
  async () => {
    const response = await api.listTables();
    return response.items;
  },
  { enabled, staleTime: 20_000, retry: 2 },
);

export const useAgentsQuery = (enabled: boolean) => useApiQuery(
  queryKeys.agents,
  async () => {
    const response = await api.listAgents({ limit: 50 });
    return response.items.reduce<Record<string, Agent>>((acc, agent) => {
      acc[agent.id] = agent;
      return acc;
    }, {});
  },
  { enabled, staleTime: 60_000, retry: 2 },
);

export const useMessagesQuery = (tableId?: string, enabled = true) => useApiQuery(
  queryKeys.messages(tableId),
  async () => {
    if (!tableId) return [] as Message[];
    const response = await api.getMessages(tableId);
    return response.items;
  },
  { enabled: enabled && !!tableId, staleTime: 5_000, retry: 1 },
);

export const useQuoteQuery = (tableId?: string, enabled = true) => useApiQuery(
  queryKeys.quote(tableId),
  async () => (tableId ? api.getQuote(tableId) : null),
  { enabled: enabled && !!tableId, staleTime: 10_000, retry: 1 },
);

export const useContractQuery = (tableId?: string, enabled = true) => useApiQuery(
  queryKeys.contract(tableId),
  async () => (tableId ? api.getContract(tableId) : null),
  { enabled: enabled && !!tableId, staleTime: 10_000, retry: 1 },
);

export const useEscrowQuery = (tableId?: string, enabled = true) => useApiQuery(
  queryKeys.escrow(tableId),
  async () => {
    if (!tableId) return null as Escrow | null;
    return api.getEscrow(tableId);
  },
  { enabled: enabled && !!tableId, staleTime: 8_000, retry: 1 },
);

export const useCreateTableMutation = () => useApiMutation(
  async (participantId: string) => {
    const response = await api.createTable(participantId);
    return response.table;
  },
  {
    onSuccess: () => invalidateQueries(queryKeys.tables),
  },
);

export const useSendMessageMutation = (tableId?: string) => {
  const key = useMemo(() => queryKeys.messages(tableId), [tableId]);

  return useApiMutation(
    async (payload: { content: string; type: 'text' | 'quote' | 'document' }) => {
      if (!tableId) throw new Error('No table selected');
      return api.sendMessage(tableId, payload.content, payload.type);
    },
    {
      onSuccess: () => invalidateQueries(key),
    },
  );
};

export const useWorkflowMutations = (tableId?: string) => ({
  submitQuote: useApiMutation(
    async ({ amount, description }: { amount: number; description: string }) => {
      if (!tableId) throw new Error('No table selected');
      return api.submitQuote(tableId, amount, description);
    },
    { onSuccess: () => invalidateQueries(queryKeys.quote(tableId)) },
  ),
  approveQuote: useApiMutation(
    async () => {
      if (!tableId) throw new Error('No table selected');
      return api.approveQuote(tableId);
    },
    { onSuccess: () => invalidateQueries(queryKeys.quote(tableId)) },
  ),
  createContract: useApiMutation(
    async (payload: { amount: number; deliverables: string[]; timeline: { start: number; end: number } }) => {
      if (!tableId) throw new Error('No table selected');
      return api.createContract(tableId, payload.amount, payload.deliverables, payload.timeline);
    },
    { onSuccess: () => invalidateQueries(queryKeys.contract(tableId)) },
  ),
  signContract: useApiMutation(
    async (amount: number) => {
      if (!tableId) throw new Error('No table selected');
      return api.signContract(tableId, amount);
    },
    { onSuccess: () => invalidateQueries(queryKeys.contract(tableId)) },
  ),
  depositEscrow: useApiMutation(
    async (amount: number) => {
      if (!tableId) throw new Error('No table selected');
      return api.depositEscrow(tableId, amount);
    },
    {
      onMutate: () => invalidateQueries(queryKeys.escrow(tableId)),
      onSuccess: () => invalidateQueries(queryKeys.escrow(tableId)),
    },
  ),
  approveRelease: useApiMutation(
    async () => {
      if (!tableId) throw new Error('No table selected');
      return api.approveRelease(tableId);
    },
    { onSuccess: () => invalidateQueries(queryKeys.escrow(tableId)) },
  ),
  openDispute: useApiMutation(
    async (payload: { reason: 'quality' | 'non_delivery' | 'other'; evidence?: string[] }) => {
      if (!tableId) throw new Error('No table selected');
      return api.openDispute(tableId, payload.reason, payload.evidence ?? []);
    },
    {
      onSuccess: () => {
        invalidateQueries(queryKeys.escrow(tableId));
        invalidateQueries(queryKeys.tables);
      },
    },
  ),
});
