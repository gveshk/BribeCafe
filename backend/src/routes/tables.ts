import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import {
  createTableSchema,
  sendMessageSchema,
  submitQuoteSchema,
  createContractSchema,
  escrowDepositSchema,
  openDisputeSchema,
} from '../route-contracts';
import { tableService } from '../services/tableService';
import { messageService } from '../services/messageService';
import { quoteService } from '../services/quoteService';
import { contractService } from '../services/contractService';
import { escrowService } from '../services/escrowService';
import type { CreateTableInput } from '../types';

const listTablesSchema = z.object({
  status: z.enum(['active', 'completed', 'cancelled', 'disputed']).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
});

export async function tableRoutes(fastify: FastifyInstance): Promise<void> {
  const requireParticipant = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const isParticipant = await tableService.isParticipant(id, request.auth.agentId);
    if (!isParticipant) {
      return reply.status(403).send({ error: 'Not authorized' });
    }
  };

  fastify.post('/', {
    preHandler: [fastify.verifyToken],
    schema: { body: createTableSchema },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as z.infer<typeof createTableSchema>;
    const creatorId = request.auth.agentId;
    const { participantId, encryptedBudget } = body;

    if (creatorId === participantId) {
      return reply.status(400).send({ error: 'Cannot create table with yourself' });
    }

    const input: CreateTableInput = { creatorId, participantId, encryptedBudget };
    const table = await tableService.create(input);

    await messageService.create({
      tableId: table.id,
      senderId: creatorId,
      content: 'Table created',
      messageType: 'system',
    });

    return reply.status(201).send({ table });
  });

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

  fastify.get('/:id', {
    preHandler: [fastify.verifyToken, requireParticipant],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const table = await tableService.findById(id);

    if (!table) {
      return reply.status(404).send({ error: 'Table not found' });
    }

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

  fastify.post('/:id/messages', {
    preHandler: [fastify.verifyToken, requireParticipant],
    schema: { body: sendMessageSchema },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as z.infer<typeof sendMessageSchema>;

    const message = await messageService.create({
      tableId: id,
      senderId: request.auth.agentId,
      content: body.content,
      messageType: body.messageType,
    });

    return reply.status(201).send({ message });
  });

  fastify.post('/:id/quote', {
    preHandler: [fastify.verifyToken],
    schema: { body: submitQuoteSchema },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as z.infer<typeof submitQuoteSchema>;

    const table = await tableService.findById(id);
    if (!table) {
      return reply.status(404).send({ error: 'Table not found' });
    }

    if (table.participantId !== request.auth.agentId) {
      return reply.status(403).send({ error: 'Only the invited participant can submit a quote' });
    }

    const quote = await quoteService.create({
      tableId: id,
      sellerId: request.auth.agentId,
      encryptedAmount: body.encryptedAmount,
      description: body.description,
    });

    await messageService.create({
      tableId: id,
      senderId: request.auth.agentId,
      content: `Quote submitted: ${body.description}`,
      messageType: 'quote',
    });

    return reply.status(201).send({ quote });
  });

  fastify.get('/:id/quote', {
    preHandler: [fastify.verifyToken, requireParticipant],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const quote = await quoteService.findLatestByTable(id);
    return reply.send({ quote });
  });

  fastify.post('/:id/quote/approve', {
    preHandler: [fastify.verifyToken],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const table = await tableService.findById(id);
    if (!table) {
      return reply.status(404).send({ error: 'Table not found' });
    }

    if (table.creatorId !== request.auth.agentId) {
      return reply.status(403).send({ error: 'Only the table creator can approve a quote' });
    }

    const latestQuote = await quoteService.findLatestByTable(id);
    if (!latestQuote) {
      return reply.status(404).send({ error: 'No quote found' });
    }

    const approvedQuote = await quoteService.approve(latestQuote.id, request.auth.agentId);
    await tableService.updateQuote(id, latestQuote.encryptedAmount);

    await messageService.create({
      tableId: id,
      senderId: request.auth.agentId,
      content: 'Quote approved',
      messageType: 'system',
    });

    return reply.send({ quote: approvedQuote });
  });

  fastify.post('/:id/contract', {
    preHandler: [fastify.verifyToken],
    schema: { body: createContractSchema },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as z.infer<typeof createContractSchema>;

    const table = await tableService.findById(id);
    if (!table) {
      return reply.status(404).send({ error: 'Table not found' });
    }

    const latestQuote = await quoteService.findLatestByTable(id);
    if (!latestQuote?.approved) {
      return reply.status(400).send({ error: 'Quote must be approved first' });
    }

    const contract = await contractService.create({
      tableId: id,
      buyerId: table.creatorId,
      sellerId: table.participantId,
      encryptedAmount: body.encryptedAmount,
      deliverables: body.deliverables,
      timeline: {
        start: body.timeline.start,
        end: body.timeline.end,
      },
    });

    await tableService.updateContractHash(id, contract.id);

    await messageService.create({
      tableId: id,
      senderId: table.participantId,
      content: 'Contract created',
      messageType: 'contract',
    });

    return reply.status(201).send({ contract });
  });

  fastify.get('/:id/contract', {
    preHandler: [fastify.verifyToken, requireParticipant],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const contract = await contractService.findByTable(id);
    return reply.send({ contract });
  });

  fastify.post('/:id/contract/sign', {
    preHandler: [fastify.verifyToken],
    schema: { body: escrowDepositSchema },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const table = await tableService.findById(id);
    if (!table) {
      return reply.status(404).send({ error: 'Table not found' });
    }

    const contract = await contractService.findByTable(id);
    if (!contract) {
      return reply.status(404).send({ error: 'Contract not found' });
    }

    const isBuyer = table.creatorId === request.auth.agentId;
    const isSeller = table.participantId === request.auth.agentId;

    if (!isBuyer && !isSeller) {
      return reply.status(403).send({ error: 'Not authorized' });
    }

    if (isBuyer) {
      await contractService.buyerSign(contract.id);
    } else {
      await contractService.sellerSign(contract.id);
    }

    await messageService.create({
      tableId: id,
      senderId: request.auth.agentId,
      content: isBuyer ? 'Buyer signed contract' : 'Seller signed contract',
      messageType: 'system',
    });

    const updatedContract = await contractService.findByTable(id);
    const bothSigned = updatedContract?.buyerSigned && updatedContract?.sellerSigned;

    if (bothSigned) {
      await tableService.updateStatus(id, 'completed');
    }

    return reply.send({ contract: updatedContract, bothSigned });
  });

  fastify.post('/:id/escrow/deposit', {
    preHandler: [fastify.verifyToken],
    schema: { body: escrowDepositSchema },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as z.infer<typeof escrowDepositSchema>;

    const table = await tableService.findById(id);
    if (!table) {
      return reply.status(404).send({ error: 'Table not found' });
    }

    if (table.creatorId !== request.auth.agentId) {
      return reply.status(403).send({ error: 'Only the buyer can deposit to escrow' });
    }

    const tx = await escrowService.deposit(id, body.amount);

    return reply.send({
      success: true,
      tableId: id,
      amount: body.amount,
      txHash: tx.txHash,
      settlementStatus: 'pending',
    });
  });

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

    const tx = isBuyer ? await escrowService.buyerApprove(id) : await escrowService.sellerApprove(id);

    return reply.send({
      success: true,
      approvedBy: isBuyer ? 'buyer' : 'seller',
      txHash: tx.txHash,
      settlementStatus: 'pending',
    });
  });

  fastify.post('/:id/escrow/cancel', {
    preHandler: [fastify.verifyToken],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const table = await tableService.findById(id);
    if (!table) {
      return reply.status(404).send({ error: 'Table not found' });
    }

    if (table.creatorId !== request.auth.agentId) {
      return reply.status(403).send({ error: 'Only the buyer can cancel escrow' });
    }

    const tx = await escrowService.cancel(id);
    return reply.send({ success: true, txHash: tx.txHash, settlementStatus: 'pending' });
  });

  fastify.get('/:id/escrow/status', {
    preHandler: [fastify.verifyToken, requireParticipant],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const status = await escrowService.getStatus(id);
    const event = await escrowService.getLatestEvent(id);

    return reply.send({
      ...status,
      settlementStatus: event?.settlementStatus ?? 'unknown',
      chainId: event?.chainId ?? null,
      txHash: event?.txHash ?? null,
      confirmations: event?.confirmations ?? 0,
      failureReason: event?.failureReason ?? null,
      finalityPending: event?.settlementStatus === 'pending',
    });
  });

  fastify.post('/:id/dispute', {
    preHandler: [fastify.verifyToken],
    schema: { body: openDisputeSchema },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const body = request.body as z.infer<typeof openDisputeSchema>;

    const table = await tableService.findById(id);
    if (!table) {
      return reply.status(404).send({ error: 'Table not found' });
    }

    const isParticipant = table.creatorId === request.auth.agentId ||
      table.participantId === request.auth.agentId;

    if (!isParticipant) {
      return reply.status(403).send({ error: 'Not authorized' });
    }

    const { disputeService } = await import('../services/disputeService');
    const dispute = await disputeService.create({
      tableId: id,
      openedBy: request.auth.agentId,
      reason: body.reason,
      evidence: body.evidence,
    });

    const tx = await escrowService.openDispute(id);

    return reply.status(201).send({ dispute, txHash: tx.txHash, settlementStatus: 'pending' });
  });

  fastify.get('/:id/dispute', {
    preHandler: [fastify.verifyToken, requireParticipant],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const { disputeService } = await import('../services/disputeService');
    const disputes = await disputeService.findByTable(id);
    return reply.send({ dispute: disputes[0] || null });
  });
}
