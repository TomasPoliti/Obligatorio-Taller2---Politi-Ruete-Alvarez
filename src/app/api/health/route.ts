import { NextResponse } from 'next/server';
import { getProvider } from '@/src/lib/blockchain/provider';
import { successResponse, errorResponse } from '@/src/lib/api/responses';

export async function GET() {
  try {
    const provider = getProvider();
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();

    return NextResponse.json(successResponse({
      network: network.name,
      chainId: Number(network.chainId),
      blockNumber,
      status: 'healthy'
    }));
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      errorResponse('NETWORK_ERROR', 'Failed to connect to blockchain'),
      { status: 503 }
    );
  }
}
