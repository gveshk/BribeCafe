import type { TableStatus } from '../types';

export const TABLE_STATE_TRANSITIONS: Record<TableStatus, readonly TableStatus[]> = {
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

export const getAllowedTransitions = (status: TableStatus): readonly TableStatus[] => TABLE_STATE_TRANSITIONS[status] ?? [];
