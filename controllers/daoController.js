import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { ethers } = require("ethers");
const GovernanceDAOArtifact = require("../artifacts/contracts/GovernanceDAO.sol/GovernanceDAO.json");
const DaoTokenArtifact = require("../artifacts/contracts/DaoToken.sol/DaoToken.json");

const DAO_ADDRESS = process.env.DAO_ADDRESS || null;
const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS || null;
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";

const provider = new ethers.JsonRpcProvider(RPC_URL);

export async function getContracts() {
  if (!DAO_ADDRESS || !TOKEN_ADDRESS) {
    throw new Error("DAO_ADDRESS y TOKEN_ADDRESS deben estar configuradas");
  }

  const dao = new ethers.Contract(DAO_ADDRESS, GovernanceDAOArtifact.abi, provider);
  const token = new ethers.Contract(TOKEN_ADDRESS, DaoTokenArtifact.abi, provider);

  return { dao, token };
}

export async function getParameters(req, res) {
  try {
    const { dao } = await getContracts();

    const [
      tokenPriceWei,
      minStakeForVoting,
      minStakeForProposing,
      minStakeLockTime,
      proposalDuration,
      tokensPerVotePower,
      panicWallet,
      paused,
    ] = await Promise.all([
      dao.tokenPriceWei(),
      dao.minStakeForVoting(),
      dao.minStakeForProposing(),
      dao.minStakeLockTime(),
      dao.proposalDuration(),
      dao.tokensPerVotePower(),
      dao.panicWallet(),
      dao.paused(),
    ]);

    res.json({
      tokenPriceWei: tokenPriceWei.toString(),
      minStakeForVoting: minStakeForVoting.toString(),
      minStakeForProposing: minStakeForProposing.toString(),
      minStakeLockTime: Number(minStakeLockTime),
      proposalDuration: Number(proposalDuration),
      tokensPerVotePower: tokensPerVotePower.toString(),
      panicWallet,
      paused,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "No se pudieron obtener los parámetros de la DAO" });
  }
}

export async function getUserInfo(req, res) {
  try {
    const userAddress = req.params.address;
    if (!ethers.isAddress(userAddress)) {
      return res.status(400).json({ error: "Dirección inválida" });
    }

    const { dao, token } = await getContracts();

    const [tokenBalance, votingStake, proposingStake, votingPower] = await Promise.all([
      token.balanceOf(userAddress),
      dao.votingStake(userAddress),
      dao.proposingStake(userAddress),
      dao.votingPower(userAddress),
    ]);

    res.json({
      address: userAddress,
      tokenBalance: tokenBalance.toString(),
      votingStake: {
        amount: votingStake.amount.toString(),
        since: Number(votingStake.since),
      },
      proposingStake: {
        amount: proposingStake.amount.toString(),
        since: Number(proposingStake.since),
      },
      votingPower: votingPower.toString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "No se pudo obtener la información del usuario" });
  }
}

export async function listProposals(req, res) {
  try {
    const { dao } = await getContracts();
    const count = await dao.getProposalsCount();

    const ids = [];
    for (let i = 0n; i < count; i++) {
      ids.push(i);
    }

    const proposals = await Promise.all(
      ids.map(async (id) => {
        try {
          const p = await dao.getProposal(id);
          return {
            id: Number(p.id),
            proposer: p.proposer,
            title: p.title,
            status: Number(p.status),
            startTime: Number(p.startTime),
            endTime: Number(p.endTime),
            isTreasury: p.isTreasury,
          };
        } catch {
          return null;
        }
      })
    );

    res.json({
      count: Number(count),
      proposals: proposals.filter(Boolean),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "No se pudo obtener el listado de propuestas" });
  }
}

export async function getProposalDetail(req, res) {
  try {
    const rawId = req.params.id;
    const id = BigInt(rawId);

    const { dao } = await getContracts();
    const p = await dao.getProposal(id);

    res.json({
      id: Number(p.id),
      proposer: p.proposer,
      title: p.title,
      description: p.description,
      startTime: Number(p.startTime),
      endTime: Number(p.endTime),
      forVotes: p.forVotes.toString(),
      againstVotes: p.againstVotes.toString(),
      status: Number(p.status),
      executed: p.executed,
      isTreasury: p.isTreasury,
      treasuryRecipient: p.treasuryRecipient,
      treasuryAmount: p.treasuryAmount.toString(),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "No se pudo obtener la propuesta" });
  }
}
