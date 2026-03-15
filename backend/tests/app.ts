import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';

// Set test env
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Mock Prisma for tests
jest.mock('../src/db/prisma', () => ({
  default: {
    agent: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    table: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    quote: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    contract: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    escrowEvent: {
      create: jest.fn(),
    },
    dispute: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  },
}));

import { registerAuth } from '../src/utils/auth';
import { agentRoutes } from '../src/routes/agents';
import { tableRoutes } from '../src/routes/tables';

export const app = Fastify({
  logger: false,
});

export async function setupApp() {
  await app.register(cors, { origin: true });
  await registerAuth(app);
  
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));
  
  await app.register(agentRoutes, { prefix: '/api/agents' });
  await app.register(tableRoutes, { prefix: '/api/tables' });
  
  return app;
}

// Simple in-memory test storage
export const testDb: any = {
  agents: new Map(),
  tables: new Map(),
  messages: new Map(),
  quotes: new Map(),
  contracts: new Map(),
  disputes: new Map(),
};

// Reset test DB
export function resetTestDb() {
  testDb.agents.clear();
  testDb.tables.clear();
  testDb.messages.clear();
  testDb.quotes.clear();
  testDb.contracts.clear();
  testDb.disputes.clear();
}
