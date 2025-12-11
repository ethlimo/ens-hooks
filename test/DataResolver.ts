import { HardhatEthers, HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/types";
import hre from "hardhat";
import { DataResolver } from "../types/ethers-contracts/DataResolver.js";
import { expect } from "chai";

describe("DataResolver", function () {
    var ethers: HardhatEthers;
    var owner: HardhatEthersSigner;
    var otherAccount: HardhatEthersSigner;
    var contract: DataResolver;

    before(async () => {
        const ret = await hre.network.connect();
        ethers = ret.ethers;
    });

    beforeEach(async () => {
        [owner, otherAccount] = await ethers.getSigners();

        contract = await ethers.deployContract("DataResolver");
    })

    it("should store arbitrary data and retrieve it", async function () {
        const firstVal = ethers.toUtf8Bytes("value");
        await contract.setData(ethers.namehash("asdf.eth"), "key", firstVal);
        const val = await contract.data(ethers.namehash("asdf.eth"), "key");
        expect(ethers.toUtf8String(val)).to.equal("value");
    });

    it("should only allow the owner to set data", async function () {
        const firstVal = ethers.toUtf8Bytes("value");
        await expect(
            contract.connect(otherAccount).setData(ethers.namehash("asdf.eth"), "key", firstVal)
        ).to.be.revertedWith("Ownable: caller is not the owner");
    });
});