import prisma from '../db/prisma';
import type { UseCaseResult } from './types';

type TableData = { creatorId: string; participantId: string; status: string };

type OpenDisputeDeps = {
  findTableById: (tableId: string) => Promise<TableData | null>;
  executeDisputeFlow: (input: {
    tableId: string;
    openedBy: string;
    reason: string;
    evidence: string[];
  }) => Promise<{ id: string }>;
};

const defaultDeps: OpenDisputeDeps = {
  findTableById: (tableId) => prisma.table.findUnique({
    where: { id: tableId },
    select: { creatorId: true, participantId: true, status: true },
  }),
  executeDisputeFlow: async ({ tableId, openedBy, reason, evidence }) => {
    return prisma.$transaction(async (tx) => {
      const dispute = await tx.dispute.create({
        data: { tableId, openedBy, reason, evidence },
        select: { id: true },
      });

      await tx.table.update({
        where: { id: tableId },
        data: { status: 'disputed' },
      });

      return dispute;
    });
  },
};

export async function openDisputeUseCase(
  input: { tableId: string; openedBy: string; reason: string; evidence: string[] },
  deps: OpenDisputeDeps = defaultDeps,
): Promise<UseCaseResult<{ disputeId: string }>> {
  const table = await deps.findTableById(input.tableId);
  if (!table) {
    return { success: false, errorCode: 'TABLE_NOT_FOUND', message: 'Table not found' };
  }

  const isParticipant = table.creatorId === input.openedBy || table.participantId === input.openedBy;
  if (!isParticipant) {
    return { success: false, errorCode: 'FORBIDDEN', message: 'Not authorized' };
  }

  if (table.status !== 'active') {
    return {
      success: false,
      errorCode: 'INVALID_STATE',
      message: 'Can only dispute active tables',
    };
  }

  const dispute = await deps.executeDisputeFlow(input);

  return {
    success: true,
    message: 'Dispute opened successfully',
    data: { disputeId: dispute.id },
  };
}
