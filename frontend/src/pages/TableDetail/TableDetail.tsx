import React, { useState } from 'react';
import { Button, Card, Badge, theme } from '../../design-system';
import { Chat } from '../../components/Chat';
import { QuoteForm } from '../../components/QuoteForm/QuoteForm';
import { ContractForm } from '../../components/ContractForm/ContractForm';
import { EscrowStatusDisplay } from '../../components/EscrowStatus/EscrowStatus';
import { useApp } from '../../context/AppContext';
import api from '../../services/api';
import { getAllowedTransitions } from '../../domain/tableLifecycle';

export const TableDetail: React.FC = () => {
  const { 
    selectedTable, 
    agents, 
    messages, 
    currentAgent,
    quote, 
    contract, 
    escrow,
    selectTable,
    refreshTable,
    loading 
  } = useApp();

  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showContractForm, setShowContractForm] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!selectedTable) {
    return (
      <div style={{ padding: theme.spacing.xl, textAlign: 'center' }}>
        <p style={{ color: theme.colors.neutral[500] }}>Select a table to view details</p>
        <Button onClick={() => selectTable(null)}>Back to Dashboard</Button>
      </div>
    );
  }

  const otherAgentId = selectedTable.creatorId === currentAgent?.id 
    ? selectedTable.participantId 
    : selectedTable.creatorId;
  const otherAgent = agents[otherAgentId];
  const isBuyer = selectedTable.creatorId === currentAgent?.id;

  const handleSendMessage = async (content: string, type: 'text' | 'quote' | 'document') => {
    await api.sendMessage(selectedTable.id, content, type);
    const msgs = await api.getMessages(selectedTable.id);
    // This would update context, but for now we need to refresh
  };

  const handleSubmitQuote = async (amount: number, description: string) => {
    setSubmitting(true);
    try {
      await api.submitQuote(selectedTable.id, amount, description);
      await refreshTable(selectedTable.id);
      setShowQuoteForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveQuote = async () => {
    setSubmitting(true);
    try {
      await api.approveQuote(selectedTable.id);
      await refreshTable(selectedTable.id);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateContract = async (amount: number, deliverables: string[], timeline: { start: number; end: number }) => {
    setSubmitting(true);
    try {
      await api.createContract(selectedTable.id, amount, deliverables, timeline);
      await refreshTable(selectedTable.id);
      setShowContractForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignContract = async () => {
    setSubmitting(true);
    try {
      await api.signContract(selectedTable.id);
      await refreshTable(selectedTable.id);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeposit = async () => {
    if (!quote) return;
    setSubmitting(true);
    try {
      await api.depositEscrow(selectedTable.id, quote.amount);
      await refreshTable(selectedTable.id);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveRelease = async () => {
    setSubmitting(true);
    try {
      await api.approveRelease(selectedTable.id);
      await refreshTable(selectedTable.id);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDispute = async () => {
    setSubmitting(true);
    try {
      await api.openDispute(selectedTable.id, 'quality');
      await refreshTable(selectedTable.id);
      setShowDisputeForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const allowedTransitions = getAllowedTransitions(selectedTable.status);

  const canSubmitQuote = Boolean(!quote && !isBuyer && allowedTransitions.includes('quoted'));
  const canApproveQuote = Boolean(quote && !quote.approvedBy.includes(currentAgent?.id || '') && isBuyer && allowedTransitions.includes('quote_approved'));
  const canCreateContract = Boolean(quote && quote.approvedBy.length > 0 && !contract && allowedTransitions.includes('contract_created'));
  const canSignContract = Boolean(contract && (
    (isBuyer && !contract.buyerSigned) || 
    (!isBuyer && !contract.sellerSigned)
  ) && allowedTransitions.includes('funded'));
  const canDeposit = Boolean(escrow?.status === 'pending' && isBuyer && allowedTransitions.includes('in_progress'));
  const canApproveRelease = Boolean(escrow?.status === 'deposited' && allowedTransitions.includes('released'));

  const containerStyle: React.CSSProperties = {
    padding: theme.spacing.xl,
    maxWidth: '1400px',
    margin: '0 auto',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 400px',
    gap: theme.spacing.lg,
  };

  const sidebarStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.md,
  };

  const statusColors: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
    negotiation: 'info',
    quoted: 'info',
    quote_approved: 'success',
    contract_created: 'info',
    funded: 'success',
    in_progress: 'info',
    delivery_submitted: 'info',
    accepted: 'success',
    released: 'success',
    cancelled: 'warning',
    disputed: 'error',
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <Button variant="ghost" onClick={() => selectTable(null)} style={{ marginBottom: theme.spacing.sm }}>
            ← Back
          </Button>
          <h1 style={{ margin: 0, fontSize: theme.typography.fontSize['2xl'] }}>
            Deal with {otherAgent?.metadata.name || 'Unknown'}
          </h1>
          <Badge variant={statusColors[selectedTable.status]} style={{ marginTop: theme.spacing.xs }}>
            {selectedTable.status}
          </Badge>
        </div>
        <div style={{ display: 'flex', gap: theme.spacing.sm }}>
          {canSubmitQuote && (
            <Button onClick={() => setShowQuoteForm(true)}>Submit Quote</Button>
          )}
          {canApproveQuote && (
            <Button onClick={handleApproveQuote} isLoading={submitting}>Approve Quote</Button>
          )}
          {canCreateContract && (
            <Button onClick={() => setShowContractForm(true)}>Create Contract</Button>
          )}
        </div>
      </div>

      <div style={gridStyle}>
        <div>
          <Chat
            messages={messages}
            agents={agents}
            currentAgentId={currentAgent?.id || ''}
            onSendMessage={handleSendMessage}
            disabled={selectedTable.status === 'released' || selectedTable.status === 'disputed' || selectedTable.status === 'cancelled'}
          />
        </div>

        <div style={sidebarStyle}>
          {/* Quote Status */}
          <Card variant="outlined" padding="md">
            <h3 style={{ margin: `0 0 ${theme.spacing.sm} 0` }}>Quote</h3>
            {quote ? (
              <div>
                <p style={{ fontSize: theme.typography.fontSize['2xl'], fontWeight: theme.typography.fontWeight.bold, margin: 0 }}>
                  ${quote.amount.toLocaleString()}
                </p>
                <p style={{ color: theme.colors.neutral[500], fontSize: theme.typography.fontSize.sm }}>
                  {quote.description}
                </p>
                <Badge variant={quote.approvedBy.length > 0 ? 'success' : 'warning'}>
                  {quote.approvedBy.length > 0 ? 'Approved' : 'Pending'}
                </Badge>
              </div>
            ) : (
              <p style={{ color: theme.colors.neutral[400] }}>No quote submitted yet</p>
            )}
          </Card>

          {/* Contract Status */}
          {contract && (
            <Card variant="outlined" padding="md">
              <h3 style={{ margin: `0 0 ${theme.spacing.sm} 0` }}>Contract</h3>
              <p style={{ fontWeight: theme.typography.fontWeight.bold }}>
                ${contract.amount.toLocaleString()}
              </p>
              <div style={{ display: 'flex', gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
                <Badge variant={contract.buyerSigned ? 'success' : 'warning'}>
                  Buyer: {contract.buyerSigned ? '✓' : '⏳'}
                </Badge>
                <Badge variant={contract.sellerSigned ? 'success' : 'warning'}>
                  Seller: {contract.sellerSigned ? '✓' : '⏳'}
                </Badge>
              </div>
              {canSignContract && (
                <Button onClick={handleSignContract} isLoading={submitting} style={{ width: '100%' }}>
                  Sign Contract
                </Button>
              )}
            </Card>
          )}

          {/* Escrow Status */}
          <EscrowStatusDisplay
            escrow={escrow}
            isBuyer={isBuyer}
            canDeposit={canDeposit}
            canApprove={canApproveRelease}
            onDeposit={handleDeposit}
            onApproveRelease={handleApproveRelease}
            onOpenDispute={() => setShowDisputeForm(true)}
            disabled={submitting}
          />
        </div>
      </div>

      {/* Modals */}
      <QuoteForm
        isOpen={showQuoteForm}
        onClose={() => setShowQuoteForm(false)}
        onSubmit={handleSubmitQuote}
        existingQuote={quote}
        canApprove={canApproveQuote}
        onApprove={handleApproveQuote}
        disabled={submitting}
      />

      <ContractForm
        isOpen={showContractForm}
        onClose={() => setShowContractForm(false)}
        onSubmit={handleCreateContract}
        onSign={handleSignContract}
        contract={contract}
        isBuyer={isBuyer}
        disabled={submitting}
      />

      {/* Simple Dispute Confirmation */}
      {showDisputeForm && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <Card variant="elevated" padding="lg" style={{ maxWidth: '400px' }}>
            <h3 style={{ marginTop: 0 }}>Open Dispute?</h3>
            <p style={{ color: theme.colors.neutral[600] }}>
              This will pause the deal and involve BribeCafe's dispute resolution team.
            </p>
            <div style={{ display: 'flex', gap: theme.spacing.sm, justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setShowDisputeForm(false)}>Cancel</Button>
              <Button variant="danger" onClick={handleOpenDispute} isLoading={submitting}>
                Open Dispute
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TableDetail;
