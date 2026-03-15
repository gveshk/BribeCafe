import { expect } from "chai";

describe("Escrow", function () {
  let escrow: any;
  let owner: any, buyer: any, seller: any, treasury: any;
  let TABLE_ID: string;

  before(async function () {
    this.timeout(60000);
    const { ethers } = await import("hardhat");
    TABLE_ID = ethers.keccak256(ethers.toUtf8Bytes("test-table-1"));
  });

  beforeEach(async function () {
    this.timeout(60000);
    const { ethers } = await import("hardhat");
    [owner, buyer, seller, treasury] = await ethers.getSigners();

    const Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy();
    await escrow.waitForDeployment();

    await escrow.initializeForTable(
      TABLE_ID,
      buyer.address,
      seller.address,
      treasury.address
    );
  });

  describe("Initialization", () => {
    it("should set correct buyer and seller", async function () {
      const status = await escrow.getStatus(TABLE_ID);
      expect(status.buyer).to.equal(buyer.address);
      expect(status.seller).to.equal(seller.address);
    });

    it("should start with zero amount", async function () {
      const status = await escrow.getStatus(TABLE_ID);
      expect(status.amount).to.equal(0n);
    });

    it("should have Active status", async function () {
      const status = await escrow.getStatus(TABLE_ID);
      expect(status.status).to.equal("active");
    });
  });

  describe("Deposits", () => {
    it("should accept deposit from buyer", async function () {
      const { ethers } = await import("hardhat");
      const depositAmount = ethers.parseEther("1");
      await escrow.connect(buyer).deposit(TABLE_ID, { value: depositAmount });
      const status = await escrow.getStatus(TABLE_ID);
      expect(status.amount).to.equal(depositAmount);
    });

    it("should reject deposit from non-buyer", async function () {
      const { ethers } = await import("hardhat");
      await expect(
        escrow.connect(seller).deposit(TABLE_ID, { value: ethers.parseEther("1") })
      ).to.be.reverted;
    });
  });

  describe("Approvals and Release", () => {
    beforeEach(async function () {
      const { ethers } = await import("hardhat");
      await escrow.connect(buyer).deposit(TABLE_ID, { value: ethers.parseEther("1") });
    });

    it("should allow buyer to approve", async function () {
      await escrow.connect(buyer).buyerApprove(TABLE_ID);
      const status = await escrow.getStatus(TABLE_ID);
      expect(status.buyerApproved).to.be.true;
    });

    it("should release funds when both approve", async function () {
      await escrow.connect(buyer).buyerApprove(TABLE_ID);
      await escrow.connect(seller).sellerApprove(TABLE_ID);
      const status = await escrow.getStatus(TABLE_ID);
      expect(status.status).to.equal("released");
    });
  });

  describe("Cancellations", () => {
    beforeEach(async function () {
      const { ethers } = await import("hardhat");
      await escrow.connect(buyer).deposit(TABLE_ID, { value: ethers.parseEther("1") });
    });

    it("should allow buyer to cancel", async function () {
      await escrow.connect(buyer).cancel(TABLE_ID);
      const status = await escrow.getStatus(TABLE_ID);
      expect(status.status).to.equal("cancelled");
    });
  });
});
