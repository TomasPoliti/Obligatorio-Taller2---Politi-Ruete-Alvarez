'use client';

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '@/src/lib/web3/hooks';
import { getContract } from '@/src/lib/web3/contract';
import WalletConnect from '@/src/components/WalletConnect';
import TokenPurchase from '@/src/components/TokenPurchase';
import StakingPanel from '@/src/components/StakingPanel';
import CreateProposal from '@/src/components/CreateProposal';
import ProposalsList from '@/src/components/ProposalsList';
import PanicControls from '@/src/components/PanicControls';

interface HealthData {
  network: string;
  chainId: number;
  blockNumber: number;
  status: string;
}

interface StatusData {
  paused: boolean;
  panicWallet: string;
  owner: string;
}

interface ParametersData {
  tokenPriceFormatted: string;
  minStakeForVotingFormatted: string;
  minStakeForProposingFormatted: string;
  minStakeLockTime: number;
  proposalDuration: number;
  tokensPerVotePowerFormatted: string;
}

interface TreasuryData {
  balanceFormatted: string;
}

interface Proposal {
  id: number;
  description: string;
  proposer: string;
  votesFor: string;
  votesAgainst: string;
  deadline: number;
  executed: boolean;
  isTreasuryProposal: boolean;
  recipient?: string;
  amount?: string;
}

interface UserBalance {
  tokens: string;
  votingStake: string;
  proposingStake: string;
  votingPower: string;
  votingStakeSince: number;
  proposingStakeSince: number;
}

