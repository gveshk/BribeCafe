import { v4 as uuidv4 } from 'uuid';
import { ethers } from 'ethers';
import prisma from '../db/prisma';
import type { EscrowStatus, EscrowEventType } from '../types';
import { tableService } from './tableService';

const DEFAULT_REQUIRED_CONFIRMATIONS = 3;
const DEFAULT_SETTLEMENT_POLL_MS = 15000;

export class EscrowService {
  private provider: ethers.JsonRpcProvider | null = null;
  private escrowContract: ethers.Contract | null = null;
  private chainId: number | null = null;
  private settlementPoller: NodeJS.Timeout | null = null;

  async initialize(blockchainConfig: {
    rpcUrl: string;
    escrowAddress: string;
    privateKey?: string;
  }): Promise<void> {
    this.provider = new ethers.JsonRpcProvider(blockchainConfig.rpcUrl);

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

    const network = await this.provider.getNetwork();
    this.chainId = Number(network.chainId);
    this.startSettlementPoller();
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

    const tableIdBytes = ethers.id(tableId);
    const result = await this.executeEscrowTransaction(
      tableId,
      'created',
      '0',
      '0',
      () => this.escrowContract!.initializeForTable(
        tableIdBytes,
        buyerAddress,
        sellerAddress,
        treasuryAddress,
        txOptions || {}
      )
    );

    const escrowAddress = await this.escrowContract.getAddress();
    await tableService.setEscrowAddress(tableId, escrowAddress);

    return { escrowAddress, txHash: result.txHash };
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
    const fee = ((value * BigInt(200)) / BigInt(10000)).toString();

    return this.executeEscrowTransaction(
      tableId,
      'deposited',
      amount,
      fee,
      () => this.escrowContract!.deposit(tableIdBytes, {
        ...txOptions,
        value: value + BigInt(fee),
      })
    );
  }

  async buyerApprove(
    tableId: string,
    txOptions?: { gasLimit?: bigint }
  ): Promise<{ txHash: string }> {
    if (!this.escrowContract) {
      throw new Error('Escrow service not initialized');
    }

    const tableIdBytes = ethers.id(tableId);
    return this.executeEscrowTransaction(
      tableId,
      'released',
      '0',
      '0',
      () => this.escrowContract!.buyerApprove(tableIdBytes, txOptions)
    );
  }

  async sellerApprove(
    tableId: string,
    txOptions?: { gasLimit?: bigint }
  ): Promise<{ txHash: string }> {
    if (!this.escrowContract) {
      throw new Error('Escrow service not initialized');
    }

    const tableIdBytes = ethers.id(tableId);
    return this.executeEscrowTransaction(
      tableId,
      'released',
      '0',
      '0',
      () => this.escrowContract!.sellerApprove(tableIdBytes, txOptions)
    );
  }

  async openDispute(
    tableId: string,
    txOptions?: { gasLimit?: bigint }
  ): Promise<{ txHash: string }> {
    if (!this.escrowContract) {
      throw new Error('Escrow service not initialized');
    }

    const tableIdBytes = ethers.id(tableId);
    return this.executeEscrowTransaction(
      tableId,
      'disputed',
      '0',
      '0',
      () => this.escrowContract!.openDispute(tableIdBytes, txOptions)
    );
  }

  async cancel(
    tableId: string,
    txOptions?: { gasLimit?: bigint }
  ): Promise<{ txHash: string }> {
    if (!this.escrowContract) {
      throw new Error('Escrow service not initialized');
    }

    const tableIdBytes = ethers.id(tableId);
    return this.executeEscrowTransaction(
      tableId,
      'cancelled',
      '0',
      '0',
      () => this.escrowContract!.cancel(tableIdBytes, txOptions)
    );
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
      buyerAddress: buyer,
      sellerAddress: seller,
      status,
      buyerApproved,
      sellerApproved,
      released: status === 'released',
      cancelled: status === 'cancelled',
      disputed: status === 'disputed',
    };
  }

  async getLatestEvent(tableId: string): Promise<{
    txHash: string | null;
    eventType: string;
    chainId: number | null;
    confirmations: number;
    settlementStatus: string;
    failureReason: string | null;
  } | null> {
    const event = await prisma.escrowEvent.findFirst({
      where: { tableId },
      orderBy: { createdAt: 'desc' },
      select: {
        txHash: true,
        eventType: true,
        chainId: true,
        confirmations: true,
        settlementStatus: true,
        failureReason: true,
      },
    });

    if (!event) {
      return null;
    }

    return event;
  }

  private async executeEscrowTransaction(
    tableId: string,
    eventType: EscrowEventType,
    amount: string,
    fee: string,
    submit: () => Promise<ethers.TransactionResponse>
  ): Promise<{ txHash: string }> {
    try {
      const tx = await submit();
      await this.logEvent({
        tableId,
        eventType,
        amount,
        fee,
        txHash: tx.hash,
        chainId: this.chainId,
        confirmations: 0,
        settlementStatus: 'pending',
      });

      return { txHash: tx.hash };
    } catch (error: any) {
      await this.logEvent({
        tableId,
        eventType,
        amount,
        fee,
        txHash: null,
        chainId: this.chainId,
        confirmations: 0,
        settlementStatus: 'failed',
        failureReason: error?.shortMessage || error?.message || 'Unknown transaction failure',
      });
      throw error;
    }
  }

  private startSettlementPoller(): void {
    if (this.settlementPoller) {
      clearInterval(this.settlementPoller);
    }

    this.settlementPoller = setInterval(() => {
      this.reconcilePendingTransactions().catch(() => {
        // noop
      });
    }, DEFAULT_SETTLEMENT_POLL_MS);
  }

  async reconcilePendingTransactions(): Promise<void> {
    if (!this.provider) {
      return;
    }

    const pendingEvents = await prisma.escrowEvent.findMany({
      where: {
        settlementStatus: 'pending',
        txHash: { not: null },
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    if (pendingEvents.length === 0) {
      return;
    }

    const latestBlock = await this.provider.getBlockNumber();

    for (const event of pendingEvents) {
      if (!event.txHash) continue;

      const receipt = await this.provider.getTransactionReceipt(event.txHash);
      if (!receipt) continue;

      const confirmations = Math.max(latestBlock - receipt.blockNumber + 1, 0);
      const isFailed = receipt.status === 0;
      const isFinalized = confirmations >= DEFAULT_REQUIRED_CONFIRMATIONS;

      await prisma.escrowEvent.update({
        where: { id: event.id },
        data: {
          confirmations,
          settlementStatus: isFailed ? 'failed' : (isFinalized ? 'finalized' : 'pending'),
          failureReason: isFailed ? 'Transaction reverted on-chain' : null,
          finalizedAt: isFailed || isFinalized ? new Date() : null,
        },
      });
    }
  }

  private async logEvent(input: {
    tableId: string;
    eventType: EscrowEventType;
    amount: string;
    fee: string;
    txHash: string | null;
    chainId: number | null;
    confirmations: number;
    settlementStatus: string;
    failureReason?: string;
  }): Promise<void> {
    await prisma.escrowEvent.create({
      data: {
        id: uuidv4(),
        tableId: input.tableId,
        eventType: input.eventType,
        amount: input.amount,
        fee: input.fee,
        txHash: input.txHash,
        chainId: input.chainId,
        confirmations: input.confirmations,
        settlementStatus: input.settlementStatus,
        failureReason: input.failureReason,
      },
    });
  }
}

export const escrowService = new EscrowService();
