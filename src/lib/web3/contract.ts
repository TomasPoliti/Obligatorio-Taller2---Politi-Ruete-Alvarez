'use client';

import { ethers, Contract, BrowserProvider, JsonRpcSigner, JsonRpcProvider } from 'ethers';
import GovernanceDAOArtifact from '../../../artifacts/src/contracts/GovernanceDAO.sol/GovernanceDAO.json';

export function getContract(address: string, signerOrProvider: JsonRpcSigner | BrowserProvider | JsonRpcProvider) {
  return new Contract(address, GovernanceDAOArtifact.abi, signerOrProvider);
}

export async function getContractAddress(chainId: number): Promise<string> {
  // For hardhat local network
  if (chainId === 31337) {
    const response = await fetch('/api/dao/status');
    const data = await response.json();
    // Extract from owner or get from environment
    return process.env.NEXT_PUBLIC_DAO_CONTRACT_ADDRESS || '';
  }

  // Add other network addresses as needed
  throw new Error(`Unsupported chain ID: ${chainId}`);
}
