import { Prisma } from '@prisma/client';
import prisma from '../db/prisma';
import type { UseCaseResult } from './types';

type TableData = { id: string; creatorId: string; participantId: string };
type QuoteData = { approved: boolean };
type ContractData = {
  id: string;
  tableId: string;
  buyerId: string;
  sellerId: string;
  encryptedAmount: string;
  deliverables: string[];
  timeline: Prisma.JsonValue;
  buyerSigned: boolean;
  sellerSigned: boolean;
  createdAt: Date;
};

type CreateContractDeps = {
  findTableById: (tableId: string) => Promise<TableData | null>;
  findLatestQuoteByTable: (tableId: string) => Promise<QuoteData | null>;
  findContractByTable: (tableId: string) => Promise<{ id: string } | null>;
  executeCreateFlow: (input: {
    tableId: string;
    buyerId: string;
    sellerId: string;
    encryptedAmount: string;
    deliverables: string[];
    timeline: { start: number; end: number };
  }) => Promise<ContractData>;
};

const contractSelect = {
  id: true,
  tableId: true,
  buyerId: true,
  sellerId: true,
  encryptedAmount: true,
  deliverables: true,
  timeline: true,
  buyerSigned: true,
  sellerSigned: true,
  createdAt: true,
} as const;

const defaultDeps: CreateContractDeps = {
  findTableById: (tableId) => prisma.table.findUnique({
    where: { id: tableId },
    select: { id: true, creatorId: true, participantId: true },
  }),
  findLatestQuoteByTable: (tableId) => prisma.quote.findFirst({
    where: { tableId },
    orderBy: { createdAt: 'desc' },
    select: { approved: true },
  }),
  findContractByTable: (tableId) => prisma.contract.findFirst({
    where: { tableId },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  }),
  executeCreateFlow: async (input) => {
    return prisma.$transaction(async (tx) => {
      const contract = await tx.contract.create({
        data: {
          tableId: input.tableId,
          buyerId: input.buyerId,
          sellerId: input.sellerId,
          encryptedAmount: input.encryptedAmount,
          deliverables: input.deliverables,
          timeline: input.timeline as Prisma.InputJsonValue,
        },
        select: contractSelect,
      });

      await tx.table.update({
        where: { id: input.tableId },
        data: { contractHash: contract.id },
      });

      await tx.message.create({
        data: {
          tableId: input.tableId,
          senderId: input.sellerId,
          content: 'Contract created',
          messageType: 'contract',
        },
      });

      return contract;
    });
  },
};

export async function createContractUseCase(
  input: {
    tableId: string;
    requesterId: string;
    encryptedAmount: string;
    deliverables: string[];
    timeline: { start: number; end: number };
  },
  deps: CreateContractDeps = defaultDeps,
): Promise<UseCaseResult<{ contract: ContractData }>> {
  const table = await deps.findTableById(input.tableId);
  if (!table) {
    return { success: false, errorCode: 'TABLE_NOT_FOUND', message: 'Table not found' };
  }

  if (table.participantId !== input.requesterId) {
    return {
      success: false,
      errorCode: 'FORBIDDEN',
      message: 'Only the invited participant can create a contract',
    };
  }

  const existingContract = await deps.findContractByTable(input.tableId);
  if (existingContract) {
    return { success: false, errorCode: 'INVALID_STATE', message: 'Contract already exists' };
  }

  const latestQuote = await deps.findLatestQuoteByTable(input.tableId);
  if (!latestQuote?.approved) {
    return {
      success: false,
      errorCode: 'INVALID_STATE',
      message: 'Quote must be approved first',
    };
  }

  const contract = await deps.executeCreateFlow({
    tableId: input.tableId,
    buyerId: table.creatorId,
    sellerId: table.participantId,
    encryptedAmount: input.encryptedAmount,
    deliverables: input.deliverables,
    timeline: input.timeline,
  });

  return {
    success: true,
    message: 'Contract created successfully',
    data: { contract },
  };
}
