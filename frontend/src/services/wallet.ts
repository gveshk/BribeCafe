// Wallet Service - handles wallet connection with Privy/Wagmi
import { api } from './api';

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

export type WalletProvider = 'metamask' | 'coinbase' | 'privy' | 'walletconnect';

interface WalletState {
  address: string | null;
  chainId: number | null;
  provider: WalletProvider | null;
  isConnected: boolean;
}

type WalletChangeCallback = (state: WalletState) => void;

class WalletService {
  private state: WalletState = {
    address: null,
    chainId: null,
    provider: null,
    isConnected: false,
  };
  private listeners: Set<WalletChangeCallback> = new Set();

  constructor() {
    // Listen for account changes
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this));
      window.ethereum.on('chainChanged', this.handleChainChanged.bind(this));
    }
  }

  /**
   * Get current wallet state
   */
  getState(): WalletState {
    return { ...this.state };
  }

  /**
   * Subscribe to wallet state changes
   */
  subscribe(callback: WalletChangeCallback): () => void {
    this.listeners.add(callback);
    // Immediately call with current state
    callback(this.getState());
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of state change
   */
  private notify(): void {
    this.listeners.forEach((callback) => callback(this.getState()));
  }

  /**
   * Handle accounts changed event
   */
  private handleAccountsChanged(accounts: string[]): void {
    if (accounts.length === 0) {
      this.disconnect();
    } else {
      this.state.address = accounts[0].toLowerCase();
      this.state.isConnected = true;
      this.notify();
    }
  }

  /**
   * Handle chain changed event
   */
  private handleChainChanged(chainId: string): void {
    this.state.chainId = parseInt(chainId, 16);
    this.notify();
  }

  /**
   * Connect to wallet (MetaMask)
   */
  async connect(): Promise<string | null> {
    if (!window.ethereum) {
      throw new Error('No wallet found. Please install MetaMask.');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      }) as string[];

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const address = accounts[0].toLowerCase();
      
      // Get chain ID
      const chainId = await window.ethereum.request({
        method: 'eth_chainId',
      }) as string;

      // Determine provider
      let provider: WalletProvider = 'metamask';
      if (window.ethereum.isMetaMask) {
        provider = 'metamask';
      }

      // Update state
      this.state = {
        address,
        chainId: parseInt(chainId, 16),
        provider,
        isConnected: true,
      };

      this.notify();
      return address;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }

  /**
   * Disconnect wallet
   */
  disconnect(): void {
    this.state = {
      address: null,
      chainId: null,
      provider: null,
      isConnected: false,
    };
    api.clearAuth();
    this.notify();
  }

  /**
   * Sign a message with the connected wallet
   */
  async signMessage(message: string): Promise<string> {
    if (!window.ethereum || !this.state.address) {
      throw new Error('Wallet not connected');
    }

    try {
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, this.state.address],
      }) as string;

      return signature;
    } catch (error) {
      console.error('Failed to sign message:', error);
      throw error;
    }
  }

  /**
   * Sign transaction data
   */
  async signTransaction(transaction: {
    to: string;
    value?: string;
    data?: string;
  }): Promise<string> {
    if (!window.ethereum || !this.state.address) {
      throw new Error('Wallet not connected');
    }

    try {
      const txParams = {
        from: this.state.address,
        to: transaction.to,
        value: transaction.value || '0x0',
        data: transaction.data || '0x',
      };

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [txParams],
      }) as string;

      return txHash;
    } catch (error) {
      console.error('Failed to sign transaction:', error);
      throw error;
    }
  }

  /**
   * Switch to a different network
   */
  async switchNetwork(chainId: number): Promise<void> {
    if (!window.ethereum) {
      throw new Error('No wallet found');
    }

    const chainIdHex = `0x${chainId.toString(16)}`;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
    } catch (error: unknown) {
      // If chain not added, could prompt to add it
      const err = error as { code?: number };
      if (err.code === 4902) {
        throw new Error('Chain not found. Please add it to your wallet.');
      }
      throw error;
    }
  }

  /**
   * Get current network name
   */
  getNetworkName(): string {
    const { chainId } = this.state;
    if (!chainId) return 'Unknown';

    const networks: Record<number, string> = {
      1: 'Ethereum Mainnet',
      5: 'Goerli Testnet',
      11155111: 'Sepolia Testnet',
      8453: 'Base Mainnet',
      84531: 'Base Goerli',
      42161: 'Arbitrum One',
      421613: 'Arbitrum Goerli',
    };

    return networks[chainId] || `Chain ${chainId}`;
  }

  /**
   * Check if wallet is installed
   */
  isWalletInstalled(): boolean {
    return typeof window !== 'undefined' && !!window.ethereum;
  }

  /**
   * Get formatted address
   */
  formatAddress(address: string): string {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
}

// Export singleton instance
export const walletService = new WalletService();
export default walletService;
