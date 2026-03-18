import prisma from '../db/prisma';
import type { UseCaseResult } from './types';

type QuoteData = { id: string; encryptedAmount: string };
type TableData = { id: string; creatorId: string };

type ApproveQuoteDeps = {
  findTableById: (tableId: string) => Promise<TableData | null>;
  findLatestQuoteByTable: (tableId: string) => Promise<QuoteData | null>;
  executeApprovalFlow: (input: { tableId: string; quoteId: string; encryptedAmount: string; approverId: string }) => Promise<void>;
};

const defaultDeps: ApproveQuoteDeps = {
  findTableById: (tableId) => prisma.table.findUnique({ where: { id: tableId }, select: { id: true, creatorId: true } }),
  findLatestQuoteByTable: (tableId) => prisma.quote.findFirst({
    where: { tableId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, encryptedAmount: true },
  }),
  executeApprovalFlow: async ({ tableId, quoteId, encryptedAmount, approverId }) => {
    await prisma.$transaction(async (tx) => {
      const approvedQuote = await tx.quote.update({
        where: { id: quoteId },
        data: { approved: true, approvedBy: approverId, approvedAt: new Date() },
      });

      await tx.table.update({
        where: { id: tableId },
        data: { encryptedQuote: encryptedAmount },
      });

      await tx.message.create({
        data: {
          tableId,
          senderId: approverId,
          content: 'Quote approved',
          messageType: 'system',
        },
      });

      return approvedQuote;
    });
  },
};

export async function approveQuoteUseCase(
  input: { tableId: string; approverId: string },
  deps: ApproveQuoteDeps = defaultDeps,
): Promise<UseCaseResult<{ tableId: string }>> {
  const table = await deps.findTableById(input.tableId);
  if (!table) {
    return { success: false, errorCode: 'TABLE_NOT_FOUND', message: 'Table not found' };
  }

  if (table.creatorId !== input.approverId) {
    return {
      success: false,
      errorCode: 'FORBIDDEN',
      message: 'Only the table creator can approve a quote',
    };
  }

  const latestQuote = await deps.findLatestQuoteByTable(input.tableId);
  if (!latestQuote) {
    return { success: false, errorCode: 'QUOTE_NOT_FOUND', message: 'No quote found' };
  }

  await deps.executeApprovalFlow({
    tableId: input.tableId,
    quoteId: latestQuote.id,
    encryptedAmount: latestQuote.encryptedAmount,
    approverId: input.approverId,
  });

  return {
    success: true,
    message: 'Quote approved successfully',
    data: { tableId: input.tableId },
  };
}
