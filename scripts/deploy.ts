import hre from "hardhat";
import { encodeDataUriContentHash, encodeDataUrlContentHash } from "../src/dataurl/encoding.js";
import * as PublicResolver from "@ensdomains/ens-contracts/artifacts/contracts/resolvers/PublicResolver.sol/PublicResolver.json" with { type: "json" };
export const PublicResolverABI = PublicResolver.default.abi;
import * as ENSRegistry from "@ensdomains/ens-contracts/artifacts/contracts/registry/ENSRegistry.sol/ENSRegistry.json" with { type: "json" };
export const ENSRegistryABI = ENSRegistry.default.abi;
import { namehash } from "ethers";
import { DataUrlHook__factory } from "../types/ethers-contracts/index.js";
import { deployFixture, getResolver, overrideContentHash } from "./deployFixture.js";
import { getBase64Payload } from "./getBase64Payload.js";
async function main() {
    const connection = await hre.network.connect();
    const ethers = connection.ethers;
    const { dataUrlHook } = await deployFixture(connection.ignition);
    const contract = DataUrlHook__factory.connect(await dataUrlHook.getAddress(), (await ethers.getSigners())[0])
    const address = await dataUrlHook.getAddress();
    const dataUrlHookAbi = encodeDataUrlContentHash("vitalik.eth", "eth.vitalik:dataURL", address, BigInt(60));
    const { resolver, owner } = await getResolver("vitalik.eth", ethers);
    const impersonatedSigner = await ethers.getImpersonatedSigner(owner);
    await overrideContentHash(impersonatedSigner, "vitalik.eth", dataUrlHookAbi, ethers);
    await contract.setDataURL(namehash("vitalik.eth"), true, await getBase64Payload())
    const dataUriHookAbi = encodeDataUriContentHash("https://www.google.com");
    await overrideContentHash(impersonatedSigner, "nick.eth", dataUriHookAbi, ethers);
}

main().catch(console.error)
