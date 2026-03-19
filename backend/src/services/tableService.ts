import { v4 as uuidv4 } from 'uuid';
import { ethers } from 'ethers';
import prisma from '../db/prisma';
import type { Table, CreateTableInput } from '../types';

export class TableService {
  async create(input: CreateTableInput): Promise<Table> {
    const tableIdBytes = ethers.id(uuidv4()); // Generate a deterministic bytes32

    const table = await prisma.table.create({
      data: {
        id: uuidv4(),
        creatorId: input.creatorId,
        participantId: input.participantId,
        encryptedBudget: input.encryptedBudget,
        tableIdBytes: tableIdBytes,
      },
      include: {
        creator: true,
        participant: true,
      },
    });

    return this.mapToType(table);
  }

  async findById(id: string): Promise<Table | null> {
    const table = await prisma.table.findUnique({
      where: { id },
      include: {
        creator: true,
        participant: true,
      },
    });
    return table ? this.mapToType(table) : null;
  }

  async findByTableIdBytes(tableIdBytes: string): Promise<Table | null> {
    const table = await prisma.table.findFirst({
      where: { tableIdBytes },
      include: {
        creator: true,
        participant: true,
      },
    });
    return table ? this.mapToType(table) : null;
  }

  async findByAgent(
    agentId: string,
    options?: { status?: string; limit?: number; offset?: number }
  ): Promise<{ tables: Table[]; total: number }> {
    const where = {
      OR: [{ creatorId: agentId }, { participantId: agentId }],
      ...(options?.status && { status: options.status }),
    } as any;

    const [tables, total] = await Promise.all([
      prisma.table.findMany({
        where,
        take: options?.limit ?? 50,
        skip: options?.offset ?? 0,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: true,
          participant: true,
        },
      }),
      prisma.table.count({ where }),
    ]);

    return {
      tables: tables.map((t) => this.mapToType(t)),
      total,
    };
  }

  async updateStatus(id: string, status: string): Promise<Table | null> {
    const table = await prisma.table.update({
      where: { id },
      data: { status: status as any },
      include: {
        creator: true,
        participant: true,
      },
    });
    return this.mapToType(table);
  }

  async updateQuote(id: string, encryptedQuote: string): Promise<Table | null> {
    const table = await prisma.table.update({
      where: { id },
      data: { encryptedQuote },
      include: {
        creator: true,
        participant: true,
      },
    });
    return this.mapToType(table);
  }

  async updateContractHash(id: string, contractHash: string): Promise<Table | null> {
    const table = await prisma.table.update({
      where: { id },
      data: { contractHash },
      include: {
        creator: true,
        participant: true,
      },
    });
    return this.mapToType(table);
  }

  async setEscrowAddress(id: string, escrowAddress: string): Promise<void> {
    await prisma.table.update({
      where: { id },
      data: { escrowAddress },
    });
  }

  async isParticipant(tableId: string, agentId: string): Promise<boolean> {
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      select: { creatorId: true, participantId: true },
    });
    return table?.creatorId === agentId || table?.participantId === agentId;
  }

  private mapToType(table: any): Table {
    return {
      id: table.id,
      creatorId: table.creatorId,
      participantId: table.participantId,
      status: table.status as unknown as Table['status'],
      encryptedBudget: table.encryptedBudget || undefined,
      encryptedQuote: table.encryptedQuote || undefined,
      contractHash: table.contractHash || undefined,
      createdAt: table.createdAt,
      updatedAt: table.updatedAt,
    };
  }
}

export const tableService = new TableService();
