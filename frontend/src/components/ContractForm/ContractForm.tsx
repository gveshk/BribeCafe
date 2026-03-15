import React, { useState } from 'react';
import { Button, Input, Card, Modal, theme } from '../../design-system';
import { Contract, Deliverable } from '../../types';

interface ContractFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number, deliverables: string[], timeline: { start: number; end: number }) => void;
  onSign: () => void;
  contract?: Contract | null;
  isBuyer: boolean;
  disabled?: boolean;
}

export const ContractForm: React.FC<ContractFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onSign,
  contract,
  isBuyer,
  disabled = false,
}) => {
  const [amount, setAmount] = useState(contract?.amount?.toString() || '');
  const [deliverablesText, setDeliverablesText] = useState(
    contract?.deliverables.map(d => d.description).join('\n') || ''
  );
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    const deliverables = deliverablesText
      .split('\n')
      .map(d => d.trim())
      .filter(d => d.length > 0);
    
    if (numAmount > 0 && deliverables.length > 0 && startDate && endDate) {
      onSubmit(
        numAmount,
        deliverables,
        { start: new Date(startDate).getTime(), end: new Date(endDate).getTime() }
      );
    }
  };

  const canSign = contract && (
    (isBuyer && !contract.buyerSigned) || 
    (!isBuyer && !contract.sellerSigned)
  );

  const sectionStyle: React.CSSProperties = {
    marginBottom: theme.spacing.lg,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.neutral[700],
    marginBottom: theme.spacing.xs,
    display: 'block',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={contract ? 'Contract Details' : 'Create Contract'}
      size="lg"
      footer={
        contract ? (
          <>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {canSign && (
              <Button onClick={onSign} disabled={disabled}>
                {isBuyer ? 'Sign as Buyer ✓' : 'Sign as Seller ✓'}
              </Button>
            )}
          </>
        ) : (
          <>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={disabled}>
              Create Contract
            </Button>
          </>
        )
      }
    >
      {contract ? (
        <div>
          <Card variant="outlined" padding="md" style={{ marginBottom: theme.spacing.md }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: `0 0 ${theme.spacing.sm} 0`, fontSize: theme.typography.fontSize.lg }}>
                  Contract Amount
                </h4>
                <p style={{ 
                  margin: 0, 
                  fontSize: theme.typography.fontSize['2xl'], 
                  fontWeight: theme.typography.fontWeight.bold,
                  color: theme.colors.primary[600],
                }}>
                  ${contract.amount.toLocaleString()}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ 
                  padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                  backgroundColor: contract.buyerSigned && contract.sellerSigned 
                    ? theme.colors.success.light 
                    : theme.colors.warning.light,
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.sm,
                  color: contract.buyerSigned && contract.sellerSigned 
                    ? theme.colors.success.dark 
                    : theme.colors.warning.dark,
                }}>
                  {contract.buyerSigned && contract.sellerSigned ? 'Fully Signed' : 'Pending Signatures'}
                </div>
              </div>
            </div>
          </Card>

          <div style={sectionStyle}>
            <h4 style={{ ...labelStyle, marginBottom: theme.spacing.sm }}>Deliverables</h4>
            {contract.deliverables.map((deliverable, index) => (
              <div
                key={deliverable.id || index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  padding: theme.spacing.sm,
                  backgroundColor: theme.colors.neutral[50],
                  borderRadius: theme.borderRadius.md,
                  marginBottom: theme.spacing.xs,
                }}
              >
                <span>{deliverable.completed ? '✅' : '⏳'}</span>
                <span>{deliverable.description}</span>
              </div>
            ))}
          </div>

          <div style={sectionStyle}>
            <h4 style={{ ...labelStyle, marginBottom: theme.spacing.sm }}>Timeline</h4>
            <div style={{ display: 'flex', gap: theme.spacing.lg }}>
              <div>
                <span style={{ color: theme.colors.neutral[500], fontSize: theme.typography.fontSize.sm }}>
                  Start Date
                </span>
                <p style={{ margin: 0, fontWeight: theme.typography.fontWeight.medium }}>
                  {new Date(contract.timeline.start).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span style={{ color: theme.colors.neutral[500], fontSize: theme.typography.fontSize.sm }}>
                  End Date
                </span>
                <p style={{ margin: 0, fontWeight: theme.typography.fontWeight.medium }}>
                  {new Date(contract.timeline.end).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div style={sectionStyle}>
            <h4 style={{ ...labelStyle, marginBottom: theme.spacing.sm }}>Signatures</h4>
            <div style={{ display: 'flex', gap: theme.spacing.md }}>
              <div style={{
                padding: theme.spacing.sm,
                backgroundColor: contract.buyerSigned ? theme.colors.success.light : theme.colors.neutral[100],
                borderRadius: theme.borderRadius.md,
                flex: 1,
              }}>
                <span style={{ fontSize: theme.typography.fontSize.sm }}>
                  {contract.buyerSigned ? '✅' : '⏳'} Buyer Signed
                </span>
              </div>
              <div style={{
                padding: theme.spacing.sm,
                backgroundColor: contract.sellerSigned ? theme.colors.success.light : theme.colors.neutral[100],
                borderRadius: theme.borderRadius.md,
                flex: 1,
              }}>
                <span style={{ fontSize: theme.typography.fontSize.sm }}>
                  {contract.sellerSigned ? '✅' : '⏳'} Seller Signed
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div style={sectionStyle}>
            <Input
              label="Contract Amount (USD)"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              leftIcon={<span>💰</span>}
              disabled={disabled}
            />
          </div>

          <div style={sectionStyle}>
            <label style={labelStyle}>Deliverables (one per line)</label>
            <textarea
              value={deliverablesText}
              onChange={(e) => setDeliverablesText(e.target.value)}
              placeholder="Enter each deliverable on a new line..."
              disabled={disabled}
              style={{
                width: '100%',
                minHeight: '120px',
                padding: theme.spacing.sm,
                border: `1px solid ${theme.colors.neutral[300]}`,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.typography.fontSize.base,
                fontFamily: theme.typography.fontFamily.sans,
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: theme.spacing.md }}>
            <div style={{ flex: 1 }}>
              <Input
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={disabled}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Input
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ContractForm;
