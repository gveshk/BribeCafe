import { describe, expect, it } from '@jest/globals';
import { createContractUseCase } from '../../src/usecases/createContract';

describe('createContractUseCase', () => {
  const payload = {
    tableId: 't1',
    encryptedAmount: 'enc',
    deliverables: ['d1'],
    timeline: { start: 1, end: 2 },
  };

  it('returns success on happy path', async () => {
    let called = 0;
    const result = await createContractUseCase(payload, {
      findTableById: async () => ({ id: 't1', creatorId: 'buyer', participantId: 'seller' }),
      findLatestQuoteByTable: async () => ({ approved: true }),
      executeCreateFlow: async () => {
        called += 1;
        return { id: 'c1' };
      },
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ contractId: 'c1' });
    expect(called).toBe(1);
  });

  it('returns table not found for missing table', async () => {
    const result = await createContractUseCase(payload, {
      findTableById: async () => null,
      findLatestQuoteByTable: async () => ({ approved: true }),
      executeCreateFlow: async () => ({ id: 'c1' }),
    });

    expect(result).toMatchObject({ success: false, errorCode: 'TABLE_NOT_FOUND' });
  });

  it('returns invalid state when quote is not approved', async () => {
    const result = await createContractUseCase(payload, {
      findTableById: async () => ({ id: 't1', creatorId: 'buyer', participantId: 'seller' }),
      findLatestQuoteByTable: async () => ({ approved: false }),
      executeCreateFlow: async () => ({ id: 'c1' }),
    });

    expect(result).toMatchObject({ success: false, errorCode: 'INVALID_STATE' });
  });
});
