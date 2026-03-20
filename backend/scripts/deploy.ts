import { ethers } from 'hardhat';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('Deploying FHE Escrow to Zama network...');

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log('Deploying with account:', deployer.address);

  // Get balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log('Account balance:', ethers.formatEther(balance), 'ETH');

  // Deploy FHE Escrow
  console.log('\nDeploying FHEEscrow...');
  const FHEEscrow = await ethers.getContractFactory('FHEEscrow');
  const escrow = await FHEEscrow.deploy();
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log('FHEEscrow deployed to:', escrowAddress);

  // Treasury address (use deployer for now)
  const treasury = deployer.address;

  // Save addresses
  const config = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    contracts: {
      FHEEscrow: escrowAddress,
    },
    treasury,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  const configPath = path.join(__dirname, 'deployments', `${(await ethers.provider.getNetwork()).chainId}.json`);
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log('\nDeployment config saved to:', configPath);

  console.log('\n=== Deployment Complete ===');
  console.log('FHEEscrow:', escrowAddress);
  console.log('Treasury:', treasury);
  console.log('\nNext steps:');
  console.log('1. Save these addresses to your frontend config');
  console.log('2. Initialize FHEVM in your client (fhevmjs)');
  console.log('3. Users can now create encrypted escrows!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
