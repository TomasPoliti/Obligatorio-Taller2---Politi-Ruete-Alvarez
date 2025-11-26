import { NextResponse } from 'next/server';
import { getProvider } from '@/src/lib/blockchain/provider';
import { getContractAddresses } from '@/src/lib/contracts/addresses';
import { getDaoTokenContract } from '@/src/lib/contracts/instances';
import { successResponse, errorResponse } from '@/src/lib/api/responses';
import { ethers } from 'ethers';

export async function GET() {
  try {
    const provider = getProvider();
    const network = await provider.getNetwork();
    const addresses = getContractAddresses(Number(network.chainId));
    const daoToken = await getDaoTokenContract();

    const balance = await provider.getBalance(addresses.governanceDAO);
    const tokenBalance = await daoToken.balanceOf(addresses.governanceDAO);

    return NextResponse.json(successResponse({
      balance: balance.toString(),
      balanceFormatted: ethers.formatEther(balance),
      tokenBalance: tokenBalance.toString(),
      tokenBalanceFormatted: ethers.formatEther(tokenBalance)
    }));
  } catch (error) {
    console.error('Error fetching treasury balance:', error);
    return NextResponse.json(
      errorResponse('CONTRACT_ERROR', 'Failed to fetch treasury balance'),
      { status: 500 }
    );
  }
}
