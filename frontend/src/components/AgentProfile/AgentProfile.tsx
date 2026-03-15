import React from 'react';
import { Card, Badge, theme } from '../../design-system';
import { Agent } from '../../types';

interface AgentProfileProps {
  agent: Agent;
  onClick?: () => void;
}

const getReputationColor = (score: number): 'success' | 'warning' | 'error' | 'default' => {
  if (score >= 80) return 'success';
  if (score >= 50) return 'warning';
  if (score >= 20) return 'error';
  return 'default';
};

export const AgentProfile: React.FC<AgentProfileProps> = ({ agent, onClick }) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.md,
  };

  const avatarStyle: React.CSSProperties = {
    width: '48px',
    height: '48px',
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary[100],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[600],
    flexShrink: 0,
  };

  const infoStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  };

  const nameStyle: React.CSSProperties = {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.neutral[900],
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.neutral[500],
    margin: `${theme.spacing.xs} 0`,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const statsStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  };

  const capabilitiesStyle: React.CSSProperties = {
    display: 'flex',
    gap: theme.spacing.xs,
    flexWrap: 'wrap',
    marginTop: theme.spacing.xs,
  };

  const capabilityStyle: React.CSSProperties = {
    fontSize: theme.typography.fontSize.xs,
    padding: '2px 6px',
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.borderRadius.sm,
    color: theme.colors.neutral[600],
  };

  return (
    <Card variant="outlined" padding="md" onClick={onClick}>
      <div style={containerStyle}>
        <div style={avatarStyle}>
          {agent.metadata.avatar ? (
            <img 
              src={agent.metadata.avatar} 
              alt={agent.metadata.name} 
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            agent.metadata.name.charAt(0).toUpperCase()
          )}
        </div>
        <div style={infoStyle}>
          <h3 style={nameStyle}>{agent.metadata.name}</h3>
          <p style={descriptionStyle}>{agent.metadata.description}</p>
          <div style={statsStyle}>
            <Badge variant={getReputationColor(agent.reputationScore)}>
              {agent.reputationScore} rep
            </Badge>
            <span style={{ fontSize: theme.typography.fontSize.xs, color: theme.colors.neutral[400] }}>
              {agent.walletAddress.slice(0, 6)}...{agent.walletAddress.slice(-4)}
            </span>
          </div>
          {agent.capabilities.length > 0 && (
            <div style={capabilitiesStyle}>
              {agent.capabilities.slice(0, 3).map((cap) => (
                <span key={cap} style={capabilityStyle}>{cap}</span>
              ))}
              {agent.capabilities.length > 3 && (
                <span style={capabilityStyle}>+{agent.capabilities.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default AgentProfile;
