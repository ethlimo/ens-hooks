import { HardhatEthers, HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/types";
import hre from "hardhat";
import { DataResolver } from "../../types/ethers-contracts/DataResolver.js";
import { expect } from "chai";
import { decodeHookAbi, encodeDataUrlHookForContenthash } from "../../src/dataurl/encoding.js";
import ENSRegistry from "@ensdomains/ens-contracts/artifacts/contracts/registry/ENSRegistry.sol/ENSRegistry.json" with { type: "json" };
const ENSRegistryABI = ENSRegistry.abi;
import * as PublicResolver from "@ensdomains/ens-contracts/artifacts/contracts/resolvers/PublicResolver.sol/PublicResolver.json" with { type: "json" };
import { PROTOCODE_ETH_CALLDATA } from "../../src/dataurl/constants.js";
import { hexlify, namehash } from "ethers";
const PublicResolverABI = PublicResolver.default.abi;
import * as IExtendedResolver from "@ensdomains/ens-contracts/artifacts/contracts/resolvers/profiles/IExtendedResolver.sol/IExtendedResolver.json" with { type: "json" };
const IExtendedResolverABI = IExtendedResolver.default.abi;

describe("DataResolver", function () {
    var ethers: HardhatEthers;
    var owner: HardhatEthersSigner;
    var otherAccount: HardhatEthersSigner;
    var vitalik: HardhatEthersSigner;
    var contract: DataResolver;

    before(async () => {
        const ret = await hre.network.connect();
        ethers = ret.ethers;
    });

    beforeEach(async () => {
        [owner, otherAccount] = await ethers.getSigners();

        contract = await ethers.deployContract("DataResolver", vitalik);
        vitalik = await ethers.getImpersonatedSigner("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")

    });

    it("should encode and decode DataUrls correctly", async function () {
        const blob = "data:text/html,<html><body>Hello, World!</body></html>";
        const firstVal = ethers.toUtf8Bytes(blob);
        await contract.setData(ethers.namehash("asdf.eth"), "data-url:asdf.eth", firstVal);
        const val = await contract.data(ethers.namehash("asdf.eth"), "data-url:asdf.eth");
        expect(ethers.toUtf8String(val)).to.equal(blob);
    });
    
    it("should retrieve data via hooks", async function () {
        const blob = "data:text/html,<html><body>Hello, World!</body></html>";
        const firstVal = ethers.toUtf8Bytes(blob);
        await contract.setData(ethers.namehash("vitalik.eth"), "data-url:vitalik.eth", firstVal);
        const ensRegistry = new ethers.Contract("0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e", ENSRegistryABI, vitalik);
        const resolverAddress = await ensRegistry.resolver(ethers.namehash("vitalik.eth"));
        const resolverContract = new ethers.Contract(resolverAddress, PublicResolverABI, vitalik);

        const contenthash = encodeDataUrlHookForContenthash("vitalik.eth", await contract.getAddress());
        await resolverContract.setContenthash(ethers.namehash("vitalik.eth"), contenthash);

        const resolvedContenthash = await resolverContract.contenthash(ethers.namehash("vitalik.eth"));
        // The resolved contenthash should be the original data URL
        const chBytes = ethers.getBytes(resolvedContenthash).slice(PROTOCODE_ETH_CALLDATA.length);
        const decodedHookAbi = decodeHookAbi(hexlify(chBytes), true);
        expect(decodedHookAbi).to.not.be.null;
        if (!decodedHookAbi) {
            return;
        }
        const decodedCalldata = decodedHookAbi.calldata;
        const decodedResolverAddress = decodedHookAbi.resolverAddress;
        expect(decodedResolverAddress.toLowerCase()).to.equal((await contract.getAddress()).toLowerCase());
        const extendedResolverContract = new ethers.Contract(decodedResolverAddress, IExtendedResolverABI, vitalik);
        const returnedData = await extendedResolverContract.resolve(namehash("vitalik.eth"), decodedCalldata);
        expect(ethers.AbiCoder.defaultAbiCoder().decode(["string"], returnedData)[0]).to.equal(blob);
    });
});