export const TABLE_LIFECYCLE_STATES = [
  'negotiation',
  'quoted',
  'quote_approved',
  'contract_created',
  'funded',
  'in_progress',
  'delivery_submitted',
  'accepted',
  'released',
  'disputed',
  'cancelled',
] as const;

export type TableLifecycleState = (typeof TABLE_LIFECYCLE_STATES)[number];

export const TABLE_STATE_TRANSITIONS: Record<TableLifecycleState, readonly TableLifecycleState[]> = {
  negotiation: ['quoted', 'cancelled'],
  quoted: ['quote_approved', 'cancelled'],
  quote_approved: ['contract_created', 'cancelled'],
  contract_created: ['funded', 'cancelled'],
  funded: ['in_progress', 'disputed', 'cancelled'],
  in_progress: ['delivery_submitted', 'disputed', 'cancelled'],
  delivery_submitted: ['accepted', 'disputed'],
  accepted: ['released', 'disputed'],
  released: [],
  disputed: ['released', 'cancelled'],
  cancelled: [],
};

export class TableTransitionValidationError extends Error {
  readonly code = 'INVALID_STATE_TRANSITION';

  constructor(
    public readonly from: TableLifecycleState,
    public readonly to: TableLifecycleState
  ) {
    super(`Invalid table state transition from ${from} to ${to}`);
    this.name = 'TableTransitionValidationError';
  }
}

export function getAllowedTableTransitions(status: TableLifecycleState): readonly TableLifecycleState[] {
  return TABLE_STATE_TRANSITIONS[status];
}

export function assertValidTableTransition(from: TableLifecycleState, to: TableLifecycleState): void {
  if (!TABLE_STATE_TRANSITIONS[from].includes(to)) {
    throw new TableTransitionValidationError(from, to);
  }
}
