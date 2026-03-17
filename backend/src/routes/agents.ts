import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { createAgentSchema, updateAgentSchema, loginSchema } from '../route-contracts';
import { agentService } from '../services/agentService';
import { generateToken, generateAuthMessage, verifyWalletSignature } from '../utils/auth';
import type { CreateAgentInput } from '../types';

// Validation schemas
const listAgentsSchema = z.object({
  capabilities: z.string().optional(),
  minReputation: z.coerce.number().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
});

export async function agentRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /api/agents - List agents
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

    return reply.send({
      items: result.agents,
      total: result.total,
      limit: limit ?? 50,
      offset: offset ?? 0,
    });
  });

  // POST /api/agents/register - Register new agent
  fastify.post('/register', {
    schema: { body: createAgentSchema },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const input = request.body as z.infer<typeof createAgentSchema>;

    // Check if agent with this owner already exists
    const existing = await agentService.findByOwnerAddress(input.ownerAddress);
    if (existing) {
      return reply.status(400).send({
        error: 'Agent already exists for this wallet address',
      });
    }

    const agent = await agentService.create(input as CreateAgentInput);
    const token = await generateToken(fastify, agent.id, agent.ownerAddress);

    return reply.status(201).send({
      agent,
      token,
    });
  });

  // POST /api/agents/login - Wallet-based login
  fastify.post('/login', {
    schema: { body: loginSchema },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { address, signature, message } = request.body as z.infer<typeof loginSchema>;

    // Verify signature
    const recoveredAddress = verifyWalletSignature(message, signature);

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return reply.status(401).send({
        error: 'Invalid signature',
      });
    }

    // Find or create agent
    let agent = await agentService.findByOwnerAddress(address);

    if (!agent) {
      // Auto-register if doesn't exist
      agent = await agentService.create({
        ownerAddress: address,
        publicKey: '',
        capabilities: [],
        walletAddress: address,
        metadata: {
          name: `Agent ${address.substring(0, 8)}`,
          description: '',
        },
      });
    }

    const token = await generateToken(fastify, agent.id, agent.ownerAddress);

    return reply.send({
      agent,
      token,
    });
  });

  // GET /api/agents/auth-message - Get message for wallet signing
  fastify.get('/auth-message', async (request: FastifyRequest, reply: FastifyReply) => {
    const message = generateAuthMessage();
    return reply.send({ message });
  });

  // GET /api/agents/:id - Get agent by ID
  fastify.get('/:id', {
    preHandler: [fastify.verifyToken],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const agent = await agentService.findById(id);

    if (!agent) {
      return reply.status(404).send({ error: 'Agent not found' });
    }

    return reply.send({ agent });
  });

  // PUT /api/agents/:id - Update agent
  fastify.put('/:id', {
    preHandler: [fastify.verifyToken],
    schema: { body: updateAgentSchema },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as z.infer<typeof updateAgentSchema>;

    // Verify ownership
    if (request.auth.agentId !== id) {
      return reply.status(403).send({ error: 'Not authorized' });
    }

    const updateData: Partial<CreateAgentInput> = {};
    if (body.publicKey) updateData.publicKey = body.publicKey;
    if (body.capabilities) updateData.capabilities = body.capabilities;
    if (body.walletAddress) updateData.walletAddress = body.walletAddress;
    if (body.metadata) updateData.metadata = body.metadata as CreateAgentInput['metadata'];

    const agent = await agentService.update(id, updateData);

    if (!agent) {
      return reply.status(404).send({ error: 'Agent not found' });
    }

    return reply.send({ agent });
  });

  // GET /api/agents/me - Get current authenticated agent
  fastify.get('/me', {
    preHandler: [fastify.verifyToken],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const agent = await agentService.findById(request.auth.agentId);

    if (!agent) {
      return reply.status(404).send({ error: 'Agent not found' });
    }

    return reply.send({ agent });
  });
}
