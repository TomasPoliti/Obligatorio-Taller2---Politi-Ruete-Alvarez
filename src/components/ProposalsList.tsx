'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { getContract } from '@/src/lib/web3/contract';
import { useWeb3 } from '@/src/lib/web3/hooks';

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

interface ProposalsListProps {
  contractAddress: string;
  proposals: Proposal[];
  onSuccess: () => void;
}

export default function ProposalsList({ contractAddress, proposals, onSuccess }: ProposalsListProps) {
  const { signer, isConnected, account } = useWeb3();
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVote = async (proposalId: number, support: boolean) => {
    if (!signer) return;

    setLoading(proposalId);
    setError(null);

    try {
      const contract = getContract(contractAddress, signer);
      const tx = await contract.vote(proposalId, support);
      await tx.wait();
      onSuccess();
    } catch (err: any) {
      setError(err.reason || err.message || 'Vote failed');
    } finally {
      setLoading(null);
    }
  };

  const handleExecute = async (proposalId: number, isTreasuryProposal: boolean) => {
    if (!signer) return;

    setLoading(proposalId);
    setError(null);

    try {
      const contract = getContract(contractAddress, signer);
      const tx = isTreasuryProposal
        ? await contract.executeTreasuryProposal(proposalId)
        : await contract.finalizeProposal(proposalId);
      await tx.wait();
      onSuccess();
    } catch (err: any) {
      setError(err.reason || err.message || 'Execution failed');
    } finally {
      setLoading(null);
    }
  };

  const isExpired = (deadline: number) => {
    return Date.now() / 1000 > deadline;
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-6 glow-hover">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span className="text-blue-500">📋</span>
        Active Proposals ({proposals.length})
      </h3>

      {!isConnected ? (
        <p className="text-zinc-400 text-sm">Connect your wallet to view and vote on proposals</p>
      ) : proposals.length === 0 ? (
        <p className="text-zinc-400 text-sm">No active proposals at the moment</p>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => {
            const totalVotes = BigInt(proposal.votesFor) + BigInt(proposal.votesAgainst);
            const forPercentage = totalVotes > 0n ? Number((BigInt(proposal.votesFor) * 100n) / totalVotes) : 0;
            const againstPercentage = totalVotes > 0n ? Number((BigInt(proposal.votesAgainst) * 100n) / totalVotes) : 0;
            const expired = isExpired(proposal.deadline);

            return (
              <div
                key={proposal.id}
                className="bg-[#0a0a0a] border border-zinc-800 rounded-lg p-4 hover:border-purple-500/30 transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                        #{proposal.id}
                      </span>
                      {proposal.isTreasuryProposal && (
                        <span className="text-xs font-mono bg-green-500/20 text-green-400 px-2 py-1 rounded">
                          TREASURY
                        </span>
                      )}
                      {proposal.executed && (
                        <span className="text-xs font-mono bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                          EXECUTED
                        </span>
                      )}
                      {expired && !proposal.executed && (
                        <span className="text-xs font-mono bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                          EXPIRED
                        </span>
                      )}
                    </div>
                    <p className="text-white font-medium mb-2">{proposal.description}</p>
                    <p className="text-xs text-zinc-500 mb-2">
                      Proposer: <span className="font-mono">{formatAddress(proposal.proposer)}</span>
                    </p>
                    {proposal.isTreasuryProposal && proposal.recipient && (
                      <div className="text-xs text-zinc-500 space-y-1">
                        <p>Recipient: <span className="font-mono">{formatAddress(proposal.recipient)}</span></p>
                        <p>Amount: <span className="font-mono text-green-400">{ethers.formatEther(proposal.amount || '0')} ETH</span></p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-green-400">For: {forPercentage}%</span>
                    <span className="text-red-400">Against: {againstPercentage}%</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden flex">
                    <div
                      className="bg-green-500 transition-all"
                      style={{ width: `${forPercentage}%` }}
                    ></div>
                    <div
                      className="bg-red-500 transition-all"
                      style={{ width: `${againstPercentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs mt-1 font-mono">
                    <span className="text-zinc-500">{ethers.formatEther(proposal.votesFor)} votes</span>
                    <span className="text-zinc-500">{ethers.formatEther(proposal.votesAgainst)} votes</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-zinc-500 mb-4">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    {expired
                      ? 'Voting ended'
                      : `Ends ${new Date(proposal.deadline * 1000).toLocaleString()}`}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleVote(proposal.id, true)}
                    disabled={loading === proposal.id || expired || proposal.executed}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Vote For
                  </button>
                  <button
                    onClick={() => handleVote(proposal.id, false)}
                    disabled={loading === proposal.id || expired || proposal.executed}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Vote Against
                  </button>
                  <button
                    onClick={() => handleExecute(proposal.id, proposal.isTreasuryProposal)}
                    disabled={loading === proposal.id || !expired || proposal.executed}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading === proposal.id ? 'Processing...' : 'Execute'}
                  </button>
                </div>
              </div>
            );
          })}

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
