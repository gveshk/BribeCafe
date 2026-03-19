import { Prisma } from '@prisma/client';
import prisma from '../db/prisma';
import type { UseCaseResult } from './types';

type TableData = { creatorId: string; participantId: string };
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

type SignContractDeps = {
  findTableById: (tableId: string) => Promise<TableData | null>;
  findContractByTable: (tableId: string) => Promise<ContractData | null>;
  executeSignFlow: (input: {
    tableId: string;
    contractId: string;
    signerId: string;
    isBuyer: boolean;
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

const defaultDeps: SignContractDeps = {
  findTableById: (tableId) => prisma.table.findUnique({
    where: { id: tableId },
    select: { creatorId: true, participantId: true },
  }),
  findContractByTable: (tableId) => prisma.contract.findFirst({
    where: { tableId },
    orderBy: { createdAt: 'desc' },
    select: contractSelect,
  }),
  executeSignFlow: async ({ tableId, contractId, signerId, isBuyer }) => {
    return prisma.$transaction(async (tx) => {
      await tx.contract.update({
        where: { id: contractId },
        data: isBuyer
          ? { buyerSigned: true, buyerSignedAt: new Date() }
          : { sellerSigned: true, sellerSignedAt: new Date() },
      });

      await tx.message.create({
        data: {
          tableId,
          senderId: signerId,
          content: isBuyer ? 'Buyer signed contract' : 'Seller signed contract',
          messageType: 'system',
        },
      });

      const updated = await tx.contract.findUniqueOrThrow({
        where: { id: contractId },
        select: contractSelect,
      });

      if (updated.buyerSigned && updated.sellerSigned) {
        await tx.table.update({ where: { id: tableId }, data: { status: 'contract_created' } });
      }

      return updated;
    });
  },
};

export async function signContractUseCase(
  input: { tableId: string; signerId: string },
  deps: SignContractDeps = defaultDeps,
): Promise<UseCaseResult<{ contract: ContractData; bothSigned: boolean }>> {
  const table = await deps.findTableById(input.tableId);
  if (!table) {
    return { success: false, errorCode: 'TABLE_NOT_FOUND', message: 'Table not found' };
  }

  const contract = await deps.findContractByTable(input.tableId);
  if (!contract) {
    return { success: false, errorCode: 'CONTRACT_NOT_FOUND', message: 'Contract not found' };
  }

  const isBuyer = table.creatorId === input.signerId;
  const isSeller = table.participantId === input.signerId;
  if (!isBuyer && !isSeller) {
    return { success: false, errorCode: 'FORBIDDEN', message: 'Not authorized' };
  }

  if ((isBuyer && contract.buyerSigned) || (isSeller && contract.sellerSigned)) {
    return { success: false, errorCode: 'INVALID_STATE', message: 'Contract already signed by this party' };
  }

  const updatedContract = await deps.executeSignFlow({
    tableId: input.tableId,
    contractId: contract.id,
    signerId: input.signerId,
    isBuyer,
  });

  return {
    success: true,
    message: 'Contract signed successfully',
    data: {
      contract: updatedContract,
      bothSigned: updatedContract.buyerSigned && updatedContract.sellerSigned,
    },
  };
}
