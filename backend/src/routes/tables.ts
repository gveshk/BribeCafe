import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { tableService } from '../services/tableService';
import { messageService } from '../services/messageService';
import { quoteService } from '../services/quoteService';
import { contractService } from '../services/contractService';
import type { CreateTableInput } from '../types';

// Validation schemas
const createTableSchema = z.object({
  participantId: z.string().uuid(),
  encryptedBudget: z.string().optional(),
});

const listTablesSchema = z.object({
  status: z.enum(['active', 'completed', 'cancelled', 'disputed']).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
});

const sendMessageSchema = z.object({
  content: z.string().min(1),
  messageType: z.enum(['text', 'quote', 'document', 'contract', 'work', 'system']).default('text'),
});

const submitQuoteSchema = z.object({
  encryptedAmount: z.string().min(1),
  description: z.string().min(1),
});

const createContractSchema = z.object({
  encryptedAmount: z.string().min(1),
  deliverables: z.array(z.string()).min(1),
  timeline: z.object({
    start: z.number(),
    end: z.number(),
  }),
});

const escrowDepositSchema = z.object({
  amount: z.string().min(1),
});

const openDisputeSchema = z.object({
  reason: z.enum(['quality', 'non_delivery', 'other']),
  evidence: z.array(z.string()),
});

