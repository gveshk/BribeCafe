import { ethers } from 'ethers';
import jwt from '@fastify/jwt';
import crypto from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { agentService } from '../services/agentService';

export interface AuthPayload {
  agentId: string;
  ownerAddress: string;
  tokenVersion: number;
}

export const AUTH_MESSAGE_PREFIX = 'Sign this challenge to authenticate with BribeCafe';

export interface AuthChallengeMessageInput {
  challengeId: string;
  nonce: string;
  walletAddress: string;
}

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

function validateJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (!secret) {
    if (!isDevelopment) {
      throw new Error('JWT_SECRET must be configured when NODE_ENV is not development');
    }

    return 'dev-only-fallback-secret';
  }

  return secret;
}

export async function registerAuth(fastify: FastifyInstance): Promise<void> {
  await fastify.register(jwt, {
    secret: validateJwtSecret(),
    sign: {
      expiresIn: '15m',
    },
  });

  fastify.decorate('verifyToken', async function (request: any, reply: any) {
    try {
      const decoded = await request.jwtVerify();
      const agent = await agentService.findById(decoded.agentId);
      const tokenVersion = await agentService.getTokenVersion(decoded.agentId);

      if (!agent || (tokenVersion ?? 0) !== decoded.tokenVersion) {
        return reply.status(401).send({ error: 'Token revoked' });
      }

      request.auth = decoded;
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });
}

export function generateAuthChallengeMessage(
  input: AuthChallengeMessageInput
): string {
  return [
    AUTH_MESSAGE_PREFIX,
    `Wallet: ${input.walletAddress.toLowerCase()}`,
    `Challenge ID: ${input.challengeId}`,
    `Nonce: ${input.nonce}`,
  ].join('\n');
}

export function createNonce(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function verifyWalletSignature(
  message: string,
  signature: string
): string {
  try {
    return ethers.verifyMessage(message, signature);
  } catch {
    throw new Error('Invalid signature');
  }
}

export async function generateToken(
  fastify: any,
  agentId: string,
  ownerAddress: string,
  tokenVersion: number
): Promise<string> {
  const payload: AuthPayload = {
    agentId,
    ownerAddress,
    tokenVersion,
  };

  return fastify.jwt.sign(payload);
}

export async function optionalAuth(
  fastify: FastifyInstance,
  request: any,
  reply: any
): Promise<void> {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return;

  try {
    const decoded = await request.server.jwt.verify(authHeader.substring(7));
    request.auth = decoded;
  } catch {
    // Ignore auth errors for optional auth
  }
}
