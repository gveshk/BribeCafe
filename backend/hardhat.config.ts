require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Zama Dev Network
    zamaDev: {
      url: process.env.ZAMA_RPC_URL || "https://rpc.dev.fhevm.network",
      chainId: parseInt(process.env.ZAMA_CHAIN_ID) || 80002,
      accounts: process.env.PRIVATE_KEY
        ? [process.env.PRIVATE_KEY]
        : [],
    },
    // Zama Mainnet (when available)
    zamaMainnet: {
      url: "https://rpc.fhevm.network",
      chainId: 80001,
      accounts: process.env.PRIVATE_KEY
        ? [process.env.PRIVATE_KEY]
        : [],
    },
    // Local Hardhat node
    hardhat: {
      chainId: 80002,
    },
  },
  etherscan: {
    apiKey: {
      zamaDev: "dummy",
    },
    customChains: [
      {
        network: "zamaDev",
        chainId: 80002,
        urls: {
          apiURL: "https://api.testnet.scan.fhevm.io/api",
          browserURL: "https://testnet.scan.fhevm.io",
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
  },
  paths: {
    sources: "./contracts",
    tests: "./tests",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
