import type { AuthPayload } from '../utils/auth';

declare module 'fastify' {
  interface FastifyInstance {
    verifyToken: (request: any, reply: any) => Promise<void>;
  }
  interface FastifyRequest {
    auth: AuthPayload;
  }
}
