import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { registerAuth } from './utils/auth';
import { agentRoutes } from './routes/agents';
import { tableRoutes } from './routes/tables';
import { escrowService } from './services/escrowService';

dotenv.config();

const fastify = Fastify({
  logger: true,
});

async function start(): Promise<void> {
  try {
    // Register CORS
    await fastify.register(cors, {
      origin: true,
    });

    // Register authentication
    await registerAuth(fastify);

    // Health check
    fastify.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // Register routes
    await fastify.register(agentRoutes, { prefix: '/api/agents' });
    await fastify.register(tableRoutes, { prefix: '/api/tables' });

    // Initialize escrow service if config provided
    if (process.env.ZAMA_RPC_URL && process.env.ESCROW_ADDRESS) {
      try {
        await escrowService.initialize({
          rpcUrl: process.env.ZAMA_RPC_URL,
          escrowAddress: process.env.ESCROW_ADDRESS,
          privateKey: process.env.PRIVATE_KEY,
        });
        fastify.log.info('Escrow service initialized');
      } catch (error) {
        fastify.log.warn({ err: error }, 'Failed to initialize escrow service');
      }
    }

    // Start server
    const port = parseInt(process.env.PORT || '3000');
    await fastify.listen({ port, host: '0.0.0.0' });

    fastify.log.info(`Server running on port ${port}`);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
}

start();
