import React, { createContext, ReactNode, useContext, useMemo } from 'react';
import { Contract, Escrow, Quote } from '../../types';
import { useTableSession } from './TableSessionContext';
import { useContractQuery, useEscrowQuery, useQuoteQuery, useWorkflowMutations } from '../../hooks/useBribeQueries';

interface EscrowWorkflowContextType {
  quote: Quote | null;
  contract: Contract | null;
  escrow: Escrow | null;
  workflowLoading: boolean;
  workflowError: string | null;
  submitQuote: (amount: number, description: string) => Promise<void>;
  approveQuote: () => Promise<void>;
  createContract: (amount: number, deliverables: string[], timeline: { start: number; end: number }) => Promise<void>;
  signContract: (amount: number) => Promise<void>;
  depositEscrow: (amount: number) => Promise<void>;
  approveRelease: () => Promise<void>;
  openDispute: (reason: 'quality' | 'non_delivery' | 'other', evidence?: string[]) => Promise<void>;
}

const EscrowWorkflowContext = createContext<EscrowWorkflowContextType | undefined>(undefined);

export const EscrowWorkflowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { selectedTable } = useTableSession();
  const tableId = selectedTable?.id;

  const quoteQuery = useQuoteQuery(tableId);
  const contractQuery = useContractQuery(tableId);
  const escrowQuery = useEscrowQuery(tableId);
  const mutations = useWorkflowMutations(tableId);

  const workflowError = quoteQuery.error?.message
    ?? contractQuery.error?.message
    ?? escrowQuery.error?.message
    ?? mutations.submitQuote.error?.message
    ?? mutations.approveQuote.error?.message
    ?? mutations.createContract.error?.message
    ?? mutations.signContract.error?.message
    ?? mutations.depositEscrow.error?.message
    ?? mutations.approveRelease.error?.message
    ?? mutations.openDispute.error?.message
    ?? null;

  const workflowLoading = quoteQuery.isLoading
    || contractQuery.isLoading
    || escrowQuery.isLoading
    || mutations.submitQuote.isLoading
    || mutations.approveQuote.isLoading
    || mutations.createContract.isLoading
    || mutations.signContract.isLoading
    || mutations.depositEscrow.isLoading
    || mutations.approveRelease.isLoading
    || mutations.openDispute.isLoading;

  const value = useMemo(() => ({
    quote: quoteQuery.data ?? null,
    contract: contractQuery.data ?? null,
    escrow: escrowQuery.data ?? null,
    workflowLoading,
    workflowError,
    submitQuote: async (amount: number, description: string) => {
      await mutations.submitQuote.mutateAsync({ amount, description });
    },
    approveQuote: async () => {
      await mutations.approveQuote.mutateAsync(undefined);
    },
    createContract: async (amount: number, deliverables: string[], timeline: { start: number; end: number }) => {
      await mutations.createContract.mutateAsync({ amount, deliverables, timeline });
    },
    signContract: async (amount: number) => {
      await mutations.signContract.mutateAsync(amount);
    },
    depositEscrow: async (amount: number) => {
      await mutations.depositEscrow.mutateAsync(amount);
    },
    approveRelease: async () => {
      await mutations.approveRelease.mutateAsync(undefined);
    },
    openDispute: async (reason: 'quality' | 'non_delivery' | 'other', evidence?: string[]) => {
      await mutations.openDispute.mutateAsync({ reason, evidence });
    },
  }), [contractQuery.data, escrowQuery.data, mutations, quoteQuery.data, workflowError, workflowLoading]);

  return <EscrowWorkflowContext.Provider value={value}>{children}</EscrowWorkflowContext.Provider>;
};

export const useEscrowWorkflow = () => {
  const context = useContext(EscrowWorkflowContext);
  if (!context) throw new Error('useEscrowWorkflow must be used within EscrowWorkflowProvider');
  return context;
};
