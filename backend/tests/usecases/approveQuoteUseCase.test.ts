import { describe, expect, it } from '@jest/globals';
import { approveQuoteUseCase } from '../../src/usecases/approveQuote';

describe('approveQuoteUseCase', () => {
  it('returns success on happy path', async () => {
    let called = 0;
    const result = await approveQuoteUseCase(
      { tableId: 't1', approverId: 'buyer-1' },
      {
        findTableById: async () => ({ id: 't1', creatorId: 'buyer-1' }),
        findLatestQuoteByTable: async () => ({ id: 'q1', encryptedAmount: 'enc-1' }),
        executeApprovalFlow: async () => {
          called += 1;
        },
      },
    );

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ tableId: 't1' });
    expect(called).toBe(1);
  });

  it('returns forbidden for non-creator', async () => {
    const result = await approveQuoteUseCase(
      { tableId: 't1', approverId: 'not-buyer' },
      {
        findTableById: async () => ({ id: 't1', creatorId: 'buyer-1' }),
        findLatestQuoteByTable: async () => ({ id: 'q1', encryptedAmount: 'enc-1' }),
        executeApprovalFlow: async () => undefined,
      },
    );

    expect(result).toMatchObject({ success: false, errorCode: 'FORBIDDEN' });
  });

  it('returns invalid state when no quote exists', async () => {
    const result = await approveQuoteUseCase(
      { tableId: 't1', approverId: 'buyer-1' },
      {
        findTableById: async () => ({ id: 't1', creatorId: 'buyer-1' }),
        findLatestQuoteByTable: async () => null,
        executeApprovalFlow: async () => undefined,
      },
    );

    expect(result).toMatchObject({ success: false, errorCode: 'QUOTE_NOT_FOUND' });
  });
});
