import "@nomicfoundation/hardhat-toolbox";

/** @type import("hardhat/config").HardhatUserConfig */

// Mnemonic que aparece en Ganache (ACÁ PEGÁS EL TUYO TAL CUAL)
const GANACHE_MNEMONIC = "twin shadow palm spy donor slight muscle obtain during gentle smart cushion";

const config = {
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
    sources: "./contracts",
    tests: "./test",
  },
  networks: {
    // red local de ganache
    ganache: {
      url: "http://127.0.0.1:7545",
      accounts: {
        mnemonic: GANACHE_MNEMONIC,
      },
      // opcional, pero ayuda a que matchee con Ganache
      chainId: 5777,
    },
  },
};

export default config;
