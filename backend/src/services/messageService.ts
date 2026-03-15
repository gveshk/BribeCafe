import { v4 as uuidv4 } from 'uuid';
import prisma from '../db/prisma';
import type { Message, CreateMessageInput, MessageType } from '../types';

export class MessageService {
  async create(input: CreateMessageInput): Promise<Message> {
    const message = await prisma.message.create({
      data: {
        id: uuidv4(),
        tableId: input.tableId,
        senderId: input.senderId,
        content: input.content,
        messageType: input.messageType,
      },
      include: {
        sender: true,
      },
    });

    return this.mapToType(message);
  }

  async findByTable(
    tableId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ messages: Message[]; total: number }> {
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { tableId },
        take: options?.limit ?? 100,
        skip: options?.offset ?? 0,
        orderBy: { createdAt: 'asc' },
        include: {
          sender: {
            select: {
              id: true,
              ownerAddress: true,
              metadata: true,
            },
          },
        },
      }),
      prisma.message.count({ where: { tableId } }),
    ]);

    return {
      messages: messages.map((m) => this.mapToType(m)),
      total,
    };
  }

  async findById(id: string): Promise<Message | null> {
    const message = await prisma.message.findUnique({
      where: { id },
      include: {
        sender: true,
      },
    });
    return message ? this.mapToType(message) : null;
  }

  async countByTable(tableId: string): Promise<number> {
    return prisma.message.count({ where: { tableId } });
  }

  private mapToType(message: {
    id: string;
    tableId: string;
    senderId: string;
    content: string;
    messageType: string;
    createdAt: Date;
  }): Message {
    return {
      id: message.id,
      tableId: message.tableId,
      senderId: message.senderId,
      content: message.content,
      messageType: message.messageType as MessageType,
      createdAt: message.createdAt,
    };
  }
}

export const messageService = new MessageService();
