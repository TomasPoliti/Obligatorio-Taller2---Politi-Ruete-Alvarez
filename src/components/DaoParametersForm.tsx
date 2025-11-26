"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "@/src/lib/web3/hooks";
import { getContract } from "@/src/lib/web3/contract";
import { getFriendlyErrorMessage } from "@/src/lib/errors/messages";

interface DaoParametersFormProps {
  contractAddress: string;
  parameters: {
    tokenPriceFormatted: string;
    minStakeForVotingFormatted: string;
    minStakeForProposingFormatted: string;
    minStakeLockTime: number;
    proposalDuration: number;
    tokensPerVotePowerFormatted: string;
  } | null;
  onSuccess: () => void;
  ownerAddress?: string;
}

export default function DaoParametersForm({
  contractAddress,
  parameters,
  onSuccess,
  ownerAddress,
}: DaoParametersFormProps) {
  const { signer, account, isConnected } = useWeb3();
  const [formState, setFormState] = useState({
    tokenPrice: "",
    minStakeVoting: "",
    minStakeProposing: "",
    minStakeLockTime: "",
    proposalDuration: "",
    tokensPerVotePower: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isOwnerConnected =
    !!account &&
    !!ownerAddress &&
    account.toLowerCase() === ownerAddress.toLowerCase();

  useEffect(() => {
    if (!parameters) return;
    setFormState({
      tokenPrice: parameters.tokenPriceFormatted,
      minStakeVoting: parameters.minStakeForVotingFormatted,
      minStakeProposing: parameters.minStakeForProposingFormatted,
      minStakeLockTime: parameters.minStakeLockTime.toString(),
      proposalDuration: parameters.proposalDuration.toString(),
      tokensPerVotePower: parameters.tokensPerVotePowerFormatted,
    });
  }, [parameters]);

  const handleChange = (field: keyof typeof formState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!signer || !isOwnerConnected) {
      setError("Debes estar conectado con la wallet owner.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const contract = getContract(contractAddress, signer);

      const tx = await contract.setParameters(
        ethers.parseEther(formState.tokenPrice || "0"),
        ethers.parseEther(formState.minStakeVoting || "0"),
        ethers.parseEther(formState.minStakeProposing || "0"),
        BigInt(formState.minStakeLockTime || "0"),
        BigInt(formState.proposalDuration || "0"),
        ethers.parseEther(formState.tokensPerVotePower || "0"),
      );

      await tx.wait();
      setSuccessMessage("Parámetros actualizados correctamente.");
      onSuccess();
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!isOwnerConnected || !isConnected || !contractAddress) {
    return null;
  }

  return (
    <div className="bg-[#111111] border border-[#1e1e1e] rounded-xl p-6 glow-hover">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span className="text-amber-400">🛠️</span>
        Configuración de la DAO
      </h2>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">
              Token Price (ETH)
            </label>
            <input
              type="number"
              step="0.000001"
              value={formState.tokenPrice}
              onChange={(e) => handleChange("tokenPrice", e.target.value)}
              className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-500 mb-1 block">
              Min Stake Voting (tokens)
            </label>
            <input
              type="number"
              step="0.0001"
              value={formState.minStakeVoting}
              onChange={(e) => handleChange("minStakeVoting", e.target.value)}
              className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-500 mb-1 block">
              Min Stake Proposing (tokens)
            </label>
            <input
              type="number"
              step="0.0001"
              value={formState.minStakeProposing}
              onChange={(e) =>
                handleChange("minStakeProposing", e.target.value)
              }
              className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-500 mb-1 block">
              Lock Time (segundos)
            </label>
            <input
              type="number"
              value={formState.minStakeLockTime}
              onChange={(e) =>
                handleChange("minStakeLockTime", e.target.value)
              }
              className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-500 mb-1 block">
              Proposal Duration (segundos)
            </label>
            <input
              type="number"
              value={formState.proposalDuration}
              onChange={(e) =>
                handleChange("proposalDuration", e.target.value)
              }
              className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-500 mb-1 block">
              Tokens por unidad de voto
            </label>
            <input
              type="number"
              step="0.0001"
              value={formState.tokensPerVotePower}
              onChange={(e) =>
                handleChange("tokensPerVotePower", e.target.value)
              }
              className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white px-4 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Actualizando..." : "Actualizar parámetros"}
        </button>
      </form>

      {error && (
        <p className="text-sm text-red-400 mt-3 bg-red-500/10 border border-red-500/20 p-2 rounded">
          {error}
        </p>
      )}
      {successMessage && (
        <p className="text-sm text-green-400 mt-3 bg-green-500/10 border border-green-500/20 p-2 rounded">
          {successMessage}
        </p>
      )}
    </div>
  );
}
