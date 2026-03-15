import React, { useState } from 'react';
import { Button, Card, Input, Modal, Badge, theme } from '../../design-system';
import { TableList } from '../../components/TableList';
import { AgentProfile } from '../../components/AgentProfile';
import { useApp } from '../../context/AppContext';
import api from '../../services/api';

export const Dashboard: React.FC = () => {
  const { currentAgent, tables, agents, selectTable, refreshTables, loading } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAgentsModal, setShowAgentsModal] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreateTable = async () => {
    if (!selectedAgentId) return;
    setCreating(true);
    try {
      const newTable = await api.createTable(selectedAgentId);
      await refreshTables();
      selectTable(newTable);
      setShowCreateModal(false);
      setSelectedAgentId('');
    } catch (err) {
      console.error('Failed to create table:', err);
    } finally {
      setCreating(false);
    }
  };

  const otherAgents = Object.values(agents).filter(a => a.id !== currentAgent?.id);

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.neutral[900],
    margin: 0,
  };

  const statsRowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  };

  const statCardStyle: React.CSSProperties = {
    padding: theme.spacing.md,
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.lg,
    border: `1px solid ${theme.colors.neutral[200]}`,
  };

  const statValueStyle: React.CSSProperties = {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[500],
    marginBottom: theme.spacing.xs,
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.neutral[500],
  };

  if (loading) {
    return (
      <div style={{ padding: theme.spacing.xl, textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  const activeTables = tables.filter(t => t.status === 'active');
  const completedTables = tables.filter(t => t.status === 'completed');

  return (
    <div style={{ padding: theme.spacing.xl, maxWidth: '1200px', margin: '0 auto' }}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Dashboard</h1>
          {currentAgent && (
            <p style={{ color: theme.colors.neutral[500], marginTop: theme.spacing.xs }}>
              Welcome back, {currentAgent.metadata.name}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: theme.spacing.sm }}>
          <Button variant="outline" onClick={() => setShowAgentsModal(true)}>
            Browse Agents
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            + New Deal
          </Button>
        </div>
      </div>

      <div style={statsRowStyle}>
        <div style={statCardStyle}>
          <div style={statValueStyle}>{tables.length}</div>
          <div style={statLabelStyle}>Total Deals</div>
        </div>
        <div style={statCardStyle}>
          <div style={statValueStyle}>{activeTables.length}</div>
          <div style={statLabelStyle}>Active Deals</div>
        </div>
        <div style={statCardStyle}>
          <div style={statValueStyle}>{completedTables.length}</div>
          <div style={statLabelStyle}>Completed</div>
        </div>
        <div style={statCardStyle}>
          <div style={statValueStyle}>{currentAgent?.reputationScore || 0}</div>
          <div style={statLabelStyle}>Reputation</div>
        </div>
      </div>

      <div>
        <h2 style={{ 
          fontSize: theme.typography.fontSize.xl, 
          fontWeight: theme.typography.fontWeight.semibold,
          marginBottom: theme.spacing.md,
        }}>
          Your Deals
        </h2>
        <TableList
          tables={tables}
          agents={agents}
          currentAgentId={currentAgent?.id}
          onTableClick={selectTable}
        />
      </div>

      {/* Create Table Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Start New Deal"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateTable} 
              disabled={!selectedAgentId || creating}
              isLoading={creating}
            >
              Create Deal
            </Button>
          </>
        }
      >
        <p style={{ marginBottom: theme.spacing.md, color: theme.colors.neutral[600] }}>
          Select an agent to start negotiating with:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          {otherAgents.map(agent => (
            <Card
              key={agent.id}
              variant={selectedAgentId === agent.id ? 'elevated' : 'outlined'}
              padding="md"
              onClick={() => setSelectedAgentId(agent.id)}
              style={{ 
                cursor: 'pointer',
                borderColor: selectedAgentId === agent.id ? theme.colors.primary[500] : undefined,
              }}
            >
              <AgentProfile agent={agent} />
            </Card>
          ))}
        </div>
      </Modal>

      {/* Browse Agents Modal */}
      <Modal
        isOpen={showAgentsModal}
        onClose={() => setShowAgentsModal(false)}
        title="Browse Agents"
        size="lg"
      >
        <p style={{ marginBottom: theme.spacing.md, color: theme.colors.neutral[600] }}>
          Discover agents to collaborate with:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          {otherAgents.map(agent => (
            <AgentProfile key={agent.id} agent={agent} />
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;
