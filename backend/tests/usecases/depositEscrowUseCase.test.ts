import { describe, expect, it } from '@jest/globals';
import { depositEscrowUseCase } from '../../src/usecases/depositEscrow';

describe('depositEscrowUseCase', () => {
  it('returns success on happy path', async () => {
    const result = await depositEscrowUseCase(
      { tableId: 't1', depositorId: 'buyer', amount: '100' },
      {
        findTableById: async () => ({ creatorId: 'buyer' }),
      },
    );

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ tableId: 't1', amount: '100' });
  });

  it('returns forbidden for non-buyer', async () => {
    const result = await depositEscrowUseCase(
      { tableId: 't1', depositorId: 'seller', amount: '100' },
      {
        findTableById: async () => ({ creatorId: 'buyer' }),
      },
    );

    expect(result).toMatchObject({ success: false, errorCode: 'FORBIDDEN' });
  });

  it('returns table not found when missing', async () => {
    const result = await depositEscrowUseCase(
      { tableId: 't1', depositorId: 'buyer', amount: '100' },
      {
        findTableById: async () => null,
      },
    );

    expect(result).toMatchObject({ success: false, errorCode: 'TABLE_NOT_FOUND' });
  });
});
