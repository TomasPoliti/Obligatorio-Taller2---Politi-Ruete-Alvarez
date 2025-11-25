import { ethers } from 'ethers';

export function getProvider() {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545';
  return new ethers.JsonRpcProvider(rpcUrl);
}

export function getNetworkConfig() {
  return {
    name: process.env.NEXT_PUBLIC_NETWORK || 'localhost',
    chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '31337'),
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545'
  };
}
