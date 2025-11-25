const hre = require("hardhat");
require("dotenv").config({ path: ".env.local" });

async function main() {
  const [minter] = await hre.ethers.getSigners();

  console.log("Minting tokens with account:", minter.address);

  // Get contract addresses from .env.local
  const tokenAddress = process.env.NEXT_PUBLIC_DAO_TOKEN_ADDRESS;
  const daoAddress = process.env.NEXT_PUBLIC_GOVERNANCE_DAO_ADDRESS;

  if (!tokenAddress || !daoAddress) {
    console.error("❌ Error: Contract addresses not found in .env.local");
    console.error("Please make sure NEXT_PUBLIC_DAO_TOKEN_ADDRESS and NEXT_PUBLIC_GOVERNANCE_DAO_ADDRESS are set");
    process.exit(1);
  }

  console.log("\n📋 Contract Info:");
  console.log("Token Address:", tokenAddress);
  console.log("DAO Address:", daoAddress);

  // Get the DaoToken contract
  const token = await hre.ethers.getContractAt("DaoToken", tokenAddress);

  // Check current owner
  const owner = await token.owner();
  console.log("\n🔑 Current token owner:", owner);
  console.log("🔑 Minter address:", minter.address);

  if (owner.toLowerCase() !== minter.address.toLowerCase()) {
    console.error("\n❌ Error: You are not the token owner!");
    console.error("The token owner is:", owner);
    console.error("You are trying to mint with:", minter.address);
    console.error("\nNote: The token ownership was transferred to the DAO in the deploy script.");
    console.error("You need to mint BEFORE transferring ownership, or use the DAO owner account.");
    process.exit(1);
  }

  // Mint tokens to DAO
  const mintAmount = hre.ethers.parseEther("1000000"); // 1 million tokens
  console.log("\n💰 Minting tokens to DAO...");
  console.log("Amount:", hre.ethers.formatEther(mintAmount), "tokens");

  const tx = await token.mint(daoAddress, mintAmount);
  console.log("Transaction hash:", tx.hash);
  await tx.wait();

  console.log("✅ Tokens minted successfully!");

  // Check DAO balance
  const daoBalance = await token.balanceOf(daoAddress);
  console.log("\n📊 DAO token balance:", hre.ethers.formatEther(daoBalance), "tokens");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
