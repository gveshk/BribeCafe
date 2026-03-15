require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.19",
  networks: {
    hardhat: {
      chainId: 80002,
    },
  },
  mocha: {
    timeout: 60000,
  },
};
