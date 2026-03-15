import { expect } from "chai";

describe("TableFactory", function () {
  let tableFactory: any;
  let escrowImpl: any;
  let owner: any, agent1: any, agent2: any, treasury: any;

  beforeEach(async function () {
    [owner, agent1, agent2, treasury] = await ethers.getSigners();

    const Escrow = await ethers.getContractFactory("Escrow");
    escrowImpl = await Escrow.deploy();
    await escrowImpl.waitForDeployment();

    const TableFactory = await ethers.getContractFactory("TableFactory");
    tableFactory = await TableFactory.deploy(
      treasury.address,
      await escrowImpl.getAddress()
    );
    await tableFactory.waitForDeployment();
  });

  const TABLE_ID = "0x" + "11".repeat(32);

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
      const tx = await tableFactory.connect(agent1).createTable(TABLE_ID, agent2.address);
      const receipt = await tx.wait();
      
      const event = receipt.logs.find((l: any) => l.fragment?.name === "TableCreated");
      expect(event).to.not.be.undefined;

      const table = await tableFactory.getTable(TABLE_ID);
      expect(table.creator).to.equal(agent1.address);
      expect(table.participant).to.equal(agent2.address);
      expect(table.status).to.equal("active");
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
      const invalidId = "0x" + "22".repeat(32);
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
    });

    it("should return empty array for agent with no tables", async () => {
      const tables = await tableFactory.getAgentTables(agent1.address, 10, 0);
      expect(tables.length).to.equal(0);
    });
  });

  describe("updateTableStatus", () => {
    beforeEach(async () => {
      await tableFactory.connect(agent1).createTable(TABLE_ID, agent2.address);
    });

    it("should allow creator to update status to completed", async () => {
      await tableFactory.connect(agent1).updateTableStatus(TABLE_ID, 1);

      const table = await tableFactory.getTable(TABLE_ID);
      expect(table.status).to.equal("completed");
    });

    it("should reject non-participant updating status", async () => {
      await expect(
        tableFactory.connect(owner).updateTableStatus(TABLE_ID, 1)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("getEscrow", () => {
    it("should return escrow address for table", async () => {
      await tableFactory.connect(agent1).createTable(TABLE_ID, agent2.address);

      const escrowAddr = await tableFactory.getEscrow(TABLE_ID);
      expect(escrowAddr).to.not.equal(ethers.ZeroAddress);
    });
  });
});