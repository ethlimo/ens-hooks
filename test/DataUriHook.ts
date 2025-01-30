import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { decodeDataHookContentHash, decodeResolveBytesToString, encodeDataUrlAbi, HookContractInterface } from "../src/index";
import { DATA_URI_PREFIX, DATA_URL_PREFIX } from "../src/constants";
import { dnsEncode, getBytes, namehash } from "ethers";

describe("DataUrlHook", function () {
  async function deployFixture() {
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const contract = await hre.ethers.deployContract("DataUrlHook");
    return { owner, otherAccount, contract };
  }

  it("should work", async function () {
    const nameHash = namehash("asdf.eth");
    const chainId = (await ethers.getDefaultProvider().getNetwork()).chainId;
    const { contract } = await loadFixture(deployFixture);

    await contract.setDataURL(nameHash, "asdf");
    const encoded = encodeDataUrlAbi("asdf.eth", await contract.getAddress(), chainId)
    const v = await contract.resolve(dnsEncode("asdf.eth"), encoded);
    expect(decodeResolveBytesToString(v)).to.equal("asdf");
  });

  it("should decode and encode correctly", async function () {
    const buf = Buffer.concat([DATA_URI_PREFIX, Buffer.from("asdf.com")]);
    expect(decodeDataHookContentHash(Uint8Array.from(buf))).to.deep.equal({"data": "asdf.com", "type": "DataUriHook"});
    const { owner } = await loadFixture(deployFixture);
    const hookFunctionValues = [namehash("asdf.eth"), "eth.asdf:dataURL", owner.address, 0];
    const encodeFunctionData = HookContractInterface.encodeFunctionData("hook", hookFunctionValues);

    const buf2 = Buffer.concat([DATA_URL_PREFIX, getBytes(encodeFunctionData)]);
    const v = decodeDataHookContentHash(Uint8Array.from(buf2))
    expect(v).to.not.be.null;
    expect(v?.type).to.equal("DataUrlHook");
    expect((v?.data)).to.deep.equal({
      node: namehash("asdf.eth"),
      key: "eth.asdf:dataURL",
      resolver: owner.address,
      coinType: 0,
    });
  });
});