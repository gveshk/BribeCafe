import { v4 as uuidv4 } from 'uuid';
import prisma from '../db/prisma';
import { createNonce } from '../utils/auth';

const prismaAny: any = prisma;

const CHALLENGE_TTL_MS = 5 * 60 * 1000;

export interface AuthChallengeRecord {
  challengeId: string;
  nonce: string;
  walletAddress: string;
  expiresAt: Date;
  usedAt: Date | null;
}

class AuthChallengeService {
  async create(walletAddress: string): Promise<AuthChallengeRecord> {
    const challenge = await prismaAny.authChallenge.create({
      data: {
        challengeId: uuidv4(),
        nonce: createNonce(),
        walletAddress: walletAddress.toLowerCase(),
        expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS),
      },
    });

    return challenge;
  }

  async consume(params: {
    challengeId: string;
    nonce: string;
    walletAddress: string;
  }): Promise<AuthChallengeRecord> {
    const challenge = await prismaAny.authChallenge.findUnique({
      where: { challengeId: params.challengeId },
    });

    if (!challenge) throw new Error('Challenge not found');
    if (challenge.usedAt) throw new Error('Challenge already used');
    if (challenge.expiresAt.getTime() <= Date.now()) throw new Error('Challenge expired');
    if (challenge.walletAddress !== params.walletAddress.toLowerCase()) {
      throw new Error('Challenge wallet mismatch');
    }
    if (challenge.nonce !== params.nonce) throw new Error('Challenge nonce mismatch');

    return prismaAny.authChallenge.update({
      where: { challengeId: params.challengeId },
      data: { usedAt: new Date() },
    });
  }
}

export const authChallengeService = new AuthChallengeService();
