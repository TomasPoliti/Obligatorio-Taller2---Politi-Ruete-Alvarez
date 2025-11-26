'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { getContract } from '@/src/lib/web3/contract';
import { useWeb3 } from '@/src/lib/web3/hooks';

interface CreateProposalProps {
  contractAddress: string;
  onSuccess: () => void;
  minStakeProposing?: string;
  proposingStake?: string;
}

export default function CreateProposal({
  contractAddress,
  onSuccess,
  minStakeProposing,
  proposingStake,
}: CreateProposalProps) {
  const { signer, isConnected } = useWeb3();
  const [activeTab, setActiveTab] = useState<'standard' | 'treasury'>('standard');

  const [standardTitle, setStandardTitle] = useState('');
  const [standardDescription, setStandardDescription] = useState('');
  const [treasuryDescription, setTreasuryDescription] = useState('');
  const [treasuryTitle, setTreasuryTitle] = useState('');
  const [treasuryRecipient, setTreasuryRecipient] = useState('');
  const [treasuryAmount, setTreasuryAmount] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const hasRequiredProposingStake = () => {
    if (!minStakeProposing) return true;
    try {
      const required = ethers.parseEther(minStakeProposing);
      const current = ethers.parseEther(proposingStake || '0');
      return current >= required;
    } catch {
      return true;
    }
  };

  const handleCreateStandardProposal = async () => {
    if (!signer || !standardDescription || !standardTitle) return;
    if (!hasRequiredProposingStake()) {
      setError('Necesitas stakear el mínimo requerido para proponer antes de crear una propuesta.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const contract = getContract(contractAddress, signer);
      const tx = await contract.createProposal(standardTitle, standardDescription);
      await tx.wait();

      setStandardTitle('');
      setStandardDescription('');
      setSuccess('Proposal created successfully!');
      onSuccess();
    } catch (err: any) {
      setError(err.reason || err.message || 'Failed to create proposal');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTreasuryProposal = async () => {
    if (
      !signer ||
      !treasuryDescription ||
      !treasuryRecipient ||
      !treasuryAmount ||
      !treasuryTitle
    )
      return;
    if (!hasRequiredProposingStake()) {
      setError('Necesitas stakear el mínimo requerido para proponer antes de crear una propuesta.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const contract = getContract(contractAddress, signer);
      const amountInWei = ethers.parseEther(treasuryAmount);
      const tx = await contract.createTreasuryProposal(
        treasuryTitle,
        treasuryDescription,
        treasuryRecipient,
        amountInWei
      );
      await tx.wait();

      setTreasuryTitle('');
      setTreasuryDescription('');
      setTreasuryRecipient('');
      setTreasuryAmount('');
      setSuccess('Treasury proposal created successfully!');
      onSuccess();
    } catch (err: any) {
      setError(err.reason || err.message || 'Failed to create treasury proposal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-6 glow-hover">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span className="text-yellow-500">✨</span>
        Create Proposal
      </h3>

      {!isConnected ? (
        <p className="text-zinc-400 text-sm">Connect your wallet to create proposals</p>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2 p-1 bg-[#0a0a0a] rounded-lg">
            <button
              onClick={() => setActiveTab('standard')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'standard' ? 'bg-yellow-500 text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Standard Proposal
            </button>
            <button
              onClick={() => setActiveTab('treasury')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'treasury' ? 'bg-green-500 text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Treasury Proposal
            </button>
          </div>

          {activeTab === 'standard' ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Proposal Title</label>
                <input
                  type="text"
                  value={standardTitle}
                  onChange={(e) => setStandardTitle(e.target.value)}
                  placeholder="Give your proposal a title..."
                  className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Proposal Description</label>
                <textarea
                  value={standardDescription}
                  onChange={(e) => setStandardDescription(e.target.value)}
                  placeholder="Describe your proposal..."
                  rows={4}
                  className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-yellow-500 focus:outline-none resize-none"
                  disabled={loading}
                />
              </div>

              <button
                onClick={handleCreateStandardProposal}
                disabled={loading || !standardDescription || !standardTitle}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  'Create Standard Proposal'
                )}
              </button>
              {minStakeProposing && (
                <p className="text-xs text-zinc-500">
                  Debes tener al menos{' '}
                  <span className="text-yellow-300 font-mono">
                    {parseFloat(minStakeProposing).toFixed(4)} tokens
                  </span>{' '}
                  staked en la pestaña "Proposing" para crear propuestas (actualmente tienes{' '}
                  {parseFloat(proposingStake || '0').toFixed(4)}).
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Proposal Title</label>
                <input
                  type="text"
                  value={treasuryTitle}
                  onChange={(e) => setTreasuryTitle(e.target.value)}
                  placeholder="Title for treasury proposal..."
                  className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-green-500 focus:outline-none"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Proposal Description</label>
                <textarea
                  value={treasuryDescription}
                  onChange={(e) => setTreasuryDescription(e.target.value)}
                  placeholder="Describe your treasury proposal..."
                  rows={3}
                  className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-green-500 focus:outline-none resize-none"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Recipient Address</label>
                <input
                  type="text"
                  value={treasuryRecipient}
                  onChange={(e) => setTreasuryRecipient(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-3 text-white font-mono focus:border-green-500 focus:outline-none"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Amount (ETH)</label>
                <input
                  type="number"
                  value={treasuryAmount}
                  onChange={(e) => setTreasuryAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-3 text-white font-mono focus:border-green-500 focus:outline-none"
                  disabled={loading}
                />
              </div>

              <button
                onClick={handleCreateTreasuryProposal}
                disabled={
                  loading ||
                  !treasuryDescription ||
                  !treasuryRecipient ||
                  !treasuryAmount ||
                  !treasuryTitle
                }
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  'Create Treasury Proposal'
                )}
              </button>
              {minStakeProposing && (
                <p className="text-xs text-zinc-500">
                  Debes tener al menos{' '}
                  <span className="text-green-300 font-mono">
                    {parseFloat(minStakeProposing).toFixed(4)} tokens
                  </span>{' '}
                  staked en "Proposing" (actualmente tienes {parseFloat(proposingStake || '0').toFixed(4)}).
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-green-400 text-sm">
              {success}
            </div>
          )}

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <p className="text-xs text-yellow-400 mb-2">ℹ️ Requirements:</p>
            <ul className="text-xs text-zinc-400 space-y-1 list-disc list-inside">
              <li>You must have sufficient staked tokens to create proposals</li>
              <li>Treasury proposals require specifying a recipient and amount</li>
              <li>Proposals require community voting to pass</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
