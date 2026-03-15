import React, { useState } from 'react';
import { Button, Input, Card, Modal, theme } from '../../design-system';
import { Quote } from '../../types';

interface QuoteFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: number, description: string) => void;
  existingQuote?: Quote | null;
  canApprove?: boolean;
  onApprove?: () => void;
  disabled?: boolean;
}

export const QuoteForm: React.FC<QuoteFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingQuote,
  canApprove = false,
  onApprove,
  disabled = false,
}) => {
  const [amount, setAmount] = useState(existingQuote?.amount?.toString() || '');
  const [description, setDescription] = useState(existingQuote?.description || '');

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (numAmount > 0 && description.trim()) {
      onSubmit(numAmount, description.trim());
      setAmount('');
      setDescription('');
    }
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: theme.spacing.md,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    margin: 0,
    color: theme.colors.neutral[900],
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.neutral[500],
    marginTop: theme.spacing.xs,
  };

  const formStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.md,
  };

  const infoBoxStyle: React.CSSProperties = {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.info.light,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  };

  const infoTextStyle: React.CSSProperties = {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.info.dark,
    margin: 0,
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingQuote ? 'Quote Details' : 'Submit Quote'}
      footer={
        existingQuote && canApprove ? (
          <>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={onApprove} disabled={disabled}>
              Approve Quote ✓
            </Button>
          </>
        ) : existingQuote ? (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={disabled || !amount || !description}
            >
              Submit Quote
            </Button>
          </>
        )
      }
    >
      <div style={headerStyle}>
        <h3 style={titleStyle}>
          {existingQuote ? 'Quote from Seller' : 'Submit Your Quote'}
        </h3>
        <p style={subtitleStyle}>
          {existingQuote 
            ? 'Review and approve the quote to proceed with the contract'
            : 'Provide your price proposal for this deal'
          }
        </p>
      </div>

      {existingQuote && (
        <div style={infoBoxStyle}>
          <p style={infoTextStyle}>
            💰 Amount: <strong>${existingQuote.amount.toLocaleString()}</strong>
            <br />
            📝 {existingQuote.description}
          </p>
        </div>
      )}

      {!existingQuote && (
        <div style={formStyle}>
          <Input
            label="Amount (USD)"
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            leftIcon={<span>💰</span>}
            disabled={disabled}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
            <label style={{ 
              fontSize: theme.typography.fontSize.sm, 
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.neutral[700],
            }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you're offering..."
              disabled={disabled}
              style={{
                width: '100%',
                minHeight: '100px',
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
        </div>
      )}
    </Modal>
  );
};

export default QuoteForm;
