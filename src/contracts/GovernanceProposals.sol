// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./GovernanceStaking.sol";

/**
 * @dev Logica de propuestas, votos y propuestas de treasury.
 */
abstract contract GovernanceProposals is GovernanceStaking {
    // ---- Propuestas ----

    function createProposal(
        string memory title,
        string memory description
    ) external daoOperational returns (uint256) {
        return _createProposal(title, description, false, address(0), 0);
    }

    function createTreasuryProposal(
        string memory title,
        string memory description,
        address recipient,
        uint256 amount
    ) external daoOperational returns (uint256) {
        if (recipient == address(0) || amount == 0) {
            revert InvalidTreasuryProposal();
        }
        return _createProposal(title, description, true, recipient, amount);
    }

    function _createProposal(
        string memory title,
        string memory description,
        bool isTreasury,
        address recipient,
        uint256 amount
    ) internal returns (uint256) {
        StakeInfo storage stakeInfo = proposingStake[msg.sender];
        if (stakeInfo.amount < minStakeForProposing) {
            revert InsufficientStake();
        }

        uint256 proposalId = nextProposalId++;

        Proposal storage p = proposals[proposalId];
        p.id = proposalId;
        p.proposer = msg.sender;
        p.title = title;
        p.description = description;
        p.startTime = block.timestamp;
        p.endTime = block.timestamp + proposalDuration;
        p.status = ProposalStatus.ACTIVE;
        p.isTreasury = isTreasury;
        p.treasuryRecipient = recipient;
        p.treasuryAmount = amount;

        emit ProposalCreated(proposalId, msg.sender, isTreasury, recipient, amount);
        return proposalId;
    }

    function vote(uint256 proposalId, bool support) external daoOperational {
        Proposal storage p = proposals[proposalId];
        if (p.proposer == address(0)) {
            revert InvalidProposal();
        }
        if (p.status != ProposalStatus.ACTIVE) {
            revert VotingNotAllowed();
        }
        if (block.timestamp >= p.endTime) {
            revert VotingNotAllowed();
        }
        if (hasVoted[proposalId][msg.sender]) {
            revert AlreadyVoted();
        }

        StakeInfo storage stakeInfo = votingStake[msg.sender];
        if (stakeInfo.amount < minStakeForVoting) {
            revert InsufficientStake();
        }

        uint256 power = votingPower(msg.sender);
        if (power == 0) {
            revert InsufficientStake();
        }

        hasVoted[proposalId][msg.sender] = true;

        if (support) {
            p.forVotes += power;
        } else {
            p.againstVotes += power;
        }

        emit VoteCast(proposalId, msg.sender, support, power);
    }

    function finalizeProposal(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        if (p.proposer == address(0)) {
            revert InvalidProposal();
        }
        if (p.status != ProposalStatus.ACTIVE) {
            revert VotingNotAllowed();
        }
        if (block.timestamp < p.endTime) {
            revert VotingNotAllowed();
        }

        if (p.forVotes > p.againstVotes) {
            p.status = ProposalStatus.ACCEPTED;
        } else {
            p.status = ProposalStatus.REJECTED;
        }

        emit ProposalFinalized(proposalId, p.status);
    }

    function executeTreasuryProposal(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        if (!p.isTreasury) {
            revert InvalidTreasuryProposal();
        }
        if (p.status != ProposalStatus.ACCEPTED || p.executed) {
            revert ProposalNotExecutable();
        }
        if (address(this).balance < p.treasuryAmount) {
            revert InvalidTreasuryProposal();
        }

        p.executed = true;

        (bool success, ) = p.treasuryRecipient.call{value: p.treasuryAmount}("");
        require(success, "Transfer failed");

        emit TreasuryProposalExecuted(proposalId, p.treasuryRecipient, p.treasuryAmount);
    }

    // ---- Helpers de lectura ----

    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        Proposal memory p = proposals[proposalId];
        if (p.proposer == address(0)) {
            revert InvalidProposal();
        }
        return p;
    }

    function getProposalsCount() external view returns (uint256) {
        return nextProposalId;
    }

    // ---- Recepcion de ETH ----

    receive() external payable {}

    fallback() external payable {}
}

