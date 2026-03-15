import { ethers } from "ethers";
import { expect } from "chai";

describe("Escrow", function () {
  let escrow: any;
  let owner: any, buyer: any, seller: any, treasury: any;
  let TABLE_ID: string;

  before(async () => {
    TABLE_ID = ethers.keccak256(ethers.toUtf8Bytes("test-table-1"));
  });

  beforeEach(async () => {
    [owner, buyer, seller, treasury] = await hre.ethers.getSigners();

    const Escrow = await hre.ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy();
    await escrow.waitForDeployment();

    // Initialize escrow for table
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

      await expect(
        escrow.connect(buyer).deposit(TABLE_ID, { value: depositAmount })
      )
        .to.emit(escrow, "Deposited")
        .withArgs(
          TABLE_ID,
          buyer.address,
          depositAmount,
          ethers.parseEther("0.02"),
          anyValue
        );

      const status = await escrow.getStatus(TABLE_ID);
      expect(status.amount).to.equal(depositAmount);
    });

    it("should reject deposit from non-buyer", async () => {
      await expect(
        escrow.connect(seller).deposit(TABLE_ID, { value: ethers.parseEther("1") })
      ).to.be.revertedWith("Only buyer allowed");
    });

    it("should reject zero deposit", async () => {
      await expect(
        escrow.connect(buyer).deposit(TABLE_ID, { value: 0 })
      ).to.be.revertedWith("Must send value");
    });
  });

  describe("Approvals", () => {
    beforeEach(async () => {
      await escrow.connect(buyer).deposit(TABLE_ID, { value: ethers.parseEther("1") });
    });

    it("should allow buyer to approve", async () => {
      await expect(escrow.connect(buyer).buyerApprove(TABLE_ID))
        .to.emit(escrow, "BuyerApproved")
        .withArgs(TABLE_ID, buyer.address);

      const status = await escrow.getStatus(TABLE_ID);
      expect(status.buyerApproved).to.be.true;
    });

    it("should allow seller to approve", async () => {
      await expect(escrow.connect(seller).sellerApprove(TABLE_ID))
        .to.emit(escrow, "SellerApproved")
        .withArgs(TABLE_ID, seller.address);

      const status = await escrow.getStatus(TABLE_ID);
      expect(status.sellerApproved).to.be.true;
    });

    it("should reject double approval from buyer", async () => {
      await escrow.connect(buyer).buyerApprove(TABLE_ID);
      await expect(escrow.connect(buyer).buyerApprove(TABLE_ID)).to.be.revertedWith(
        "Already approved"
      );
    });

    it("should release funds when both approve", async () => {
      const initialSellerBal = await ethers.provider.getBalance(seller.address);

      await escrow.connect(buyer).buyerApprove(TABLE_ID);
      await escrow.connect(seller).sellerApprove(TABLE_ID);

      // Should be released
      const status = await escrow.getStatus(TABLE_ID);
      expect(status.status).to.equal("released");

      // Seller gets amount - fee (1 - 0.02 = 0.98 ETH)
      const finalSellerBal = await ethers.provider.getBalance(seller.address);
      expect(finalSellerBal > initialSellerBal).to.be.true;
    });
  });

  describe("Cancellations", () => {
    beforeEach(async () => {
      await escrow.connect(buyer).deposit(TABLE_ID, { value: ethers.parseEther("1") });
    });

    it("should allow buyer to cancel", async () => {
      await expect(escrow.connect(buyer).cancel(TABLE_ID))
        .to.emit(escrow, "Cancelled")
        .withArgs(TABLE_ID, buyer.address, ethers.parseEther("0.98"));

      const status = await escrow.getStatus(TABLE_ID);
      expect(status.status).to.equal("cancelled");
    });

    it("should reject cancellation by seller", async () => {
      await expect(escrow.connect(seller).cancel(TABLE_ID)).to.be.revertedWith(
        "Only buyer allowed"
      );
    });
  });

  describe("Disputes", () => {
    beforeEach(async () => {
      await escrow.connect(buyer).deposit(TABLE_ID, { value: ethers.parseEther("1") });
    });

    it("should allow buyer to open dispute", async () => {
      await expect(escrow.connect(buyer).openDispute(TABLE_ID))
        .to.emit(escrow, "DisputeOpened")
        .withArgs(TABLE_ID, buyer.address, anyValue);

      const status = await escrow.getStatus(TABLE_ID);
      expect(status.status).to.equal("disputed");
    });

    it("should allow seller to open dispute", async () => {
      await expect(escrow.connect(seller).openDispute(TABLE_ID))
        .to.emit(escrow, "DisputeOpened")
        .withArgs(TABLE_ID, seller.address, anyValue);

      const status = await escrow.getStatus(TABLE_ID);
      expect(status.status).to.equal("disputed");
    });

    it("should reject non-participant opening dispute", async () => {
      await expect(escrow.connect(owner).openDispute(TABLE_ID)).to.be.revertedWith(
        "Not authorized"
      );
    });

    it("should resolve dispute in favor of seller", async () => {
      await escrow.connect(buyer).openDispute(TABLE_ID);

      await expect(escrow.connect(owner).resolveDispute(TABLE_ID, true))
        .to.emit(escrow, "Released")
        .withArgs(TABLE_ID, seller.address, anyValue, anyValue, anyValue);

      const status = await escrow.getStatus(TABLE_ID);
      expect(status.status).to.equal("released");
    });

    it("should resolve dispute in favor of buyer", async () => {
      await escrow.connect(buyer).openDispute(TABLE_ID);

      await expect(escrow.connect(owner).resolveDispute(TABLE_ID, false))
        .to.emit(escrow, "Cancelled")
        .withArgs(TABLE_ID, buyer.address, anyValue);

      const status = await escrow.getStatus(TABLE_ID);
      expect(status.status).to.equal("cancelled");
    });
  });

  describe("Edge Cases", () => {
    it("should reject operations on non-existent table", async () => {
      const invalidTableId = ethers.keccak256(ethers.toUtf8Bytes("non-existent"));
      await expect(
        escrow.connect(buyer).deposit(invalidTableId, { value: ethers.parseEther("1") })
      ).to.be.revertedWith("Escrow not active");
    });

    it("should handle multiple small deposits", async () => {
      await escrow.connect(buyer).deposit(TABLE_ID, { value: ethers.parseEther("0.1") });
      await escrow.connect(buyer).deposit(TABLE_ID, { value: ethers.parseEther("0.2") });

      const status = await escrow.getStatus(TABLE_ID);
      expect(status.amount).to.equal(ethers.parseEther("0.3"));
    });

    it("should track total fee correctly", async () => {
      await escrow.connect(buyer).deposit(TABLE_ID, { value: ethers.parseEther("1") });
      await escrow.connect(buyer).deposit(TABLE_ID, { value: ethers.parseEther("1") });

      const status = await escrow.getStatus(TABLE_ID);
      expect(status.amount).to.equal(ethers.parseEther("2"));
      expect(status.fee).to.equal(ethers.parseEther("0.04"));
    });
  });

  describe("Security", () => {
    it("should only initialize once per table", async () => {
      const TABLE_ID_2 = ethers.keccak256(ethers.toUtf8Bytes("test-table-2"));
      await expect(
        escrow.initializeForTable(TABLE_ID_2, buyer.address, seller.address, treasury.address)
      ).to.not.be.reverted;

      // Try to reinitialize same table
      await expect(
        escrow.initializeForTable(TABLE_ID, buyer.address, seller.address, treasury.address)
      ).to.be.reverted;
    });
  });
});

const anyValue = () => expect.any(String);