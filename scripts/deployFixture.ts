import { EthersIgnitionHelper } from "@nomicfoundation/hardhat-ignition-ethers/dist/src/types.js";
import DataUrlHookModule from "../ignition/modules/DataUrlHook.js";

import { Contract, namehash, Signer } from "ethers";
import * as PublicResolver from "@ensdomains/ens-contracts/artifacts/contracts/resolvers/PublicResolver.sol/PublicResolver.json" with { type: "json" };
const PublicResolverABI = PublicResolver.default.abi;
import * as ENSRegistry from "@ensdomains/ens-contracts/artifacts/contracts/registry/ENSRegistry.sol/ENSRegistry.json" with { type: "json" };
import { Provider } from "ethers";
import { HardhatEthers } from "@nomicfoundation/hardhat-ethers/types";
const ENSRegistryABI = ENSRegistry.default.abi;

export async function deployFixture(ignition: EthersIgnitionHelper) {
    return await ignition.deploy(DataUrlHookModule);
}
export const getResolver = async (ensname: string, provider: Provider): Promise<{ resolver: string; owner: string; }> => {
    const ensRegistry = new Contract("0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e", ENSRegistryABI, provider);
    const resolverAddress = await ensRegistry.resolver(namehash(ensname));
    const owner = await ensRegistry.owner(namehash(ensname));
    return { resolver: resolverAddress, owner };
};

export const overrideContentHash = async (signer: Signer, resolver: string, ensname: string, bytes: Uint8Array) => {
    const resolverContract = new Contract(resolver, PublicResolverABI, signer);
    await resolverContract.setContenthash(namehash(ensname), bytes);
};
