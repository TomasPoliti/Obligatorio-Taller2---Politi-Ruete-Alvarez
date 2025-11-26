"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getContract } from "@/src/lib/web3/contract";
import { useWeb3 } from "@/src/lib/web3/hooks";
import { getFriendlyErrorMessage } from "@/src/lib/errors/messages";

interface TokenPurchaseProps {
  contractAddress: string;
  tokenPrice: string;
  onSuccess: () => void;
}

export default function TokenPurchase({
  contractAddress,
  tokenPrice,
  onSuccess,
}: TokenPurchaseProps) {
  const { signer, isConnected } = useWeb3();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ethBalance, setEthBalance] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      if (signer) {
        try {
          const address = await signer.getAddress();
          const balance = await signer.provider.getBalance(address);
          setEthBalance(ethers.formatEther(balance));
        } catch (err) {
          console.error("Failed to fetch balance:", err);
        }
      }
    };

    fetchBalance();
  }, [signer]);

  const handleBuyTokens = async () => {
    if (!signer || !amount) return;

    setLoading(true);
    setError(null);

    try {
      const contract = getContract(contractAddress, signer);
      const amountInWei = ethers.parseEther(amount);
      const pricePerToken = ethers.parseEther(tokenPrice);
      const totalCost = (amountInWei * pricePerToken) / ethers.parseEther("1");

      // buyTokens() takes no parameters, only ETH value
      const tx = await contract.buyTokens({ value: totalCost });
      await tx.wait();

      // Refresh balance after purchase
      const address = await signer.getAddress();
      const balance = await signer.provider.getBalance(address);
      setEthBalance(ethers.formatEther(balance));

      setAmount("");
      onSuccess();
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const calculateCost = () => {
    if (!amount || !tokenPrice) return "0";
    try {
      const amountInWei = ethers.parseEther(amount);
      const pricePerToken = ethers.parseEther(tokenPrice);
      const totalCost = (amountInWei * pricePerToken) / ethers.parseEther("1");
      return ethers.formatEther(totalCost);
    } catch {
      return "0";
    }
  };

  return (
    <div className="bg-[#111111] border border-[#1e1e1e] rounded-2xl p-6 glow-hover">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span className="text-green-500">💰</span>
        Buy DAO Tokens
      </h3>

      {!isConnected ? (
        <p className="text-zinc-400 text-sm">
          Connect your wallet to buy tokens
        </p>
      ) : (
        <div className="space-y-4">
          {ethBalance !== null && (
            <div className="bg-[#0a0a0a] border border-zinc-800 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">Your ETH Balance</span>
                <span className="text-white font-mono font-bold">
                  {parseFloat(ethBalance).toFixed(6)} ETH
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="text-sm text-zinc-400 mb-2 block">
              Amount (Tokens)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
              disabled={loading}
            />
          </div>

          <div className="bg-[#0a0a0a] border border-zinc-800 rounded-lg p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-zinc-400">Price per token</span>
              <span className="text-white font-mono">
                {parseFloat(tokenPrice).toFixed(6)} ETH
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Total cost</span>
              <span className="text-purple-400 font-mono font-bold">
                {parseFloat(calculateCost()).toFixed(6)} ETH
              </span>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleBuyTokens}
            disabled={loading || !amount}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              "Buy Tokens"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
