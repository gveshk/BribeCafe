import React, { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { Agent, Table } from '../../types';
import { useAuth } from './AuthContext';
import { invalidateQueries } from '../../hooks/apiHooks';
import { queryKeys, useAgentsQuery, useTablesQuery } from '../../hooks/useBribeQueries';

interface TableSessionContextType {
  tables: Table[];
  agents: Record<string, Agent>;
  selectedTable: Table | null;
  tableError: string | null;
  tablesLoading: boolean;
  tablesEmpty: boolean;
  selectTable: (table: Table | null) => void;
  refreshTables: () => Promise<void>;
}

const TableSessionContext = createContext<TableSessionContextType | undefined>(undefined);

export const TableSessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  const tablesQuery = useTablesQuery(isAuthenticated);
  const agentsQuery = useAgentsQuery(isAuthenticated);

  const refreshTables = async () => {
    invalidateQueries(queryKeys.tables);
    await tablesQuery.refetch();
  };

  const value = useMemo(() => ({
    tables: tablesQuery.data ?? [],
    agents: agentsQuery.data ?? {},
    selectedTable,
    tableError: tablesQuery.error?.message ?? agentsQuery.error?.message ?? null,
    tablesLoading: authLoading || tablesQuery.isLoading || agentsQuery.isLoading,
    tablesEmpty: !tablesQuery.isLoading && (tablesQuery.data?.length ?? 0) === 0,
    selectTable: setSelectedTable,
    refreshTables,
  }), [agentsQuery.data, agentsQuery.error?.message, agentsQuery.isLoading, authLoading, selectedTable, tablesQuery.data, tablesQuery.error?.message, tablesQuery.isLoading]);

  return <TableSessionContext.Provider value={value}>{children}</TableSessionContext.Provider>;
};

export const useTableSession = () => {
  const context = useContext(TableSessionContext);
  if (!context) {
    throw new Error('useTableSession must be used within TableSessionProvider');
  }
  return context;
};
