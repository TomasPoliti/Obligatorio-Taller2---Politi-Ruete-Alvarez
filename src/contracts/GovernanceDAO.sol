// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./GovernanceProposals.sol";

/**
 * @title GovernanceDAO
 * @dev DAO basica con staking de tokens ERC20, propuestas, votos
 *      y un tipo de propuesta especial para manejar el treasury (Conjunto C).
 *
 * Incluye protección contra ataque del 51% mediante:
 * - Quorum mínimo: porcentaje mínimo de participación requerido
 * - Approval threshold: porcentaje mínimo de votos a favor sobre el total
 *
 * La logica esta separada en varios contratos abstractos:
 * - GovernanceBase: estado, tipos, eventos, errores y modifiers
 * - GovernanceAdmin: parametros de la DAO, panico/tranquilidad y compra de tokens
 * - GovernanceStaking: logica de staking para votar/proponer
 * - GovernanceProposals: manejo de propuestas, votos y treasury
 */
contract GovernanceDAO is GovernanceProposals {
    constructor(
        address initialOwner,
        address tokenAddress,
        uint256 _tokenPriceWei,
        uint256 _minStakeForVoting,
        uint256 _minStakeForProposing,
        uint256 _minStakeLockTime,
        uint256 _proposalDuration,
        uint256 _tokensPerVotePower,
        uint256 _quorumPercentage,
        uint256 _approvalPercentage
    )
        GovernanceBase(
            initialOwner,
            tokenAddress,
            _tokenPriceWei,
            _minStakeForVoting,
            _minStakeForProposing,
            _minStakeLockTime,
            _proposalDuration,
            _tokensPerVotePower,
            _quorumPercentage,
            _approvalPercentage
        )
    {}
}

