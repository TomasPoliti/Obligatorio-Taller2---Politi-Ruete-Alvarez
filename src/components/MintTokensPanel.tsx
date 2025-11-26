"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "@/src/lib/web3/hooks";
import { getContract } from "@/src/lib/web3/contract";

interface MintTokensPanelProps {
  contractAddress: string;
  ownerAddress?: string;
  onSuccess: () => void;
}

export default function MintTokensPanel({
  contractAddress,
  ownerAddress,
  onSuccess,
}: MintTokensPanelProps) {
  const { signer, account, isConnected } = useWeb3();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isOwnerConnected =
    !!account &&
    !!ownerAddress &&
    account.toLowerCase() === ownerAddress.toLowerCase();

  const canSubmit = amount.trim() !== "" && Number(amount) > 0;

  const handleMint = async () => {
    if (!signer || !isOwnerConnected || !canSubmit) {
      setError("Completa los campos con valores válidos.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const contract = getContract(contractAddress, signer);
      const amountInWei = ethers.parseEther(amount);
      const tx = await contract.mintDaoTokens(contractAddress, amountInWei);
      await tx.wait();
      setSuccess("Tokens minteados correctamente.");
      setAmount("");
      onSuccess();
    } catch (err: any) {
      setError(err?.reason || err?.message || "Transacción fallida");
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected || !isOwnerConnected) {
    return null;
  }

  return (
    <div className="bg-[#111111] border border-[#1e1e1e] rounded-xl p-6 glow-hover">
      <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
        <span className="text-emerald-400">🪙</span>
        Mintear tokens
      </h2>
      <p className="text-xs text-zinc-500 mb-4">
        Solo el owner puede mintear nuevos tokens de gobernanza.
      </p>

      <div className="space-y-3">
        <div className="text-xs text-zinc-500 mb-2">
          Los tokens se mintean al contrato de la DAO:
          <span className="block font-mono text-emerald-300">{contractAddress}</span>
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">
            Cantidad (tokens)
          </label>
          <input
            type="number"
            min="0"
            step="0.0001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1000"
            className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-emerald-400 focus:outline-none"
            disabled={loading}
          />
        </div>

        <button
          onClick={handleMint}
          disabled={loading || !canSubmit}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Minteando..." : "Mint Tokens"}
        </button>

        {error && (
          <p className="text-sm text-red-400 mt-2 bg-red-500/10 border border-red-500/20 p-2 rounded">
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm text-green-400 mt-2 bg-green-500/10 border border-green-500/20 p-2 rounded">
            {success}
          </p>
        )}
      </div>
    </div>
  );
}
