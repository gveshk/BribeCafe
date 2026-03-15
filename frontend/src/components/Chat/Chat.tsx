import React, { useState, useRef, useEffect } from 'react';
import { Button, Input, Card, theme } from '../../design-system';
import { Message, Agent, MessageType } from '../../types';

interface ChatProps {
  messages: Message[];
  agents: Record<string, Agent>;
  currentAgentId: string;
  onSendMessage: (content: string, type: MessageType) => void;
  disabled?: boolean;
}

const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const Chat: React.FC<ChatProps> = ({
  messages,
  agents,
  currentAgentId,
  onSendMessage,
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim() && !disabled) {
      onSendMessage(inputValue.trim(), 'text');
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getMessageStyle = (isOwn: boolean): React.CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: isOwn ? 'flex-end' : 'flex-start',
    marginBottom: theme.spacing.md,
  });

  const bubbleStyle = (isOwn: boolean, type: MessageType): React.CSSProperties => ({
    maxWidth: '70%',
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: isOwn 
      ? theme.colors.primary[500] 
      : type === 'quote'
        ? theme.colors.warning.light
        : theme.colors.neutral[100],
    color: isOwn ? 'white' : theme.colors.neutral[900],
    borderBottomRightRadius: isOwn ? theme.borderRadius.sm : theme.borderRadius.lg,
    borderBottomLeftRadius: isOwn ? theme.borderRadius.lg : theme.borderRadius.sm,
  });

  const senderStyle: React.CSSProperties = {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.neutral[500],
    marginBottom: theme.spacing.xs,
  };

  const timeStyle: React.CSSProperties = {
    fontSize: theme.typography.fontSize.xs,
    color: isOwn => isOwn ? 'rgba(255,255,255,0.7)' : theme.colors.neutral[400],
    marginTop: theme.spacing.xs,
  };

  const inputContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderTop: `1px solid ${theme.colors.neutral[200]}`,
    backgroundColor: theme.colors.neutral[50],
  };

  return (
    <Card variant="outlined" padding="none" style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ 
        padding: theme.spacing.md, 
        borderBottom: `1px solid ${theme.colors.neutral[200]}`,
        backgroundColor: theme.colors.neutral[50],
      }}>
        <h3 style={{ margin: 0, fontSize: theme.typography.fontSize.lg }}>Negotiation</h3>
      </div>
      
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: theme.spacing.md,
      }}>
        {messages.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: theme.colors.neutral[400],
            padding: theme.spacing.xl,
          }}>
            <p>No messages yet</p>
            <p style={{ fontSize: theme.typography.fontSize.sm }}>
              Start the conversation to negotiate your deal
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.senderId === currentAgentId;
            const sender = agents[message.senderId];
            
            return (
              <div key={message.id} style={getMessageStyle(isOwn)}>
                {!isOwn && (
                  <span style={senderStyle}>
                    {sender?.metadata.name || 'Unknown'}
                  </span>
                )}
                <div style={bubbleStyle(isOwn, message.messageType)}>
                  {message.messageType === 'quote' && (
                    <div style={{ 
                      fontWeight: theme.typography.fontWeight.bold,
                      marginBottom: theme.spacing.xs,
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.xs,
                    }}>
                      💰 Quote
                    </div>
                  )}
                  {message.content}
                </div>
                <span style={timeStyle(isOwn)}>{formatTime(message.createdAt)}</span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={inputContainerStyle}>
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={disabled ? 'Chat disabled' : 'Type a message...'}
          disabled={disabled}
          style={{ flex: 1 }}
        />
        <Button 
          onClick={handleSend} 
          disabled={disabled || !inputValue.trim()}
        >
          Send
        </Button>
      </div>
    </Card>
  );
};

export default Chat;
