import { HardhatRuntimeEnvironment } from "hardhat/types";

export default async function globalSetup(_hre: HardhatRuntimeEnvironment) {
  // This runs once before all tests
  console.log("Setting up Hardhat test environment...");
}

export async function globalTeardown() {
  // Cleanup after all tests
  console.log("Cleaning up test environment...");
}