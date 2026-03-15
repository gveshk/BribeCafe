import { v4 as uuidv4 } from 'uuid';
import { ethers } from 'ethers';
import prisma from '../db/prisma';
import type { EscrowEvent, EscrowStatus, EscrowEventType } from '../types';
import { tableService } from './tableService';

export class EscrowService {
  private provider: ethers.JsonRpcProvider | null = null;
  private escrowContract: ethers.Contract | null = null;

  async initialize(blockchainConfig: {
    rpcUrl: string;
    escrowAddress: string;
    privateKey?: string;
  }): Promise<void> {
    this.provider = new ethers.JsonRpcProvider(blockchainConfig.rpcUrl);
    
    // Minimal ABI for Escrow functions we need
    const abi = [
      'function initializeForTable(bytes32 tableId, address buyer, address seller, address treasury) external',
      'function deposit(bytes32 tableId) external payable',
      'function buyerApprove(bytes32 tableId) external',
      'function sellerApprove(bytes32 tableId) external',
      'function openDispute(bytes32 tableId) external',
      'function resolveDispute(bytes32 tableId, bool releaseToSeller) external',
      'function cancel(bytes32 tableId) external',
      'function getStatus(bytes32 tableId) view returns (uint256 amount, uint256 fee, address buyer, address seller, bool buyerApproved, bool sellerApproved, string status)',
    ];

    const wallet = blockchainConfig.privateKey
      ? new ethers.Wallet(blockchainConfig.privateKey, this.provider)
      : undefined;

    this.escrowContract = new ethers.Contract(
      blockchainConfig.escrowAddress,
      abi,
      wallet || this.provider
    );
  }

  async createEscrow(
    tableId: string,
    buyerAddress: string,
    sellerAddress: string,
    treasuryAddress: string,
    txOptions?: { gasLimit?: bigint }
  ): Promise<{ escrowAddress: string; txHash: string }> {
    if (!this.escrowContract) {
      throw new Error('Escrow service not initialized');
    }

    const table = await tableService.findById(tableId);
    if (!table) {
      throw new Error('Table not found');
    }

    const tableIdBytes = ethers.id(tableId); // Convert to bytes32
    const tx = await this.escrowContract.initializeForTable(
      tableIdBytes,
      buyerAddress,
      sellerAddress,
      treasuryAddress,
      txOptions || {}
    );

    const receipt = await tx.wait();
    const escrowAddress = await this.escrowContract.getAddress();

    // Store escrow address in table
    await tableService.setEscrowAddress(tableId, escrowAddress);

    // Log event
    await this.logEvent(tableId, 'created', '0', '0', receipt.hash);

    return { escrowAddress, txHash: receipt.hash };
  }

  async deposit(
    tableId: string,
    amount: string,
    txOptions?: { gasLimit?: bigint; value?: bigint }
  ): Promise<{ txHash: string }> {
    if (!this.escrowContract) {
      throw new Error('Escrow service not initialized');
    }

    const table = await tableService.findById(tableId);
    if (!table) {
      throw new Error('Table not found');
    }

    const tableIdBytes = ethers.id(tableId);
    const value = BigInt(amount);
    const fee = (value * BigInt(200)) / BigInt(10000); // 2%
    const total = value + fee;

    const tx = await this.escrowContract.deposit(tableIdBytes, {
      ...txOptions,
      value: total,
    });

    const receipt = await tx.wait();
    const feeStr = fee.toString();

    await this.logEvent(tableId, 'deposited', amount, feeStr, receipt.hash);

    return { txHash: receipt.hash };
  }

  async buyerApprove(
    tableId: string,
    txOptions?: { gasLimit?: bigint }
  ): Promise<{ txHash: string }> {
    if (!this.escrowContract) {
      throw new Error('Escrow service not initialized');
    }

    const tableIdBytes = ethers.id(tableId);
    const tx = await this.escrowContract.buyerApprove(tableIdBytes, txOptions);
    const receipt = await tx.wait();

    return { txHash: receipt.hash };
  }

  async sellerApprove(
    tableId: string,
    txOptions?: { gasLimit?: bigint }
  ): Promise<{ txHash: string }> {
    if (!this.escrowContract) {
      throw new Error('Escrow service not initialized');
    }

    const tableIdBytes = ethers.id(tableId);
    const tx = await this.escrowContract.sellerApprove(tableIdBytes, txOptions);
    const receipt = await tx.wait();

    return { txHash: receipt.hash };
  }

  async openDispute(
    tableId: string,
    txOptions?: { gasLimit?: bigint }
  ): Promise<{ txHash: string }> {
    if (!this.escrowContract) {
      throw new Error('Escrow service not initialized');
    }

    const tableIdBytes = ethers.id(tableId);
    const tx = await this.escrowContract.openDispute(tableIdBytes, txOptions);
    const receipt = await tx.wait();

    await this.logEvent(tableId, 'disputed', '0', '0', receipt.hash);

    return { txHash: receipt.hash };
  }

  async resolveDispute(
    tableId: string,
    releaseToSeller: boolean,
    txOptions?: { gasLimit?: bigint }
  ): Promise<{ txHash: string }> {
    if (!this.escrowContract) {
      throw new Error('Escrow service not initialized');
    }

    const tableIdBytes = ethers.id(tableId);
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

  async cancel(
    tableId: string,
    txOptions?: { gasLimit?: bigint }
  ): Promise<{ txHash: string }> {
    if (!this.escrowContract) {
      throw new Error('Escrow service not initialized');
    }

    const tableIdBytes = ethers.id(tableId);
    const tx = await this.escrowContract.cancel(tableIdBytes, txOptions);
    const receipt = await tx.wait();

    await this.logEvent(tableId, 'cancelled', '0', '0', receipt.hash);

    return { txHash: receipt.hash };
  }

  async getStatus(tableId: string): Promise<EscrowStatus> {
    if (!this.escrowContract) {
      throw new Error('Escrow service not initialized');
    }

    const tableIdBytes = ethers.id(tableId);
    const [amount, fee, buyer, seller, buyerApproved, sellerApproved, status] =
      await this.escrowContract.getStatus(tableIdBytes);

    return {
      tableId,
      amount: amount.toString(),
      fee: fee.toString(),
      buyerApproved,
      sellerApproved,
      released: status === 'released',
      cancelled: status === 'cancelled',
      disputed: status === 'disputed',
    };
  }

  private async logEvent(
    tableId: string,
    eventType: EscrowEventType,
    amount: string,
    fee: string,
    txHash: string
  ): Promise<void> {
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
  }
}

export const escrowService = new EscrowService();
