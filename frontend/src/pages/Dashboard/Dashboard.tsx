import React, { useState } from 'react';
import { Button, Card, Modal, theme } from '../../design-system';
import { TableList } from '../../components/TableList';
import { AgentProfile } from '../../components/AgentProfile';
import { useApp } from '../../context/AppContext';
import { useCreateTableMutation } from '../../hooks/useBribeQueries';

export const Dashboard: React.FC = () => {
  const { currentAgent, tables, agents, selectTable, loading, error, tablesEmpty } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAgentsModal, setShowAgentsModal] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const createTableMutation = useCreateTableMutation();

  const handleCreateTable = async () => {
    if (!selectedAgentId) return;
    const newTable = await createTableMutation.mutateAsync(selectedAgentId);
    selectTable(newTable);
    setShowCreateModal(false);
    setSelectedAgentId('');
  };

  const otherAgents = Object.values(agents).filter((a) => a.id !== currentAgent?.id);

  if (loading) {
    return <div style={{ padding: theme.spacing.xl, textAlign: 'center' }}><p>Loading dashboard...</p></div>;
  }

  if (error) {
    return <div style={{ padding: theme.spacing.xl, textAlign: 'center', color: theme.colors.error.main }}><p>{error}</p></div>;
  }

  if (tablesEmpty) {
    return <div style={{ padding: theme.spacing.xl, textAlign: 'center' }}><p>No deals yet. Start your first deal.</p></div>;
  }

  return (
    <div style={{ padding: theme.spacing.xl, maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg }}>
        <div>
          <h1 style={{ margin: 0 }}>Dashboard</h1>
          {currentAgent && <p>Welcome back, {currentAgent.metadata.name}</p>}
        </div>
        <div style={{ display: 'flex', gap: theme.spacing.sm }}>
          <Button variant="outline" onClick={() => setShowAgentsModal(true)}>Browse Agents</Button>
          <Button onClick={() => setShowCreateModal(true)}>+ New Deal</Button>
        </div>
      </div>

      <TableList tables={tables} agents={agents} currentAgentId={currentAgent?.id} onTableClick={selectTable} />

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Start New Deal"
        footer={(
          <>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button onClick={handleCreateTable} disabled={!selectedAgentId || createTableMutation.isLoading} isLoading={createTableMutation.isLoading}>Create Deal</Button>
          </>
        )}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          {otherAgents.map((agent) => (
            <Card key={agent.id} variant={selectedAgentId === agent.id ? 'elevated' : 'outlined'} padding="md" onClick={() => setSelectedAgentId(agent.id)} style={{ cursor: 'pointer' }}>
              <AgentProfile agent={agent} />
            </Card>
          ))}
        </div>
      </Modal>

      <Modal isOpen={showAgentsModal} onClose={() => setShowAgentsModal(false)} title="Browse Agents" size="lg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          {otherAgents.map((agent) => <AgentProfile key={agent.id} agent={agent} />)}
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;
