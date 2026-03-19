import prisma from '../db/prisma';
import type { UseCaseResult } from './types';

type TableData = { creatorId: string; participantId: string; status: string };
type DisputeData = {
  id: string;
  tableId: string;
  openedBy: string;
  reason: string;
  evidence: string[];
  decision: string | null;
  decidedBy: string | null;
  decidedAt: Date | null;
  createdAt: Date;
};

type OpenDisputeDeps = {
  findTableById: (tableId: string) => Promise<TableData | null>;
  executeDisputeFlow: (input: {
    tableId: string;
    openedBy: string;
    reason: string;
    evidence: string[];
  }) => Promise<DisputeData>;
};

const disputeSelect = {
  id: true,
  tableId: true,
  openedBy: true,
  reason: true,
  evidence: true,
  decision: true,
  decidedBy: true,
  decidedAt: true,
  createdAt: true,
} as const;

const defaultDeps: OpenDisputeDeps = {
  findTableById: (tableId) => prisma.table.findUnique({
    where: { id: tableId },
    select: { creatorId: true, participantId: true, status: true },
  }),
  executeDisputeFlow: async ({ tableId, openedBy, reason, evidence }) => {
    return prisma.$transaction(async (tx) => {
      const dispute = await tx.dispute.create({
        data: { tableId, openedBy, reason, evidence },
        select: disputeSelect,
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
): Promise<UseCaseResult<{ dispute: DisputeData }>> {
  const table = await deps.findTableById(input.tableId);
  if (!table) {
    return { success: false, errorCode: 'TABLE_NOT_FOUND', message: 'Table not found' };
  }

  const isParticipant = table.creatorId === input.openedBy || table.participantId === input.openedBy;
  if (!isParticipant) {
    return { success: false, errorCode: 'FORBIDDEN', message: 'Not authorized' };
  }

  if (['disputed', 'cancelled', 'released'].includes(table.status)) {
    return {
      success: false,
      errorCode: 'INVALID_STATE',
      message: 'Table cannot be disputed in its current state',
    };
  }

  const dispute = await deps.executeDisputeFlow(input);

  return {
    success: true,
    message: 'Dispute opened successfully',
    data: { dispute },
  };
}
