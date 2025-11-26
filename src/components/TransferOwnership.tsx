"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "@/src/lib/web3/hooks";
import { getContract } from "@/src/lib/web3/contract";

interface TransferOwnershipProps {
  contractAddress: string;
  ownerAddress?: string;
  onSuccess: () => void;
}

export default function TransferOwnership({
  contractAddress,
  ownerAddress,
  onSuccess,
}: TransferOwnershipProps) {
  const { signer, account, isConnected } = useWeb3();
  const [newOwner, setNewOwner] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isOwnerConnected =
    !!account &&
    !!ownerAddress &&
    account.toLowerCase() === ownerAddress.toLowerCase();

  const isValidAddress = ethers.isAddress(newOwner.trim());

  const handleTransfer = async () => {
    if (!signer || !isOwnerConnected || !isValidAddress) {
      setError("Ingresa una dirección válida del nuevo owner.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const contract = getContract(contractAddress, signer);
      const tx = await contract.transferOwnership(newOwner.trim());
      await tx.wait();
      setSuccess("Ownership transferida correctamente.");
      setNewOwner("");
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
        <span className="text-rose-400">🔑</span>
        Transferir ownership
      </h2>
      <p className="text-xs text-zinc-500 mb-4">
        Solo el owner actual puede ejecutar esta acción.
      </p>

      <input
        type="text"
        value={newOwner}
        onChange={(e) => setNewOwner(e.target.value)}
        placeholder="0x..."
        className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-3 text-white font-mono text-sm focus:border-rose-400 focus:outline-none mb-3"
        disabled={loading}
      />

      <button
        onClick={handleTransfer}
        disabled={loading || !isValidAddress}
        className="w-full bg-rose-500 hover:bg-rose-600 text-white px-4 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Transfiriendo..." : "Transfer Ownership"}
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
