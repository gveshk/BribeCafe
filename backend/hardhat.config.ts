require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    zamaTestnet: {
      url: process.env.ZAMA_RPC_URL || "https://testnet.zama.ai",
      chainId: 80002,
      accounts: process.env.ZAMA_PRIVATE_KEY 
        ? [process.env.ZAMA_PRIVATE_KEY] 
        : [],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
  },
  paths: {
    sources: "./contracts",
    tests: "./tests",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
