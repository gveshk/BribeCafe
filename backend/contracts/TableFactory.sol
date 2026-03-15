// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Import Zama FHE library - using placeholder for now
// In production, use: import "@fhevm/lib/TFHE.sol";

import "./Escrow.sol";

/**
 * @title TableFactory
 * @dev Creates and manages deal tables between agents
 */
contract TableFactory {
    // Events
    event TableCreated(
        bytes32 indexed tableId,
        address indexed creator,
        address indexed participant,
        uint256 createdAt
    );
    event TableUpdated(bytes32 indexed tableId, string status);
    event ParticipantInvited(
        bytes32 indexed tableId,
        address indexed participant
    );

    // Constants
    uint256 public constant FEE_PERCENT = 200; // 2% in basis points

    // State
    mapping(bytes32 => Table) public tables;
    mapping(address => bytes32[]) public agentTables;
    mapping(bytes32 => address) public escrows;
    
    address public platformTreasury;
    address public escrowImplementation;

    // Enums
    enum TableStatus {
        Active,
        Completed,
        Cancelled,
        Disputed
    }

    // Structs
    struct Table {
        bytes32 id;
        address creator;
        address participant;
        TableStatus status;
        address escrowAddress;
        uint256 createdAt;
        uint256 updatedAt;
    }

    // Modifiers
    modifier onlyTableParticipant(bytes32 tableId) {
        require(
            tables[tableId].creator == msg.sender ||
                tables[tableId].participant == msg.sender,
            "Not authorized"
        );
        _;
    }

    modifier tableExists(bytes32 tableId) {
        require(tables[tableId].createdAt != 0, "Table does not exist");
        _;
    }

    // Constructor
    constructor(address _treasury, address _escrowImplementation) {
        platformTreasury = _treasury;
        escrowImplementation = _escrowImplementation;
    }

    // External functions

    /**
     * @notice Create a new table for agent-to-agent negotiation
     * @param tableId Unique table identifier
     * @param participant Address of the other agent
     */
    function createTable(
        bytes32 tableId,
        address participant
    ) external returns (bytes32) {
        require(tables[tableId].createdAt == 0, "Table already exists");
        require(participant != address(0), "Invalid participant");
        require(participant != msg.sender, "Cannot invite self");

        // Create escrow for this table
        address payable escrowAddr = createEscrow();
        escrows[tableId] = escrowAddr;
        
        // Initialize escrow
        Escrow(escrowAddr).initialize(msg.sender, participant, platformTreasury);

        // Create table
        tables[tableId] = Table({
            id: tableId,
            creator: msg.sender,
            participant: participant,
            status: TableStatus.Active,
            escrowAddress: escrowAddr,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        // Track tables for each agent
        agentTables[msg.sender].push(tableId);
        agentTables[participant].push(tableId);

        emit TableCreated(tableId, msg.sender, participant, block.timestamp);

        return tableId;
    }

    /**
     * @notice Get table details
     * @param tableId Table identifier
     */
    function getTable(
        bytes32 tableId
    )
        external
        view
        tableExists(tableId)
        returns (
            address creator,
            address participant,
            string memory status,
            address escrowAddress,
            uint256 createdAt,
            uint256 updatedAt
        )
    {
        Table storage table = tables[tableId];
        return (
            table.creator,
            table.participant,
            _statusToString(table.status),
            table.escrowAddress,
            table.createdAt,
            table.updatedAt
        );
    }

    /**
     * @notice Get tables for an agent
     * @param agent Agent address
     * @param limit Max results
     * @param offset Starting index
     */
    function getAgentTables(
        address agent,
        uint256 limit,
        uint256 offset
    ) external view returns (bytes32[] memory) {
        bytes32[] storage allTables = agentTables[agent];
        uint256 total = allTables.length;
        
        if (offset >= total) {
            return new bytes32[](0);
        }
        
        uint256 resultLength = limit;
        if (offset + limit > total) {
            resultLength = total - offset;
        }
        
        bytes32[] memory result = new bytes32[](resultLength);
        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = allTables[offset + i];
        }
        
        return result;
    }

    /**
     * @notice Update table status
     * @param tableId Table identifier
     * @param newStatus New status
     */
    function updateTableStatus(
        bytes32 tableId,
        TableStatus newStatus
    ) external onlyTableParticipant(tableId) {
        Table storage table = tables[tableId];
        
        // Status transition validation
        if (table.status == TableStatus.Active) {
            require(
                newStatus == TableStatus.Completed ||
                    newStatus == TableStatus.Cancelled ||
                    newStatus == TableStatus.Disputed,
                "Invalid status transition"
            );
        }
        
        table.status = newStatus;
        table.updatedAt = block.timestamp;
        
        emit TableUpdated(tableId, _statusToString(newStatus));
    }

    /**
     * @notice Get escrow address for a table
     * @param tableId Table identifier
     */
    function getEscrow(bytes32 tableId) external view returns (address) {
        return escrows[tableId];
    }

    // Internal functions

    function createEscrow() internal returns (address payable) {
        // Create minimal proxy to Escrow implementation
        bytes32 salt = keccak256(abi.encodePacked(block.timestamp, msg.sender));
        address payable escrowAddr;
        address impl = escrowImplementation;
        assembly {
            let ptr := mload(0x40)
            mstore(ptr, 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000)
            mstore(add(ptr, 0x0d), shl(0x60, impl))
            mstore(add(ptr, 0x1d), shl(0x60, salt))
            escrowAddr := create2(0, ptr, 0x37, salt)
        }
        return escrowAddr;
    }

    function _statusToString(
        TableStatus status
    ) internal pure returns (string memory) {
        if (status == TableStatus.Active) return "active";
        if (status == TableStatus.Completed) return "completed";
        if (status == TableStatus.Cancelled) return "cancelled";
        if (status == TableStatus.Disputed) return "disputed";
        return "unknown";
    }
}
