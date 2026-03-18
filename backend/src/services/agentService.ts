import { v4 as uuidv4 } from 'uuid';
import prisma from '../db/prisma';
import type { Agent, CreateAgentInput, AgentMetadata } from '../types';

// Using any for prisma to avoid type issues
const prismaAny: any = prisma;

export class AgentService {
  async create(input: CreateAgentInput): Promise<Agent> {
    const agent = await prismaAny.agent.create({
      data: {
        id: uuidv4(),
        ownerAddress: input.ownerAddress.toLowerCase(),
        publicKey: input.publicKey,
        capabilities: input.capabilities,
        walletAddress: input.walletAddress?.toLowerCase(),
        metadata: input.metadata,
      },
    });
    return this.mapToType(agent);
  }

  async findById(id: string): Promise<Agent | null> {
    const agent = await prismaAny.agent.findUnique({ where: { id } });
    return agent ? this.mapToType(agent) : null;
  }

  async findByOwnerAddress(address: string): Promise<Agent | null> {
    const agent = await prismaAny.agent.findUnique({
      where: { ownerAddress: address.toLowerCase() },
    });
    return agent ? this.mapToType(agent) : null;
  }

  async findAll(filters?: {
    capabilities?: string[];
    minReputation?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ agents: Agent[]; total: number }> {
    const where: any = {};

    if (filters?.capabilities && filters.capabilities.length > 0) {
      where.capabilities = { hasSome: filters.capabilities };
    }
    if (filters?.minReputation !== undefined) {
      where.reputationScore = { gte: filters.minReputation };
    }

    const [agents, total] = await Promise.all([
      prismaAny.agent.findMany({
        where,
        take: filters?.limit ?? 50,
        skip: filters?.offset ?? 0,
        orderBy: { reputationScore: 'desc' },
      }),
      prismaAny.agent.count({ where }),
    ]);

    return {
      agents: agents.map((a: any) => this.mapToType(a)),
      total,
    };
  }

  async update(
    id: string,
    data: Partial<CreateAgentInput>
  ): Promise<Agent | null> {
    const updateData: any = {};
    if (data.publicKey) updateData.publicKey = data.publicKey;
    if (data.capabilities) updateData.capabilities = data.capabilities;
    if (data.walletAddress) {
      updateData.walletAddress = data.walletAddress.toLowerCase();
    }
    if (data.metadata) updateData.metadata = data.metadata;

    const agent = await prismaAny.agent.update({
      where: { id },
      data: updateData,
    });
    return this.mapToType(agent);
  }

  async updateReputation(id: string, delta: number): Promise<void> {
    await prismaAny.agent.update({
      where: { id },
      data: { reputationScore: { increment: delta } },
    });
  }

  async getTokenVersion(id: string): Promise<number | null> {
    const agent = await prismaAny.agent.findUnique({
      where: { id },
      select: { tokenVersion: true },
    });

    return agent?.tokenVersion ?? null;
  }

  async rotateTokenVersion(id: string): Promise<number> {
    const agent = await prismaAny.agent.update({
      where: { id },
      data: { tokenVersion: { increment: 1 } },
      select: { tokenVersion: true },
    });

    return agent.tokenVersion;
  }

  private mapToType(agent: any): Agent {
    return {
      id: agent.id,
      ownerAddress: agent.ownerAddress,
      publicKey: agent.publicKey,
      capabilities: agent.capabilities,
      reputationScore: agent.reputationScore,
      walletAddress: agent.walletAddress || '',
      metadata: agent.metadata as AgentMetadata,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
    };
  }
}

export const agentService = new AgentService();
