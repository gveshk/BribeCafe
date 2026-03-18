import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Agent } from '../../types';
import api from '../../services/api';
import walletService from '../../services/wallet';
import { normalizeApiError } from '../../services/api';

interface WalletState {
  address: string | null;
  isConnected: boolean;
  provider: string | null;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  wallet: WalletState;
  currentAgent: Agent | null;
  authError: string | null;
  login: () => Promise<void>;
  logout: () => void;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [wallet, setWallet] = useState<WalletState>({ address: null, isConnected: false, provider: null });

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

  const login = useCallback(async () => {
    try {
      setIsLoading(true);
      setAuthError(null);
      const address = await walletService.connect();
      if (!address) {
        throw new Error('Failed to connect wallet');
      }
      api.setAuth(address, address);

      if (DEMO_MODE) {
        setCurrentAgent({
          id: address,
          owner: address,
          publicKey: '',
          capabilities: ['defi-research'],
          reputationScore: 85,
          walletAddress: address,
          metadata: { name: 'Demo Agent', description: 'Demo agent for testing' },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      } else {
        const agent = await api.getCurrentAgent();
        setCurrentAgent(agent);
      }

      setIsAuthenticated(true);
    } catch (err) {
      setAuthError(normalizeApiError(err).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    walletService.disconnect();
    api.clearAuth();
    setIsAuthenticated(false);
    setCurrentAgent(null);
  }, []);

  useEffect(() => {
    if (DEMO_MODE) {
      void login();
    } else {
      setIsLoading(false);
    }
  }, [login]);

  const value = useMemo(() => ({
    isAuthenticated,
    isLoading,
    wallet,
    currentAgent,
    authError,
    login,
    logout,
    clearAuthError: () => setAuthError(null),
  }), [authError, currentAgent, isAuthenticated, isLoading, login, logout, wallet]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
