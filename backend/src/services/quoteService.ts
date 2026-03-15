import { v4 as uuidv4 } from 'uuid';
import prisma from '../db/prisma';
import type { Quote, CreateQuoteInput } from '../types';

export class QuoteService {
  async create(input: CreateQuoteInput): Promise<Quote> {
    const quote = await prisma.quote.create({
      data: {
        id: uuidv4(),
        tableId: input.tableId,
        sellerId: input.sellerId,
        encryptedAmount: input.encryptedAmount,
        description: input.description,
      },
      include: {
        seller: true,
      },
    });

    return this.mapToType(quote);
  }

  async findById(id: string): Promise<Quote | null> {
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        seller: true,
      },
    });
    return quote ? this.mapToType(quote) : null;
  }

  async findByTable(tableId: string): Promise<Quote[]> {
    const quotes = await prisma.quote.findMany({
      where: { tableId },
      orderBy: { createdAt: 'desc' },
      include: {
        seller: true,
      },
    });
    return quotes.map((q) => this.mapToType(q));
  }

  async findLatestByTable(tableId: string): Promise<Quote | null> {
    const quote = await prisma.quote.findFirst({
      where: { tableId },
      orderBy: { createdAt: 'desc' },
      include: {
        seller: true,
      },
    });
    return quote ? this.mapToType(quote) : null;
  }

  async approve(id: string, approvedBy: string): Promise<Quote | null> {
    const quote = await prisma.quote.update({
      where: { id },
      data: {
        approved: true,
        approvedBy,
        approvedAt: new Date(),
      },
      include: {
        seller: true,
      },
    });
    return this.mapToType(quote);
  }

  private mapToType(quote: {
    id: string;
    tableId: string;
    sellerId: string;
    encryptedAmount: string;
    description: string;
    approved: boolean;
    approvedBy?: string | null;
    approvedAt?: Date | null;
    createdAt: Date;
  }): Quote {
    return {
      id: quote.id,
      tableId: quote.tableId,
      sellerId: quote.sellerId,
      encryptedAmount: quote.encryptedAmount,
      description: quote.description,
      approved: quote.approved,
      approvedBy: quote.approvedBy || undefined,
      approvedAt: quote.approvedAt || undefined,
      createdAt: quote.createdAt,
    };
  }
}

export const quoteService = new QuoteService();
