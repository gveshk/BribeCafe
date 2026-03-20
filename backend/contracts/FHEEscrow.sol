// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {TFHE, ebool, euint64} from "fhevm/lib/TFHE.sol";

/**
 * @title FHEEscrow
 * @dev Escrow contract with Fully Homomorphic Encryption (FHE)
 * @notice All amounts are encrypted on-chain
 */
contract FHEEscrow {
    // Events
    event EscrowCreated(
        bytes32 indexed tableId,
        address indexed buyer,
        address indexed seller,
        address treasury
    );
    event Deposited(
        bytes32 indexed tableId,
        address indexed buyer,
        uint256 timestamp
    );
    event BuyerApproved(bytes32 indexed tableId, address buyer);
    event SellerApproved(bytes32 indexed tableId, address seller);
    event Released(
        bytes32 indexed tableId,
        address seller,
        uint256 timestamp
    );
    event Cancelled(bytes32 indexed tableId, address buyer);
    event DisputeOpened(bytes32 indexed tableId, address indexed opener);
    event DisputeResolved(
        bytes32 indexed tableId,
        bool releaseToSeller,
        address resolver
    );

    // Constants
    uint64 public constant FEE_PERCENT = 200; // 2%
    uint64 public constant BASIS_POINTS = 10000;

    // State
    mapping(bytes32 => EscrowState) public escrows;
    mapping(bytes32 => address) public buyerAddresses;
    mapping(bytes32 => address) public sellerAddresses;

    // Enums
    enum EscrowStatus {
        None,
        Created,
        Deposited,
        Released,
        Cancelled,
        Disputed
    }

    // Structs
    struct EscrowState {
        euint64 amount;
        euint64 fee;
        address treasury;
        bool buyerApproved;
        bool sellerApproved;
        EscrowStatus status;
    }

    /**
     * @dev Create escrow
     */
    function createEscrow(
        bytes32 tableId,
        address buyer,
        address seller,
        address treasury
    ) external {
        require(escrows[tableId].status == EscrowStatus.None, "Exists");
        
        buyerAddresses[tableId] = buyer;
        sellerAddresses[tableId] = seller;
        
        escrows[tableId] = EscrowState({
            amount: euint64.wrap(0),
            fee: euint64.wrap(0),
            treasury: treasury,
            buyerApproved: false,
            sellerApproved: false,
            status: EscrowStatus.Created
        });
        
        emit EscrowCreated(tableId, buyer, seller, treasury);
    }

    /**
     * @dev Deposit (client encrypts amount before sending)
     */
    function deposit(
        bytes32 tableId,
        euint64 encryptedAmount
    ) external payable {
        EscrowState storage escrow = escrows[tableId];
        require(escrow.status == EscrowStatus.Created || escrow.status == EscrowStatus.Deposited, "Invalid");
        require(msg.sender == buyerAddresses[tableId], "Only buyer");
        
        // Add to amount
        if (escrow.status == EscrowStatus.Created) {
            escrow.amount = encryptedAmount;
        } else {
            escrow.amount = TFHE.add(escrow.amount, encryptedAmount);
        }
        
        // Calculate 2% fee
        euint64 feeCalc = TFHE.mul(escrow.amount, FEE_PERCENT);
        escrow.fee = TFHE.div(feeCalc, BASIS_POINTS);
        
        escrow.status = EscrowStatus.Deposited;
        
        emit Deposited(tableId, msg.sender, block.timestamp);
    }

    /**
     * @dev Buyer approves
     */
    function buyerApprove(bytes32 tableId) external {
        require(msg.sender == buyerAddresses[tableId], "Only buyer");
        EscrowState storage escrow = escrows[tableId];
        require(escrow.status == EscrowStatus.Deposited, "Not deposited");
        
        escrow.buyerApproved = true;
        
        emit BuyerApproved(tableId, msg.sender);
    }

    /**
     * @dev Seller approves
     */
    function sellerApprove(bytes32 tableId) external {
        require(msg.sender == sellerAddresses[tableId], "Only seller");
        EscrowState storage escrow = escrows[tableId];
        require(escrow.status == EscrowStatus.Deposited, "Not deposited");
        
        escrow.sellerApproved = true;
        
        emit SellerApproved(tableId, msg.sender);
    }

    /**
     * @dev Release funds
     */
    function release(bytes32 tableId) external {
        EscrowState storage escrow = escrows[tableId];
        require(escrow.status == EscrowStatus.Deposited, "Not deposited");
        require(escrow.buyerApproved && escrow.sellerApproved, "Need both approval");
        
        escrow.status = EscrowStatus.Released;
        
        emit Released(tableId, sellerAddresses[tableId], block.timestamp);
    }

    /**
     * @dev Open dispute
     */
    function openDispute(bytes32 tableId) external {
        require(
            msg.sender == buyerAddresses[tableId] || msg.sender == sellerAddresses[tableId],
            "Only participant"
        );
        EscrowState storage escrow = escrows[tableId];
        require(escrow.status == EscrowStatus.Deposited, "Not deposited");
        
        escrow.status = EscrowStatus.Disputed;
        
        emit DisputeOpened(tableId, msg.sender);
    }

    /**
     * @dev Resolve dispute
     */
    function resolveDispute(bytes32 tableId, bool releaseToSeller) external {
        EscrowState storage escrow = escrows[tableId];
        require(escrow.status == EscrowStatus.Disputed, "Not disputed");
        
        if (releaseToSeller) {
            escrow.status = EscrowStatus.Released;
            emit Released(tableId, sellerAddresses[tableId], block.timestamp);
        } else {
            escrow.status = EscrowStatus.Cancelled;
            emit Cancelled(tableId, buyerAddresses[tableId]);
        }
        
        emit DisputeResolved(tableId, releaseToSeller, msg.sender);
    }

    /**
     * @dev Cancel
     */
    function cancel(bytes32 tableId) external {
        require(msg.sender == buyerAddresses[tableId], "Only buyer");
        EscrowState storage escrow = escrows[tableId];
        require(escrow.status == EscrowStatus.Deposited, "Not deposited");
        require(!escrow.buyerApproved && !escrow.sellerApproved, "Already approved");
        
        escrow.status = EscrowStatus.Cancelled;
        
        emit Cancelled(tableId, msg.sender);
    }

    /**
     * @dev Get status
     */
    function getStatus(bytes32 tableId) external view returns (EscrowStatus) {
        return escrows[tableId].status;
    }
}
