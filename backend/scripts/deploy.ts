import { ethers } from 'hardhat';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('Deploying contracts to Zama network...');

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log('Deploying with account:', deployer.address);

  // Get balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log('Account balance:', ethers.formatEther(balance), 'ETH');

  // Deploy Escrow first
  console.log('\nDeploying Escrow...');
  const Escrow = await ethers.getContractFactory('Escrow');
  const escrow = await Escrow.deploy();
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log('Escrow deployed to:', escrowAddress);

  // Treasury address (use deployer for now)
  const treasury = deployer.address;

  // Deploy TableFactory
  console.log('\nDeploying TableFactory...');
  const TableFactory = await ethers.getContractFactory('TableFactory');
  const tableFactory = await TableFactory.deploy(treasury, escrowAddress);
  await tableFactory.waitForDeployment();
  const tableFactoryAddress = await tableFactory.getAddress();
  console.log('TableFactory deployed to:', tableFactoryAddress);

  // Save addresses
  const config = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    contracts: {
      Escrow: escrowAddress,
      TableFactory: tableFactoryAddress,
    },
    treasury,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  const configPath = path.join(__dirname, 'deployments', `${(await ethers.provider.getNetwork()).chainId}.json`);
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log('\nDeployment config saved to:', configPath);

  // Verify on explorer (if supported)
  console.log('\nDeployment complete!');
  console.log('Escrow:', escrowAddress);
  console.log('TableFactory:', tableFactoryAddress);
  console.log('Treasury:', treasury);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
