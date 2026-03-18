import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Agent, Table, Message, Quote, Contract, Escrow } from '../types';
import api from '../services/api';
import wsService from '../services/websocket';
import walletService from '../services/wallet';

interface WalletState {
  address: string | null;
  isConnected: boolean;
  provider: string | null;
}

interface AppContextType {
  // Auth state
  isAuthenticated: boolean;
  isLoading: boolean;
  wallet: WalletState;
  
  // Data
  currentAgent: Agent | null;
  tables: Table[];
  selectedTable: Table | null;
  agents: Record<string, Agent>;
  messages: Message[];
  quote: Quote | null;
  contract: Contract | null;
  escrow: Escrow | null;
  
  // Actions
  login: () => Promise<void>;
  logout: () => void;
  selectTable: (table: Table | null) => Promise<void>;
  refreshTable: (tableId: string) => Promise<void>;
  refreshTables: () => Promise<void>;
  sendMessage: (content: string, type?: 'text' | 'quote' | 'document') => Promise<void>;
  submitQuote: (amount: number, description: string) => Promise<void>;
  approveQuote: () => Promise<void>;
  createContract: (amount: number, deliverables: string[], timeline: { start: number; end: number }) => Promise<void>;
  signContract: (amount: string) => Promise<void>;
  depositEscrow: (amount: string) => Promise<void>;
  approveRelease: () => Promise<void>;
  openDispute: (reason: 'quality' | 'non_delivery' | 'other', evidence?: string[]) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Demo mode - uses mock data when no backend
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false';
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    isConnected: false,
    provider: null,
  });
  
  // Data state
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [agents, setAgents] = useState<Record<string, Agent>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [escrow, setEscrow] = useState<Escrow | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize wallet listener
  useEffect(() => {
    const unsubscribe = walletService.subscribe((state) => {
      setWallet({
        address: state.address,
        isConnected: state.isConnected,
        provider: state.provider,
      });
    });

    return () => unsubscribe();
  }, []);

  // Connect to WebSocket when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      wsService.connect().catch((err) => {
        console.log('WebSocket connection failed:', err.message);
      });

      // Subscribe to real-time updates
      const unsubs = [
        wsService.onNewMessage(({ message, tableId }) => {
          if (selectedTable?.id === tableId) {
            setMessages((prev) => [...prev, message]);
          }
        }),
        wsService.onTableUpdated(({ table }) => {
          setTables((prev) => prev.map((t) => (t.id === table.id ? table : t)));
          if (selectedTable?.id === table.id) {
            setSelectedTable(table);
          }
        }),
      ];

      return () => {
        unsubs.forEach((unsub) => unsub());
        wsService.disconnect();
      };
    }
  }, [isAuthenticated, selectedTable?.id]);

  // Login function
  const login = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Connect wallet
      const address = await walletService.connect();
      if (!address) {
        throw new Error('Failed to connect wallet');
      }

      // In production, would authenticate with backend
      // For now, use wallet address as agent ID (demo mode)
      const agentId = address; // In real app, look up agent by wallet
      
      // Set auth in API service
      api.setAuth(agentId, address);

      // Load initial data
      const [agentData, tablesData] = await Promise.all([
        DEMO_MODE ? null : api.getCurrentAgent().catch(() => null),
        api.listTables(),
      ]);

      // For demo mode, use mock data if no backend
      if (DEMO_MODE || !agentData) {
        // Use mock data
        const mockAgent: Agent = {
          id: address,
          ownerAddress: address,
          publicKey: '',
          capabilities: ['defi-research'],
          reputationScore: 85,
          walletAddress: address,
          metadata: {
            name: 'Demo Agent',
            description: 'Demo agent for testing',
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setCurrentAgent(mockAgent);
        
        // Mock tables for demo
        const mockTables: Table[] = [
          {
            id: 'table-001',
            creatorId: address,
            participantId: 'agent-002',
            status: 'active',
            createdAt: Date.now() - 86400000 * 2,
            updatedAt: Date.now() - 3600000,
          },
          {
            id: 'table-002',
            creatorId: address,
            participantId: 'agent-003',
            status: 'completed',
            createdAt: Date.now() - 86400000 * 5,
            updatedAt: Date.now() - 86400000,
          },
        ];
        setTables(mockTables);

        // Mock agents
        const mockAgents: Record<string, Agent> = {
          [address]: mockAgent,
          'agent-002': {
            id: 'agent-002',
            ownerAddress: '0x9B3a54D092fF1F4c3a9bC7fE1d2C8F3a1E5b7D9C',
            publicKey: '',
            capabilities: ['smart-contract-audit'],
            reputationScore: 85,
            walletAddress: '0x9B3a54D092fF1F4c3a9bC7fE1d2C8F3a1E5b7D9C',
            metadata: { name: 'Security Auditor', description: 'Expert in smart contract security' },
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          'agent-003': {
            id: 'agent-003',
            ownerAddress: '0x1234567890abcdef1234567890abcdef12345678',
            publicKey: '',
            capabilities: ['nft-minting'],
            reputationScore: 78,
            walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
            metadata: { name: 'NFT Artist Bot', description: 'Generates unique NFT art' },
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        };
        setAgents(mockAgents);
      } else {
        setCurrentAgent(agentData);
        setTables(tablesData.items);
      }

      setIsAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    walletService.disconnect();
    api.clearAuth();
    wsService.disconnect();
    
    setIsAuthenticated(false);
    setCurrentAgent(null);
    setTables([]);
    setSelectedTable(null);
    setAgents({});
    setMessages([]);
    setQuote(null);
    setContract(null);
    setEscrow(null);
  }, []);

  // Select table
  const selectTable = useCallback(async (table: Table | null) => {
    setSelectedTable(table);
    if (table) {
      try {
        if (DEMO_MODE) {
          // Mock data for demo
          const mockMessages: Message[] = [
            { id: '1', tableId: table.id, senderId: table.creatorId, content: 'Hi! I need help with my project.', messageType: 'text', createdAt: Date.now() - 86400000 * 2 },
            { id: '2', tableId: table.id, senderId: table.participantId, content: 'Sure! What do you need?', messageType: 'text', createdAt: Date.now() - 86400000 * 2 + 3600000 },
          ];
          setMessages(mockMessages);
          setQuote({ id: 'q1', tableId: table.id, sellerId: table.participantId, encryptedAmount: '5000', description: 'Full project delivery', approvedBy: [], createdAt: Date.now(), updatedAt: Date.now() });
          setContract(null);
          setEscrow({ tableId: table.id, amount: '5100', fee: '100', buyerAddress: table.creatorId, sellerAddress: table.participantId, status: 'deposited', buyerApproved: false, sellerApproved: false });
        } else {
          const [tableData, escrowStatus] = await Promise.all([
            api.getTable(table.id),
            api.getEscrow(table.id).catch(() => null),
          ]);

          setMessages(tableData.messages);
          setQuote(tableData.quotes[0] ?? null);
          setContract(tableData.contract);
          setEscrow(escrowStatus);
        }
      } catch (err) {
        console.error('Failed to load table:', err);
        setError('Failed to load table data');
      }
    } else {
      setMessages([]);
      setQuote(null);
      setContract(null);
      setEscrow(null);
    }
  }, []);

  // Refresh table
  const refreshTable = useCallback(async (tableId: string) => {
    if (!selectedTable || selectedTable.id !== tableId) return;
    
    try {
      if (DEMO_MODE) {
        // Already loaded
      } else {
        const [tableData, escrowStatus] = await Promise.all([
          api.getTable(tableId),
          api.getEscrow(tableId).catch(() => null),
        ]);

        setSelectedTable(tableData.table);
        setMessages(tableData.messages);
        setQuote(tableData.quotes[0] ?? null);
        setContract(tableData.contract);
        setEscrow(escrowStatus);
      }
    } catch (err) {
      console.error('Failed to refresh table:', err);
    }
  }, [selectedTable]);

  // Refresh tables list
  const refreshTables = useCallback(async () => {
    try {
      if (DEMO_MODE) {
        // Already have mock data
      } else {
        const data = await api.listTables();
        setTables(data.items);
      }
    } catch (err) {
      console.error('Failed to refresh tables:', err);
    }
  }, []);

  // Send message
  const sendMessage = useCallback(async (content: string, type: 'text' | 'quote' | 'document' = 'text') => {
    if (!selectedTable) return;
    
    try {
      if (DEMO_MODE) {
        const newMsg: Message = {
          id: `msg-${Date.now()}`,
          tableId: selectedTable.id,
          senderId: currentAgent?.id || '',
          content,
          messageType: type,
          createdAt: Date.now(),
        };
        setMessages((prev) => [...prev, newMsg]);
      } else {
        await api.sendMessage(selectedTable.id, content, type);
        await refreshTable(selectedTable.id);
      }
    } catch (err) {
      setError('Failed to send message');
      console.error(err);
    }
  }, [selectedTable, currentAgent, refreshTable]);

  // Submit quote
  const submitQuote = useCallback(async (amount: number, description: string) => {
    if (!selectedTable) return;
    
    try {
      if (DEMO_MODE) {
        const newQuote: Quote = {
          id: `quote-${Date.now()}`,
          tableId: selectedTable.id,
          sellerId: currentAgent?.id || '',
          encryptedAmount: amount.toString(),
          description,
          approvedBy: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setQuote(newQuote);
      } else {
        await api.submitQuote(selectedTable.id, amount.toString(), description);
        await refreshTable(selectedTable.id);
      }
    } catch (err) {
      setError('Failed to submit quote');
      console.error(err);
    }
  }, [selectedTable, currentAgent, refreshTable]);

  // Approve quote
  const approveQuote = useCallback(async () => {
    if (!selectedTable) return;
    
    try {
      if (DEMO_MODE) {
        setQuote((prev) => {
          if (!prev) return null;
          const currentApprovedBy = Array.isArray(prev.approvedBy)
            ? prev.approvedBy
            : prev.approvedBy
              ? [prev.approvedBy]
              : [];
          return { ...prev, approvedBy: [...currentApprovedBy, currentAgent?.id || ''] };
        });
      } else {
        await api.approveQuote(selectedTable.id);
        await refreshTable(selectedTable.id);
      }
    } catch (err) {
      setError('Failed to approve quote');
      console.error(err);
    }
  }, [selectedTable, currentAgent, refreshTable]);

  // Create contract
  const createContract = useCallback(async (amount: number, deliverables: string[], timeline: { start: number; end: number }) => {
    if (!selectedTable) return;
    
    try {
      if (DEMO_MODE) {
        const newContract: Contract = {
          id: `contract-${Date.now()}`,
          tableId: selectedTable.id,
          encryptedAmount: amount.toString(),
          deliverables: deliverables.map((d, i) => ({ id: `d-${i}`, description: d, completed: false })),
          timeline,
          buyerSigned: false,
          sellerSigned: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setContract(newContract);
      } else {
        await api.createContract(selectedTable.id, amount.toString(), deliverables, timeline);
        await refreshTable(selectedTable.id);
      }
    } catch (err) {
      setError('Failed to create contract');
      console.error(err);
    }
  }, [selectedTable, refreshTable]);

  // Sign contract
  const signContract = useCallback(async (amount: string) => {
    if (!selectedTable) return;
    
    try {
      if (DEMO_MODE) {
        const isBuyer = selectedTable.creatorId === currentAgent?.id;
        setContract((prev) => prev ? {
          ...prev,
          buyerSigned: isBuyer ? true : prev.buyerSigned,
          sellerSigned: !isBuyer ? true : prev.sellerSigned,
        } : null);
      } else {
        await api.signContract(selectedTable.id, amount);
        await refreshTable(selectedTable.id);
      }
    } catch (err) {
      setError('Failed to sign contract');
      console.error(err);
    }
  }, [selectedTable, currentAgent, refreshTable]);

  // Deposit escrow
  const depositEscrow = useCallback(async (amount: string) => {
    if (!selectedTable) return;
    
    try {
      if (DEMO_MODE) {
        setEscrow({
          tableId: selectedTable.id,
          amount,
          fee: Math.round(Number(amount) * 0.02).toString(),
          buyerAddress: currentAgent?.walletAddress || '',
          sellerAddress: agents[selectedTable.participantId]?.walletAddress || '',
          status: 'deposited',
          buyerApproved: false,
          sellerApproved: false,
        });
      } else {
        await api.depositEscrow(selectedTable.id, amount);
        await refreshTable(selectedTable.id);
      }
    } catch (err) {
      setError('Failed to deposit escrow');
      console.error(err);
    }
  }, [selectedTable, currentAgent, agents, refreshTable]);

  // Approve release
  const approveRelease = useCallback(async () => {
    if (!selectedTable) return;
    
    try {
      if (DEMO_MODE) {
        const isBuyer = selectedTable.creatorId === currentAgent?.id;
        setEscrow((prev) => prev ? {
          ...prev,
          buyerApproved: isBuyer ? true : prev.buyerApproved,
          sellerApproved: !isBuyer ? true : prev.sellerApproved,
        } : null);
      } else {
        await api.approveRelease(selectedTable.id);
        await refreshTable(selectedTable.id);
      }
    } catch (err) {
      setError('Failed to approve release');
      console.error(err);
    }
  }, [selectedTable, currentAgent, refreshTable]);

  // Open dispute
  const openDispute = useCallback(async (reason: 'quality' | 'non_delivery' | 'other', evidence: string[] = []) => {
    if (!selectedTable) return;
    
    try {
      if (DEMO_MODE) {
        setSelectedTable((prev) => prev ? { ...prev, status: 'disputed' } : null);
        setEscrow((prev) => prev ? { ...prev, status: 'disputed' } : null);
      } else {
        await api.openDispute(selectedTable.id, reason, evidence);
        await refreshTable(selectedTable.id);
      }
    } catch (err) {
      setError('Failed to open dispute');
      console.error(err);
    }
  }, [selectedTable, refreshTable]);

  // Clear error
  const clearError = useCallback(() => setError(null), []);

  // Auto-login in demo mode
  useEffect(() => {
    if (DEMO_MODE) {
      login();
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        wallet,
        currentAgent,
        tables,
        selectedTable,
        agents,
        messages,
        quote,
        contract,
        escrow,
        login,
        logout,
        selectTable,
        refreshTable,
        refreshTables,
        sendMessage,
        submitQuote,
        approveQuote,
        createContract,
        signContract,
        depositEscrow,
        approveRelease,
        openDispute,
        error,
        clearError,
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
