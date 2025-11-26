'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { ethers, BrowserProvider, JsonRpcSigner } from 'ethers';

interface Web3ContextValue {
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  account: string | null;
  chainId: number | null;
  isConnecting: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isConnected: boolean;
}

const Web3Context = createContext<Web3ContextValue | undefined>(undefined);

export function Web3Provider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!window.ethereum) {
      setError('Please install MetaMask or another Web3 wallet');
      return;
    }

    const web3Provider = new ethers.BrowserProvider(window.ethereum);
    setProvider(web3Provider);

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        web3Provider.getSigner().then(setSigner).catch(() => setSigner(null));
      } else {
        setAccount(null);
        setSigner(null);
      }
    };

    const handleChainChanged = (newChainId: string) => {
      const parsed = Number(newChainId);
      setChainId(Number.isNaN(parsed) ? null : parsed);
      web3Provider.getSigner().then(setSigner).catch(() => setSigner(null));
    };

    window.ethereum
      .request({ method: 'eth_accounts' })
      .then(handleAccountsChanged)
      .catch((err: Error) => {
        console.error('Error fetching accounts', err);
      });

    web3Provider
      .getNetwork()
      .then((network) => setChainId(Number(network.chainId)))
      .catch((err) => {
        console.error('Error fetching network', err);
      });

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener(
        'accountsChanged',
        handleAccountsChanged,
      );
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setError('Please install MetaMask or another Web3 wallet');
      return;
    }

    if (!provider) {
      setError('Wallet provider not ready yet, try again in a moment');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const accounts = await provider.send('eth_requestAccounts', []);
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        const web3Signer = await provider.getSigner();
        setSigner(web3Signer);
      }

      const network = await provider.getNetwork();
      setChainId(Number(network.chainId));
    } catch (err: any) {
      console.error('Error connecting wallet', err);
      setError(err?.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  }, [provider]);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setSigner(null);
  }, []);

  const value = useMemo<Web3ContextValue>(
    () => ({
      provider,
      signer,
      account,
      chainId,
      isConnecting,
      error,
      connectWallet,
      disconnectWallet,
      isConnected: !!account,
    }),
    [
      provider,
      signer,
      account,
      chainId,
      isConnecting,
      error,
      connectWallet,
      disconnectWallet,
    ],
  );

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string }) => Promise<any>;
      on: (event: string, handler: (...args: any[]) => void) => void;
      removeListener: (
        event: string,
        handler: (...args: any[]) => void,
      ) => void;
    };
  }
}
