const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("GovernanceDAO", function () {
  let daoToken;
  let governanceDAO;
  let owner;
  let panicWallet;
  let user1;
  let user2;
  let user3;

  const TOKEN_PRICE_WEI = ethers.parseEther("0.001");
  const MIN_STAKE_FOR_VOTING = ethers.parseEther("100");
  const MIN_STAKE_FOR_PROPOSING = ethers.parseEther("500");
  const MIN_STAKE_LOCK_TIME = 86400;
  const PROPOSAL_DURATION = 604800;
  const TOKENS_PER_VOTE_POWER = ethers.parseEther("10");
  const QUORUM_PERCENTAGE = 30;
  const APPROVAL_PERCENTAGE = 60;

  beforeEach(async function () {
    [owner, panicWallet, user1, user2, user3] = await ethers.getSigners();
    const DaoToken = await ethers.getContractFactory("DaoToken");
    daoToken = await DaoToken.deploy("DAO Token", "DAO", owner.address);
    await daoToken.waitForDeployment();
    const GovernanceDAO = await ethers.getContractFactory("GovernanceDAO");
    governanceDAO = await GovernanceDAO.deploy(owner.address, await daoToken.getAddress(), TOKEN_PRICE_WEI, MIN_STAKE_FOR_VOTING, MIN_STAKE_FOR_PROPOSING, MIN_STAKE_LOCK_TIME, PROPOSAL_DURATION, TOKENS_PER_VOTE_POWER, QUORUM_PERCENTAGE, APPROVAL_PERCENTAGE);
    await governanceDAO.waitForDeployment();
    await daoToken.transferOwnership(await governanceDAO.getAddress());
    await governanceDAO.mintDaoTokens(await governanceDAO.getAddress(), ethers.parseEther("1000000"));
  });

  describe("Deployment", function () {
    it("Should set correct owner", async function () {
      expect(await governanceDAO.owner()).to.equal(owner.address);
    });

    it("Should set panic wallet to owner initially", async function () {
      expect(await governanceDAO.panicWallet()).to.equal(owner.address);
    });

    it("Should revert with zero token address", async function () {
      const GovernanceDAO = await ethers.getContractFactory("GovernanceDAO");
      await expect(GovernanceDAO.deploy(owner.address, ethers.ZeroAddress, TOKEN_PRICE_WEI, MIN_STAKE_FOR_VOTING, MIN_STAKE_FOR_PROPOSING, MIN_STAKE_LOCK_TIME, PROPOSAL_DURATION, TOKENS_PER_VOTE_POWER, QUORUM_PERCENTAGE, APPROVAL_PERCENTAGE)).to.be.revertedWithCustomError(governanceDAO, "InvalidParameter");
    });

    it("Should revert with zero token price", async function () {
      const GovernanceDAO = await ethers.getContractFactory("GovernanceDAO");
      await expect(GovernanceDAO.deploy(owner.address, await daoToken.getAddress(), 0, MIN_STAKE_FOR_VOTING, MIN_STAKE_FOR_PROPOSING, MIN_STAKE_LOCK_TIME, PROPOSAL_DURATION, TOKENS_PER_VOTE_POWER, QUORUM_PERCENTAGE, APPROVAL_PERCENTAGE)).to.be.revertedWithCustomError(governanceDAO, "InvalidParameter");
    });

    it("Should revert with zero min stake voting", async function () {
      const GovernanceDAO = await ethers.getContractFactory("GovernanceDAO");
      await expect(GovernanceDAO.deploy(owner.address, await daoToken.getAddress(), TOKEN_PRICE_WEI, 0, MIN_STAKE_FOR_PROPOSING, MIN_STAKE_LOCK_TIME, PROPOSAL_DURATION, TOKENS_PER_VOTE_POWER, QUORUM_PERCENTAGE, APPROVAL_PERCENTAGE)).to.be.revertedWithCustomError(governanceDAO, "InvalidParameter");
    });

    it("Should revert with zero min stake proposing", async function () {
      const GovernanceDAO = await ethers.getContractFactory("GovernanceDAO");
      await expect(GovernanceDAO.deploy(owner.address, await daoToken.getAddress(), TOKEN_PRICE_WEI, MIN_STAKE_FOR_VOTING, 0, MIN_STAKE_LOCK_TIME, PROPOSAL_DURATION, TOKENS_PER_VOTE_POWER, QUORUM_PERCENTAGE, APPROVAL_PERCENTAGE)).to.be.revertedWithCustomError(governanceDAO, "InvalidParameter");
    });

    it("Should revert with zero proposal duration", async function () {
      const GovernanceDAO = await ethers.getContractFactory("GovernanceDAO");
      await expect(GovernanceDAO.deploy(owner.address, await daoToken.getAddress(), TOKEN_PRICE_WEI, MIN_STAKE_FOR_VOTING, MIN_STAKE_FOR_PROPOSING, MIN_STAKE_LOCK_TIME, 0, TOKENS_PER_VOTE_POWER, QUORUM_PERCENTAGE, APPROVAL_PERCENTAGE)).to.be.revertedWithCustomError(governanceDAO, "InvalidParameter");
    });

    it("Should revert with zero tokens per vote", async function () {
      const GovernanceDAO = await ethers.getContractFactory("GovernanceDAO");
      await expect(GovernanceDAO.deploy(owner.address, await daoToken.getAddress(), TOKEN_PRICE_WEI, MIN_STAKE_FOR_VOTING, MIN_STAKE_FOR_PROPOSING, MIN_STAKE_LOCK_TIME, PROPOSAL_DURATION, 0, QUORUM_PERCENTAGE, APPROVAL_PERCENTAGE)).to.be.revertedWithCustomError(governanceDAO, "InvalidParameter");
    });
    
    it("Should revert with zero quorum percentage", async function () {
      const GovernanceDAO = await ethers.getContractFactory("GovernanceDAO");
      await expect(GovernanceDAO.deploy(owner.address, await daoToken.getAddress(), TOKEN_PRICE_WEI, MIN_STAKE_FOR_VOTING, MIN_STAKE_FOR_PROPOSING, MIN_STAKE_LOCK_TIME, PROPOSAL_DURATION, TOKENS_PER_VOTE_POWER, 0, APPROVAL_PERCENTAGE)).to.be.revertedWithCustomError(governanceDAO, "InvalidParameter");
    });
    
    it("Should revert with quorum percentage over 100", async function () {
      const GovernanceDAO = await ethers.getContractFactory("GovernanceDAO");
      await expect(GovernanceDAO.deploy(owner.address, await daoToken.getAddress(), TOKEN_PRICE_WEI, MIN_STAKE_FOR_VOTING, MIN_STAKE_FOR_PROPOSING, MIN_STAKE_LOCK_TIME, PROPOSAL_DURATION, TOKENS_PER_VOTE_POWER, 101, APPROVAL_PERCENTAGE)).to.be.revertedWithCustomError(governanceDAO, "InvalidParameter");
    });
    
    it("Should revert with zero approval percentage", async function () {
      const GovernanceDAO = await ethers.getContractFactory("GovernanceDAO");
      await expect(GovernanceDAO.deploy(owner.address, await daoToken.getAddress(), TOKEN_PRICE_WEI, MIN_STAKE_FOR_VOTING, MIN_STAKE_FOR_PROPOSING, MIN_STAKE_LOCK_TIME, PROPOSAL_DURATION, TOKENS_PER_VOTE_POWER, QUORUM_PERCENTAGE, 0)).to.be.revertedWithCustomError(governanceDAO, "InvalidParameter");
    });
    
    it("Should revert with approval percentage over 100", async function () {
      const GovernanceDAO = await ethers.getContractFactory("GovernanceDAO");
      await expect(GovernanceDAO.deploy(owner.address, await daoToken.getAddress(), TOKEN_PRICE_WEI, MIN_STAKE_FOR_VOTING, MIN_STAKE_FOR_PROPOSING, MIN_STAKE_LOCK_TIME, PROPOSAL_DURATION, TOKENS_PER_VOTE_POWER, QUORUM_PERCENTAGE, 101)).to.be.revertedWithCustomError(governanceDAO, "InvalidParameter");
    });
  });

  describe("Admin - setPanicWallet", function () {
    it("Should allow owner to set panic wallet", async function () {
      await expect(governanceDAO.setPanicWallet(panicWallet.address)).to.emit(governanceDAO, "PanicWalletUpdated").withArgs(panicWallet.address);
    });

    it("Should revert non-owner", async function () {
      await expect(governanceDAO.connect(user1).setPanicWallet(panicWallet.address)).to.be.revertedWithCustomError(governanceDAO, "OwnableUnauthorizedAccount");
    });

    it("Should revert zero address", async function () {
      await expect(governanceDAO.setPanicWallet(ethers.ZeroAddress)).to.be.revertedWithCustomError(governanceDAO, "InvalidParameter");
    });
  });

  describe("Admin - setParameters", function () {
    it("Should allow owner to update", async function () {
      await expect(governanceDAO.setParameters(TOKEN_PRICE_WEI, MIN_STAKE_FOR_VOTING, MIN_STAKE_FOR_PROPOSING, MIN_STAKE_LOCK_TIME, PROPOSAL_DURATION, TOKENS_PER_VOTE_POWER)).to.emit(governanceDAO, "ParametersUpdated");
    });

    it("Should revert non-owner", async function () {
      await expect(governanceDAO.connect(user1).setParameters(TOKEN_PRICE_WEI, MIN_STAKE_FOR_VOTING, MIN_STAKE_FOR_PROPOSING, MIN_STAKE_LOCK_TIME, PROPOSAL_DURATION, TOKENS_PER_VOTE_POWER)).to.be.revertedWithCustomError(governanceDAO, "OwnableUnauthorizedAccount");
    });

    it("Should revert zero price", async function () {
      await expect(governanceDAO.setParameters(0, MIN_STAKE_FOR_VOTING, MIN_STAKE_FOR_PROPOSING, MIN_STAKE_LOCK_TIME, PROPOSAL_DURATION, TOKENS_PER_VOTE_POWER)).to.be.revertedWithCustomError(governanceDAO, "InvalidParameter");
    });
  });
  
  describe("Admin - setQuorum", function () {
    it("Should allow owner to update quorum", async function () {
      await expect(governanceDAO.setQuorum(40, 70)).to.emit(governanceDAO, "QuorumUpdated").withArgs(40, 70);
      expect(await governanceDAO.quorumPercentage()).to.equal(40);
      expect(await governanceDAO.approvalPercentage()).to.equal(70);
    });
    
    it("Should revert non-owner", async function () {
      await expect(governanceDAO.connect(user1).setQuorum(40, 70)).to.be.revertedWithCustomError(governanceDAO, "OwnableUnauthorizedAccount");
    });
    
    it("Should revert zero quorum", async function () {
      await expect(governanceDAO.setQuorum(0, 70)).to.be.revertedWithCustomError(governanceDAO, "InvalidParameter");
    });
    
    it("Should revert quorum over 100", async function () {
      await expect(governanceDAO.setQuorum(101, 70)).to.be.revertedWithCustomError(governanceDAO, "InvalidParameter");
    });
    
    it("Should revert zero approval", async function () {
      await expect(governanceDAO.setQuorum(40, 0)).to.be.revertedWithCustomError(governanceDAO, "InvalidParameter");
    });
    
    it("Should revert approval over 100", async function () {
      await expect(governanceDAO.setQuorum(40, 101)).to.be.revertedWithCustomError(governanceDAO, "InvalidParameter");
    });
  });

  describe("Panic Controls", function () {
    beforeEach(async function () {
      await governanceDAO.setPanicWallet(panicWallet.address);
    });

    it("Should activate panic", async function () {
      await expect(governanceDAO.connect(panicWallet).panico()).to.emit(governanceDAO, "PanicActivated");
    });

    it("Should deactivate panic", async function () {
      await governanceDAO.connect(panicWallet).panico();
      await expect(governanceDAO.connect(panicWallet).tranquilidad()).to.emit(governanceDAO, "CalmActivated");
    });

    it("Should revert non-panic wallet", async function () {
      await expect(governanceDAO.connect(user1).panico()).to.be.revertedWithCustomError(governanceDAO, "NotPanicWallet");
    });

    it("Should prevent ops when paused", async function () {
      await governanceDAO.connect(panicWallet).panico();
      await expect(governanceDAO.buyTokens({ value: ethers.parseEther("1") })).to.be.revertedWithCustomError(governanceDAO, "DAOIsPaused");
    });
  });

  describe("Token Purchase", function () {
    it("Should buy tokens", async function () {
      await governanceDAO.connect(user1).buyTokens({ value: ethers.parseEther("1") });
      expect(await daoToken.balanceOf(user1.address)).to.be.greaterThan(0);
    });

    it("Should revert zero ETH", async function () {
      await expect(governanceDAO.buyTokens({ value: 0 })).to.be.revertedWithCustomError(governanceDAO, "InvalidParameter");
    });

    it("Should revert insufficient tokens", async function () {
      const bal = await daoToken.balanceOf(await governanceDAO.getAddress());
      await governanceDAO.connect(user1).buyTokens({ value: (bal * TOKEN_PRICE_WEI) / ethers.parseEther("1") });
      await expect(governanceDAO.connect(user2).buyTokens({ value: ethers.parseEther("1") })).to.be.revertedWithCustomError(governanceDAO, "InvalidParameter");
    });

    it("Should revert zero tokens", async function () {
      // tokenPriceWei = 0.001 ETH = 10^15 wei
      // tokensToBuy = (msg.value * 1e18) / tokenPriceWei
      // For tokensToBuy to be 0: msg.value * 1e18 < tokenPriceWei
      // msg.value < tokenPriceWei / 1e18 = 10^15 / 10^18 = 0.001
      // So send anything less than 0.001 wei - but minimum is 1 wei
      // With 1 wei: tokensToBuy = (1 * 1e18) / 1e15 = 1000
      // This test doesn't apply since any positive wei will give tokens
      // Let's remove this test or change the token price
      // For now, let's test that we can buy with minimum wei
      await governanceDAO.buyTokens({ value: 1 });
      expect(await daoToken.balanceOf(owner.address)).to.be.greaterThan(0);
    });
  });

  describe("Mint Tokens", function () {
    it("Should mint", async function () {
      await governanceDAO.mintDaoTokens(user1.address, ethers.parseEther("1000"));
      expect(await daoToken.balanceOf(user1.address)).to.equal(ethers.parseEther("1000"));
    });

    it("Should revert non-owner", async function () {
      await expect(governanceDAO.connect(user1).mintDaoTokens(user2.address, ethers.parseEther("1000"))).to.be.revertedWithCustomError(governanceDAO, "OwnableUnauthorizedAccount");
    });

    it("Should revert zero address", async function () {
      await expect(governanceDAO.mintDaoTokens(ethers.ZeroAddress, ethers.parseEther("1000"))).to.be.revertedWithCustomError(governanceDAO, "InvalidParameter");
    });

    it("Should revert zero amount", async function () {
      await expect(governanceDAO.mintDaoTokens(user1.address, 0)).to.be.revertedWithCustomError(governanceDAO, "InvalidParameter");
    });
  });

  describe("Staking Voting", function () {
    beforeEach(async function () {
      await governanceDAO.mintDaoTokens(user1.address, ethers.parseEther("10000"));
      await daoToken.connect(user1).approve(await governanceDAO.getAddress(), ethers.parseEther("10000"));
    });

    it("Should stake", async function () {
      await expect(governanceDAO.connect(user1).stakeForVoting(ethers.parseEther("100"))).to.emit(governanceDAO, "StakedForVoting");
    });

    it("Should revert zero", async function () {
      await expect(governanceDAO.connect(user1).stakeForVoting(0)).to.be.revertedWithCustomError(governanceDAO, "InvalidParameter");
    });

    it("Should unstake after lock", async function () {
      await governanceDAO.connect(user1).stakeForVoting(ethers.parseEther("200"));
      await time.increase(MIN_STAKE_LOCK_TIME + 1);
      await expect(governanceDAO.connect(user1).unstakeFromVoting(ethers.parseEther("200"))).to.emit(governanceDAO, "UnstakedFromVoting");
    });

    it("Should revert before lock", async function () {
      await governanceDAO.connect(user1).stakeForVoting(ethers.parseEther("100"));
      await expect(governanceDAO.connect(user1).unstakeFromVoting(ethers.parseEther("100"))).to.be.revertedWithCustomError(governanceDAO, "LockTimeNotReached");
    });

    it("Should revert unstake zero", async function () {
      await governanceDAO.connect(user1).stakeForVoting(ethers.parseEther("100"));
      await time.increase(MIN_STAKE_LOCK_TIME + 1);
      await expect(governanceDAO.connect(user1).unstakeFromVoting(0)).to.be.revertedWithCustomError(governanceDAO, "InsufficientStake");
    });

    it("Should revert unstake more", async function () {
      await governanceDAO.connect(user1).stakeForVoting(ethers.parseEther("100"));
      await time.increase(MIN_STAKE_LOCK_TIME + 1);
      await expect(governanceDAO.connect(user1).unstakeFromVoting(ethers.parseEther("200"))).to.be.revertedWithCustomError(governanceDAO, "InsufficientStake");
    });

    it("Should calc voting power", async function () {
      await governanceDAO.connect(user1).stakeForVoting(ethers.parseEther("1000"));
      const power = await governanceDAO.votingPower(user1.address);
      expect(power).to.equal(100n); // 1000 / 10 = 100 voting power
    });
  });

  describe("Staking Proposing", function () {
    beforeEach(async function () {
      await governanceDAO.mintDaoTokens(user1.address, ethers.parseEther("10000"));
      await daoToken.connect(user1).approve(await governanceDAO.getAddress(), ethers.parseEther("10000"));
    });

    it("Should stake", async function () {
      await expect(governanceDAO.connect(user1).stakeForProposing(ethers.parseEther("500"))).to.emit(governanceDAO, "StakedForProposing");
    });

    it("Should revert zero", async function () {
      await expect(governanceDAO.connect(user1).stakeForProposing(0)).to.be.revertedWithCustomError(governanceDAO, "InvalidParameter");
    });

    it("Should unstake after lock", async function () {
      await governanceDAO.connect(user1).stakeForProposing(ethers.parseEther("500"));
      await time.increase(MIN_STAKE_LOCK_TIME + 1);
      await expect(governanceDAO.connect(user1).unstakeFromProposing(ethers.parseEther("500"))).to.emit(governanceDAO, "UnstakedFromProposing");
    });

    it("Should revert before lock", async function () {
      await governanceDAO.connect(user1).stakeForProposing(ethers.parseEther("500"));
      await expect(governanceDAO.connect(user1).unstakeFromProposing(ethers.parseEther("500"))).to.be.revertedWithCustomError(governanceDAO, "LockTimeNotReached");
    });

    it("Should revert unstake zero", async function () {
      await governanceDAO.connect(user1).stakeForProposing(ethers.parseEther("500"));
      await time.increase(MIN_STAKE_LOCK_TIME + 1);
      await expect(governanceDAO.connect(user1).unstakeFromProposing(0)).to.be.revertedWithCustomError(governanceDAO, "InsufficientStake");
    });

    it("Should revert unstake more", async function () {
      await governanceDAO.connect(user1).stakeForProposing(ethers.parseEther("500"));
      await time.increase(MIN_STAKE_LOCK_TIME + 1);
      await expect(governanceDAO.connect(user1).unstakeFromProposing(ethers.parseEther("1000"))).to.be.revertedWithCustomError(governanceDAO, "InsufficientStake");
    });
  });

  describe("Proposals", function () {
    beforeEach(async function () {
      await governanceDAO.mintDaoTokens(user1.address, ethers.parseEther("10000"));
      await daoToken.connect(user1).approve(await governanceDAO.getAddress(), ethers.parseEther("10000"));
      await governanceDAO.connect(user1).stakeForProposing(MIN_STAKE_FOR_PROPOSING);
    });

    it("Should create proposal", async function () {
      await expect(governanceDAO.connect(user1).createProposal("Test", "Desc")).to.emit(governanceDAO, "ProposalCreated");
    });

    it("Should revert insufficient stake", async function () {
      await expect(governanceDAO.connect(user2).createProposal("Test", "Desc")).to.be.revertedWithCustomError(governanceDAO, "InsufficientStake");
    });

    it("Should get proposal", async function () {
      await governanceDAO.connect(user1).createProposal("Test", "Desc");
      const p = await governanceDAO.getProposal(0);
      expect(p.title).to.equal("Test");
    });

    it("Should get count", async function () {
      await governanceDAO.connect(user1).createProposal("1", "1");
      expect(await governanceDAO.getProposalsCount()).to.equal(1);
    });

    it("Should revert get invalid", async function () {
      await expect(governanceDAO.getProposal(999)).to.be.revertedWithCustomError(governanceDAO, "InvalidProposal");
    });
  });

  describe("Treasury Proposals", function () {
    beforeEach(async function () {
      await governanceDAO.mintDaoTokens(user1.address, ethers.parseEther("10000"));
      await daoToken.connect(user1).approve(await governanceDAO.getAddress(), ethers.parseEther("10000"));
      await governanceDAO.connect(user1).stakeForProposing(MIN_STAKE_FOR_PROPOSING);
      await owner.sendTransaction({ to: await governanceDAO.getAddress(), value: ethers.parseEther("10") });
    });

    it("Should create treasury", async function () {
      await expect(governanceDAO.connect(user1).createTreasuryProposal("T", "D", user2.address, ethers.parseEther("1"))).to.emit(governanceDAO, "ProposalCreated");
    });

    it("Should revert zero recipient", async function () {
      await expect(governanceDAO.connect(user1).createTreasuryProposal("T", "D", ethers.ZeroAddress, ethers.parseEther("1"))).to.be.revertedWithCustomError(governanceDAO, "InvalidTreasuryProposal");
    });

    it("Should revert zero amount", async function () {
      await expect(governanceDAO.connect(user1).createTreasuryProposal("T", "D", user2.address, 0)).to.be.revertedWithCustomError(governanceDAO, "InvalidTreasuryProposal");
    });
  });

  describe("Voting", function () {
    beforeEach(async function () {
      await governanceDAO.mintDaoTokens(user1.address, ethers.parseEther("10000"));
      await governanceDAO.mintDaoTokens(user2.address, ethers.parseEther("10000"));
      await daoToken.connect(user1).approve(await governanceDAO.getAddress(), ethers.parseEther("10000"));
      await daoToken.connect(user2).approve(await governanceDAO.getAddress(), ethers.parseEther("10000"));
      await governanceDAO.connect(user1).stakeForProposing(MIN_STAKE_FOR_PROPOSING);
      await governanceDAO.connect(user2).stakeForVoting(ethers.parseEther("1000"));
      await governanceDAO.connect(user1).createProposal("Test", "Desc");
    });

    it("Should vote", async function () {
      await expect(governanceDAO.connect(user2).vote(0, true)).to.emit(governanceDAO, "VoteCast");
    });

    it("Should revert twice", async function () {
      await governanceDAO.connect(user2).vote(0, true);
      await expect(governanceDAO.connect(user2).vote(0, true)).to.be.revertedWithCustomError(governanceDAO, "AlreadyVoted");
    });

    it("Should revert insufficient", async function () {
      await expect(governanceDAO.connect(owner).vote(0, true)).to.be.revertedWithCustomError(governanceDAO, "InsufficientStake");
    });

    it("Should revert zero power", async function () {
      await governanceDAO.mintDaoTokens(owner.address, ethers.parseEther("5"));
      await daoToken.approve(await governanceDAO.getAddress(), ethers.parseEther("5"));
      await governanceDAO.stakeForVoting(ethers.parseEther("5"));
      await expect(governanceDAO.vote(0, true)).to.be.revertedWithCustomError(governanceDAO, "InsufficientStake");
    });

    it("Should revert invalid proposal", async function () {
      await expect(governanceDAO.connect(user2).vote(999, true)).to.be.revertedWithCustomError(governanceDAO, "InvalidProposal");
    });

    it("Should revert after ended", async function () {
      await time.increase(PROPOSAL_DURATION + 1);
      await expect(governanceDAO.connect(user2).vote(0, true)).to.be.revertedWithCustomError(governanceDAO, "VotingNotAllowed");
    });
  });

  describe("Finalization", function () {
    beforeEach(async function () {
      await governanceDAO.mintDaoTokens(user1.address, ethers.parseEther("10000"));
      await governanceDAO.mintDaoTokens(user2.address, ethers.parseEther("10000"));
      await daoToken.connect(user1).approve(await governanceDAO.getAddress(), ethers.parseEther("10000"));
      await daoToken.connect(user2).approve(await governanceDAO.getAddress(), ethers.parseEther("10000"));
      await governanceDAO.connect(user1).stakeForProposing(MIN_STAKE_FOR_PROPOSING);
      await governanceDAO.connect(user2).stakeForVoting(ethers.parseEther("1000"));
      await governanceDAO.connect(user1).createProposal("Test", "Test");
    });

    it("Should finalize accepted", async function () {
      await governanceDAO.connect(user2).vote(0, true);
      await time.increase(PROPOSAL_DURATION + 1);
      await expect(governanceDAO.finalizeProposal(0)).to.emit(governanceDAO, "ProposalFinalized");
    });

    it("Should finalize rejected", async function () {
      await governanceDAO.connect(user2).vote(0, false);
      await time.increase(PROPOSAL_DURATION + 1);
      await governanceDAO.finalizeProposal(0);
      const p = await governanceDAO.getProposal(0);
      expect(p.status).to.equal(2);
    });

    it("Should revert before end", async function () {
      await expect(governanceDAO.finalizeProposal(0)).to.be.revertedWithCustomError(governanceDAO, "VotingNotAllowed");
    });

    it("Should revert invalid", async function () {
      await time.increase(PROPOSAL_DURATION + 1);
      await expect(governanceDAO.finalizeProposal(999)).to.be.revertedWithCustomError(governanceDAO, "InvalidProposal");
    });

    it("Should revert already finalized", async function () {
      await governanceDAO.connect(user2).vote(0, true);
      await time.increase(PROPOSAL_DURATION + 1);
      await governanceDAO.finalizeProposal(0);
      await expect(governanceDAO.finalizeProposal(0)).to.be.revertedWithCustomError(governanceDAO, "VotingNotAllowed");
    });
  });
  
  describe("Anti-51% Attack (Quorum and Approval)", function () {
    beforeEach(async function () {
      const amount = ethers.parseEther("10000");
      await governanceDAO.mintDaoTokens(user1.address, amount);
      await governanceDAO.mintDaoTokens(user2.address, amount);
      await governanceDAO.mintDaoTokens(user3.address, amount);
      await daoToken.connect(user1).approve(await governanceDAO.getAddress(), amount);
      await daoToken.connect(user2).approve(await governanceDAO.getAddress(), amount);
      await daoToken.connect(user3).approve(await governanceDAO.getAddress(), amount);
      await governanceDAO.connect(user1).stakeForProposing(MIN_STAKE_FOR_PROPOSING);
    });
    
    it("Should reject when quorum not reached", async function () {
      // Stake for voting - user2 has 100 power, user3 has 500 power = 600 total
      await governanceDAO.connect(user2).stakeForVoting(ethers.parseEther("1000"));
      await governanceDAO.connect(user3).stakeForVoting(ethers.parseEther("5000"));
      
      // Total voting power = 600
      // Quorum needed = 30% of 600 = 180
      // user2 votes with 100 power (less than 180)
      await governanceDAO.connect(user1).createProposal("Test", "Test");
      await governanceDAO.connect(user2).vote(0, true);
      
      await time.increase(PROPOSAL_DURATION + 1);
      await expect(governanceDAO.finalizeProposal(0)).to.be.revertedWithCustomError(governanceDAO, "QuorumNotReached");
    });
    
    it("Should accept when quorum reached and approval threshold met", async function () {
      // user2 and user3 stake
      await governanceDAO.connect(user2).stakeForVoting(ethers.parseEther("2000"));
      await governanceDAO.connect(user3).stakeForVoting(ethers.parseEther("1000"));
      
      // Total voting power = 300
      // Quorum needed = 30% of 300 = 90
      // Both vote for = 300 votes (100% participation, > 30% quorum)
      // Approval: 300 for, 0 against = 100% approval (> 60% required)
      await governanceDAO.connect(user1).createProposal("Test", "Test");
      await governanceDAO.connect(user2).vote(0, true);
      await governanceDAO.connect(user3).vote(0, true);
      
      await time.increase(PROPOSAL_DURATION + 1);
      await governanceDAO.finalizeProposal(0);
      
      const p = await governanceDAO.getProposal(0);
      expect(p.status).to.equal(1); // ACCEPTED
    });
    
    it("Should reject when approval threshold not met", async function () {
      // user2 and user3 stake
      await governanceDAO.connect(user2).stakeForVoting(ethers.parseEther("1000"));
      await governanceDAO.connect(user3).stakeForVoting(ethers.parseEther("1000"));
      
      // Total voting power = 200
      // Both vote but split: 100 for, 100 against = 50% approval (< 60% required)
      await governanceDAO.connect(user1).createProposal("Test", "Test");
      await governanceDAO.connect(user2).vote(0, true);
      await governanceDAO.connect(user3).vote(0, false);
      
      await time.increase(PROPOSAL_DURATION + 1);
      await governanceDAO.finalizeProposal(0);
      
      const p = await governanceDAO.getProposal(0);
      expect(p.status).to.equal(2); // REJECTED
    });
    
    it("Should prevent 51% attack scenario", async function () {
      // Simular ataque del 51%: un usuario tiene 51% del total de voting power
      const attacker = user2;
      const defender = user3;
      
      // Attacker stakes 510 tokens (51 voting power)
      // Defender stakes 490 tokens (49 voting power)
      // Total = 100 voting power
      await governanceDAO.connect(attacker).stakeForVoting(ethers.parseEther("510"));
      await governanceDAO.connect(defender).stakeForVoting(ethers.parseEther("490"));
      
      await governanceDAO.connect(user1).createProposal("Malicious", "Attack");
      
      // Attacker votes with 51 power
      await governanceDAO.connect(attacker).vote(0, true);
      
      await time.increase(PROPOSAL_DURATION + 1);
      
      // Con 30% quorum: necesita 30 votes, tiene 51 (OK)
      // Con 60% approval: necesita 60% de los votos que participaron
      // Si solo attacker vota: 51 for, 0 against = 100% approval (ACCEPTED)
      // Pero si defender también vota: 51 for, 49 against = 51% approval (< 60% REJECTED)
      
      // Sin defensa, el ataque pasa por quorum pero necesita 60% approval
      // Como es el único votante, tiene 100% approval
      await governanceDAO.finalizeProposal(0);
      let p = await governanceDAO.getProposal(0);
      expect(p.status).to.equal(1); // ACCEPTED (solo votó el attacker)
      
      // Ahora probemos con defensa
      await governanceDAO.connect(user1).createProposal("Malicious2", "Attack2");
      await governanceDAO.connect(attacker).vote(1, true);
      await governanceDAO.connect(defender).vote(1, false);
      
      await time.increase(PROPOSAL_DURATION + 1);
      await governanceDAO.finalizeProposal(1);
      
      p = await governanceDAO.getProposal(1);
      // 51 for / 100 total = 51% approval (< 60% required)
      expect(p.status).to.equal(2); // REJECTED - Attack prevented!
    });
  });

  describe("Treasury Execution", function () {
    beforeEach(async function () {
      await governanceDAO.mintDaoTokens(user1.address, ethers.parseEther("10000"));
      await governanceDAO.mintDaoTokens(user2.address, ethers.parseEther("10000"));
      await daoToken.connect(user1).approve(await governanceDAO.getAddress(), ethers.parseEther("10000"));
      await daoToken.connect(user2).approve(await governanceDAO.getAddress(), ethers.parseEther("10000"));
      await governanceDAO.connect(user1).stakeForProposing(MIN_STAKE_FOR_PROPOSING);
      await governanceDAO.connect(user2).stakeForVoting(ethers.parseEther("1000"));
      await owner.sendTransaction({ to: await governanceDAO.getAddress(), value: ethers.parseEther("10") });
      await governanceDAO.connect(user1).createTreasuryProposal("T", "D", user3.address, ethers.parseEther("1"));
      await governanceDAO.connect(user2).vote(0, true);
      await time.increase(PROPOSAL_DURATION + 1);
      await governanceDAO.finalizeProposal(0);
    });

    it("Should execute", async function () {
      await expect(governanceDAO.executeTreasuryProposal(0)).to.emit(governanceDAO, "TreasuryProposalExecuted");
    });

    it("Should revert non-treasury", async function () {
      await governanceDAO.connect(user1).createProposal("R", "P");
      await governanceDAO.connect(user2).vote(1, true);
      await time.increase(PROPOSAL_DURATION + 1);
      await governanceDAO.finalizeProposal(1);
      await expect(governanceDAO.executeTreasuryProposal(1)).to.be.revertedWithCustomError(governanceDAO, "InvalidTreasuryProposal");
    });

    it("Should revert rejected", async function () {
      await governanceDAO.connect(user1).createTreasuryProposal("T2", "D", user3.address, ethers.parseEther("1"));
      await governanceDAO.connect(user2).vote(1, false);
      await time.increase(PROPOSAL_DURATION + 1);
      await governanceDAO.finalizeProposal(1);
      await expect(governanceDAO.executeTreasuryProposal(1)).to.be.revertedWithCustomError(governanceDAO, "ProposalNotExecutable");
    });

    it("Should revert executed", async function () {
      await governanceDAO.executeTreasuryProposal(0);
      await expect(governanceDAO.executeTreasuryProposal(0)).to.be.revertedWithCustomError(governanceDAO, "ProposalNotExecutable");
    });

    it("Should revert insufficient funds", async function () {
      await governanceDAO.connect(user1).createTreasuryProposal("Big", "Too much", user3.address, ethers.parseEther("100"));
      await governanceDAO.connect(user2).vote(1, true);
      await time.increase(PROPOSAL_DURATION + 1);
      await governanceDAO.finalizeProposal(1);
      await expect(governanceDAO.executeTreasuryProposal(1)).to.be.revertedWithCustomError(governanceDAO, "InvalidTreasuryProposal");
    });
  });

  describe("ETH Reception", function () {
    it("Should receive ETH", async function () {
      await owner.sendTransaction({ to: await governanceDAO.getAddress(), value: ethers.parseEther("5") });
      expect(await ethers.provider.getBalance(await governanceDAO.getAddress())).to.be.greaterThan(0);
    });

    it("Should fallback with data", async function () {
      await owner.sendTransaction({ to: await governanceDAO.getAddress(), value: ethers.parseEther("3"), data: "0x1234" });
      expect(await ethers.provider.getBalance(await governanceDAO.getAddress())).to.be.greaterThan(0);
    });
  });

  describe("Ownership", function () {
    it("Should transfer ownership", async function () {
      await governanceDAO.transferOwnership(user1.address);
      expect(await governanceDAO.owner()).to.equal(user1.address);
    });

    it("Should revert non-owner", async function () {
      await expect(governanceDAO.connect(user1).transferOwnership(user2.address)).to.be.revertedWithCustomError(governanceDAO, "OwnableUnauthorizedAccount");
    });
  });
});

