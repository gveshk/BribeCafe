import type { HardhatRuntimeEnvironment } from "hardhat/types";

declare global {
  var hre: HardhatRuntimeEnvironment;
}

before(async function () {
  global.hre = await import("hardhat");
});
