'use client';

import type { ReactNode } from 'react';
import { Web3Provider } from '@/src/lib/web3/hooks';

export function AppProviders({ children }: { children: ReactNode }) {
  return <Web3Provider>{children}</Web3Provider>;
}
