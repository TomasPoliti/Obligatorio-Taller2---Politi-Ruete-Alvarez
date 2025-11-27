const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Deploy DaoToken
  console.log("\n📝 Deploying DaoToken...");
  const DaoToken = await hre.ethers.getContractFactory("DaoToken");
  const daoToken = await DaoToken.deploy(
    "DAO Token",
    "DAOT",
    deployer.address // Initial owner
  );
  await daoToken.waitForDeployment();
  const tokenAddress = await daoToken.getAddress();
  console.log("✅ DaoToken deployed to:", tokenAddress);

  // Deploy GovernanceDAO
  console.log("\n📝 Deploying GovernanceDAO...");
  const GovernanceDAO = await hre.ethers.getContractFactory("GovernanceDAO");

  // Initial parameters
  const tokenPriceWei = hre.ethers.parseEther("0.001"); // 0.001 ETH per token
  const minStakeForVoting = hre.ethers.parseEther("10"); // 10 tokens
  const minStakeForProposing = hre.ethers.parseEther("100"); // 100 tokens
  const minStakeLockTime = 60 * 60 * 24 * 7; // 7 days in seconds
  const proposalDuration = 60 * 60 * 24 * 7; // 7 days in seconds
  const tokensPerVotePower = hre.ethers.parseEther("1"); // 1 token = 1 vote power
  
  // Anti-51% attack parameters
  const quorumPercentage = 30; // Minimum 30% of total voting power must participate
  const approvalPercentage = 60; // Minimum 60% of votes must be in favor

  const governanceDAO = await GovernanceDAO.deploy(
    deployer.address, // Initial owner (should be multisig in production)
    tokenAddress,
    tokenPriceWei,
    minStakeForVoting,
    minStakeForProposing,
    minStakeLockTime,
    proposalDuration,
    tokensPerVotePower,
    quorumPercentage,
    approvalPercentage
  );
  await governanceDAO.waitForDeployment();
  const daoAddress = await governanceDAO.getAddress();
  console.log("✅ GovernanceDAO deployed to:", daoAddress);

  // Set panic wallet (using deployer for testing - should be multisig)
  console.log("\n📝 Setting panic wallet...");
  const tx = await governanceDAO.setPanicWallet(deployer.address);
  await tx.wait();
  console.log("✅ Panic wallet set");

  // Transfer token ownership to DAO
  console.log("\n📝 Transferring DaoToken ownership to GovernanceDAO...");
  const transferTx = await daoToken.transferOwnership(daoAddress);
  await transferTx.wait();
  console.log("✅ Ownership transferred");

  console.log("\n📋 Deployment Summary:");
  console.log("=======================");
  console.log("DaoToken:", tokenAddress);
  console.log("GovernanceDAO:", daoAddress);
  console.log("Initial DAO token balance: 0 (mint via admin panel after deploy)");
  console.log("\n📝 Update your .env.local with these addresses:");
  console.log(`NEXT_PUBLIC_DAO_TOKEN_ADDRESS=${tokenAddress}`);
  console.log(`NEXT_PUBLIC_GOVERNANCE_DAO_ADDRESS=${daoAddress}`);
  console.log("\n✅ Deployment complete! The DAO is ready to use.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
