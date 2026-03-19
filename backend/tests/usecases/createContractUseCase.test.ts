import { describe, expect, it } from '@jest/globals';
import { createContractUseCase } from '../../src/usecases/createContract';

describe('createContractUseCase', () => {
  const payload = {
    tableId: 't1',
    requesterId: 'seller',
    encryptedAmount: 'enc',
    deliverables: ['d1'],
    timeline: { start: 1, end: 2 },
  };

  it('returns success on happy path', async () => {
    let called = 0;
    const result = await createContractUseCase(payload, {
      findTableById: async () => ({ id: 't1', creatorId: 'buyer', participantId: 'seller' }),
      findLatestQuoteByTable: async () => ({ approved: true }),
      findContractByTable: async () => null,
      executeCreateFlow: async () => {
        called += 1;
        return {
          id: 'c1',
          tableId: 't1',
          buyerId: 'buyer',
          sellerId: 'seller',
          encryptedAmount: 'enc',
          deliverables: ['d1'],
          timeline: { start: 1, end: 2 },
          buyerSigned: false,
          sellerSigned: false,
          createdAt: new Date(),
        };
      },
    });

    expect(result.success).toBe(true);
    expect(result.data?.contract.id).toBe('c1');
    expect(called).toBe(1);
  });

  it('returns forbidden for non-participant creator', async () => {
    const result = await createContractUseCase(
      { ...payload, requesterId: 'buyer' },
      {
        findTableById: async () => ({ id: 't1', creatorId: 'buyer', participantId: 'seller' }),
        findLatestQuoteByTable: async () => ({ approved: true }),
        findContractByTable: async () => null,
        executeCreateFlow: async () => {
          throw new Error('should not call');
        },
      },
    );

    expect(result).toMatchObject({ success: false, errorCode: 'FORBIDDEN' });
  });

  it('returns invalid state when quote is not approved', async () => {
    const result = await createContractUseCase(payload, {
      findTableById: async () => ({ id: 't1', creatorId: 'buyer', participantId: 'seller' }),
      findLatestQuoteByTable: async () => ({ approved: false }),
      findContractByTable: async () => null,
      executeCreateFlow: async () => {
        throw new Error('should not call');
      },
    });

    expect(result).toMatchObject({ success: false, errorCode: 'INVALID_STATE' });
  });
});
