const hre = require("hardhat");

async function main() {
  console.log("ethers:", typeof hre.ethers);
  const [owner, buyer, seller, treasury] = await hre.ethers.getSigners();
  console.log("✅ Got signers:", owner.address);
  
  const ethers = hre.ethers;
  const TABLE_ID = ethers.keccak256(ethers.toUtf8Bytes("test-table-1"));
  
  const Escrow = await ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy();
  await escrow.waitForDeployment();
  console.log("✅ Escrow deployed");
  
  await escrow.initializeForTable(TABLE_ID, buyer.address, seller.address, treasury.address);
  console.log("✅ Table initialized");
  
  // Test deposit
  await escrow.connect(buyer).deposit(TABLE_ID, { value: ethers.parseEther("1") });
  const status = await escrow.getStatus(TABLE_ID);
  console.log("✅ Deposit:", ethers.formatEther(status.amount), "ETH");
  
  // Test approval
  await escrow.connect(buyer).buyerApprove(TABLE_ID);
  await escrow.connect(seller).sellerApprove(TABLE_ID);
  const finalStatus = await escrow.getStatus(TABLE_ID);
  console.log("✅ Status:", finalStatus.status);
  
  console.log("\n🎉 All tests passed!");
}
main();
