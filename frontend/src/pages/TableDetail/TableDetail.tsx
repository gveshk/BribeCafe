import React, { useState } from 'react';
import { Button, Card, Badge, theme } from '../../design-system';
import { Chat } from '../../components/Chat';
import { QuoteForm } from '../../components/QuoteForm';
import { ContractForm } from '../../components/ContractForm';
import { EscrowStatusDisplay } from '../../components/EscrowStatus/EscrowStatus';
import { useApp } from '../../context/AppContext';

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
    sendMessage,
    submitQuote,
    approveQuote,
    createContract,
    signContract,
    depositEscrow,
    approveRelease,
    openDispute,
    messagesLoading,
    workflowLoading,
    messagesError,
    workflowError,
  } = useApp();

  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showContractForm, setShowContractForm] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);

  if (!selectedTable) {
    return <div style={{ padding: theme.spacing.xl, textAlign: 'center' }}><p>Select a table to view details</p></div>;
  }

  const otherAgentId = selectedTable.creatorId === currentAgent?.id ? selectedTable.participantId : selectedTable.creatorId;
  const otherAgent = agents[otherAgentId];
  const isBuyer = selectedTable.creatorId === currentAgent?.id;

  const canSubmitQuote = !quote && !isBuyer;
  const canApproveQuote = quote && !quote.approvedBy.includes(currentAgent?.id || '') && isBuyer;
  const canCreateContract = quote && quote.approvedBy.length > 0 && !contract;
  const canSignContract = contract && ((isBuyer && !contract.buyerSigned) || (!isBuyer && !contract.sellerSigned));
  const canDeposit = escrow?.status === 'pending' && isBuyer;
  const canApproveRelease = escrow?.status === 'deposited';

  return (
    <div style={{ padding: theme.spacing.xl, maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg }}>
        <div>
          <Button variant="ghost" onClick={() => selectTable(null)} style={{ marginBottom: theme.spacing.sm }}>← Back</Button>
          <h1 style={{ margin: 0 }}>Deal with {otherAgent?.metadata.name || 'Unknown'}</h1>
          <Badge variant="success" style={{ marginTop: theme.spacing.xs }}>{selectedTable.status}</Badge>
        </div>
        <div style={{ display: 'flex', gap: theme.spacing.sm }}>
          {canSubmitQuote && <Button onClick={() => setShowQuoteForm(true)}>Submit Quote</Button>}
          {canApproveQuote && <Button onClick={() => void approveQuote()} isLoading={workflowLoading}>Approve Quote</Button>}
          {canCreateContract && <Button onClick={() => setShowContractForm(true)}>Create Contract</Button>}
        </div>
      </div>

      {messagesError && <p style={{ color: theme.colors.error.main }}>Messaging error: {messagesError}</p>}
      {workflowError && <p style={{ color: theme.colors.error.main }}>Workflow error: {workflowError}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: theme.spacing.lg }}>
        <div>
          {messagesLoading ? <p>Loading messages...</p> : (
            <Chat
              messages={messages}
              agents={agents}
              currentAgentId={currentAgent?.id || ''}
              onSendMessage={(content, type) => sendMessage(content, type)}
              disabled={selectedTable.status === 'completed' || selectedTable.status === 'disputed'}
            />
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
          <Card variant="outlined" padding="md">
            <h3>Quote</h3>
            {!quote ? <p>No quote submitted yet</p> : <p>${quote.amount.toLocaleString()} - {quote.description}</p>}
          </Card>

          <Card variant="outlined" padding="md">
            <h3>Contract</h3>
            {!contract ? <p>No contract yet</p> : (
              <>
                <p>${contract.amount.toLocaleString()}</p>
                {canSignContract && <Button onClick={() => void signContract(contract.amount)} isLoading={workflowLoading}>Sign Contract</Button>}
              </>
            )}
          </Card>

          <EscrowStatusDisplay
            escrow={escrow}
            isBuyer={isBuyer}
            canDeposit={canDeposit}
            canApprove={canApproveRelease}
            onDeposit={() => quote ? depositEscrow(quote.amount) : Promise.resolve()}
            onApproveRelease={() => approveRelease()}
            onOpenDispute={() => setShowDisputeForm(true)}
            disabled={workflowLoading}
          />
        </div>
      </div>

      <QuoteForm
        isOpen={showQuoteForm}
        onClose={() => setShowQuoteForm(false)}
        onSubmit={submitQuote}
        existingQuote={quote}
        canApprove={Boolean(canApproveQuote)}
        onApprove={approveQuote}
        disabled={workflowLoading}
      />

      <ContractForm
        isOpen={showContractForm}
        onClose={() => setShowContractForm(false)}
        onSubmit={createContract}
        onSign={() => signContract(contract?.amount || quote?.amount || 0)}
        contract={contract}
        isBuyer={isBuyer}
        disabled={workflowLoading}
      />

      {showDisputeForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Card variant="elevated" padding="lg" style={{ maxWidth: '400px' }}>
            <h3>Open Dispute?</h3>
            <div style={{ display: 'flex', gap: theme.spacing.sm, justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setShowDisputeForm(false)}>Cancel</Button>
              <Button variant="danger" onClick={() => void openDispute('quality')} isLoading={workflowLoading}>Open Dispute</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TableDetail;
