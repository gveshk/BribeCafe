import { v4 as uuidv4 } from 'uuid';
import { Prisma } from '@prisma/client';
import prisma from '../db/prisma';
import type { Contract, CreateContractInput, ContractTimeline } from '../types';

export class ContractService {
  async create(input: CreateContractInput): Promise<Contract> {
    const contract = await prisma.contract.create({
      data: {
        id: uuidv4(),
        tableId: input.tableId,
        buyerId: input.buyerId,
        sellerId: input.sellerId,
        encryptedAmount: input.encryptedAmount,
        deliverables: input.deliverables,
        timeline: input.timeline as Prisma.InputJsonValue,
      },
      include: {
        buyer: true,
        seller: true,
      },
    });

    return this.mapToType(contract);
  }

  async findById(id: string): Promise<Contract | null> {
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        buyer: true,
        seller: true,
      },
    });
    return contract ? this.mapToType(contract) : null;
  }

  async findByTable(tableId: string): Promise<Contract | null> {
    const contract = await prisma.contract.findFirst({
      where: { tableId },
      orderBy: { createdAt: 'desc' },
      include: {
        buyer: true,
        seller: true,
      },
    });
    return contract ? this.mapToType(contract) : null;
  }

  async buyerSign(id: string): Promise<Contract | null> {
    const contract = await prisma.contract.update({
      where: { id },
      data: {
        buyerSigned: true,
        buyerSignedAt: new Date(),
      },
      include: {
        buyer: true,
        seller: true,
      },
    });
    return this.mapToType(contract);
  }

  async sellerSign(id: string): Promise<Contract | null> {
    const contract = await prisma.contract.update({
      where: { id },
      data: {
        sellerSigned: true,
        sellerSignedAt: new Date(),
      },
      include: {
        buyer: true,
        seller: true,
      },
    });
    return this.mapToType(contract);
  }

  async isFullySigned(id: string): Promise<boolean> {
    const contract = await prisma.contract.findUnique({
      where: { id },
      select: { buyerSigned: true, sellerSigned: true },
    });
    return contract?.buyerSigned === true && contract?.sellerSigned === true;
  }

  private mapToType(contract: {
    id: string;
    tableId: string;
    buyerId: string;
    sellerId: string;
    encryptedAmount: string;
    deliverables: string[];
    timeline: Prisma.JsonValue;
    buyerSigned: boolean;
    sellerSigned: boolean;
    buyerSignedAt?: Date | null;
    sellerSignedAt?: Date | null;
    createdAt: Date;
  }): Contract {
    return {
      id: contract.id,
      tableId: contract.tableId,
      buyerId: contract.buyerId,
      sellerId: contract.sellerId,
      encryptedAmount: contract.encryptedAmount,
      deliverables: contract.deliverables,
      timeline: (contract.timeline ?? {}) as unknown as ContractTimeline,
      buyerSigned: contract.buyerSigned,
      sellerSigned: contract.sellerSigned,
      buyerSignedAt: contract.buyerSignedAt || undefined,
      sellerSignedAt: contract.sellerSignedAt || undefined,
      createdAt: contract.createdAt,
    };
  }
}

export const contractService = new ContractService();
