import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { createAgentSchema, updateAgentSchema } from '../route-contracts';
import { agentService } from '../services/agentService';
import { authChallengeService } from '../services/authChallengeService';
import {
  generateToken,
  generateAuthChallengeMessage,
  verifyWalletSignature,
} from '../utils/auth';
import type { CreateAgentInput } from '../types';

const loginSchema = z.object({
  address: z.string().min(1),
  signature: z.string().min(1),
  challengeId: z.string().min(1),
  nonce: z.string().min(1),
});

const challengeSchema = z.object({
  address: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const listAgentsSchema = z.object({
  capabilities: z.string().optional(),
  minReputation: z.coerce.number().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
});

export async function agentRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/', {
    schema: { querystring: listAgentsSchema },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { capabilities, minReputation, limit, offset } = request.query as Record<string, unknown>;

    const result = await agentService.findAll({
      capabilities: typeof capabilities === 'string' ? capabilities.split(',') : undefined,
      minReputation: typeof minReputation === 'number' ? minReputation : undefined,
      limit: typeof limit === 'number' ? limit : undefined,
      offset: typeof offset === 'number' ? offset : undefined,
    });

    return reply.send({ items: result.agents, total: result.total, limit: limit ?? 50, offset: offset ?? 0 });
  });

  fastify.post('/register', {
    schema: { body: createAgentSchema },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const input = request.body as z.infer<typeof createAgentSchema>;

    const existing = await agentService.findByOwnerAddress(input.ownerAddress);
    if (existing) {
      return reply.status(400).send({ error: 'Agent already exists for this wallet address' });
    }

    const agent = await agentService.create(input as CreateAgentInput);
    const token = await generateToken(fastify, agent.id, agent.ownerAddress, 0);
    const refreshToken = (fastify.jwt as any).sign(
      { agentId: agent.id, ownerAddress: agent.ownerAddress, tokenVersion: 0, type: 'refresh' },
      { expiresIn: '7d' }
    );

    return reply.status(201).send({ agent, token, refreshToken });
  });

  fastify.post('/auth-challenge', {
    schema: { body: challengeSchema },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { address } = request.body as z.infer<typeof challengeSchema>;
    const challenge = await authChallengeService.create(address);
    return reply.send({
      challengeId: challenge.challengeId,
      nonce: challenge.nonce,
      expiresAt: challenge.expiresAt,
      message: generateAuthChallengeMessage({
        challengeId: challenge.challengeId,
        nonce: challenge.nonce,
        walletAddress: challenge.walletAddress,
      }),
    });
  });

  fastify.post('/login', {
    schema: { body: loginSchema },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { address, signature, challengeId, nonce } = request.body as z.infer<typeof loginSchema>;
    const normalizedAddress = address.toLowerCase();

    try {
      await authChallengeService.consume({ challengeId, nonce, walletAddress: normalizedAddress });
    } catch (error) {
      return reply.status(401).send({ error: (error as Error).message });
    }

    const message = generateAuthChallengeMessage({ challengeId, nonce, walletAddress: normalizedAddress });
    const recoveredAddress = verifyWalletSignature(message, signature);

    if (recoveredAddress.toLowerCase() !== normalizedAddress) {
      return reply.status(401).send({ error: 'Invalid signature' });
    }

    let agent = await agentService.findByOwnerAddress(normalizedAddress);

    if (!agent) {
      agent = await agentService.create({
        ownerAddress: normalizedAddress,
        publicKey: '',
        capabilities: [],
        walletAddress: normalizedAddress,
        metadata: { name: `Agent ${normalizedAddress.substring(0, 8)}`, description: '' },
      });
    }

    const tokenVersion = (await agentService.getTokenVersion(agent.id)) ?? 0;
    const token = await generateToken(fastify, agent.id, agent.ownerAddress, tokenVersion);
    const refreshToken = (fastify.jwt as any).sign(
      { agentId: agent.id, ownerAddress: agent.ownerAddress, tokenVersion, type: 'refresh' },
      { expiresIn: '7d' }
    );

    return reply.send({ agent, token, refreshToken });
  });

  fastify.post('/refresh', {
    schema: { body: refreshSchema },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { refreshToken } = request.body as z.infer<typeof refreshSchema>;

    try {
      const decoded = await fastify.jwt.verify<any>(refreshToken);
      if (decoded.type !== 'refresh') return reply.status(401).send({ error: 'Invalid refresh token' });

      const currentTokenVersion = await agentService.getTokenVersion(decoded.agentId);
      if (currentTokenVersion === null || currentTokenVersion !== decoded.tokenVersion) {
        return reply.status(401).send({ error: 'Refresh token revoked' });
      }

      const token = await generateToken(fastify, decoded.agentId, decoded.ownerAddress, currentTokenVersion);
      return reply.send({ token });
    } catch {
      return reply.status(401).send({ error: 'Invalid refresh token' });
    }
  });

  fastify.post('/logout', {
    preHandler: [fastify.verifyToken],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    await agentService.rotateTokenVersion(request.auth.agentId);
    return reply.send({ success: true });
  });

  fastify.get('/:id', {
    preHandler: [fastify.verifyToken],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const agent = await agentService.findById(id);

    if (!agent) return reply.status(404).send({ error: 'Agent not found' });
    return reply.send({ agent });
  });

  fastify.put('/:id', {
    preHandler: [fastify.verifyToken],
    schema: { body: updateAgentSchema },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as z.infer<typeof updateAgentSchema>;

    if (request.auth.agentId !== id) return reply.status(403).send({ error: 'Not authorized' });

    const updateData: Partial<CreateAgentInput> = {};
    if (body.publicKey) updateData.publicKey = body.publicKey;
    if (body.capabilities) updateData.capabilities = body.capabilities;
    if (body.walletAddress) updateData.walletAddress = body.walletAddress;
    if (body.metadata) updateData.metadata = body.metadata as CreateAgentInput['metadata'];

    const agent = await agentService.update(id, updateData);
    if (!agent) return reply.status(404).send({ error: 'Agent not found' });

    return reply.send({ agent });
  });

  fastify.get('/me', {
    preHandler: [fastify.verifyToken],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const agent = await agentService.findById(request.auth.agentId);
    if (!agent) return reply.status(404).send({ error: 'Agent not found' });

    return reply.send({ agent });
  });
}
