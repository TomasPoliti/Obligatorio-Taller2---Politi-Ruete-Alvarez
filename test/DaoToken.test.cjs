const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DaoToken", function () {
  let daoToken;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const DaoToken = await ethers.getContractFactory("DaoToken");
    daoToken = await DaoToken.deploy("DAO Token", "DAO", owner.address);
    await daoToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await daoToken.name()).to.equal("DAO Token");
      expect(await daoToken.symbol()).to.equal("DAO");
    });

    it("Should set the correct owner", async function () {
      expect(await daoToken.owner()).to.equal(owner.address);
    });

    it("Should start with zero total supply", async function () {
      expect(await daoToken.totalSupply()).to.equal(0);
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      const amount = ethers.parseEther("1000");
      await daoToken.mint(addr1.address, amount);
      expect(await daoToken.balanceOf(addr1.address)).to.equal(amount);
      expect(await daoToken.totalSupply()).to.equal(amount);
    });

    it("Should emit Transfer event on mint", async function () {
      const amount = ethers.parseEther("100");
      await expect(daoToken.mint(addr1.address, amount))
        .to.emit(daoToken, "Transfer")
        .withArgs(ethers.ZeroAddress, addr1.address, amount);
    });

    it("Should allow multiple mints", async function () {
      const amount1 = ethers.parseEther("1000");
      const amount2 = ethers.parseEther("500");
      
      await daoToken.mint(addr1.address, amount1);
      await daoToken.mint(addr2.address, amount2);
      
      expect(await daoToken.balanceOf(addr1.address)).to.equal(amount1);
      expect(await daoToken.balanceOf(addr2.address)).to.equal(amount2);
      expect(await daoToken.totalSupply()).to.equal(amount1 + amount2);
    });

    it("Should revert when non-owner tries to mint", async function () {
      const amount = ethers.parseEther("1000");
      await expect(
        daoToken.connect(addr1).mint(addr2.address, amount)
      ).to.be.revertedWithCustomError(daoToken, "OwnableUnauthorizedAccount");
    });

    it("Should allow minting to zero address (ERC20 standard allows it in _mint)", async function () {
      const amount = ethers.parseEther("100");
      await expect(
        daoToken.mint(ethers.ZeroAddress, amount)
      ).to.be.revertedWithCustomError(daoToken, "ERC20InvalidReceiver");
    });
  });

  describe("ERC20 Functionality", function () {
    beforeEach(async function () {
      const amount = ethers.parseEther("1000");
      await daoToken.mint(addr1.address, amount);
    });

    it("Should allow transfers", async function () {
      const transferAmount = ethers.parseEther("100");
      await daoToken.connect(addr1).transfer(addr2.address, transferAmount);
      expect(await daoToken.balanceOf(addr2.address)).to.equal(transferAmount);
      expect(await daoToken.balanceOf(addr1.address)).to.equal(
        ethers.parseEther("900")
      );
    });

    it("Should allow approve and transferFrom", async function () {
      const approveAmount = ethers.parseEther("200");
      await daoToken.connect(addr1).approve(addr2.address, approveAmount);
      expect(await daoToken.allowance(addr1.address, addr2.address)).to.equal(
        approveAmount
      );

      const transferAmount = ethers.parseEther("100");
      await daoToken
        .connect(addr2)
        .transferFrom(addr1.address, addr2.address, transferAmount);
      expect(await daoToken.balanceOf(addr2.address)).to.equal(transferAmount);
    });

    it("Should emit Approval event", async function () {
      const amount = ethers.parseEther("100");
      await expect(daoToken.connect(addr1).approve(addr2.address, amount))
        .to.emit(daoToken, "Approval")
        .withArgs(addr1.address, addr2.address, amount);
    });
  });

  describe("Ownership", function () {
    it("Should allow owner to transfer ownership", async function () {
      await daoToken.transferOwnership(addr1.address);
      expect(await daoToken.owner()).to.equal(addr1.address);
    });

    it("Should revert when non-owner tries to transfer ownership", async function () {
      await expect(
        daoToken.connect(addr1).transferOwnership(addr2.address)
      ).to.be.revertedWithCustomError(daoToken, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to renounce ownership", async function () {
      await daoToken.renounceOwnership();
      expect(await daoToken.owner()).to.equal(ethers.ZeroAddress);
    });
  });
});

