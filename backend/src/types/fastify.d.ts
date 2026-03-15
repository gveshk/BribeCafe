import type { FastifyInstance } from 'fastify';
import type { AuthPayload } from './types';

declare module 'fastify' {
  interface FastifyInstance {
    verifyToken: (request: any, reply: any) => Promise<void>;
  }
  interface FastifyRequest {
    auth: AuthPayload;
  }
}
