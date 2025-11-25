import { NextResponse } from 'next/server';
import { getGovernanceDAOContract } from '@/src/lib/contracts/instances';
import { successResponse, errorResponse } from '@/src/lib/api/responses';
import { ethers } from 'ethers';

export async function GET() {
  try {
    const contract = await getGovernanceDAOContract();

    const [
      tokenPriceWei,
      minStakeForVoting,
      minStakeForProposing,
      minStakeLockTime,
      proposalDuration,
      tokensPerVotePower
    ] = await Promise.all([
      contract.tokenPriceWei(),
      contract.minStakeForVoting(),
      contract.minStakeForProposing(),
      contract.minStakeLockTime(),
      contract.proposalDuration(),
      contract.tokensPerVotePower()
    ]);

    return NextResponse.json(successResponse({
      tokenPriceWei: tokenPriceWei.toString(),
      tokenPriceFormatted: ethers.formatEther(tokenPriceWei),
      minStakeForVoting: minStakeForVoting.toString(),
      minStakeForVotingFormatted: ethers.formatEther(minStakeForVoting),
      minStakeForProposing: minStakeForProposing.toString(),
      minStakeForProposingFormatted: ethers.formatEther(minStakeForProposing),
      minStakeLockTime: Number(minStakeLockTime),
      proposalDuration: Number(proposalDuration),
      tokensPerVotePower: tokensPerVotePower.toString(),
      tokensPerVotePowerFormatted: ethers.formatEther(tokensPerVotePower)
    }));
  } catch (error) {
    console.error('Error fetching DAO parameters:', error);
    return NextResponse.json(
      errorResponse('CONTRACT_ERROR', 'Failed to fetch DAO parameters'),
      { status: 500 }
    );
  }
}
