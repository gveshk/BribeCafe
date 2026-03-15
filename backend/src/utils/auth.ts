import { ethers } from 'ethers';
import jwt from '@fastify/jwt';
import type { FastifyInstance } from 'fastify';
import { agentService } from '../services/agentService';
import type { AuthPayload } from '../types';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AuthPayload;
    user: AuthPayload;
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    auth: AuthPayload;
  }
}

const AUTH_MESSAGE = 'Sign this message to authenticate with BribeCafe';

export async function registerAuth(fastify: FastifyInstance): Promise<void> {
  // Register JWT plugin
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'fallback-secret-change-me',
    sign: {
      expiresIn: '7d',
    },
  });

  // Decorate with verify function
  fastify.decorate('verifyToken', async function (request: any, reply: any) {
    try {
      const decoded = await request.jwtVerify();
      request.auth = decoded;
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });
}

// Generate authentication message for wallet signing
export function generateAuthMessage(): string {
  const timestamp = Date.now();
  return `${AUTH_MESSAGE}\n\nTimestamp: ${timestamp}\nNonce: ${Math.random().toString(36).substring(7)}`;
}

// Verify wallet signature and return address
export function verifyWalletSignature(
  message: string,
  signature: string
): string {
  try {
    // Parse the message to extract timestamp and nonce
    const expectedPrefix = AUTH_MESSAGE;
    if (!message.startsWith(expectedPrefix)) {
      throw new Error('Invalid message format');
    }

    // Verify signature
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress;
  } catch (error) {
    throw new Error('Invalid signature');
  }
}

// Generate JWT token for authenticated agent
export async function generateToken(
  fastify: FastifyInstance,
  agentId: string,
  ownerAddress: string
): Promise<string> {
  const payload: AuthPayload = {
    agentId,
    ownerAddress,
  };
  return fastify.jwt.sign(payload);
}

// Optional auth decorator - doesn't fail if no token
export async function optionalAuth(
  fastify: FastifyInstance,
  request: any,
  reply: any
): Promise<void> {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return;
  }

  try {
    const decoded = await request.server.jwt.verify(
      authHeader.substring(7)
    );
    request.auth = decoded;
  } catch {
    // Ignore auth errors for optional auth
  }
}
