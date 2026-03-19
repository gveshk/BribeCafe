import { describe, expect, it } from '@jest/globals';
import { signContractUseCase } from '../../src/usecases/signContract';

describe('signContractUseCase', () => {
  const contract = {
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

  it('returns success on happy path', async () => {
    let called = 0;
    const result = await signContractUseCase(
      { tableId: 't1', signerId: 'buyer' },
      {
        findTableById: async () => ({ creatorId: 'buyer', participantId: 'seller' }),
        findContractByTable: async () => ({ ...contract }),
        executeSignFlow: async () => {
          called += 1;
          return { ...contract, buyerSigned: true, sellerSigned: true };
        },
      },
    );

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ contract: { ...contract, buyerSigned: true, sellerSigned: true }, bothSigned: true });
    expect(called).toBe(1);
  });

  it('returns forbidden for outsider', async () => {
    const result = await signContractUseCase(
      { tableId: 't1', signerId: 'outsider' },
      {
        findTableById: async () => ({ creatorId: 'buyer', participantId: 'seller' }),
        findContractByTable: async () => ({ ...contract }),
        executeSignFlow: async () => ({ ...contract }),
      },
    );

    expect(result).toMatchObject({ success: false, errorCode: 'FORBIDDEN' });
  });

  it('returns invalid state when signer already signed', async () => {
    const result = await signContractUseCase(
      { tableId: 't1', signerId: 'buyer' },
      {
        findTableById: async () => ({ creatorId: 'buyer', participantId: 'seller' }),
        findContractByTable: async () => ({ ...contract, buyerSigned: true }),
        executeSignFlow: async () => ({ ...contract }),
      },
    );

    expect(result).toMatchObject({ success: false, errorCode: 'INVALID_STATE' });
  });
});
