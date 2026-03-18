import { describe, expect, it } from '@jest/globals';
import { signContractUseCase } from '../../src/usecases/signContract';

describe('signContractUseCase', () => {
  it('returns success on happy path', async () => {
    let called = 0;
    const result = await signContractUseCase(
      { tableId: 't1', signerId: 'buyer' },
      {
        findTableById: async () => ({ creatorId: 'buyer', participantId: 'seller' }),
        findContractByTable: async () => ({ id: 'c1', buyerSigned: false, sellerSigned: false }),
        executeSignFlow: async () => {
          called += 1;
          return { buyerSigned: true, sellerSigned: true };
        },
      },
    );

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ bothSigned: true });
    expect(called).toBe(1);
  });

  it('returns forbidden for outsider', async () => {
    const result = await signContractUseCase(
      { tableId: 't1', signerId: 'outsider' },
      {
        findTableById: async () => ({ creatorId: 'buyer', participantId: 'seller' }),
        findContractByTable: async () => ({ id: 'c1', buyerSigned: false, sellerSigned: false }),
        executeSignFlow: async () => ({ buyerSigned: false, sellerSigned: false }),
      },
    );

    expect(result).toMatchObject({ success: false, errorCode: 'FORBIDDEN' });
  });

  it('returns invalid state when contract is missing', async () => {
    const result = await signContractUseCase(
      { tableId: 't1', signerId: 'buyer' },
      {
        findTableById: async () => ({ creatorId: 'buyer', participantId: 'seller' }),
        findContractByTable: async () => null,
        executeSignFlow: async () => ({ buyerSigned: false, sellerSigned: false }),
      },
    );

    expect(result).toMatchObject({ success: false, errorCode: 'CONTRACT_NOT_FOUND' });
  });
});
