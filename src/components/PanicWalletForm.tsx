"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "@/src/lib/web3/hooks";
import { getContract } from "@/src/lib/web3/contract";
import { getFriendlyErrorMessage } from "@/src/lib/errors/messages";

interface PanicWalletFormProps {
  contractAddress: string;
  ownerAddress?: string;
  currentPanicWallet?: string;
  onSuccess: () => void;
}

export default function PanicWalletForm({
  contractAddress,
  ownerAddress,
  currentPanicWallet,
  onSuccess,
}: PanicWalletFormProps) {
  const { signer, account, isConnected } = useWeb3();
  const [newWallet, setNewWallet] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isOwnerConnected =
    !!account &&
    !!ownerAddress &&
    account.toLowerCase() === ownerAddress.toLowerCase();

  const candidate = newWallet.trim();
  const canSubmit = candidate !== "" && ethers.isAddress(candidate);

  const handleSubmit = async () => {
    if (!signer || !isOwnerConnected || !canSubmit) {
      setError("Ingresa una dirección válida.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const contract = getContract(contractAddress, signer);
      const tx = await contract.setPanicWallet(candidate);
      await tx.wait();
      setSuccess("Panic wallet actualizada correctamente.");
      setNewWallet("");
      onSuccess();
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err));
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
        <span className="text-orange-400">⚠️</span>
        Panic wallet
      </h2>
      <p className="text-xs text-zinc-500 mb-3">
        Actual owner de pánico:
        <span className="block font-mono text-orange-300">
          {currentPanicWallet || "No configurada"}
        </span>
      </p>
      <input
        type="text"
        value={newWallet}
        onChange={(e) => setNewWallet(e.target.value)}
        placeholder="0x..."
        className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-3 text-white font-mono text-sm focus:border-orange-400 focus:outline-none mb-3"
        disabled={loading}
      />
      <button
        onClick={handleSubmit}
        disabled={loading || !canSubmit}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Actualizando..." : "Actualizar panic wallet"}
      </button>
      {error && (
        <p className="text-sm text-red-400 mt-3 bg-red-500/10 border border-red-500/20 p-2 rounded">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-green-400 mt-3 bg-green-500/10 border border-green-500/20 p-2 rounded">
          {success}
        </p>
      )}
    </div>
  );
}
