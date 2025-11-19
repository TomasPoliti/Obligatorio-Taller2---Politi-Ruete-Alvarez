import { expect } from "chai";
import hardhat from "hardhat";
const { ethers } = hardhat;

describe("DaoToken", function () {
  async function deployDaoTokenFixture() {
    const [owner, other] = await ethers.getSigners();
    const DaoToken = await ethers.getContractFactory("DaoToken");
    const token = await DaoToken.deploy("DAO Token", "DTK", owner.address);
    await token.waitForDeployment();

    return { token, owner, other };
  }

  it("debe inicializar nombre, símbolo y owner correctamente", async function () {
    const { token, owner } = await deployDaoTokenFixture();

    expect(await token.name()).to.equal("DAO Token");
    expect(await token.symbol()).to.equal("DTK");
    expect(await token.owner()).to.equal(owner.address);
  });

  it("solo el owner puede mintear tokens", async function () {
    const { token, owner, other } = await deployDaoTokenFixture();

    await expect(token.connect(other).mint(other.address, 100n)).to.be.revertedWithCustomError(
      token,
      "OwnableUnauthorizedAccount"
    );

    await expect(token.connect(owner).mint(other.address, 100n))
      .to.emit(token, "Transfer")
      .withArgs(ethers.ZeroAddress, other.address, 100n);

    expect(await token.balanceOf(other.address)).to.equal(100n);
  });
});
