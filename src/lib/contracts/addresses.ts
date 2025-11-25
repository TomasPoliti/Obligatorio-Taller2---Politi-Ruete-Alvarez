type ContractAddresses = {
  daoToken: string;
  governanceDAO: string;
};

const addresses: Record<number, ContractAddresses> = {
  31337: {
    // Localhost/Hardhat
    daoToken: process.env.NEXT_PUBLIC_DAO_TOKEN_ADDRESS || "",
    governanceDAO: process.env.NEXT_PUBLIC_GOVERNANCE_DAO_ADDRESS || "",
  },
  1337: {
    // Ganache
    daoToken: process.env.NEXT_PUBLIC_DAO_TOKEN_ADDRESS || "",
    governanceDAO: process.env.NEXT_PUBLIC_GOVERNANCE_DAO_ADDRESS || "",
  },
  11155111: {
    // Sepolia
    daoToken: process.env.NEXT_PUBLIC_DAO_TOKEN_ADDRESS || "",
    governanceDAO: process.env.NEXT_PUBLIC_GOVERNANCE_DAO_ADDRESS || "",
  },
};

export function getContractAddresses(chainId: number): ContractAddresses {
  if (!addresses[chainId]) {
    throw new Error(`No contract addresses configured for chain ID ${chainId}`);
  }

  const addrs = addresses[chainId];
  if (!addrs.daoToken || !addrs.governanceDAO) {
    throw new Error(
      `Contract addresses not set. Please deploy contracts and update .env.local`
    );
  }

  return addrs;
}
