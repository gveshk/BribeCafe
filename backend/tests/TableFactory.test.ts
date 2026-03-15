import { expect } from "chai";

describe("TableFactory", function () {
  let tableFactory: any;
  let escrowImpl: any;
  let owner: any, agent1: any, agent2: any, treasury: any;
  let TABLE_ID: string;

  before(async function () {
    const { ethers } = await import("hardhat");
    TABLE_ID = ethers.keccak256(ethers.toUtf8Bytes("test-table-1"));
  });

  beforeEach(async function () {
    const { ethers } = await import("hardhat");
    [owner, agent1, agent2, treasury] = await ethers.getSigners();

    const Escrow = await ethers.getContractFactory("Escrow");
    escrowImpl = await Escrow.deploy();
    await escrowImpl.waitForDeployment();

    const TableFactory = await ethers.getContractFactory("TableFactory");
    tableFactory = await TableFactory.deploy(await escrowImpl.getAddress());
    await tableFactory.waitForDeployment();
  });

  describe("Create Table", () => {
    it("should create a new table", async function () {
      const tx = await tableFactory.createTable(agent1.address, agent2.address);
      const receipt = await tx.wait();
      const tableId = receipt.logs[0].args[0];
      expect(tableId).to.not.be.undefined;
    });
  });
});
