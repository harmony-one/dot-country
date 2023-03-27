import { expect } from "chai";
import { ethers, network } from "hardhat";
import { BigNumber } from "ethers";
import config from '../config'

import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";

import { MockDC, Tweet } from "../typechain-types"

const dotName = 'test.1.country'
const baseRentalPrice = ethers.utils.parseEther("1");

const name1 = "name1";
const name2 = "name2";
const name3 = "name3";

const names = [
  name1,
  name2,
  name3,
];

const url1 = "url1";
const url2 = "url2";
const url3 = "url3";

const urls = [
  url1,
  url2,
  url3,
]

const stringToBytes32 = (stringToConvert: string) => {
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(stringToConvert));
}

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
      baseRentalPrice: baseRentalPrice,
      revenueAccount: revenueAccount.address,
      dc: mockDC.address
    })) as Tweet;
  });

  describe("initializeActivation", () => {
    it("Should be able to initialize the activation", async () => {
      expect(await tweet.activatedAt(stringToBytes32(name1))).to.equal(0);

      await tweet.initializeActivation(names);

      expect(await tweet.activatedAt(stringToBytes32(name1))).to.gt(0);
    });

    it("Should revert if the domain was already activated", async () => {
      await tweet.finishInitialization();

      await expect(tweet.initializeActivation(names)).to.be.revertedWith("Tweet: already initialized");
    });
  });

  describe("initializeUrls", () => {
    it("Should be able to initialize the urls", async () => {
      expect(await tweet.numUrls(name1)).to.equal(0);
      for (let i = 0; i < urls.length; i++) {
        expect(await tweet.urlUpdateAt(stringToBytes32(name1), urls[i])).to.equal(0);
      }

      await tweet.initializeUrls(name1, urls);

      expect(await tweet.numUrls(name1)).to.equal(urls.length);
      for (let i = 0; i < urls.length; i++) {
        expect(await tweet.urlUpdateAt(stringToBytes32(name1), urls[i])).gt(0);
      }
    });

    it("Should revert if the initialization is finalized", async () => {
      await tweet.finishInitialization();

      await expect(tweet.initializeUrls(name1, urls)).to.revertedWith("Tweet: already initialized");
    });
  });

  describe("setBaseRentalPrice", () => {
    it("Should be able set the base rental price", async () => {
      expect(await tweet.baseRentalPrice()).to.equal(baseRentalPrice);
      
      await tweet.setBaseRentalPrice(baseRentalPrice.add(1));

      expect(await tweet.baseRentalPrice()).to.equal(baseRentalPrice.add(1));
    });

    it("Should revert if the caller is not owner", async () => {
      await expect(tweet.connect(alice).setBaseRentalPrice(baseRentalPrice)).to.be.reverted;
    });
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

  describe("setDC", () => {
    it("Should be able set the DC contract address", async () => {
      expect(await tweet.dc()).to.equal(mockDC.address);
      
      await tweet.setDC(alice.address);

      expect(await tweet.dc()).to.equal(alice.address);
    });

    it("Should revert if the caller is not owner", async () => {
      await expect(tweet.connect(alice).setDC(alice.address)).to.be.reverted;
    });
  });

  describe("withdraw", () => {
    beforeEach(async () => {
      await mockDC.connect(alice).register(dotName);
      await tweet.activate(dotName, { value: baseRentalPrice });
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
