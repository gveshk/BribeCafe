import React, { ReactNode } from 'react';
import { useAuth, AuthProvider } from './providers/AuthContext';
import { TableSessionProvider, useTableSession } from './providers/TableSessionContext';
import { MessagingProvider, useMessaging } from './providers/MessagingContext';
import { EscrowWorkflowProvider, useEscrowWorkflow } from './providers/EscrowWorkflowContext';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => (
  <AuthProvider>
    <TableSessionProvider>
      <MessagingProvider>
        <EscrowWorkflowProvider>{children}</EscrowWorkflowProvider>
      </MessagingProvider>
    </TableSessionProvider>
  </AuthProvider>
);

export const useApp = () => {
  const auth = useAuth();
  const table = useTableSession();
  const messaging = useMessaging();
  const workflow = useEscrowWorkflow();

  return {
    ...auth,
    ...table,
    ...messaging,
    ...workflow,
    isLoading: auth.isLoading,
    loading: auth.isLoading || table.tablesLoading,
    error: auth.authError || table.tableError || messaging.messagesError || workflow.workflowError,
    clearError: auth.clearAuthError,
    refreshTable: async (_tableId: string) => Promise.resolve(),
  };
};

export default AppProvider;
