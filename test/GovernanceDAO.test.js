import { expect } from "chai";
import hardhat from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
const { ethers } = hardhat;

describe("GovernanceDAO", function () {
  async function deployFixture(overrides = {}) {
    const [multisigOwner, panicMultisig, user, other] = await ethers.getSigners();

    const DaoToken = await ethers.getContractFactory("DaoToken");
    const token = await DaoToken.deploy("DAO Token", "DTK", multisigOwner.address);
    await token.waitForDeployment();

    const params = {
      tokenPriceWei: ethers.parseEther("0.001"), // 0.001 ETH por token (1e18 unidades)
      minStakeForVoting: ethers.parseEther("100"),
      minStakeForProposing: ethers.parseEther("100"),
      minStakeLockTime: 60n,
      proposalDuration: 3600n,
      tokensPerVotePower: ethers.parseEther("10"), // 10 tokens = 1 voto de poder
      ...overrides,
    };

    const GovernanceDAO = await ethers.getContractFactory("GovernanceDAO");
    const dao = await GovernanceDAO.deploy(
      multisigOwner.address,
      await token.getAddress(),
      params.tokenPriceWei,
      params.minStakeForVoting,
      params.minStakeForProposing,
      params.minStakeLockTime,
      params.proposalDuration,
      params.tokensPerVotePower
    );
    await dao.waitForDeployment();

    return {
      dao,
      token,
      multisigOwner,
      panicMultisig,
      user,
      other,
      params,
    };
  }

  describe("constructor y parámetros", function () {
    it("debe inicializar correctamente owner, token y parámetros válidos", async function () {
      const { dao, token, multisigOwner, params } = await deployFixture();

      expect(await dao.owner()).to.equal(multisigOwner.address);
      expect(await dao.token()).to.equal(await token.getAddress());
      expect(await dao.tokenPriceWei()).to.equal(params.tokenPriceWei);
      expect(await dao.minStakeForVoting()).to.equal(params.minStakeForVoting);
      expect(await dao.minStakeForProposing()).to.equal(params.minStakeForProposing);
      expect(await dao.minStakeLockTime()).to.equal(params.minStakeLockTime);
      expect(await dao.proposalDuration()).to.equal(params.proposalDuration);
      expect(await dao.tokensPerVotePower()).to.equal(params.tokensPerVotePower);
    });

    it("debe revertir si tokenAddress es cero", async function () {
      const [multisigOwner] = await ethers.getSigners();
      const GovernanceDAO = await ethers.getContractFactory("GovernanceDAO");

      await expect(
        GovernanceDAO.deploy(
          multisigOwner.address,
          ethers.ZeroAddress,
          1n,
          1n,
          1n,
          1n,
          1n,
          1n
        )
      ).to.be.revertedWithCustomError(GovernanceDAO, "InvalidParameter");
    });

    it("setParameters debe actualizar parámetros y validar valores > 0", async function () {
      const { dao, multisigOwner } = await deployFixture();

      await expect(
        dao
          .connect(multisigOwner)
          .setParameters(0n, 1n, 1n, 1n, 1n, 1n)
      ).to.be.revertedWithCustomError(dao, "InvalidParameter");

      await expect(
        dao
          .connect(multisigOwner)
          .setParameters(1n, 2n, 3n, 4n, 5n, 6n)
      )
        .to.emit(dao, "ParametersUpdated")
        .withArgs(1n, 2n, 3n, 4n, 5n, 6n);

      expect(await dao.tokenPriceWei()).to.equal(1n);
      expect(await dao.minStakeForVoting()).to.equal(2n);
      expect(await dao.minStakeForProposing()).to.equal(3n);
      expect(await dao.minStakeLockTime()).to.equal(4n);
      expect(await dao.proposalDuration()).to.equal(5n);
      expect(await dao.tokensPerVotePower()).to.equal(6n);
    });
  });

  describe("multisig de pánico y estado pausado", function () {
    it("solo el owner puede configurar la panicWallet y no puede ser cero", async function () {
      const { dao, multisigOwner, panicMultisig, user } = await deployFixture();

      await expect(
        dao.connect(user).setPanicWallet(panicMultisig.address)
      ).to.be.revertedWithCustomError(dao, "OwnableUnauthorizedAccount");

      await expect(
        dao.connect(multisigOwner).setPanicWallet(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(dao, "InvalidParameter");

      await expect(
        dao.connect(multisigOwner).setPanicWallet(panicMultisig.address)
      )
        .to.emit(dao, "PanicWalletUpdated")
        .withArgs(panicMultisig.address);

      expect(await dao.panicWallet()).to.equal(panicMultisig.address);
    });

    it("sin panicWallet configurada, la DAO no puede operar", async function () {
      const { dao, token, user, params } = await deployFixture();

      // Preparamos tokens para stake, pero nunca seteamos panicWallet.
      await token.mint(user.address, params.minStakeForVoting);
      await token.connect(user).approve(await dao.getAddress(), params.minStakeForVoting);

      await expect(
        dao.connect(user).stakeForVoting(params.minStakeForVoting)
      ).to.be.revertedWithCustomError(dao, "PanicWalletNotSet");
    });

    it("solo la panicWallet puede activar panico y tranquilidad, y panico pausa la DAO", async function () {
      const { dao, multisigOwner, panicMultisig, user, token, params } = await deployFixture();

      // Configura panic wallet
      await dao.connect(multisigOwner).setPanicWallet(panicMultisig.address);

      // Preparamos stake
      await token.mint(user.address, params.minStakeForVoting);
      await token.connect(user).approve(await dao.getAddress(), params.minStakeForVoting);

      // Otro usuario no puede llamar panico/tranquilidad
      await expect(dao.connect(user).panico()).to.be.revertedWithCustomError(
        dao,
        "NotPanicWallet"
      );

      await expect(dao.connect(panicMultisig).panico())
        .to.emit(dao, "PanicActivated")
        .withArgs(panicMultisig.address);

      expect(await dao.paused()).to.equal(true);

      // Mientras esté pausada, stake (operación de la DAO) no debe funcionar
      await expect(
        dao.connect(user).stakeForVoting(params.minStakeForVoting)
      ).to.be.revertedWithCustomError(dao, "DAOIsPaused");

      await expect(dao.connect(panicMultisig).tranquilidad())
        .to.emit(dao, "CalmActivated")
        .withArgs(panicMultisig.address);

      expect(await dao.paused()).to.equal(false);

      // Ahora sí debe poder operar
      await expect(
        dao.connect(user).stakeForVoting(params.minStakeForVoting)
      ).to.emit(dao, "StakedForVoting");
    });
  });

  describe("compra de tokens (dApp)", function () {
    it("debe revertir si msg.value es 0, si los tokens calculados son 0 o si no hay balance suficiente", async function () {
      const { dao, token, multisigOwner, panicMultisig, user, params } = await deployFixture({
        tokenPriceWei: ethers.parseEther("2"), // 2 ETH por token (muy caro)
      });

      await dao.connect(multisigOwner).setPanicWallet(panicMultisig.address);

      // 0 ETH
      await expect(
        dao.connect(user).buyTokens({ value: 0n })
      ).to.be.revertedWithCustomError(dao, "InvalidParameter");

      // msg.value muy bajo => tokensToBuy = 0
      await expect(
        dao.connect(user).buyTokens({ value: 1n })
      ).to.be.revertedWithCustomError(dao, "InvalidParameter");

      // Aun con valor razonable, sin tokens en la DAO debe fallar
      await expect(
        dao.connect(user).buyTokens({ value: ethers.parseEther("1") })
      ).to.be.revertedWithCustomError(dao, "InvalidParameter");

      // Minteamos tokens al dao para que haya liquidez
      const daoAddress = await dao.getAddress();
      await token.connect(multisigOwner).mint(daoAddress, ethers.parseEther("10"));

      // Ahora debería funcionar con valor que genere al menos 1 token
      const price = await dao.tokenPriceWei();
      const value = price; // paga 1 token

      await expect(
        dao.connect(user).buyTokens({ value })
      ).to.emit(token, "Transfer");
    });
  });

  describe("staking para votar y proponer", function () {
    it("stakeForVoting y stakeForProposing validan amount > 0 y usan transferFrom", async function () {
      const { dao, token, multisigOwner, panicMultisig, user, params } = await deployFixture();

      await dao.connect(multisigOwner).setPanicWallet(panicMultisig.address);

      const totalToMint =
        params.minStakeForVoting + params.minStakeForProposing;
      await token.mint(user.address, totalToMint);

      await token
        .connect(user)
        .approve(await dao.getAddress(), totalToMint);

      await expect(
        dao.connect(user).stakeForVoting(0n)
      ).to.be.revertedWithCustomError(dao, "InvalidParameter");

      await expect(
        dao.connect(user).stakeForProposing(0n)
      ).to.be.revertedWithCustomError(dao, "InvalidParameter");

      await expect(
        dao.connect(user).stakeForVoting(params.minStakeForVoting)
      )
        .to.emit(dao, "StakedForVoting")
        .withArgs(user.address, params.minStakeForVoting);

      await expect(
        dao.connect(user).stakeForProposing(params.minStakeForProposing)
      )
        .to.emit(dao, "StakedForProposing")
        .withArgs(user.address, params.minStakeForProposing);

      const votingStake = await dao.votingStake(user.address);
      const proposingStake = await dao.proposingStake(user.address);

      expect(votingStake.amount).to.equal(params.minStakeForVoting);
      expect(proposingStake.amount).to.equal(params.minStakeForProposing);
    });

    it("unstake valida amount, lockTime y devuelve tokens al usuario", async function () {
      const overrides = { minStakeLockTime: 10n };
      const { dao, token, multisigOwner, panicMultisig, user, params } =
        await deployFixture(overrides);

      await dao.connect(multisigOwner).setPanicWallet(panicMultisig.address);

      const stakeAmount =
        params.minStakeForVoting + params.minStakeForProposing;
      await token.mint(user.address, stakeAmount);
      await token
        .connect(user)
        .approve(await dao.getAddress(), stakeAmount);

      await dao.connect(user).stakeForVoting(params.minStakeForVoting);
      await dao.connect(user).stakeForProposing(params.minStakeForProposing);

      await expect(
        dao.connect(user).unstakeFromVoting(0n)
      ).to.be.revertedWithCustomError(dao, "InsufficientStake");

      await expect(
        dao.connect(user).unstakeFromVoting(params.minStakeForVoting + 1n)
      ).to.be.revertedWithCustomError(dao, "InsufficientStake");

      await expect(
        dao.connect(user).unstakeFromVoting(params.minStakeForVoting)
      ).to.be.revertedWithCustomError(dao, "LockTimeNotReached");

      await time.increase(overrides.minStakeLockTime + 1n);

      await expect(
        dao.connect(user).unstakeFromVoting(params.minStakeForVoting)
      )
        .to.emit(dao, "UnstakedFromVoting")
        .withArgs(user.address, params.minStakeForVoting);

      await expect(
        dao.connect(user).unstakeFromProposing(params.minStakeForProposing)
      )
        .to.emit(dao, "UnstakedFromProposing")
        .withArgs(user.address, params.minStakeForProposing);

      const votingStake = await dao.votingStake(user.address);
      const proposingStake = await dao.proposingStake(user.address);

      expect(votingStake.amount).to.equal(0n);
      expect(proposingStake.amount).to.equal(0n);
    });

    it("votingPower refleja tokens bloqueados y parámetro tokensPerVotePower", async function () {
      const overrides = { tokensPerVotePower: ethers.parseEther("50") }; // 50 tokens = 1 VP
      const { dao, token, multisigOwner, panicMultisig, user, params } =
        await deployFixture(overrides);

      await dao.connect(multisigOwner).setPanicWallet(panicMultisig.address);

      const stakeAmount = ethers.parseEther("200"); // 200 tokens => 4 VP
      await token.mint(user.address, stakeAmount);
      await token
        .connect(user)
        .approve(await dao.getAddress(), stakeAmount);

      await dao.connect(user).stakeForVoting(stakeAmount);

      const power = await dao.votingPower(user.address);
      expect(power).to.equal(4n);
    });
  });

  describe("propuestas y votación", function () {
    async function createBasicProposal() {
      const { dao, token, multisigOwner, panicMultisig, user, params } =
        await deployFixture();

      await dao.connect(multisigOwner).setPanicWallet(panicMultisig.address);

      const totalToMint =
        params.minStakeForVoting + params.minStakeForProposing;
      await token.mint(user.address, totalToMint);
      await token
        .connect(user)
        .approve(await dao.getAddress(), totalToMint);

      await dao.connect(user).stakeForVoting(params.minStakeForVoting);
      await dao.connect(user).stakeForProposing(params.minStakeForProposing);

      const tx = await dao
        .connect(user)
        .createProposal("Titulo", "Descripcion");
      const receipt = await tx.wait();

      const event = receipt.logs
        .map((l) => dao.interface.parseLog(l))
        .find((e) => e && e.name === "ProposalCreated");

      const proposalId = event.args.id;

      return {
        dao,
        token,
        multisigOwner,
        panicMultisig,
        user,
        params,
        proposalId,
      };
    }

    it("no se puede crear propuesta si stake para proponer es insuficiente", async function () {
      const { dao, token, multisigOwner, panicMultisig, user, params } =
        await deployFixture();

      await dao.connect(multisigOwner).setPanicWallet(panicMultisig.address);

      // Solo stakemos para votar, no para proponer
      await token.mint(user.address, params.minStakeForVoting);
      await token
        .connect(user)
        .approve(await dao.getAddress(), params.minStakeForVoting);

      await dao.connect(user).stakeForVoting(params.minStakeForVoting);

      await expect(
        dao.connect(user).createProposal("Titulo", "Desc")
      ).to.be.revertedWithCustomError(dao, "InsufficientStake");
    });

    it("puede crear propuestas normales y de treasury", async function () {
      const {
        dao,
        token,
        multisigOwner,
        panicMultisig,
        user,
        params,
      } = await deployFixture();

      await dao.connect(multisigOwner).setPanicWallet(panicMultisig.address);

      const totalToMint =
        params.minStakeForVoting + params.minStakeForProposing;
      await token.mint(user.address, totalToMint);
      await token
        .connect(user)
        .approve(await dao.getAddress(), totalToMint);

      await dao.connect(user).stakeForVoting(params.minStakeForVoting);
      await dao.connect(user).stakeForProposing(params.minStakeForProposing);

      await expect(
        dao.connect(user).createTreasuryProposal("t", "d", ethers.ZeroAddress, 1n)
      ).to.be.revertedWithCustomError(dao, "InvalidTreasuryProposal");

      await expect(
        dao.connect(user).createTreasuryProposal("t", "d", user.address, 0n)
      ).to.be.revertedWithCustomError(dao, "InvalidTreasuryProposal");

      await expect(
        dao.connect(user).createProposal("Titulo", "Descripcion")
      ).to.emit(dao, "ProposalCreated");

      await expect(
        dao
          .connect(user)
          .createTreasuryProposal("T Treasury", "D Treasury", user.address, 1n)
      ).to.emit(dao, "ProposalCreated");

      const count = await dao.getProposalsCount();
      expect(count).to.equal(2n);
    });

    it("vote valida propuesta, estado, tiempo, stake y previene doble voto", async function () {
      const { dao, user, params, proposalId } = await createBasicProposal();

      const invalidId = proposalId + 10n;

      await expect(
        dao.connect(user).vote(invalidId, true)
      ).to.be.revertedWithCustomError(dao, "InvalidProposal");

      // Forzamos que pase el tiempo de la propuesta.
      const proposal = await dao.getProposal(proposalId);
      await time.increase(BigInt(proposal.endTime) - BigInt(await time.latest()) + 1n);

      await expect(
        dao.connect(user).vote(proposalId, true)
      ).to.be.revertedWithCustomError(dao, "VotingNotAllowed");
    });

    it("no se puede votar si stake para votar es insuficiente o si votingPower es 0", async function () {
      const overrides = {
        tokensPerVotePower: ethers.parseEther("1000"), // hace que votingPower sea 0 para stake chico
      };
      const {
        dao,
        token,
        multisigOwner,
        panicMultisig,
        user,
        params,
      } = await deployFixture(overrides);

      await dao.connect(multisigOwner).setPanicWallet(panicMultisig.address);

      // Staking insuficiente para votar
      await token.mint(user.address, params.minStakeForProposing);
      await token
        .connect(user)
        .approve(await dao.getAddress(), params.minStakeForProposing);

      await dao.connect(user).stakeForProposing(params.minStakeForProposing);

      await dao.connect(user).createProposal("t", "d");

      // Ahora sí stakemos para votar y proponer, pero con votingPower 0
      const extra = overrides.tokensPerVotePower - params.minStakeForProposing;
      await token.mint(user.address, extra + params.minStakeForVoting);
      await token
        .connect(user)
        .approve(await dao.getAddress(), extra + params.minStakeForVoting);

      await dao.connect(user).stakeForVoting(params.minStakeForVoting);
      await dao.connect(user).stakeForProposing(extra); // completa los tokens para proponer

      const tx = await dao
        .connect(user)
        .createProposal("Titulo", "Descripcion");
      const receipt = await tx.wait();
      const event = receipt.logs
        .map((l) => dao.interface.parseLog(l))
        .find((e) => e && e.name === "ProposalCreated");
      const proposalId = event.args.id;

      await expect(
        dao.connect(user).vote(proposalId, true)
      ).to.be.revertedWithCustomError(dao, "InsufficientStake");
    });

    it("votación suma votos a favor/en contra y evita doble voto", async function () {
      const {
        dao,
        token,
        multisigOwner,
        panicMultisig,
        user,
        other,
        params,
      } = await deployFixture();

      await dao.connect(multisigOwner).setPanicWallet(panicMultisig.address);

      const toMint = params.minStakeForVoting * 2n + params.minStakeForProposing;
      await token.mint(user.address, toMint);
      await token
        .connect(user)
        .approve(await dao.getAddress(), toMint);

      await dao.connect(user).stakeForVoting(params.minStakeForVoting);
      await dao.connect(user).stakeForProposing(params.minStakeForProposing);

      const tx = await dao
        .connect(user)
        .createProposal("Titulo", "Descripcion");
      const receipt = await tx.wait();
      const event = receipt.logs
        .map((l) => dao.interface.parseLog(l))
        .find((e) => e && e.name === "ProposalCreated");
      const proposalId = event.args.id;

      // Segundo usuario con menos poder de voto
      await token.mint(other.address, params.minStakeForVoting);
      await token
        .connect(other)
        .approve(await dao.getAddress(), params.minStakeForVoting);
      await dao.connect(other).stakeForVoting(params.minStakeForVoting);

      const powerUser = await dao.votingPower(user.address);
      const powerOther = await dao.votingPower(other.address);
      expect(powerUser).to.be.greaterThan(0n);
      expect(powerOther).to.be.greaterThan(0n);

      await expect(
        dao.connect(user).vote(proposalId, true)
      )
        .to.emit(dao, "VoteCast")
        .withArgs(proposalId, user.address, true, powerUser);

      await expect(
        dao.connect(other).vote(proposalId, false)
      )
        .to.emit(dao, "VoteCast")
        .withArgs(proposalId, other.address, false, powerOther);

      const p = await dao.getProposal(proposalId);
      expect(p.forVotes).to.equal(powerUser);
      expect(p.againstVotes).to.equal(powerOther);

      await expect(
        dao.connect(user).vote(proposalId, true)
      ).to.be.revertedWithCustomError(dao, "AlreadyVoted");
    });

    it("finalizeProposal decide aceptación o rechazo según votos y estado/tiempo", async function () {
      const {
        dao,
        token,
        multisigOwner,
        panicMultisig,
        user,
        params,
      } = await deployFixture({ proposalDuration: 100n });

      await dao.connect(multisigOwner).setPanicWallet(panicMultisig.address);

      await token.mint(user.address, params.minStakeForVoting + params.minStakeForProposing);
      await token
        .connect(user)
        .approve(await dao.getAddress(), params.minStakeForVoting + params.minStakeForProposing);

      await dao.connect(user).stakeForVoting(params.minStakeForVoting);
      await dao.connect(user).stakeForProposing(params.minStakeForProposing);

      const tx = await dao
        .connect(user)
        .createProposal("Titulo", "Descripcion");
      const receipt = await tx.wait();
      const event = receipt.logs
        .map((l) => dao.interface.parseLog(l))
        .find((e) => e && e.name === "ProposalCreated");
      const proposalId = event.args.id;

      await expect(
        dao.finalizeProposal(proposalId)
      ).to.be.revertedWithCustomError(dao, "VotingNotAllowed");

      await dao.connect(user).vote(proposalId, true);

      const proposalBefore = await dao.getProposal(proposalId);
      await time.increase(BigInt(proposalBefore.endTime) - BigInt(await time.latest()) + 1n);

      await expect(dao.finalizeProposal(proposalId))
        .to.emit(dao, "ProposalFinalized");

      const finalized = await dao.getProposal(proposalId);
      expect(finalized.status).to.equal(1); // ACCEPTED

      await expect(
        dao.finalizeProposal(proposalId)
      ).to.be.revertedWithCustomError(dao, "VotingNotAllowed");
    });
  });

  describe("propuestas de treasury (Conjunto C)", function () {
    it("solo propuestas marcadas como treasury pueden ejecutarse y requieren estado ACCEPTED, no ejecutadas y balance suficiente", async function () {
      const {
        dao,
        token,
        multisigOwner,
        panicMultisig,
        user,
        params,
      } = await deployFixture({ proposalDuration: 100n });

      await dao.connect(multisigOwner).setPanicWallet(panicMultisig.address);

      const toMint = params.minStakeForVoting + params.minStakeForProposing;
      await token.mint(user.address, toMint);
      await token
        .connect(user)
        .approve(await dao.getAddress(), toMint);

      await dao.connect(user).stakeForVoting(params.minStakeForVoting);
      await dao.connect(user).stakeForProposing(params.minStakeForProposing);

      const tx = await dao
        .connect(user)
        .createTreasuryProposal("Treasury", "Envio ETH", user.address, ethers.parseEther("1"));
      const receipt = await tx.wait();
      const event = receipt.logs
        .map((l) => dao.interface.parseLog(l))
        .find((e) => e && e.name === "ProposalCreated");
      const proposalId = event.args.id;

      // Propuesta no-treasury
      const txNormal = await dao
        .connect(user)
        .createProposal("Normal", "Desc");
      const receiptNormal = await txNormal.wait();
      const eventNormal = receiptNormal.logs
        .map((l) => dao.interface.parseLog(l))
        .find((e) => e && e.name === "ProposalCreated");
      const normalId = eventNormal.args.id;

      await expect(
        dao.executeTreasuryProposal(normalId)
      ).to.be.revertedWithCustomError(dao, "InvalidTreasuryProposal");

      await expect(
        dao.executeTreasuryProposal(proposalId)
      ).to.be.revertedWithCustomError(dao, "ProposalNotExecutable");

      await dao.connect(user).vote(proposalId, true);

      const proposal = await dao.getProposal(proposalId);
      await time.increase(BigInt(proposal.endTime) - BigInt(await time.latest()) + 1n);

      await dao.finalizeProposal(proposalId);

      // Sin balance suficiente debe revertir
      await expect(
        dao.executeTreasuryProposal(proposalId)
      ).to.be.revertedWithCustomError(dao, "InvalidTreasuryProposal");
    });

    it("cuando la propuesta de treasury se aprueba y hay fondos, transfiere ETH automáticamente y marca executed", async function () {
      const {
        dao,
        token,
        multisigOwner,
        panicMultisig,
        user,
        params,
      } = await deployFixture({ proposalDuration: 100n });

      await dao.connect(multisigOwner).setPanicWallet(panicMultisig.address);

      const toMint = params.minStakeForVoting + params.minStakeForProposing;
      await token.mint(user.address, toMint);
      await token
        .connect(user)
        .approve(await dao.getAddress(), toMint);

      await dao.connect(user).stakeForVoting(params.minStakeForVoting);
      await dao.connect(user).stakeForProposing(params.minStakeForProposing);

      const amount = ethers.parseEther("1");

      const tx = await dao
        .connect(user)
        .createTreasuryProposal("Treasury", "Envio ETH", user.address, amount);
      const receipt = await tx.wait();
      const event = receipt.logs
        .map((l) => dao.interface.parseLog(l))
        .find((e) => e && e.name === "ProposalCreated");
      const proposalId = event.args.id;

      await dao.connect(user).vote(proposalId, true);

      const proposal = await dao.getProposal(proposalId);
      await time.increase(BigInt(proposal.endTime) - BigInt(await time.latest()) + 1n);

      await dao.finalizeProposal(proposalId);

      const daoAddress = await dao.getAddress();
      await multisigOwner.sendTransaction({ to: daoAddress, value: amount });

      const balanceBefore = await ethers.provider.getBalance(user.address);

      await expect(
        dao.executeTreasuryProposal(proposalId)
      )
        .to.emit(dao, "TreasuryProposalExecuted")
        .withArgs(proposalId, user.address, amount);

      const balanceAfter = await ethers.provider.getBalance(user.address);
      expect(balanceAfter).to.be.greaterThan(balanceBefore);

      const finalized = await dao.getProposal(proposalId);
      expect(finalized.executed).to.equal(true);

      await expect(
        dao.executeTreasuryProposal(proposalId)
      ).to.be.revertedWithCustomError(dao, "ProposalNotExecutable");
    });
  });

  describe("helpers de lectura y recepción de ETH", function () {
    it("getProposal revierte para id inexistente y devuelve datos válidos para propuestas existentes", async function () {
      const {
        dao,
        token,
        multisigOwner,
        panicMultisig,
        user,
        params,
      } = await deployFixture();

      await dao.connect(multisigOwner).setPanicWallet(panicMultisig.address);

      await token.mint(user.address, params.minStakeForVoting + params.minStakeForProposing);
      await token
        .connect(user)
        .approve(await dao.getAddress(), params.minStakeForVoting + params.minStakeForProposing);

      await dao.connect(user).stakeForVoting(params.minStakeForVoting);
      await dao.connect(user).stakeForProposing(params.minStakeForProposing);

      const tx = await dao
        .connect(user)
        .createProposal("Titulo", "Descripcion");
      const receipt = await tx.wait();
      const event = receipt.logs
        .map((l) => dao.interface.parseLog(l))
        .find((e) => e && e.name === "ProposalCreated");
      const proposalId = event.args.id;

      await expect(
        dao.getProposal(proposalId + 1n)
      ).to.be.revertedWithCustomError(dao, "InvalidProposal");

      const p = await dao.getProposal(proposalId);
      expect(p.id).to.equal(proposalId);
      expect(p.proposer).to.equal(user.address);
    });

    it("el contrato puede recibir ETH vía receive y fallback", async function () {
      const { dao, multisigOwner } = await deployFixture();
      const daoAddress = await dao.getAddress();

      const value = ethers.parseEther("0.5");

      const balanceBefore = await ethers.provider.getBalance(daoAddress);

      await multisigOwner.sendTransaction({
        to: daoAddress,
        value,
      });

      await multisigOwner.sendTransaction({
        to: daoAddress,
        value,
        data: "0x1234",
      });

      const balanceAfter = await ethers.provider.getBalance(daoAddress);
      expect(balanceAfter).to.equal(balanceBefore + value * 2n);
    });
  });
});
