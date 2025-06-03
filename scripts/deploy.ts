import hre from "hardhat";
import { encodeDataUriContentHash, encodeDataUrlAbi, encodeDataUrlContentHash } from "../src/dataurl/encoding.js";
import * as PublicResolver from "@ensdomains/ens-contracts/artifacts/contracts/resolvers/PublicResolver.sol/PublicResolver.json" with { type: "json" };
const PublicResolverABI = PublicResolver.default.abi;
import * as ENSRegistry from "@ensdomains/ens-contracts/artifacts/contracts/registry/ENSRegistry.sol/ENSRegistry.json" with { type: "json" };
const ENSRegistryABI = ENSRegistry.default.abi;
import { namehash } from "ethers";
import DataUrlHookModule from "../ignition/modules/DataUrlHook.js";
import { EthersIgnitionHelper } from "@nomicfoundation/hardhat-ignition-ethers/dist/src/types.js";
import { HardhatEthers } from "@nomicfoundation/hardhat-ethers/types";

async function deployFixture(ignition: EthersIgnitionHelper) {
    return await ignition.deploy(DataUrlHookModule)
}

const getResolver = async (ensname: string, ethers: HardhatEthers): Promise<{resolver: string, owner: string}> => {
    const ensRegistry = new ethers.Contract("0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e", ENSRegistryABI, ethers.provider);
    const resolverAddress = await ensRegistry.resolver(namehash(ensname));
    const owner = await ensRegistry.owner(namehash(ensname));
    return {resolver: resolverAddress, owner};
}

const overrideContentHash = async (ensname: string, bytes: Uint8Array, ethers: HardhatEthers) => {
    const {resolver, owner} = await getResolver(ensname, ethers);
    const impersonatedSigner = await ethers.getImpersonatedSigner(owner);
    const resolverContract = new ethers.Contract(resolver, PublicResolverABI, impersonatedSigner)
    await resolverContract.setContenthash(namehash(ensname), bytes);
}

async function main() {
    const { ignition, ethers } = await hre.network.connect();
    const { dataUrlHook } = await deployFixture(ignition);
    const address = await dataUrlHook.getAddress();
    const dataUrlHookAbi = encodeDataUrlContentHash("vitalik.eth", "eth.vitalik:dataURL", address, BigInt(60));
    await overrideContentHash("vitalik.eth", dataUrlHookAbi, ethers);

    const dataUriHookAbi = encodeDataUriContentHash("https://www.google.com");
    await overrideContentHash("nick.eth", dataUriHookAbi, ethers);
}

main().catch(console.error)
