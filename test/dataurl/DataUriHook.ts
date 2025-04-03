import { expect } from "chai";
import { describe, it } from "mocha";
import hre from "hardhat";
import { decodeResolveBytesToString, HookContractInterface } from "../../src/dataurl/encoding.js";
import { encodeDataUrlAbi } from "../../src/dataurl/encoding.js";
import { DATA_URI_PREFIX, DATA_URL_PREFIX } from "../../src/dataurl/constants.js";
import { dnsEncode, getBytes, namehash } from "ethers";
import { HardhatEthers } from "@nomicfoundation/hardhat-ethers/types";
import { DataUrlContentHashEncoder } from "../../src/index.js";

describe("DataUrlHook", function () {
  var ethers: HardhatEthers;

  before(async () => {
    const ret = await hre.network.connect();
    ethers = ret.ethers;
  });

  async function deployFixture() {
    const [owner, otherAccount] = await ethers.getSigners();

    const contract = await ethers.deployContract("DataUrlHook");
    return { owner, otherAccount, contract };
  }

  it("should store arbitrary data and retrieve it", async function () {
    const nameHash = namehash("asdf.eth");
    const chainId = (await ethers.getDefaultProvider().getNetwork()).chainId;
    const { contract } = await deployFixture();

    await contract.setDataURL(nameHash, true, "asdf");
    const encoded = encodeDataUrlAbi("asdf.eth", "asdf.eth:dataURL", await contract.getAddress(), chainId)
    const v = await contract.resolve(dnsEncode("asdf.eth"), encoded);
    expect(decodeResolveBytesToString(v)).to.equal("asdf");
  });

  it("should correctly encode and decode DataUrls using the DataUrlContentHashEncoder", async function () {
    const { owner } = await deployFixture();
    const testObj = DataUrlContentHashEncoder.create("DataUrl", {
      _tag: "DataUrl",
      value: {
        node: namehash("asdf.eth"),
        key: "eth.asdf:dataURL",
        resolver: owner.address,
        coinType: 0,
      }
    })

    const contentHash = testObj.toContentHash();

    const decoded = DataUrlContentHashEncoder.createFromContentHash(contentHash);

    expect(decoded?.Data).to.deep.equal(testObj.Data);
    expect(decoded?.Type).to.deep.equal(testObj.Type);
  })
});