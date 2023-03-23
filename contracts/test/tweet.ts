import { expect } from "chai";
import { ethers, network } from "hardhat";
import { BigNumber } from "ethers";
import config from '../config'

import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";

import { MockDC, Tweet } from "../typechain-types"

const dotName = 'test.1.country'
const activatePrice = ethers.utils.parseEther("1");

describe('Tweet', () => {
  let accounts: SignerWithAddress;
  let deployer: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let revenueAccount: SignerWithAddress;

  let mockDC: MockDC;
  let tweet: Tweet;

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    [deployer, alice, bob, revenueAccount] = accounts;

    // Deploy MockDC contract
    const MockDC = await ethers.getContractFactory('MockDC');
    mockDC = (await MockDC.deploy()) as MockDC;

    // Deploy Tweet contract
    const Tweet = await ethers.getContractFactory("Tweet");
    tweet = (await Tweet.deploy({
      baseRentalPrice: activatePrice,
      revenueAccount: revenueAccount.address,
      dc: mockDC.address
    })) as Tweet;
  });

  describe("setRevenueAccount", () => {
    it("Should be able set the revenue account", async () => {
      expect(await tweet.revenueAccount()).to.equal(revenueAccount.address);
      
      await tweet.setRevenueAccount(alice.address);

      expect(await tweet.revenueAccount()).to.equal(alice.address);
    });

    it("Should revert if the caller is not owner", async () => {
      await expect(tweet.connect(alice).setRevenueAccount(alice.address)).to.be.reverted;
    });
  });

  describe("withdraw", () => {
    beforeEach(async () => {
      await mockDC.connect(alice).register(dotName);
      await tweet.activate(dotName, { value: activatePrice });
    });

    it("should be able to withdraw ONE tokens", async () => {
      const revenueAccountBalanceBefore = await ethers.provider.getBalance(revenueAccount.address);
      
      // withdraw ONE tokens
      await tweet.connect(revenueAccount).withdraw();

      const revenueAccountBalanceAfter = await ethers.provider.getBalance(revenueAccount.address);
      expect(revenueAccountBalanceAfter).gt(revenueAccountBalanceBefore);
    });

    it("Should revert if the caller is not the owner or revenue account", async () => {
      await expect(tweet.connect(alice).withdraw()).to.be.revertedWith("Tweet: must be owner or revenue account");
    });
  });
});
