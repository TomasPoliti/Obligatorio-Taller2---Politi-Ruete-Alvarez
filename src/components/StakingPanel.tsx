'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getContract } from '@/src/lib/web3/contract';
import { useWeb3 } from '@/src/lib/web3/hooks';

const ERC20_ABI = [
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
];

interface StakingPanelProps {
  contractAddress: string;
  userBalance: {
    votingStake: string;
    proposingStake: string;
    votingPower: string;
    votingStakeSince: number;
    proposingStakeSince: number;
  };
  lockTimeSeconds: number;
  onSuccess: () => void;
}

export default function StakingPanel({ contractAddress, userBalance, onSuccess, lockTimeSeconds }: StakingPanelProps) {
  const { signer, isConnected } = useWeb3();
  const [votingAmount, setVotingAmount] = useState('');
  const [proposingAmount, setProposingAmount] = useState('');
  const [customGasLimit, setCustomGasLimit] = useState('');
  const [unstakeVotingAmount, setUnstakeVotingAmount] = useState('');
  const [unstakeProposingAmount, setUnstakeProposingAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'voting' | 'proposing'>('voting');
  const tokenAddress = process.env.NEXT_PUBLIC_DAO_TOKEN_ADDRESS;
  const [currentTimestamp, setCurrentTimestamp] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimestamp(Math.floor(Date.now() / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const ensureAllowance = async (requiredAmount: bigint) => {
    if (!signer) {
      throw new Error('Wallet not connected');
    }
    if (!tokenAddress) {
      throw new Error('Token contract address not configured');
    }

    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
    const userAddress = await signer.getAddress();
    const currentAllowance = await tokenContract.allowance(userAddress, contractAddress);

    if (currentAllowance < requiredAmount) {
      const approveTx = await tokenContract.approve(contractAddress, requiredAmount);
      await approveTx.wait();
    }
  };

  const getGasOverrides = () => {
    const value = customGasLimit.trim();
    if (!value) {
      return undefined;
    }

    try {
      const parsed = BigInt(value);
      if (parsed < 50_000n) {
        throw new Error('Gas limit demasiado bajo. Ingresa al menos 50000.');
      }
      return { gasLimit: parsed };
    } catch (error) {
      throw new Error('Gas limit inválido. Usa solo números enteros.');
    }
  };
  const getUnlockTimestamp = (since: number) => {
    if (!since || lockTimeSeconds === 0) {
      return 0;
    }
    return since + lockTimeSeconds;
  };

  const isStakeUnlocked = (since: number) => {
    const unlock = getUnlockTimestamp(since);
    if (unlock === 0) {
      return true;
    }
    return currentTimestamp >= unlock;
  };

  const formatUnlockDate = (since: number) => {
    const unlock = getUnlockTimestamp(since);
    if (unlock === 0) {
      return 'Sin bloqueo';
    }
    const date = new Date(unlock * 1000);
    return date.toLocaleString();
  };
  const votingUnlocked = isStakeUnlocked(userBalance.votingStakeSince);
  const proposingUnlocked = isStakeUnlocked(userBalance.proposingStakeSince);

  const handleStakeVoting = async () => {
    if (!signer || !votingAmount) return;

    setLoading(true);
    setError(null);

    try {
      const contract = getContract(contractAddress, signer);
      const amountInWei = ethers.parseEther(votingAmount);
      await ensureAllowance(amountInWei);
      const gasOverrides = getGasOverrides();
      const tx = await contract.stakeForVoting(amountInWei, gasOverrides);
      await tx.wait();

      setVotingAmount('');
      onSuccess();
    } catch (err: any) {
      setError(err.reason || err.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStakeProposing = async () => {
    if (!signer || !proposingAmount) return;

    setLoading(true);
    setError(null);

    try {
      const contract = getContract(contractAddress, signer);
      const amountInWei = ethers.parseEther(proposingAmount);
      await ensureAllowance(amountInWei);
      const gasOverrides = getGasOverrides();
      const tx = await contract.stakeForProposing(amountInWei, gasOverrides);
      await tx.wait();

      setProposingAmount('');
      onSuccess();
    } catch (err: any) {
      setError(err.reason || err.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUnstakeVoting = async () => {
    if (!signer || !unstakeVotingAmount) return;
    if (!isStakeUnlocked(userBalance.votingStakeSince)) {
      setError(`Tus tokens para votar estarán desbloqueados el ${formatUnlockDate(userBalance.votingStakeSince)}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const contract = getContract(contractAddress, signer);
      const amountInWei = ethers.parseEther(unstakeVotingAmount);
      const gasOverrides = getGasOverrides();
      const tx = await contract.unstakeFromVoting(amountInWei, gasOverrides);
      await tx.wait();
      setUnstakeVotingAmount('');
      onSuccess();
    } catch (err: any) {
      setError(err.reason || err.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUnstakeProposing = async () => {
    if (!signer || !unstakeProposingAmount) return;
    if (!isStakeUnlocked(userBalance.proposingStakeSince)) {
      setError(`Tus tokens para proponer estarán desbloqueados el ${formatUnlockDate(userBalance.proposingStakeSince)}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const contract = getContract(contractAddress, signer);
      const amountInWei = ethers.parseEther(unstakeProposingAmount);
      const gasOverrides = getGasOverrides();
      const tx = await contract.unstakeFromProposing(amountInWei, gasOverrides);
      await tx.wait();
      setUnstakeProposingAmount('');
      onSuccess();
    } catch (err: any) {
      setError(err.reason || err.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-6 glow-hover">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span className="text-purple-500">🔒</span>
        Staking
      </h3>

      {!isConnected ? (
        <p className="text-zinc-400 text-sm">Connect your wallet to stake tokens</p>
      ) : (
        <div className="space-y-4">
          <div className="bg-[#0a0a0a] border border-zinc-800 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div>
                <p className="text-xs text-zinc-500 mb-1">Voting Stake</p>
                <p className="font-mono text-lg font-bold text-purple-400">{parseFloat(userBalance.votingStake).toFixed(4)}</p>
                <p className="text-[11px] text-zinc-500 mt-1">Desbloqueo: {formatUnlockDate(userBalance.votingStakeSince)}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-1">Proposing Stake</p>
                <p className="font-mono text-lg font-bold text-blue-400">{parseFloat(userBalance.proposingStake).toFixed(4)}</p>
                <p className="text-[11px] text-zinc-500 mt-1">Desbloqueo: {formatUnlockDate(userBalance.proposingStakeSince)}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-zinc-800">
              <p className="text-xs text-zinc-500 mb-1">Your Voting Power</p>
              <p className="font-mono text-2xl font-bold text-green-400">{userBalance.votingPower}</p>
            </div>
          </div>

          <div className="flex gap-2 p-1 bg-[#0a0a0a] rounded-lg">
            <button
              onClick={() => setActiveTab('voting')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'voting' ? 'bg-purple-500 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Voting
            </button>
            <button
              onClick={() => setActiveTab('proposing')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'proposing' ? 'bg-blue-500 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Proposing
            </button>
          </div>

          {activeTab === 'voting' ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Amount to Stake (Tokens)</label>
                <input
                  type="number"
                  value={votingAmount}
                  onChange={(e) => setVotingAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Amount to Unstake (Tokens)</label>
                <input
                  type="number"
                  value={unstakeVotingAmount}
                  onChange={(e) => setUnstakeVotingAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Gas Limit (optional)</label>
                <input
                  type="number"
                  value={customGasLimit}
                  onChange={(e) => setCustomGasLimit(e.target.value)}
                  placeholder="Ej: 300000"
                  className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                  disabled={loading}
                />
                <p className="text-xs text-zinc-500 mt-1">Si el estimado automático falla, ingresa un gas limit manual (mínimo 50000).</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleStakeVoting}
                  disabled={loading || !votingAmount}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Stake
                </button>
                <button
                  onClick={handleUnstakeVoting}
                  disabled={loading || !unstakeVotingAmount || !votingUnlocked}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Unstake
                </button>
              </div>
              {!votingUnlocked && (
                <p className="text-xs text-amber-400">Tus tokens estarán desbloqueados el {formatUnlockDate(userBalance.votingStakeSince)}.</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Amount to Stake (Tokens)</label>
                <input
                  type="number"
                  value={proposingAmount}
                  onChange={(e) => setProposingAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Amount to Unstake (Tokens)</label>
                <input
                  type="number"
                  value={unstakeProposingAmount}
                  onChange={(e) => setUnstakeProposingAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Gas Limit (optional)</label>
                <input
                  type="number"
                  value={customGasLimit}
                  onChange={(e) => setCustomGasLimit(e.target.value)}
                  placeholder="Ej: 300000"
                  className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                  disabled={loading}
                />
                <p className="text-xs text-zinc-500 mt-1">Si el estimado automático falla, ingresa un gas limit manual (mínimo 50000).</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleStakeProposing}
                  disabled={loading || !proposingAmount}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Stake
                </button>
                <button
                  onClick={handleUnstakeProposing}
                  disabled={loading || !unstakeProposingAmount || !proposingUnlocked}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Unstake
                </button>
              </div>
              {!proposingUnlocked && (
                <p className="text-xs text-amber-400">Tus tokens estarán desbloqueados el {formatUnlockDate(userBalance.proposingStakeSince)}.</p>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
