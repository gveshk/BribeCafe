import { describe, expect, it } from '@jest/globals';
import { openDisputeUseCase } from '../../src/usecases/openDispute';

describe('openDisputeUseCase', () => {
  const payload = { tableId: 't1', openedBy: 'buyer', reason: 'quality', evidence: ['e1'] };

  it('returns success on happy path', async () => {
    let called = 0;
    const result = await openDisputeUseCase(payload, {
      findTableById: async () => ({ creatorId: 'buyer', participantId: 'seller', status: 'active' }),
      executeDisputeFlow: async () => {
        called += 1;
        return {
          id: 'd1',
          tableId: 't1',
          openedBy: 'buyer',
          reason: 'quality',
          evidence: ['e1'],
          decision: null,
          decidedBy: null,
          decidedAt: null,
          createdAt: new Date(),
        };
      },
    });

    expect(result.success).toBe(true);
    expect(result.data?.dispute.id).toEqual('d1');
    expect(called).toBe(1);
  });

  it('returns forbidden for outsider', async () => {
    const result = await openDisputeUseCase(
      { ...payload, openedBy: 'outsider' },
      {
        findTableById: async () => ({ creatorId: 'buyer', participantId: 'seller', status: 'active' }),
        executeDisputeFlow: async () => ({
          id: 'd1',
          tableId: 't1',
          openedBy: 'buyer',
          reason: 'quality',
          evidence: ['e1'],
          decision: null,
          decidedBy: null,
          decidedAt: null,
          createdAt: new Date(),
        }),
      },
    );

    expect(result).toMatchObject({ success: false, errorCode: 'FORBIDDEN' });
  });

  it('returns invalid state for non-active table', async () => {
    const result = await openDisputeUseCase(payload, {
      findTableById: async () => ({ creatorId: 'buyer', participantId: 'seller', status: 'disputed' }),
      executeDisputeFlow: async () => ({
        id: 'd1',
        tableId: 't1',
        openedBy: 'buyer',
        reason: 'quality',
        evidence: ['e1'],
        decision: null,
        decidedBy: null,
        decidedAt: null,
        createdAt: new Date(),
      }),
    });

    expect(result).toMatchObject({ success: false, errorCode: 'INVALID_STATE' });
  });
});
