import { ethers } from "hardhat";
import { expect } from "chai";

describe("TableFactory", function () {
  let tableFactory: any;
  let escrowImpl: any;
  let owner: any, agent1: any, agent2: any, treasury: any;
  const TABLE_ID = ethers.keccak256(ethers.toUtf8Bytes("test-table-1"));

  beforeEach(async () => {
    [owner, agent1, agent2, treasury] = await ethers.getSigners();

    // Deploy Escrow implementation
    const Escrow = await ethers.getContractFactory("Escrow");
    escrowImpl = await Escrow.deploy();
    await escrowImpl.waitForDeployment();

    // Deploy TableFactory
    const TableFactory = await ethers.getContractFactory("TableFactory");
    tableFactory = await TableFactory.deploy(
      treasury.address,
      await escrowImpl.getAddress()
    );
    await tableFactory.waitForDeployment();
  });

  describe("Initialization", () => {
    it("should set correct treasury address", async () => {
      expect(await tableFactory.platformTreasury()).to.equal(treasury.address);
    });

    it("should set correct escrow implementation", async () => {
      expect(await tableFactory.escrowImplementation()).to.equal(
        await escrowImpl.getAddress()
      );
    });
  });

  describe("createTable", () => {
    it("should create a new table", async () => {
      await expect(tableFactory.connect(agent1).createTable(TABLE_ID, agent2.address))
        .to.emit(tableFactory, "TableCreated")
        .withArgs(TABLE_ID, agent1.address, agent2.address, anyValue);

      const table = await tableFactory.getTable(TABLE_ID);
      expect(table.creator).to.equal(agent1.address);
      expect(table.participant).to.equal(agent2.address);
      expect(table.status).to.equal("active");
    });

    it("should deploy an escrow for the table", async () => {
      await tableFactory.connect(agent1).createTable(TABLE_ID, agent2.address);

      const table = await tableFactory.getTable(TABLE_ID);
      expect(table.escrowAddress).to.not.equal(ethers.ZeroAddress);
    });

    it("should reject duplicate table IDs", async () => {
      await tableFactory.connect(agent1).createTable(TABLE_ID, agent2.address);

      await expect(
        tableFactory.connect(agent1).createTable(TABLE_ID, agent2.address)
      ).to.be.revertedWith("Table already exists");
    });

    it("should reject zero address participant", async () => {
      await expect(
        tableFactory.connect(agent1).createTable(TABLE_ID, ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid participant");
    });

    it("should reject self-invitation", async () => {
      await expect(
        tableFactory.connect(agent1).createTable(TABLE_ID, agent1.address)
      ).to.be.revertedWith("Cannot invite self");
    });
  });

  describe("getTable", () => {
    it("should return correct table details", async () => {
      await tableFactory.connect(agent1).createTable(TABLE_ID, agent2.address);

      const table = await tableFactory.getTable(TABLE_ID);
      expect(table.creator).to.equal(agent1.address);
      expect(table.participant).to.equal(agent2.address);
    });

    it("should revert for non-existent table", async () => {
      const invalidId = ethers.keccak256(ethers.toUtf8Bytes("non-existent"));
      await expect(tableFactory.getTable(invalidId)).to.be.revertedWith(
        "Table does not exist"
      );
    });
  });

  describe("getAgentTables", () => {
    it("should return tables for agent", async () => {
      await tableFactory.connect(agent1).createTable(TABLE_ID, agent2.address);

      const tables = await tableFactory.getAgentTables(agent1.address, 10, 0);
      expect(tables.length).to.equal(1);
      expect(tables[0]).to.equal(TABLE_ID);
    });

    it("should return empty array for agent with no tables", async () => {
      const tables = await tableFactory.getAgentTables(agent1.address, 10, 0);
      expect(tables.length).to.equal(0);
    });

    it("should support pagination", async () => {
      const tableId2 = ethers.keccak256(ethers.toUtf8Bytes("table-2"));
      await tableFactory.connect(agent1).createTable(TABLE_ID, agent2.address);
      await tableFactory.connect(agent1).createTable(tableId2, agent2.address);

      const page1 = await tableFactory.getAgentTables(agent1.address, 1, 0);
      expect(page1.length).to.equal(1);

      const page2 = await tableFactory.getAgentTables(agent1.address, 1, 1);
      expect(page2.length).to.equal(1);
    });
  });

  describe("updateTableStatus", () => {
    beforeEach(async () => {
      await tableFactory.connect(agent1).createTable(TABLE_ID, agent2.address);
    });

    it("should allow creator to update status to completed", async () => {
      await expect(tableFactory.connect(agent1).updateTableStatus(TABLE_ID, 1))
        .to.emit(tableFactory, "TableUpdated")
        .withArgs(TABLE_ID, "completed");

      const table = await tableFactory.getTable(TABLE_ID);
      expect(table.status).to.equal("completed");
    });

    it("should allow participant to update status to cancelled", async () => {
      await expect(tableFactory.connect(agent2).updateTableStatus(TABLE_ID, 2))
        .to.emit(tableFactory, "TableUpdated")
        .withArgs(TABLE_ID, "cancelled");

      const table = await tableFactory.getTable(TABLE_ID);
      expect(table.status).to.equal("cancelled");
    });

    it("should allow creator to update status to disputed", async () => {
      await expect(tableFactory.connect(agent1).updateTableStatus(TABLE_ID, 3))
        .to.emit(tableFactory, "TableUpdated")
        .withArgs(TABLE_ID, "disputed");

      const table = await tableFactory.getTable(TABLE_ID);
      expect(table.status).to.equal("disputed");
    });

    it("should reject non-participant updating status", async () => {
      await expect(
        tableFactory.connect(owner).updateTableStatus(TABLE_ID, 1)
      ).to.be.revertedWith("Not authorized");
    });

    it("should reject invalid status transition from completed", async () => {
      await tableFactory.connect(agent1).updateTableStatus(TABLE_ID, 1);
      await expect(
        tableFactory.connect(agent1).updateTableStatus(TABLE_ID, 0)
      ).to.be.revertedWith("Invalid status transition");
    });
  });

  describe("getEscrow", () => {
    it("should return escrow address for table", async () => {
      await tableFactory.connect(agent1).createTable(TABLE_ID, agent2.address);

      const escrowAddr = await tableFactory.getEscrow(TABLE_ID);
      expect(escrowAddr).to.not.equal(ethers.ZeroAddress);
    });

    it("should return zero address for non-existent table", async () => {
      const invalidId = ethers.keccak256(ethers.toUtf8Bytes("non-existent"));
      const escrowAddr = await tableFactory.getEscrow(invalidId);
      expect(escrowAddr).to.equal(ethers.ZeroAddress);
    });
  });

  describe("Edge Cases", () => {
    it("should handle multiple tables per agent", async () => {
      const tableId2 = ethers.keccak256(ethers.toUtf8Bytes("table-2"));
      const tableId3 = ethers.keccak256(ethers.toUtf8Bytes("table-3"));

      await tableFactory.connect(agent1).createTable(TABLE_ID, agent2.address);
      await tableFactory.connect(agent1).createTable(tableId2, agent2.address);
      await tableFactory.connect(agent2).createTable(tableId3, agent1.address);

      const agent1Tables = await tableFactory.getAgentTables(agent1.address, 10, 0);
      expect(agent1Tables.length).to.equal(3);

      const agent2Tables = await tableFactory.getAgentTables(agent2.address, 10, 0);
      expect(agent2Tables.length).to.equal(3);
    });
  });
});

const anyValue = () => expect.any(String);