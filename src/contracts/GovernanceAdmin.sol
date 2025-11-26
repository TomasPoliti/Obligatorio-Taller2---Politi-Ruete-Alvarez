// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./GovernanceBase.sol";

/**
 * @dev Funcionalidades administrativas: configuracion de parametros,
 *      wallet de panico y compra de tokens.
 */
abstract contract GovernanceAdmin is GovernanceBase {
    // ---- Admin / configuracion ----

    function setPanicWallet(address newPanicWallet) external onlyOwner {
        if (newPanicWallet == address(0)) {
            revert InvalidParameter();
        }
        panicWallet = newPanicWallet;
        emit PanicWalletUpdated(newPanicWallet);
    }

    function setParameters(
        uint256 _tokenPriceWei,
        uint256 _minStakeForVoting,
        uint256 _minStakeForProposing,
        uint256 _minStakeLockTime,
        uint256 _proposalDuration,
        uint256 _tokensPerVotePower
    ) external onlyOwner {
        _updateParameters(
            _tokenPriceWei,
            _minStakeForVoting,
            _minStakeForProposing,
            _minStakeLockTime,
            _proposalDuration,
            _tokensPerVotePower
        );
    }

    // ---- Panico / tranquilidad ----

    function panico() external onlyPanicWallet {
        paused = true;
        emit PanicActivated(msg.sender);
    }

    function tranquilidad() external onlyPanicWallet {
        paused = false;
        emit CalmActivated(msg.sender);
    }

    // ---- Compra de tokens ----

    function buyTokens() external payable daoOperational {
        if (msg.value == 0) {
            revert InvalidParameter();
        }

        // Se asume 18 decimales en el token.
        uint256 tokensToBuy = (msg.value * 1e18) / tokenPriceWei;
        if (tokensToBuy == 0) {
            revert InvalidParameter();
        }

        uint256 balance = token.balanceOf(address(this));
        if (balance < tokensToBuy) {
            revert InvalidParameter();
        }

        bool ok = token.transfer(msg.sender, tokensToBuy);
        require(ok, "Token transfer failed");
    }

    function mintDaoTokens(address to, uint256 amount) external onlyOwner {
        if (to == address(0) || amount == 0) {
            revert InvalidParameter();
        }
        token.mint(to, amount);
    }
}