export default function Home() {
  const { account, signer, provider, isConnected } = useWeb3();
  const [health, setHealth] = useState<HealthData | null>(null);
  const [status, setStatus] = useState<StatusData | null>(null);
  const [parameters, setParameters] = useState<ParametersData | null>(null);
  const [treasury, setTreasury] = useState<TreasuryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [userBalance, setUserBalance] = useState<UserBalance>({
    tokens: '0',
    votingStake: '0',
    proposingStake: '0',
    votingPower: '0',
    votingStakeSince: 0,
    proposingStakeSince: 0
  });
  const [contractAddress, setContractAddress] = useState('');

  // Fetch API data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [healthRes, statusRes, parametersRes, treasuryRes] = await Promise.all([
          fetch('/api/health'),
          fetch('/api/dao/status'),
          fetch('/api/dao/parameters'),
          fetch('/api/dao/treasury')
        ]);

        const [healthData, statusData, parametersData, treasuryData] = await Promise.all([
          healthRes.json(),
          statusRes.json(),
          parametersRes.json(),
          treasuryRes.json()
        ]);

        setHealth(healthData.data);
        setStatus(statusData.data);
        setParameters(parametersData.data);
        setTreasury(treasuryData.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch user data and proposals when wallet is connected
  useEffect(() => {
    if (!account) return;

    const fetchUserData = async () => {
      try {
        // Get contract address from environment or API
        const addr = process.env.NEXT_PUBLIC_DAO_CONTRACT_ADDRESS || '';
        if (!addr) {
          console.error('Contract address not configured');
          return;
        }
        setContractAddress(addr);

        // Create a direct JsonRpcProvider for read-only operations
        // This avoids issues with MetaMask's provider
        const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:7545';
        const directProvider = new ethers.JsonRpcProvider(rpcUrl);

        const contract = getContract(addr, directProvider);

        // Fetch user balance and stakes
        const tokenAddr = process.env.NEXT_PUBLIC_DAO_TOKEN_ADDRESS;
        if (!tokenAddr) {
          console.error('Token address not configured');
          return;
        }

        const tokenContract = new ethers.Contract(
          tokenAddr,
          ['function balanceOf(address) view returns (uint256)'],
          directProvider
        );

        const [tokenBalance, votingStakeInfo, proposingStakeInfo, votingPower, proposalsCount] = await Promise.all([
          tokenContract.balanceOf(account).catch((err: Error) => {
            console.error('Error fetching token balance:', err);
            return BigInt(0);
          }),
          contract.votingStake(account).catch((err: Error) => {
            console.error('Error fetching voting stake:', err);
            return { amount: BigInt(0), since: BigInt(0) };
          }),
          contract.proposingStake(account).catch((err: Error) => {
            console.error('Error fetching proposing stake:', err);
            return { amount: BigInt(0), since: BigInt(0) };
          }),
          contract.votingPower(account).catch((err: Error) => {
            console.error('Error fetching voting power:', err);
            return BigInt(0);
          }),
          contract.nextProposalId().catch((err: Error) => {
            console.error('Error fetching next proposal ID:', err);
            return BigInt(0);
          })
        ]);

        setUserBalance({
          tokens: ethers.formatEther(tokenBalance),
          votingStake: ethers.formatEther(votingStakeInfo.amount || votingStakeInfo[0] || 0),
          proposingStake: ethers.formatEther(proposingStakeInfo.amount || proposingStakeInfo[0] || 0),
          votingPower: votingPower.toString(),
          votingStakeSince: Number(votingStakeInfo.since || votingStakeInfo[1] || 0),
          proposingStakeSince: Number(proposingStakeInfo.since || proposingStakeInfo[1] || 0)
        });

        // Fetch all proposals
        const proposalPromises = [];
        for (let i = 0; i < Number(proposalsCount); i++) {
          proposalPromises.push(contract.getProposal(i));
        }

        const proposalsData = await Promise.all(proposalPromises);
        const formattedProposals = proposalsData.map((p: any, index: number) => ({
          id: index,
          description: p.description,
          proposer: p.proposer,
          votesFor: p.votesFor.toString(),
          votesAgainst: p.votesAgainst.toString(),
          deadline: Number(p.deadline),
          executed: p.executed,
          isTreasuryProposal: p.isTreasuryProposal,
          recipient: p.recipient,
          amount: p.amount?.toString()
        }));

        setProposals(formattedProposals);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [account]);

  const refreshData = () => {
    // Trigger re-fetch by updating a dummy state or reloading the useEffect
    if (signer && isConnected) {
      window.location.reload();
    }
  };

  const isOwnerConnected =
    account && status?.owner
      ? account.toLowerCase() === status.owner.toLowerCase()
      : false;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-400 text-lg">Loading DAO Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="absolute inset-0 bg-linear-to-br from-purple-900/10 via-transparent to-blue-900/10 pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2 gradient-text">
                Governance DAO
              </h1>
              <p className="text-lg text-zinc-400">
                Decentralized Autonomous Organization
              </p>
            </div>
            <WalletConnect />
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#111111] border border-[#1e1e1e] rounded-xl p-5 glow-hover transition-all duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-zinc-400">Network Status</h3>
            </div>
            <p className="text-2xl font-bold text-white mb-1">{health?.status || 'N/A'}</p>
            <p className="text-sm text-zinc-500">{health?.network || 'Unknown'}</p>
          </div>

          <div className="bg-[#111111] border border-[#1e1e1e] rounded-xl p-5 glow-hover transition-all duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-zinc-400">Block Height</h3>
            </div>
            <p className="text-2xl font-bold text-white mb-1">{health?.blockNumber?.toLocaleString() || '0'}</p>
            <p className="text-sm text-zinc-500">Chain ID: {health?.chainId || 'N/A'}</p>
          </div>

          <div className="bg-[#111111] border border-[#1e1e1e] rounded-xl p-5 glow-hover transition-all duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-zinc-400">Treasury</h3>
            </div>
            <p className="text-2xl font-bold text-white mb-1">{parseFloat(treasury?.balanceFormatted || '0').toFixed(4)}</p>
            <p className="text-sm text-zinc-500">ETH</p>
          </div>

          <div className="bg-[#111111] border border-[#1e1e1e] rounded-xl p-5 glow-hover transition-all duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-full ${status?.paused ? 'bg-red-500/20' : 'bg-green-500/20'} flex items-center justify-center`}>
                <svg className={`w-5 h-5 ${status?.paused ? 'text-red-500' : 'text-green-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-zinc-400">DAO Status</h3>
            </div>
            <p className="text-2xl font-bold text-white mb-1">{status?.paused ? 'Paused' : 'Active'}</p>
            <p className="text-sm text-zinc-500">Contract Status</p>
          </div>
        </div>

        {/* User Balance Card */}
        {isConnected && (
          <div className="bg-linear-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>💼</span>
              Your Balances
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-zinc-400 mb-1">Token Balance</p>
                <p className="text-xl font-bold text-white font-mono">{parseFloat(userBalance.tokens).toFixed(4)}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 mb-1">Voting Stake</p>
                <p className="text-xl font-bold text-purple-400 font-mono">{parseFloat(userBalance.votingStake).toFixed(4)}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 mb-1">Proposing Stake</p>
                <p className="text-xl font-bold text-blue-400 font-mono">{parseFloat(userBalance.proposingStake).toFixed(4)}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 mb-1">Voting Power</p>
                <p className="text-xl font-bold text-green-400 font-mono">{userBalance.votingPower}</p>
              </div>
            </div>
          </div>
        )}

        {/* Interactive Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <TokenPurchase
            contractAddress={contractAddress}
            tokenPrice={parameters?.tokenPriceFormatted || '0'}
            onSuccess={refreshData}
          />
          <StakingPanel
            contractAddress={contractAddress}
            userBalance={userBalance}
            lockTimeSeconds={parameters?.minStakeLockTime || 0}
            onSuccess={refreshData}
          />
        </div>

        {/* Proposals Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <CreateProposal contractAddress={contractAddress} onSuccess={refreshData} />
          <ProposalsList
            contractAddress={contractAddress}
            proposals={proposals}
            onSuccess={refreshData}
          />
        </div>

        {/* Parameters and Contract Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#111111] border border-[#1e1e1e] rounded-xl p-6 glow-hover">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-purple-500">⚙</span>
              DAO Parameters
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                <span className="text-sm text-zinc-400">Token Price</span>
                <span className="font-mono font-semibold text-white text-sm">{parseFloat(parameters?.tokenPriceFormatted || '0').toFixed(6)} ETH</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                <span className="text-sm text-zinc-400">Min Stake (Voting)</span>
                <span className="font-mono font-semibold text-white text-sm">{parseFloat(parameters?.minStakeForVotingFormatted || '0').toFixed(4)} ETH</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                <span className="text-sm text-zinc-400">Min Stake (Proposing)</span>
                <span className="font-mono font-semibold text-white text-sm">{parseFloat(parameters?.minStakeForProposingFormatted || '0').toFixed(4)} ETH</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                <span className="text-sm text-zinc-400">Lock Time</span>
                <span className="font-mono font-semibold text-white text-sm">{parameters?.minStakeLockTime || 0}s</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                <span className="text-sm text-zinc-400">Proposal Duration</span>
                <span className="font-mono font-semibold text-white text-sm">{parameters?.proposalDuration || 0}s</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-zinc-400">Tokens per Vote Power</span>
                <span className="font-mono font-semibold text-white text-sm">{parseFloat(parameters?.tokensPerVotePowerFormatted || '0').toFixed(6)}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#111111] border border-[#1e1e1e] rounded-xl p-6 glow-hover">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-blue-500">🔐</span>
              Contract Info
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 mb-2 block">Owner Address</label>
                <div className="bg-[#0a0a0a] border border-zinc-800 rounded-lg p-3 font-mono text-xs break-all">
                  {status?.owner || 'N/A'}
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-400 mb-2 block">Panic Wallet</label>
                <div className="bg-[#0a0a0a] border border-zinc-800 rounded-lg p-3 font-mono text-xs break-all">
                  {status?.panicWallet || 'N/A'}
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                <span className="text-sm text-zinc-400">Contract Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${status?.paused ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                  {status?.paused ? 'Paused' : 'Active'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {isOwnerConnected && contractAddress && (
          <div className="mb-8">
            <PanicControls
              contractAddress={contractAddress}
              isPaused={status?.paused ?? false}
              ownerAddress={status?.owner ?? ''}
              onSuccess={refreshData}
            />
          </div>
        )}

        <footer className="text-center text-zinc-500 text-sm">
          <p>Data auto-refreshes every 10 seconds</p>
        </footer>
      </div>
    </div>
  );
}
