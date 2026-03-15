// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Escrow
 * @dev Handles secure fund holding with fee calculation
 * @notice This is a placeholder - real implementation uses Zama FHE
 */
contract Escrow {
    // Events
    event Deposited(
        bytes32 indexed tableId,
        address indexed buyer,
        uint256 amount,
        uint256 fee,
        uint256 timestamp
    );
    event BuyerApproved(bytes32 indexed tableId, address buyer);
    event SellerApproved(bytes32 indexed tableId, address seller);
    event Released(
        bytes32 indexed tableId,
        address seller,
        uint256 amount,
        uint256 fee,
        uint256 timestamp
    );
    event Cancelled(bytes32 indexed tableId, address buyer, uint256 amount);
    event DisputeOpened(
        bytes32 indexed tableId,
        address indexed opener,
        uint256 timestamp
    );
    event DisputeResolved(
        bytes32 indexed tableId,
        bool releaseToSeller,
        address resolver,
        uint256 timestamp
    );

    // Constants
    uint256 public constant FEE_PERCENT = 200; // 2% in basis points
    uint256 public constant BASIS_POINTS = 10000;

    // State
    mapping(bytes32 => EscrowState) public escrows;

    // Enums
    enum EscrowStatus {
        Active,
        Released,
        Cancelled,
        Disputed
    }

    // Structs
    struct EscrowState {
        uint256 amount;        // Total amount deposited
        uint256 fee;           // Platform fee (2%)
        address buyer;         // Who deposited
        address seller;        // Who receives
        address platformTreasury; // BribeCafe treasury
        bool buyerApproved;    // Buyer signed for release
        bool sellerApproved;   // Seller signed for release
        EscrowStatus status;   // Current status
    }

    // Modifiers
    modifier onlyBuyer(bytes32 tableId) {
        require(msg.sender == escrows[tableId].buyer, "Only buyer allowed");
        _;
    }

    modifier onlySeller(bytes32 tableId) {
        require(msg.sender == escrows[tableId].seller, "Only seller allowed");
        _;
    }

    modifier onlyParticipant(bytes32 tableId) {
        require(
            msg.sender == escrows[tableId].buyer ||
                msg.sender == escrows[tableId].seller,
            "Not authorized"
        );
        _;
    }

    modifier onlyActive(bytes32 tableId) {
        require(
            escrows[tableId].status == EscrowStatus.Active,
            "Escrow not active"
        );
        _;
    }

    // External functions

    /**
     * @notice Initialize escrow for a table
     */
    function initialize(
        address buyer,
        address seller,
        address treasury
    ) external {
        // Only allow initialization via factory
        require(escrows[bytes32(0)].platformTreasury == address(0), "Already initialized");
        
        // Store treasury address in slot 0 to mark as initialized
        EscrowState storage state = escrows[bytes32(0)];
        state.platformTreasury = treasury;
    }

    /**
     * @notice Initialize escrow for a specific table
     * @dev Called by TableFactory
     */
    function initializeForTable(
        bytes32 tableId,
        address buyer,
        address seller,
        address treasury
    ) external {
        require(escrows[tableId].buyer == address(0), "Already initialized");
        
        escrows[tableId] = EscrowState({
            amount: 0,
            fee: 0,
            buyer: buyer,
            seller: seller,
            platformTreasury: treasury,
            buyerApproved: false,
            sellerApproved: false,
            status: EscrowStatus.Active
        });
    }

    /**
     * @notice Deposit funds into escrow
     * @param tableId Table identifier
     */
    function deposit(bytes32 tableId) external payable onlyBuyer(tableId) onlyActive(tableId) {
        require(msg.value > 0, "Must send value");

        EscrowState storage escrow = escrows[tableId];
        
        // Calculate 2% fee
        uint256 feeAmount = (msg.value * FEE_PERCENT) / BASIS_POINTS;
        uint256 sellerAmount = msg.value - feeAmount;
        
        escrow.amount += msg.value;
        escrow.fee += feeAmount;
        
        emit Deposited(tableId, msg.sender, msg.value, feeAmount, block.timestamp);
    }

    /**
     * @notice Buyer approves release of funds
     * @param tableId Table identifier
     */
    function buyerApprove(bytes32 tableId) external onlyBuyer(tableId) onlyActive(tableId) {
        EscrowState storage escrow = escrows[tableId];
        require(!escrow.buyerApproved, "Already approved");
        
        escrow.buyerApproved = true;
        
        emit BuyerApproved(tableId, msg.sender);
        
        // If both approved, auto-release
        if (escrow.sellerApproved) {
            _release(tableId);
        }
    }

    /**
     * @notice Seller approves release of funds
     * @param tableId Table identifier
     */
    function sellerApprove(bytes32 tableId) external onlySeller(tableId) onlyActive(tableId) {
        EscrowState storage escrow = escrows[tableId];
        require(!escrow.sellerApproved, "Already approved");
        
        escrow.sellerApproved = true;
        
        emit SellerApproved(tableId, msg.sender);
        
        // If both approved, auto-release
        if (escrow.buyerApproved) {
            _release(tableId);
        }
    }

    /**
     * @notice Open a dispute
     * @param tableId Table identifier
     */
    function openDispute(bytes32 tableId) external onlyParticipant(tableId) onlyActive(tableId) {
        EscrowState storage escrow = escrows[tableId];
        
        escrow.status = EscrowStatus.Disputed;
        
        emit DisputeOpened(tableId, msg.sender, block.timestamp);
    }

    /**
     * @notice Resolve dispute
     * @param tableId Table identifier
     * @param releaseToSeller If true, funds go to seller; if false, refund buyer
     */
    function resolveDispute(
        bytes32 tableId,
        bool releaseToSeller
    ) external {
        EscrowState storage escrow = escrows[tableId];
        require(escrow.status == EscrowStatus.Disputed, "Not disputed");
        
        if (releaseToSeller) {
            // Release to seller (minus fee)
            uint256 sellerAmount = escrow.amount - escrow.fee;
            
            escrow.status = EscrowStatus.Released;
            
            payable(escrow.seller).transfer(sellerAmount);
            payable(escrow.platformTreasury).transfer(escrow.fee);
            
            emit Released(tableId, escrow.seller, sellerAmount, escrow.fee, block.timestamp);
        } else {
            // Refund buyer (but fee still goes to treasury)
            escrow.status = EscrowStatus.Cancelled;
            
            payable(escrow.buyer).transfer(escrow.amount - escrow.fee);
            payable(escrow.platformTreasury).transfer(escrow.fee);
            
            emit Cancelled(tableId, escrow.buyer, escrow.amount - escrow.fee);
        }
        
        emit DisputeResolved(tableId, releaseToSeller, msg.sender, block.timestamp);
    }

    /**
     * @notice Cancel and refund buyer (if seller doesn't deliver)
     * @param tableId Table identifier
     */
    function cancel(bytes32 tableId) external onlyBuyer(tableId) onlyActive(tableId) {
        EscrowState storage escrow = escrows[tableId];
        
        require(escrow.amount > 0, "No funds to refund");
        
        uint256 refundAmount = escrow.amount;
        
        escrow.status = EscrowStatus.Cancelled;
        
        // Refund buyer but fee still goes to treasury
        payable(escrow.buyer).transfer(refundAmount - escrow.fee);
        payable(escrow.platformTreasury).transfer(escrow.fee);
        
        emit Cancelled(tableId, escrow.buyer, refundAmount - escrow.fee);
    }

    /**
     * @notice Get escrow status
     * @param tableId Table identifier
     */
    function getStatus(
        bytes32 tableId
    )
        external
        view
        returns (
            uint256 amount,
            uint256 fee,
            address buyer,
            address seller,
            bool buyerApproved,
            bool sellerApproved,
            string memory status
        )
    {
        EscrowState storage escrow = escrows[tableId];
        
        return (
            escrow.amount,
            escrow.fee,
            escrow.buyer,
            escrow.seller,
            escrow.buyerApproved,
            escrow.sellerApproved,
            _statusToString(escrow.status)
        );
    }

    // Internal functions

    function _release(bytes32 tableId) internal {
        EscrowState storage escrow = escrows[tableId];
        
        require(escrow.buyerApproved && escrow.sellerApproved, "Need both approvals");
        
        uint256 sellerAmount = escrow.amount - escrow.fee;
        
        escrow.status = EscrowStatus.Released;
        
        // Transfer to seller (amount - fee)
        payable(escrow.seller).transfer(sellerAmount);
        
        // Transfer fee to treasury
        payable(escrow.platformTreasury).transfer(escrow.fee);
        
        emit Released(tableId, escrow.seller, sellerAmount, escrow.fee, block.timestamp);
    }

    function _statusToString(
        EscrowStatus status
    ) internal pure returns (string memory) {
        if (status == EscrowStatus.Active) return "active";
        if (status == EscrowStatus.Released) return "released";
        if (status == EscrowStatus.Cancelled) return "cancelled";
        if (status == EscrowStatus.Disputed) return "disputed";
        return "unknown";
    }

    // Allow receiving ETH
    receive() external payable {}
}
