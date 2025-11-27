// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IDaoToken} from "./interfaces/IDaoToken.sol";

/**
 * @dev Base contract que contiene el estado compartido, tipos,
 *      eventos, errores y modifiers de la GovernanceDAO.
 */
abstract contract GovernanceBase is Ownable {
    enum ProposalStatus {
        ACTIVE,
        ACCEPTED,
        REJECTED
    }

    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        ProposalStatus status;
        bool executed;
        bool isTreasury;
        address treasuryRecipient;
        uint256 treasuryAmount;
    }

    struct StakeInfo {
        uint256 amount;
        uint256 since;
    }

    IDaoToken public immutable token;

    // Direccion multisig que actǧa como "dueño" de la DAO (owner de Ownable)
    // se configura en el constructor de Ownable.

    // Direccion de la multisig de panico.
    address public panicWallet;

    // Indica si la DAO esta pausada por "panico".
    bool public paused;

    // Parametros de la DAO configurables por el owner (multisig).
    uint256 public tokenPriceWei; // precio de 1 token (1 * 10^18 unidades) en wei
    uint256 public minStakeForVoting;
    uint256 public minStakeForProposing;
    uint256 public minStakeLockTime; // en segundos
    uint256 public proposalDuration; // en segundos
    uint256 public tokensPerVotePower; // cuantos tokens equivalen a 1 unidad de poder de voto
    
    // Protección contra ataque del 51%
    uint256 public quorumPercentage; // Porcentaje mínimo de participación (en base 100)
    uint256 public approvalPercentage; // Porcentaje mínimo de aprobación (en base 100)

    uint256 public nextProposalId;
    
    // Total de poder de voto stakeado (para calcular quorum)
    uint256 public totalVotingPower;

    mapping(uint256 proposalId => Proposal) public proposals;
    mapping(uint256 proposalId => mapping(address voter => bool)) public hasVoted;

    mapping(address user => StakeInfo) public votingStake;
    mapping(address user => StakeInfo) public proposingStake;

    event PanicWalletUpdated(address indexed newPanicWallet);
    event PanicActivated(address indexed caller);
    event CalmActivated(address indexed caller);

    event ParametersUpdated(
        uint256 tokenPriceWei,
        uint256 minStakeForVoting,
        uint256 minStakeForProposing,
        uint256 minStakeLockTime,
        uint256 proposalDuration,
        uint256 tokensPerVotePower
    );
    
    event QuorumUpdated(uint256 quorumPercentage, uint256 approvalPercentage);

    event StakedForVoting(address indexed user, uint256 amount);
    event UnstakedFromVoting(address indexed user, uint256 amount);
    event StakedForProposing(address indexed user, uint256 amount);
    event UnstakedFromProposing(address indexed user, uint256 amount);

    event ProposalCreated(
        uint256 indexed id,
        address indexed proposer,
        bool isTreasury,
        address treasuryRecipient,
        uint256 treasuryAmount
    );
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 votePower);
    event ProposalFinalized(uint256 indexed proposalId, ProposalStatus status);
    event TreasuryProposalExecuted(
        uint256 indexed proposalId,
        address indexed recipient,
        uint256 amount
    );

    error DAOIsPaused();
    error PanicWalletNotSet();
    error NotPanicWallet();
    error InvalidParameter();
    error InvalidProposal();
    error VotingNotAllowed();
    error AlreadyVoted();
    error InsufficientStake();
    error LockTimeNotReached();
    error InvalidTreasuryProposal();
    error ProposalNotExecutable();
    error QuorumNotReached();
    error ApprovalThresholdNotReached();

    modifier daoOperational() {
        if (paused) {
            revert DAOIsPaused();
        }
        if (panicWallet == address(0)) {
            revert PanicWalletNotSet();
        }
        _;
    }

    modifier onlyPanicWallet() {
        if (msg.sender != panicWallet) {
            revert NotPanicWallet();
        }
        _;
    }

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
    ) Ownable(initialOwner) {
        if (tokenAddress == address(0)) {
            revert InvalidParameter();
        }
        token = IDaoToken(tokenAddress);

        // Set the panic wallet to the initial owner so the DAO works right after deployment.
        panicWallet = initialOwner;
        emit PanicWalletUpdated(initialOwner);

        _updateParameters(
            _tokenPriceWei,
            _minStakeForVoting,
            _minStakeForProposing,
            _minStakeLockTime,
            _proposalDuration,
            _tokensPerVotePower
        );
        
        _updateQuorum(_quorumPercentage, _approvalPercentage);
    }

    function _updateParameters(
        uint256 _tokenPriceWei,
        uint256 _minStakeForVoting,
        uint256 _minStakeForProposing,
        uint256 _minStakeLockTime,
        uint256 _proposalDuration,
        uint256 _tokensPerVotePower
    ) internal {
        if (
            _tokenPriceWei == 0 ||
            _minStakeForVoting == 0 ||
            _minStakeForProposing == 0 ||
            _proposalDuration == 0 ||
            _tokensPerVotePower == 0
        ) {
            revert InvalidParameter();
        }

        tokenPriceWei = _tokenPriceWei;
        minStakeForVoting = _minStakeForVoting;
        minStakeForProposing = _minStakeForProposing;
        minStakeLockTime = _minStakeLockTime;
        proposalDuration = _proposalDuration;
        tokensPerVotePower = _tokensPerVotePower;

        emit ParametersUpdated(
            _tokenPriceWei,
            _minStakeForVoting,
            _minStakeForProposing,
            _minStakeLockTime,
            _proposalDuration,
            _tokensPerVotePower
        );
    }
    
    function _updateQuorum(uint256 _quorumPercentage, uint256 _approvalPercentage) internal {
        if (_quorumPercentage == 0 || _quorumPercentage > 100) {
            revert InvalidParameter();
        }
        if (_approvalPercentage == 0 || _approvalPercentage > 100) {
            revert InvalidParameter();
        }
        
        quorumPercentage = _quorumPercentage;
        approvalPercentage = _approvalPercentage;
        
        emit QuorumUpdated(_quorumPercentage, _approvalPercentage);
    }
}

