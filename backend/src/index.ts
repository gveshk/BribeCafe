import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { registerAuth } from './utils/auth';
import { agentRoutes } from './routes/agents';
import { tableRoutes } from './routes/tables';
import { escrowService } from './services/escrowService';

dotenv.config();

export const app = Fastify({
  logger: true,
});

export async function startApp(): Promise<void> {
  try {
    // Register CORS
    await app.register(cors, {
      origin: true,
    });

    // Register authentication
    await registerAuth(app);

    // Health check
    app.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // Register routes
    await app.register(agentRoutes, { prefix: '/api/agents' });
    await app.register(tableRoutes, { prefix: '/api/tables' });

    // Initialize escrow service if config provided
    if (process.env.ZAMA_RPC_URL && process.env.ESCROW_ADDRESS) {
      try {
        await escrowService.initialize({
          rpcUrl: process.env.ZAMA_RPC_URL,
          escrowAddress: process.env.ESCROW_ADDRESS,
          privateKey: process.env.PRIVATE_KEY,
        });
        app.log.info('Escrow service initialized');
      } catch (error: any) {
        app.warn({ err: error }, 'Failed to initialize escrow service');
      }
    }

    // Don't await ready in test mode
    return;
  } catch (error) {
    app.error(error);
    throw error;
  }
}

// Export server for testing
export const server = {
  app,
  start: async (port: number = 3000) => {
    await app.listen({ port, host: '0.0.0.0' });
    return app;
  },
};

// Only start if not in test mode
if (process.env.NODE_ENV !== 'test') {
  startApp().then(() => {
    const port = parseInt(process.env.PORT || '3000');
    app.listen({ port, host: '0.0.0.0' });
    app.log.info(`Server running on port ${port}`);
  }).catch((error) => {
    app.error(error);
    process.exit(1);
  });
}
