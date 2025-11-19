import hardhat from "hardhat";

const { ethers } = hardhat;

async function main() {
  const [owner, panicMultisig] = await ethers.getSigners();

  console.log("Deploying contracts with owner:", owner.address);
  console.log("Panic multisig:", panicMultisig.address);

  const DaoToken = await ethers.getContractFactory("DaoToken");
  const token = await DaoToken.deploy("DAO Token", "DTK", owner.address);
  await token.waitForDeployment();

  console.log("DaoToken deployed to:", await token.getAddress());

  const GovernanceDAO = await ethers.getContractFactory("GovernanceDAO");
  const dao = await GovernanceDAO.deploy(
    owner.address,
    await token.getAddress(),
    ethers.parseEther("0.001"), // tokenPriceWei
    ethers.parseEther("100"),   // minStakeForVoting
    ethers.parseEther("100"),   // minStakeForProposing
    60n,                        // minStakeLockTime (segundos)
    3600n,                      // proposalDuration (segundos)
    ethers.parseEther("10")     // tokensPerVotePower
  );
  await dao.waitForDeployment();

  console.log("GovernanceDAO deployed to:", await dao.getAddress());

  // Configuramos la panic wallet para que la DAO pueda operar
  const tx = await dao.setPanicWallet(panicMultisig.address);
  await tx.wait();

  console.log("Panic wallet set to:", panicMultisig.address);
  console.log("TOKEN_ADDRESS =", await token.getAddress());
  console.log("DAO_ADDRESS   =", await dao.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

