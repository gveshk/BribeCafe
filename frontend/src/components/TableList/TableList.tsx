import React from 'react';
import { Card, Badge, Button, theme } from '../../design-system';
import { Table, Agent } from '../../types';

interface TableListProps {
  tables: Table[];
  agents: Record<string, Agent>;
  currentAgentId?: string;
  onTableClick?: (table: Table) => void;
}

const statusVariant: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  active: 'success',
  completed: 'info',
  cancelled: 'warning',
  disputed: 'error',
};

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export const TableList: React.FC<TableListProps> = ({
  tables,
  agents,
  currentAgentId,
  onTableClick,
}) => {
  if (tables.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: theme.spacing.xl,
        color: theme.colors.neutral[500]
      }}>
        <p>No tables found</p>
        <p style={{ fontSize: theme.typography.fontSize.sm }}>
          Create a new table to start negotiating
        </p>
      </div>
    );
  }

  const getOtherParticipant = (table: Table): Agent | undefined => {
    const otherId = table.creatorId === currentAgentId ? table.participantId : table.creatorId;
    return agents[otherId];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
      {tables.map((table) => {
        const otherAgent = getOtherParticipant(table);
        
        const rowStyle: React.CSSProperties = {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: theme.spacing.md,
        };

        const agentInfoStyle: React.CSSProperties = {
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm,
          flex: 1,
          minWidth: 0,
        };

        const agentAvatarStyle: React.CSSProperties = {
          width: '40px',
          height: '40px',
          borderRadius: theme.borderRadius.full,
          backgroundColor: theme.colors.neutral[100],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.neutral[600],
          flexShrink: 0,
        };

        const agentNameStyle: React.CSSProperties = {
          fontWeight: theme.typography.fontWeight.medium,
          color: theme.colors.neutral[900],
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        };

        const dateStyle: React.CSSProperties = {
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.neutral[400],
        };

        const actionsStyle: React.CSSProperties = {
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm,
        };

        return (
          <Card 
            key={table.id} 
            variant="outlined" 
            padding="md"
            onClick={() => onTableClick?.(table)}
          >
            <div style={rowStyle}>
              <div style={agentInfoStyle}>
                <div style={agentAvatarStyle}>
                  {otherAgent?.metadata.name.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <div style={agentNameStyle}>
                    {otherAgent?.metadata.name || 'Unknown Agent'}
                  </div>
                  <div style={dateStyle}>
                    Created {formatDate(table.createdAt)}
                  </div>
                </div>
              </div>
              <div style={actionsStyle}>
                <Badge variant={statusVariant[table.status]}>
                  {table.status}
                </Badge>
                <Button size="sm" variant="ghost">
                  View →
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default TableList;
