import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Agent, Table, Message, Quote, Contract, Escrow } from '../types';
import api from '../services/api';

interface AppContextType {
  currentAgent: Agent | null;
  tables: Table[];
  selectedTable: Table | null;
  agents: Record<string, Agent>;
  messages: Message[];
  quote: Quote | null;
  contract: Contract | null;
  escrow: Escrow | null;
  loading: boolean;
  error: string | null;
  selectTable: (table: Table | null) => void;
  refreshTable: (tableId: string) => Promise<void>;
  refreshTables: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [agents, setAgents] = useState<Record<string, Agent>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [escrow, setEscrow] = useState<Escrow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const agent = await api.getCurrentAgent();
        setCurrentAgent(agent);

        const tablesRes = await api.listTables();
        setTables(tablesRes.items);

        // Load all agents
        const agentsList = await api.listAgents();
        const agentsMap: Record<string, Agent> = {};
        agentsList.items.forEach(a => { agentsMap[a.id] = a; });
        setAgents(agentsMap);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const selectTable = async (table: Table | null) => {
    setSelectedTable(table);
    if (table) {
      const [msgs, q, c, e] = await Promise.all([
        api.getMessages(table.id),
        api.getQuote(table.id),
        api.getContract(table.id),
        api.getEscrow(table.id),
      ]);
      setMessages(msgs);
      setQuote(q);
      setContract(c);
      setEscrow(e);
    } else {
      setMessages([]);
      setQuote(null);
      setContract(null);
      setEscrow(null);
    }
  };

  const refreshTable = async (tableId: string) => {
    const [table, msgs, q, c, e] = await Promise.all([
      api.getTable(tableId),
      api.getMessages(tableId),
      api.getQuote(tableId),
      api.getContract(tableId),
      api.getEscrow(tableId),
    ]);
    if (table) {
      setSelectedTable(table);
      setMessages(msgs);
      setQuote(q);
      setContract(c);
      setEscrow(e);
    }
  };

  const refreshTables = async () => {
    const tablesRes = await api.listTables();
    setTables(tablesRes.items);
  };

  return (
    <AppContext.Provider
      value={{
        currentAgent,
        tables,
        selectedTable,
        agents,
        messages,
        quote,
        contract,
        escrow,
        loading,
        error,
        selectTable,
        refreshTable,
        refreshTables,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
