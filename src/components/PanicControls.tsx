"use client";

import { useState } from "react";
import { useWeb3 } from "@/src/lib/web3/hooks";
import { getContract } from "@/src/lib/web3/contract";
import { getFriendlyErrorMessage } from "@/src/lib/errors/messages";

interface PanicControlsProps {
  contractAddress: string;
  isPaused: boolean;
  panicWallet?: string;
  onSuccess: () => void;
}

export default function PanicControls({
  contractAddress,
  isPaused,
  panicWallet,
  onSuccess,
}: PanicControlsProps) {
  const { signer, account, isConnected } = useWeb3();
  const [loadingAction, setLoadingAction] = useState<"panic" | "calm" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const isPanicWalletConnected =
    !!signer &&
    !!panicWallet &&
    !!account &&
    account.toLowerCase() === panicWallet.toLowerCase();

  const handleAction = async (action: "panic" | "calm") => {
    if (!signer || !isPanicWalletConnected) {
      setError("Debes conectarte con la wallet de pánico para usar estos controles.");
      return;
    }

    setLoadingAction(action);
    setError(null);

    try {
      const contract = getContract(contractAddress, signer);
      const tx =
        action === "panic" ? await contract.panico() : await contract.tranquilidad();
      await tx.wait();
      onSuccess();
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoadingAction(null);
    }
  };

  if (!isConnected || !account || !panicWallet || !isPanicWalletConnected) {
    return null;
  }

  return (
    <div className="bg-[#111111] border border-[#1e1e1e] rounded-xl p-6 glow-hover">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold mb-1">Controles de Pánico</h2>
          <p className="text-sm text-zinc-500">
            Solo visible para el owner de la DAO.
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            isPaused
              ? "bg-red-500/20 text-red-400 border border-red-500/30"
              : "bg-green-500/20 text-green-400 border border-green-500/30"
          }`}
        >
          {isPaused ? "Modo pánico activo" : "Modo normal"}
        </span>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => handleAction("panic")}
          disabled={loadingAction !== null || isPaused}
          className="w-full bg-red-500/90 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loadingAction === "panic" ? "Activando..." : "Activar pánico"}
        </button>
        <button
          onClick={() => handleAction("calm")}
          disabled={loadingAction !== null || !isPaused}
          className="w-full bg-green-500/80 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loadingAction === "calm" ? "Desactivando..." : "Desactivar pánico"}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-400 mt-3 bg-red-500/10 border border-red-500/20 p-2 rounded">
          {error}
        </p>
      )}
    </div>
  );
}
