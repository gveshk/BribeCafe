import React from 'react';
import { Card, Badge, Button, theme } from '../../design-system';
import { Escrow, EscrowStatus } from '../../types';

interface EscrowStatusDisplayProps {
  escrow: Escrow | null;
  onDeposit?: () => void;
  onApproveRelease?: () => void;
  onOpenDispute?: () => void;
  onCancel?: () => void;
  isBuyer: boolean;
  canDeposit?: boolean;
  canApprove?: boolean;
  disabled?: boolean;
}

type ChainEscrowMeta = {
  settlementStatus?: 'pending' | 'finalized' | 'failed' | 'unknown';
  txHash?: string | null;
  chainId?: number | null;
  confirmations?: number;
  failureReason?: string | null;
  finalityPending?: boolean;
};

const statusVariant: Record<EscrowStatus, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  pending: 'default',
  deposited: 'success',
  released: 'info',
  cancelled: 'warning',
  disputed: 'error',
};

const statusLabels: Record<EscrowStatus, string> = {
  pending: 'Awaiting Deposit',
  deposited: 'Funds in Escrow',
  released: 'Completed',
  cancelled: 'Cancelled',
  disputed: 'Under Dispute',
};

export const EscrowStatusDisplay: React.FC<EscrowStatusDisplayProps> = ({
  escrow,
  onDeposit,
  onApproveRelease,
  onOpenDispute,
  onCancel,
  isBuyer,
  canDeposit = false,
  canApprove = false,
  disabled = false,
}) => {
  const chainMeta = (escrow ?? {}) as ChainEscrowMeta;

  const containerStyle: React.CSSProperties = { padding: theme.spacing.md };
  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  };

  const amountStyle: React.CSSProperties = {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.neutral[900],
  };

  const detailsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  };

  const detailItemStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: theme.spacing.xs };
  const detailLabelStyle: React.CSSProperties = { fontSize: theme.typography.fontSize.sm, color: theme.colors.neutral[500] };
  const detailValueStyle: React.CSSProperties = {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.neutral[900],
  };

  const actionsStyle: React.CSSProperties = { display: 'flex', gap: theme.spacing.sm, marginTop: theme.spacing.lg, flexWrap: 'wrap' };

  if (!escrow) {
    return (
      <Card variant="outlined" padding="md">
        <div style={containerStyle}>
          <div style={{ textAlign: 'center', padding: theme.spacing.lg }}>
            <p style={{ color: theme.colors.neutral[500], marginBottom: theme.spacing.md }}>No escrow yet</p>
            {canDeposit && (
              <Button onClick={onDeposit} disabled={disabled}>
                💰 Deposit to Escrow
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  const amountValue = Number(escrow.amount);
  const feeValue = Number(escrow.fee);
  const totalAmount = amountValue + feeValue;

  return (
    <Card variant="outlined" padding="md">
      <div style={containerStyle}>
        <div style={headerStyle}>
          <div>
            <h3 style={{ margin: 0, fontSize: theme.typography.fontSize.lg }}>Escrow Status</h3>
            <Badge variant={statusVariant[escrow.status || 'pending']} style={{ marginTop: theme.spacing.xs }}>
              {statusLabels[escrow.status || 'pending']}
            </Badge>
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: theme.spacing.md }}>
          <div style={amountStyle}>${amountValue.toLocaleString()}</div>
          <div style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.neutral[500], marginTop: theme.spacing.xs }}>
            + ${feeValue.toLocaleString()} fee (2%) = ${totalAmount.toLocaleString()} total
          </div>
        </div>

        <div style={detailsGridStyle}>
          <div style={detailItemStyle}>
            <span style={detailLabelStyle}>Buyer</span>
            <span style={detailValueStyle}>
              {escrow.buyerAddress?.slice(0, 6)}...{escrow.buyerAddress?.slice(-4)}
              {escrow.buyerApproved && ' ✓'}
            </span>
          </div>
          <div style={detailItemStyle}>
            <span style={detailLabelStyle}>Seller</span>
            <span style={detailValueStyle}>
              {escrow.sellerAddress?.slice(0, 6)}...{escrow.sellerAddress?.slice(-4)}
              {escrow.sellerApproved && ' ✓'}
            </span>
          </div>
        </div>

        {chainMeta.txHash && (
          <div style={{ marginTop: theme.spacing.md, fontSize: theme.typography.fontSize.sm, color: theme.colors.neutral[600] }}>
            <div>Chain: {chainMeta.chainId ?? 'unknown'}</div>
            <div>Tx: {chainMeta.txHash.slice(0, 12)}...{chainMeta.txHash.slice(-8)}</div>
            <div>
              Settlement: {chainMeta.settlementStatus || 'unknown'} ({chainMeta.confirmations ?? 0} confirmations)
            </div>
            {chainMeta.failureReason && <div style={{ color: theme.colors.error.main }}>Reason: {chainMeta.failureReason}</div>}
            {chainMeta.finalityPending && <Badge variant="warning">Pending Finality</Badge>}
            {chainMeta.settlementStatus === 'finalized' && <Badge variant="success">Finalized</Badge>}
          </div>
        )}

        <div style={actionsStyle}>
          {escrow.status === 'pending' && isBuyer && (
            <Button onClick={onDeposit} disabled={disabled}>💰 Deposit Funds</Button>
          )}

          {escrow.status === 'deposited' && canApprove && (
            <Button onClick={onApproveRelease} disabled={disabled}>✓ Approve Release</Button>
          )}

          {escrow.status === 'deposited' && (
            <Button variant="danger" onClick={onOpenDispute} disabled={disabled}>⚠️ Open Dispute</Button>
          )}

          {escrow.status === 'deposited' && isBuyer && (
            <Button variant="ghost" onClick={onCancel} disabled={disabled}>Cancel & Refund</Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default EscrowStatusDisplay;
