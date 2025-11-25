// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./GovernanceAdmin.sol";

/**
 * @dev Logica de staking para votar y proponer.
 */
abstract contract GovernanceStaking is GovernanceAdmin {
    // ---- Staking ----

    function stakeForVoting(uint256 amount) external daoOperational {
        if (amount == 0) {
            revert InvalidParameter();
        }

        StakeInfo storage info = votingStake[msg.sender];
        info.amount += amount;
        info.since = block.timestamp;

        bool ok = token.transferFrom(msg.sender, address(this), amount);
        require(ok, "Token transfer failed");

        emit StakedForVoting(msg.sender, amount);
    }

    function unstakeFromVoting(uint256 amount) external daoOperational {
        StakeInfo storage info = votingStake[msg.sender];
        if (amount == 0 || amount > info.amount) {
            revert InsufficientStake();
        }
        if (block.timestamp < info.since + minStakeLockTime) {
            revert LockTimeNotReached();
        }

        info.amount -= amount;
        bool ok = token.transfer(msg.sender, amount);
        require(ok, "Token transfer failed");

        emit UnstakedFromVoting(msg.sender, amount);
    }

    function stakeForProposing(uint256 amount) external daoOperational {
        if (amount == 0) {
            revert InvalidParameter();
        }

        StakeInfo storage info = proposingStake[msg.sender];
        info.amount += amount;
        info.since = block.timestamp;

        bool ok = token.transferFrom(msg.sender, address(this), amount);
        require(ok, "Token transfer failed");

        emit StakedForProposing(msg.sender, amount);
    }

    function unstakeFromProposing(uint256 amount) external daoOperational {
        StakeInfo storage info = proposingStake[msg.sender];
        if (amount == 0 || amount > info.amount) {
            revert InsufficientStake();
        }
        if (block.timestamp < info.since + minStakeLockTime) {
            revert LockTimeNotReached();
        }

        info.amount -= amount;
        bool ok = token.transfer(msg.sender, amount);
        require(ok, "Token transfer failed");

        emit UnstakedFromProposing(msg.sender, amount);
    }

    function votingPower(address account) public view returns (uint256) {
        return votingStake[account].amount / tokensPerVotePower;
    }
}

