import { v4 as uuidv4 } from 'uuid';
import { ethers } from 'ethers';
import prisma from '../db/prisma';
import type { EscrowEvent, EscrowStatus, EscrowEventType } from '../types';
import { tableService } from './tableService';

// FHE Escrow contract ABI (FHE functions)
const FHE_ESCROW_ABI = [
  // Write functions
  'function createEscrow(bytes32 tableId, address buyer, address seller, address treasury) external',
  'function deposit(bytes32 tableId, bytes32 encryptedAmount) external payable',
  'function buyerApprove(bytes32 tableId) external',
  'function sellerApprove(bytes32 tableId) external',
  'function release(bytes32 tableId) external',
  'function openDispute(bytes32 tableId) external',
  'function resolveDispute(bytes32 tableId, bool releaseToSeller) external',
  'function cancel(bytes32 tableId) external',
  // Read functions
  'function getStatus(bytes32 tableId) external view returns (uint8)',
  'function getBuyer(bytes32 tableId) external view returns (address)',
  'function getSeller(bytes32 tableId) external view returns (address)',
  // Events
  'event EscrowCreated(bytes32 indexed tableId, address indexed buyer, address indexed seller, address treasury)',
  'event Deposited(bytes32 indexed tableId, address indexed buyer, uint256 encryptedAmount, uint256 timestamp)',
  'event BuyerApproved(bytes32 indexed tableId, address buyer)',
  'event SellerApproved(bytes32 indexed tableId, address seller)',
  'event Released(bytes32 indexed tableId, address seller, uint256 amount, uint256 fee, uint256 timestamp)',
  'event Cancelled(bytes32 indexed tableId, address buyer, uint256 amount)',
  'event DisputeOpened(bytes32 indexed tableId, address indexed opener)',
  'event DisputeResolved(bytes32 indexed tableId, bool releaseToSeller, address resolver)',
];

// Contract status enum (must match Solidity)
const ESCROW_STATUS = {
  None: 0,
  Created: 1,
  Deposited: 2,
  Released: 3,
  Cancelled: 4,
  Disputed: 5,
};

export class EscrowService {
  private provider: ethers.JsonRpcProvider | null = null;
  private escrowContract: ethers.Contract | null = null;
  private treasuryAddress: string = '';

  /**
   * Initialize the escrow service with blockchain configuration
   */
  async initialize(blockchainConfig: {
    rpcUrl: string;
    escrowAddress: string;
    treasuryAddress: string;
    privateKey?: string;
  }): Promise<void> {
    this.provider = new ethers.JsonRpcProvider(blockchainConfig.rpcUrl);
    this.treasuryAddress = blockchainConfig.treasuryAddress;

    const wallet = blockchainConfig.privateKey
      ? new ethers.Wallet(blockchainConfig.privateKey, this.provider)
      : undefined;

    this.escrowContract = new ethers.Contract(
      blockchainConfig.escrowAddress,
      FHE_ESCROW_ABI,
      wallet || this.provider
    );

    console.log('Escrow service initialized:', blockchainConfig.escrowAddress);
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.escrowContract !== null && this.provider !== null;
  }

  /**
   * Create a new escrow for a table
   */
  async createEscrow(
    tableId: string,
    buyerAddress: string,
    sellerAddress: string,
    txOptions?: { gasLimit?: bigint }
  ): Promise<{ txHash: string }> {
    if (!this.escrowContract) {
      throw new Error('Escrow service not initialized');
    }

    const table = await tableService.findById(tableId);
    if (!table) {
      throw new Error('Table not found');
    }

    const tableIdBytes = this.stringToBytes32(tableId);
    
    const tx = await this.escrowContract.createEscrow(
      tableIdBytes,
      buyerAddress,
      sellerAddress,
      this.treasuryAddress,
      txOptions || {}
    );

    const receipt = await tx.wait();

    await this.logEvent(tableId, 'created', '0', '0', receipt.hash);

    return { txHash: receipt.hash };
  }

  /**
   * Deposit funds to escrow (with FHE encryption)
   * Note: In production, amount should be encrypted client-side using fhevmjs
   */
  async deposit(
    tableId: string,
    amount: string,
    encryptedAmount: string, // FHE encrypted from client
    txOptions?: { gasLimit?: bigint; value?: bigint }
  ): Promise<{ txHash: string }> {
    if (!this.escrowContract) {
      throw new Error('Escrow service not initialized');
    }

    const table = await tableService.findById(tableId);
    if (!table) {
      throw new Error('Table not found');
    }

    const tableIdBytes = this.stringToBytes32(tableId);
    
    // Calculate total with 2% fee
    const value = BigInt(amount);
    const fee = (value * BigInt(200)) / BigInt(10000);
    const total = value + fee;

    const tx = await this.escrowContract.deposit(
      tableIdBytes,
      encryptedAmount, // FHE encrypted
      {
        ...txOptions,
        value: total,
      }
    );

    const receipt = await tx.wait();
    const feeStr = fee.toString();

    await this.logEvent(tableId, 'deposited', amount, feeStr, receipt.hash);

    return { txHash: receipt.hash };
  }

  /**
   * Buyer approves release
   */
  async buyerApprove(
    tableId: string,
    txOptions?: { gasLimit?: bigint }
  ): Promise<{ txHash: string }> {
    if (!this.escrowContract) {
      throw new Error('Escrow service not initialized');
    }

    const tableIdBytes = this.stringToBytes32(tableId);
    const tx = await this.escrowContract.buyerApprove(tableIdBytes, txOptions);
    const receipt = await tx.wait();

    return { txHash: receipt.hash };
  }

