import React, { createContext, ReactNode, useContext, useMemo } from 'react';
import { Message } from '../../types';
import { useTableSession } from './TableSessionContext';
import { useMessagesQuery, useSendMessageMutation } from '../../hooks/useBribeQueries';

interface MessagingContextType {
  messages: Message[];
  messagesLoading: boolean;
  messagesError: string | null;
  sendMessage: (content: string, type?: 'text' | 'quote' | 'document') => Promise<void>;
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

export const MessagingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { selectedTable } = useTableSession();
  const tableId = selectedTable?.id;
  const messagesQuery = useMessagesQuery(tableId);
  const sendMessageMutation = useSendMessageMutation(tableId);

  const sendMessage = async (content: string, type: 'text' | 'quote' | 'document' = 'text') => {
    await sendMessageMutation.mutateAsync({ content, type });
  };

  const value = useMemo(() => ({
    messages: messagesQuery.data ?? [],
    messagesLoading: messagesQuery.isLoading,
    messagesError: messagesQuery.error?.message ?? sendMessageMutation.error?.message ?? null,
    sendMessage,
  }), [messagesQuery.data, messagesQuery.error?.message, messagesQuery.isLoading, sendMessageMutation.error?.message]);

  return <MessagingContext.Provider value={value}>{children}</MessagingContext.Provider>;
};

export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (!context) throw new Error('useMessaging must be used within MessagingProvider');
  return context;
};
