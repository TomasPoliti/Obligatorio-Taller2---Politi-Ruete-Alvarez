import { ethers } from 'ethers';

export function getProvider() {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:7545';
  return new ethers.JsonRpcProvider(rpcUrl);
}

export function getNetworkConfig() {
  return {
    name: process.env.NEXT_PUBLIC_NETWORK || 'localhost',
    chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '1337'),
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:7545'
  };
}