export async function tableRoutes(fastify: FastifyInstance): Promise<void> {
  // Middleware to check table participation
  const requireParticipant = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const isParticipant = await tableService.isParticipant(id, request.auth.agentId);
    if (!isParticipant) {
      return reply.status(403).send({ error: 'Not authorized' });
    }
  };

  // POST /api/tables - Create a new table
  fastify.post('/', {
    preHandler: [fastify.verifyToken],
    schema: { body: createTableSchema },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as z.infer<typeof createTableSchema>;
    const creatorId = request.auth.agentId;
    const { participantId, encryptedBudget } = body;

    if (creatorId === participantId) {
      return reply.status(400).send({
        error: 'Cannot create table with yourself',
      });
    }

    const input: CreateTableInput = {
      creatorId,
      participantId,
      encryptedBudget,
    };

    const table = await tableService.create(input);

    // Send system message
    await messageService.create({
      tableId: table.id,
      senderId: creatorId,
      content: 'Table created',
      messageType: 'system',
    });

    return reply.status(201).send({ table });
  });

  // GET /api/tables - List tables for current agent
  fastify.get('/', {
    preHandler: [fastify.verifyToken],
    schema: { querystring: listTablesSchema },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as Record<string, unknown>;
    const { status, limit, offset } = query;

    const result = await tableService.findByAgent(request.auth.agentId, {
      status: status as 'active' | 'completed' | 'cancelled' | 'disputed' | undefined,
      limit: typeof limit === 'number' ? limit : undefined,
      offset: typeof offset === 'number' ? offset : undefined,
    });

    return reply.send({
      items: result.tables,
      total: result.total,
      limit: limit ?? 50,
      offset: offset ?? 0,
    });
  });

  // GET /api/tables/:id - Get table details
  fastify.get('/:id', {
    preHandler: [fastify.verifyToken, requireParticipant],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const table = await tableService.findById(id);

    if (!table) {
      return reply.status(404).send({ error: 'Table not found' });
    }

    // Get related data
    const [messages, quotes, contracts] = await Promise.all([
      messageService.findByTable(id, { limit: 50 }),
      quoteService.findByTable(id),
      contractService.findByTable(id),
    ]);

    return reply.send({
      table,
      messages: messages.messages,
      quotes,
      contract: contracts,
    });
  });

  // GET /api/tables/:id/messages - Get table messages
  fastify.get('/:id/messages', {
    preHandler: [fastify.verifyToken, requireParticipant],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const query = request.query as Record<string, unknown>;

    const result = await messageService.findByTable(id, {
      limit: typeof query.limit === 'number' ? query.limit : undefined,
      offset: typeof query.offset === 'number' ? query.offset : undefined,
    });

    return reply.send({
      items: result.messages,
      total: result.total,
      limit: query.limit ?? 100,
      offset: query.offset ?? 0,
    });
  });

  // POST /api/tables/:id/messages - Send message
  fastify.post('/:id/messages', {
    preHandler: [fastify.verifyToken, requireParticipant],
    schema: { body: sendMessageSchema },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as z.infer<typeof sendMessageSchema>;
    const { content, messageType } = body;

    const message = await messageService.create({
      tableId: id,
      senderId: request.auth.agentId,
      content,
      messageType,
    });

    return reply.status(201).send({ message });
  });

  // POST /api/tables/:id/quote - Submit quote (seller only)
  fastify.post('/:id/quote', {
    preHandler: [fastify.verifyToken],
    schema: { body: submitQuoteSchema },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as z.infer<typeof submitQuoteSchema>;
    const { encryptedAmount, description } = body;

    const table = await tableService.findById(id);
    if (!table) {
      return reply.status(404).send({ error: 'Table not found' });
    }

    // Only participant can submit quote
    if (table.participantId !== request.auth.agentId) {
      return reply.status(403).send({
        error: 'Only the invited participant can submit a quote',
      });
    }

    const quote = await quoteService.create({
      tableId: id,
      sellerId: request.auth.agentId,
      encryptedAmount,
      description,
    });

    // Send system message
    await messageService.create({
      tableId: id,
      senderId: request.auth.agentId,
      content: `Quote submitted: ${description}`,
      messageType: 'quote',
    });

    return reply.status(201).send({ quote });
  });

  // POST /api/tables/:id/quote/approve - Approve quote (buyer only)
  fastify.post('/:id/quote/approve', {
    preHandler: [fastify.verifyToken],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const table = await tableService.findById(id);
    if (!table) {
      return reply.status(404).send({ error: 'Table not found' });
    }

    // Only creator (buyer) can approve
    if (table.creatorId !== request.auth.agentId) {
      return reply.status(403).send({
        error: 'Only the table creator can approve a quote',
      });
    }

    const latestQuote = await quoteService.findLatestByTable(id);
    if (!latestQuote) {
      return reply.status(404).send({ error: 'No quote found' });
    }

    const approvedQuote = await quoteService.approve(latestQuote.id, request.auth.agentId);

    // Update table with quote
    await tableService.updateQuote(id, latestQuote.encryptedAmount);

    // Send system message
    await messageService.create({
      tableId: id,
      senderId: request.auth.agentId,
      content: 'Quote approved',
      messageType: 'system',
    });

    return reply.send({ quote: approvedQuote });
  });

  // POST /api/tables/:id/contract - Create contract
  fastify.post('/:id/contract', {
    preHandler: [fastify.verifyToken],
    schema: { body: createContractSchema },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as z.infer<typeof createContractSchema>;
    const { encryptedAmount, deliverables, timeline } = body;

    const table = await tableService.findById(id);
    if (!table) {
      return reply.status(404).send({ error: 'Table not found' });
    }

    // Verify quote is approved
    const latestQuote = await quoteService.findLatestByTable(id);
    if (!latestQuote?.approved) {
      return reply.status(400).send({ error: 'Quote must be approved first' });
    }

    const contract = await contractService.create({
      tableId: id,
      buyerId: table.creatorId,
      sellerId: table.participantId,
      encryptedAmount,
      deliverables,
      timeline: {
        start: timeline.start,
        end: timeline.end,
      },
    });

    // Update table with contract hash
    await tableService.updateContractHash(id, contract.id);

    // Send system message
    await messageService.create({
      tableId: id,
      senderId: table.participantId,
      content: 'Contract created',
      messageType: 'contract',
    });

    return reply.status(201).send({ contract });
  });

  // POST /api/tables/:id/contract/sign - Sign contract & deposit escrow
  fastify.post('/:id/contract/sign', {
    preHandler: [fastify.verifyToken],
    schema: { body: escrowDepositSchema },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as z.infer<typeof escrowDepositSchema>;
    const { amount } = body;

    const table = await tableService.findById(id);
    if (!table) {
      return reply.status(404).send({ error: 'Table not found' });
    }

    const contract = await contractService.findByTable(id);
    if (!contract) {
      return reply.status(404).send({ error: 'Contract not found' });
    }

    // Determine if sender is buyer or seller
    const isBuyer = table.creatorId === request.auth.agentId;
    const isSeller = table.participantId === request.auth.agentId;

    if (!isBuyer && !isSeller) {
      return reply.status(403).send({ error: 'Not authorized' });
    }

    // Sign based on role
    if (isBuyer) {
      await contractService.buyerSign(contract.id);
    } else {
      await contractService.sellerSign(contract.id);
    }

    // Send system message
    await messageService.create({
      tableId: id,
      senderId: request.auth.agentId,
      content: isBuyer ? 'Buyer signed contract' : 'Seller signed contract',
      messageType: 'system',
    });

    // Check if both signed
    const updatedContract = await contractService.findByTable(id);
    const bothSigned = updatedContract?.buyerSigned && updatedContract?.sellerSigned;

    if (bothSigned) {
      await tableService.updateStatus(id, 'completed');
    }

    return reply.send({ 
      contract: updatedContract,
      bothSigned,
    });
  });

  // POST /api/tables/:id/escrow/deposit - Deposit to escrow
  fastify.post('/:id/escrow/deposit', {
    preHandler: [fastify.verifyToken],
    schema: { body: escrowDepositSchema },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as z.infer<typeof escrowDepositSchema>;
    const { amount } = body;

    const table = await tableService.findById(id);
    if (!table) {
      return reply.status(404).send({ error: 'Table not found' });
    }

    // Only buyer can deposit
    if (table.creatorId !== request.auth.agentId) {
      return reply.status(403).send({
        error: 'Only the buyer can deposit to escrow',
      });
    }

    // In production, this would call escrowService.deposit()
    return reply.send({
      success: true,
      tableId: id,
      amount,
      message: 'Deposit initiated (blockchain integration pending)',
    });
  });

  // POST /api/tables/:id/escrow/release/approve - Approve release
  fastify.post('/:id/escrow/release/approve', {
    preHandler: [fastify.verifyToken],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const table = await tableService.findById(id);
    if (!table) {
      return reply.status(404).send({ error: 'Table not found' });
    }

    const isBuyer = table.creatorId === request.auth.agentId;
    const isSeller = table.participantId === request.auth.agentId;

    if (!isBuyer && !isSeller) {
      return reply.status(403).send({ error: 'Not authorized' });
    }

    return reply.send({
      success: true,
      approvedBy: isBuyer ? 'buyer' : 'seller',
      message: 'Release approval recorded',
    });
  });

  // GET /api/tables/:id/escrow/status - Get escrow status
  fastify.get('/:id/escrow/status', {
    preHandler: [fastify.verifyToken, requireParticipant],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    // In production, call escrowService.getStatus()
    return reply.send({
      tableId: id,
      amount: '0',
      fee: '0',
      buyerApproved: false,
      sellerApproved: false,
      released: false,
      cancelled: false,
      disputed: false,
    });
  });

  // POST /api/tables/:id/dispute - Open dispute
  fastify.post('/:id/dispute', {
    preHandler: [fastify.verifyToken],
    schema: { body: openDisputeSchema },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as z.infer<typeof openDisputeSchema>;
    const { reason, evidence } = body;

    const table = await tableService.findById(id);
    if (!table) {
      return reply.status(404).send({ error: 'Table not found' });
    }

    const isParticipant = table.creatorId === request.auth.agentId || 
                          table.participantId === request.auth.agentId;

    if (!isParticipant) {
      return reply.status(403).send({ error: 'Not authorized' });
    }

    // Import dispute service
    const { disputeService } = await import('../services/disputeService');
    
    const dispute = await disputeService.create({
      tableId: id,
      openedBy: request.auth.agentId,
      reason,
      evidence,
    });

    return reply.status(201).send({ dispute });
  });
}
