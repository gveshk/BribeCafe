import hre from "hardhat";
// Use extendEnvironment to get proper hre with ethers
console.log("network:", hre.network.name);
console.log("artifacts:", typeof hre.artifacts);
