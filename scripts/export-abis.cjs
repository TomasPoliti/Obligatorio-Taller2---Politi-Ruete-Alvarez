const fs = require("fs");
const path = require("path");

const artifactsPath = path.join(__dirname, "../artifacts/src/contracts");
const abiOutputPath = path.join(__dirname, "../src/lib/contracts/abis");

// Ensure output directory exists
if (!fs.existsSync(abiOutputPath)) {
  fs.mkdirSync(abiOutputPath, { recursive: true });
}

// Contracts to export
const contracts = ["DaoToken", "GovernanceDAO"];

contracts.forEach((contractName) => {
  const artifactPath = path.join(
    artifactsPath,
    `${contractName}.sol`,
    `${contractName}.json`
  );

  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const abi = artifact.abi;

    const outputFile = path.join(abiOutputPath, `${contractName}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(abi, null, 2));

    console.log(`✅ Exported ABI for ${contractName}`);
  } else {
    console.warn(`⚠️  Artifact not found for ${contractName}`);
  }
});

console.log("✅ ABI export completed");
