import { NextResponse } from 'next/server';
import { getGovernanceDAOContract } from '@/src/lib/contracts/instances';
import { successResponse, errorResponse } from '@/src/lib/api/responses';

export async function GET() {
  try {
    const contract = await getGovernanceDAOContract();

    const [paused, panicWallet, owner] = await Promise.all([
      contract.paused(),
      contract.panicWallet(),
      contract.owner()
    ]);

    return NextResponse.json(successResponse({
      paused,
      panicWallet,
      owner
    }));
  } catch (error) {
    console.error('Error fetching DAO status:', error);
    return NextResponse.json(
      errorResponse('CONTRACT_ERROR', 'Failed to fetch DAO status'),
      { status: 500 }
    );
  }
}
