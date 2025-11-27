require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: ".env.local" });
require("solidity-coverage");

/** @type import("hardhat/config").HardhatUserConfig */

// Mnemonic que aparece en Ganache (ACÁ PEGÁS EL TUYO TAL CUAL)
const GANACHE_MNEMONIC =
  "twin shadow palm spy donor slight muscle obtain during gentle smart cushion";

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  paths: {
    sources: "./src/contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
    },
    // red local de ganache
    ganache: {
      url: "http://127.0.0.1:7545",
      accounts: {
        mnemonic: GANACHE_MNEMONIC,
      },
      // opcional, pero ayuda a que matchee con Ganache
      chainId: 1337,
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia.publicnode.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },
};
