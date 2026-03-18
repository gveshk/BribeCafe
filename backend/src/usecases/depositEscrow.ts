import prisma from '../db/prisma';
import type { UseCaseResult } from './types';

type TableData = { creatorId: string };

type DepositEscrowDeps = {
  findTableById: (tableId: string) => Promise<TableData | null>;
};

const defaultDeps: DepositEscrowDeps = {
  findTableById: (tableId) => prisma.table.findUnique({ where: { id: tableId }, select: { creatorId: true } }),
};

export async function depositEscrowUseCase(
  input: { tableId: string; depositorId: string; amount: string },
  deps: DepositEscrowDeps = defaultDeps,
): Promise<UseCaseResult<{ tableId: string; amount: string }>> {
  const table = await deps.findTableById(input.tableId);
  if (!table) {
    return { success: false, errorCode: 'TABLE_NOT_FOUND', message: 'Table not found' };
  }

  if (table.creatorId !== input.depositorId) {
    return {
      success: false,
      errorCode: 'FORBIDDEN',
      message: 'Only the buyer can deposit to escrow',
    };
  }

  return {
    success: true,
    message: 'Deposit initiated (blockchain integration pending)',
    data: {
      tableId: input.tableId,
      amount: input.amount,
    },
  };
}
