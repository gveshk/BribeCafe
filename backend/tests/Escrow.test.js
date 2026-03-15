const { expect } = require("chai");
const ethers = require("ethers");

describe("Escrow", function () {
  let escrow;
  let owner, buyer, seller, treasury;
  let TABLE_ID;

  before(async function () {
    this.timeout(60000);
    TABLE_ID = ethers.keccak256(ethers.toUtf8Bytes("test-table-1"));
  });

  beforeEach(async function () {
    this.timeout(60000);
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
    it("should set correct buyer and seller", async () => {
      const status = await escrow.getStatus(TABLE_ID);
      expect(status.buyer).to.equal(buyer.address);
      expect(status.seller).to.equal(seller.address);
    });

    it("should start with zero amount", async () => {
      const status = await escrow.getStatus(TABLE_ID);
      expect(status.amount).to.equal(0);
    });

    it("should have Active status", async () => {
      const status = await escrow.getStatus(TABLE_ID);
      expect(status.status).to.equal("active");
    });
  });

  describe("Deposits", () => {
    it("should accept deposit from buyer", async () => {
      const depositAmount = ethers.parseEther("1");
      await escrow.connect(buyer).deposit(TABLE_ID, { value: depositAmount });
      const status = await escrow.getStatus(TABLE_ID);
      expect(status.amount).to.equal(depositAmount);
    });

    it("should reject deposit from non-buyer", async () => {
      await expect(
        escrow.connect(seller).deposit(TABLE_ID, { value: ethers.parseEther("1") })
      ).to.be.revertedWith("Only buyer allowed");
    });
  });

  describe("Approvals", () => {
    beforeEach(async () => {
      await escrow.connect(buyer).deposit(TABLE_ID, { value: ethers.parseEther("1") });
    });

    it("should allow buyer to approve", async () => {
      await escrow.connect(buyer).buyerApprove(TABLE_ID);
      const status = await escrow.getStatus(TABLE_ID);
      expect(status.buyerApproved).to.be.true;
    });

    it("should release funds when both approve", async () => {
      await escrow.connect(buyer).buyerApprove(TABLE_ID);
      await escrow.connect(seller).sellerApprove(TABLE_ID);
      const status = await escrow.getStatus(TABLE_ID);
      expect(status.status).to.equal("released");
    });
  });

  describe("Disputes", () => {
    beforeEach(async () => {
      await escrow.connect(buyer).deposit(TABLE_ID, { value: ethers.parseEther("1") });
    });

    it("should allow buyer to open dispute", async () => {
      await escrow.connect(buyer).openDispute(TABLE_ID);
      const status = await escrow.getStatus(TABLE_ID);
      expect(status.status).to.equal("disputed");
    });
  });
});