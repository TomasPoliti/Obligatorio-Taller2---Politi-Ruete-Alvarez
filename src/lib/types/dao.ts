export enum ProposalStatus {
  ACTIVE = 0,
  ACCEPTED = 1,
  REJECTED = 2
}

export type Proposal = {
  id: string;
  proposer: string;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  forVotes: string;
  forVotesFormatted: string;
  againstVotes: string;
  againstVotesFormatted: string;
  status: ProposalStatus;
  executed: boolean;
  isTreasury: boolean;
  treasuryRecipient: string;
  treasuryAmount: string;
  treasuryAmountFormatted: string;
};

export type StakeInfo = {
  amount: string;
  amountFormatted: string;
  since: number;
  lockedUntil: number;
  isLocked: boolean;
};

export type DAOParameters = {
  tokenPriceWei: string;
  tokenPriceFormatted: string;
  minStakeForVoting: string;
  minStakeForVotingFormatted: string;
  minStakeForProposing: string;
  minStakeForProposingFormatted: string;
  minStakeLockTime: number;
  proposalDuration: number;
  tokensPerVotePower: string;
  tokensPerVotePowerFormatted: string;
};

export type DAOStatus = {
  paused: boolean;
  panicWallet: string;
  owner: string;
};