  /**
   * Seller approves release
   */
  async sellerApprove(
    tableId: string,
    txOptions?: { gasLimit?: bigint }
  ): Promise<{ txHash: string }> {
    if (!this.escrowContract) {
      throw new Error('Escrow service not initialized');
    }

    const tableIdBytes = this.stringToBytes32(tableId);
    const tx = await this.escrowContract.sellerApprove(tableIdBytes, txOptions);
    const receipt = await tx.wait();

    return { txHash: receipt.hash };
  }

  /**
   * Release funds (called after both parties approve)
   */
  async release(
    tableId: string,
    txOptions?: { gasLimit?: bigint }
  ): Promise<{ txHash: string }> {
    if (!this.escrowContract) {
      throw new Error('Escrow service not initialized');
    }

    const tableIdBytes = this.stringToBytes32(tableId);
    const tx = await this.escrowContract.release(tableIdBytes, txOptions);
    const receipt = await tx.wait();

    // Calculate amounts for logging
    const status = await this.getStatus(tableId);
    const amount = status.amount || '0';
    const fee = (BigInt(amount) * BigInt(200)) / BigInt(10000);

    await this.logEvent(tableId, 'released', amount, fee.toString(), receipt.hash);

    return { txHash: receipt.hash };
  }

  /**
   * Open a dispute
   */
  async openDispute(
    tableId: string,
    txOptions?: { gasLimit?: bigint }
  ): Promise<{ txHash: string }> {
    if (!this.escrowContract) {
      throw new Error('Escrow service not initialized');
    }

    const tableIdBytes = this.stringToBytes32(tableId);
    const tx = await this.escrowContract.openDispute(tableIdBytes, txOptions);
    const receipt = await tx.wait();

    await this.logEvent(tableId, 'disputed', '0', '0', receipt.hash);

    return { txHash: receipt.hash };
  }

  /**
   * Resolve a dispute
   */
  async resolveDispute(
    tableId: string,
    releaseToSeller: boolean,
    txOptions?: { gasLimit?: bigint }
  ): Promise<{ txHash: string }> {
    if (!this.escrowContract) {
      throw new Error('Escrow service not initialized');
    }

    const tableIdBytes = this.stringToBytes32(tableId);
    const tx = await this.escrowContract.resolveDispute(
      tableIdBytes,
      releaseToSeller,
      txOptions
    );
    const receipt = await tx.wait();

    await this.logEvent(
      tableId,
      releaseToSeller ? 'released' : 'cancelled',
      '0',
      '0',
      receipt.hash
    );

    return { txHash: receipt.hash };
  }

  /**
   * Cancel and refund buyer
   */
  async cancel(
    tableId: string,
    txOptions?: { gasLimit?: bigint }
  ): Promise<{ txHash: string }> {
    if (!this.escrowContract) {
      throw new Error('Escrow service not initialized');
    }

    const tableIdBytes = this.stringToBytes32(tableId);
    const tx = await this.escrowContract.cancel(tableIdBytes, txOptions);
    const receipt = await tx.wait();

    await this.logEvent(tableId, 'cancelled', '0', '0', receipt.hash);

    return { txHash: receipt.hash };
  }

  /**
   * Get escrow status from blockchain
   */
  async getStatus(tableId: string): Promise<EscrowStatus> {
    if (!this.escrowContract) {
      throw new Error('Escrow service not initialized');
    }

    const tableIdBytes = this.stringToBytes32(tableId);
    
    try {
      const statusNum = await this.escrowContract.getStatus(tableIdBytes);
      const buyer = await this.escrowContract.getBuyer(tableIdBytes);
      const seller = await this.escrowContract.getSeller(tableIdBytes);

      const statusMap: Record<number, string> = {
        0: 'none',
        1: 'created',
        2: 'deposited',
        3: 'released',
        4: 'cancelled',
        5: 'disputed',
      };

      return {
        tableId,
        amount: '0', // FHE - needs decryption
        fee: '0',    // FHE - needs decryption
        buyerAddress: buyer,
        sellerAddress: seller,
        status: statusMap[Number(statusNum)] as EscrowStatus['status'],
        buyerApproved: false, // FHE - needs decryption
        sellerApproved: false, // FHE - needs decryption
        released: Number(statusNum) === ESCROW_STATUS.Released,
        cancelled: Number(statusNum) === ESCROW_STATUS.Cancelled,
        disputed: Number(statusNum) === ESCROW_STATUS.Disputed,
      };
    } catch (error) {
      console.error('Error getting escrow status:', error);
      return {
        tableId,
        amount: '0',
        fee: '0',
        status: 'none',
        buyerApproved: false,
        sellerApproved: false,
      };
    }
  }

  /**
   * Helper: Convert string to bytes32
   */
  private stringToBytes32(str: string): string {
    // Use ethers id function for deterministic bytes32
    return ethers.id(str);
  }

  /**
   * Log event to database
   */
  private async logEvent(
    tableId: string,
    eventType: EscrowEventType,
    amount: string,
    fee: string,
    txHash: string
  ): Promise<void> {
    try {
      await prisma.escrowEvent.create({
        data: {
          id: uuidv4(),
          tableId,
          eventType,
          amount,
          fee,
          txHash,
        },
      });
    } catch (error) {
      console.error('Failed to log escrow event:', error);
    }
  }
}

export const escrowService = new EscrowService();
