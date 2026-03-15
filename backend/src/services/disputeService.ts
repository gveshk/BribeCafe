import { v4 as uuidv4 } from 'uuid';
import prisma from '../db/prisma';
import type { Dispute, CreateDisputeInput, DisputeReason, DisputeDecision } from '../types';
import { tableService } from './tableService';
import { agentService } from './agentService';

const REP_SELLER_FAULT = -50; // Seller loses 50 rep on fault
const REP_BUYER_PENALTY = 0; // Buyer penalty is handled via escrow

export class DisputeService {
  async create(input: CreateDisputeInput): Promise<Dispute> {
    // Verify table exists and is active
    const table = await tableService.findById(input.tableId);
    if (!table) {
      throw new Error('Table not found');
    }

    if (table.status !== 'active') {
      throw new Error('Can only dispute active tables');
    }

    const dispute = await prisma.dispute.create({
      data: {
        id: uuidv4(),
        tableId: input.tableId,
        openedBy: input.openedBy,
        reason: input.reason,
        evidence: input.evidence,
      },
      include: {
        opener: true,
      },
    });

    // Update table status to disputed
    await tableService.updateStatus(input.tableId, 'disputed');

    return this.mapToType(dispute);
  }

  async findById(id: string): Promise<Dispute | null> {
    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        opener: true,
      },
    });
    return dispute ? this.mapToType(dispute) : null;
  }

  async findByTable(tableId: string): Promise<Dispute[]> {
    const disputes = await prisma.dispute.findMany({
      where: { tableId },
      orderBy: { createdAt: 'desc' },
      include: {
        opener: true,
      },
    });
    return disputes.map((d) => this.mapToType(d));
  }

  async resolve(
    disputeId: string,
    decision: DisputeDecision,
    decidedBy: string
  ): Promise<Dispute | null> {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        table: true,
      },
    });

    if (!dispute) {
      throw new Error('Dispute not found');
    }

    // Get table to determine buyer and seller
    const table = await tableService.findById(dispute.tableId);
    if (!table) {
      throw new Error('Table not found');
    }

    // Update dispute
    const updated = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        decision,
        decidedBy,
        decidedAt: new Date(),
      },
      include: {
        opener: true,
      },
    });

    // Apply reputation changes based on decision
    if (decision === 'buyer_wins') {
      // Refund buyer, penalize seller
      await agentService.updateReputation(table.participantId, REP_SELLER_FAULT);
      await tableService.updateStatus(table.id, 'cancelled');
    } else if (decision === 'seller_wins') {
      // Release to seller
      await tableService.updateStatus(table.id, 'completed');
    } else if (decision === 'split') {
      // Rare case - release half to each
      await tableService.updateStatus(table.id, 'completed');
    }

    return this.mapToType(updated);
  }

  async getActiveDisputes(): Promise<Dispute[]> {
    const disputes = await prisma.dispute.findMany({
      where: {
        decision: null,
      },
      orderBy: { createdAt: 'asc' },
      include: {
        opener: true,
        table: true,
      },
    });
    return disputes.map((d) => this.mapToType(d));
  }

  private mapToType(dispute: {
    id: string;
    tableId: string;
    openedBy: string;
    reason: string;
    evidence: string[];
    decision?: string | null;
    decidedBy?: string | null;
    decidedAt?: Date | null;
    createdAt: Date;
  }): Dispute {
    return {
      id: dispute.id,
      tableId: dispute.tableId,
      openedBy: dispute.openedBy,
      reason: dispute.reason as DisputeReason,
      evidence: dispute.evidence,
      decision: dispute.decision as DisputeDecision | undefined,
      decidedBy: dispute.decidedBy || undefined,
      decidedAt: dispute.decidedAt || undefined,
      createdAt: dispute.createdAt,
    };
  }
}

export const disputeService = new DisputeService();
