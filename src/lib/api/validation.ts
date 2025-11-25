import { ethers } from 'ethers';

export function validateAddress(address: string): boolean {
  return ethers.isAddress(address);
}

export function validateProposalId(id: string): boolean {
  try {
    const num = BigInt(id);
    return num >= 0n;
  } catch {
    return false;
  }
}

export class ValidationError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
