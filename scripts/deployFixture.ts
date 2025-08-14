import { HardhatEthers } from "@nomicfoundation/hardhat-ethers/types";
import { EthersIgnitionHelper } from "@nomicfoundation/hardhat-ignition-ethers/dist/src/types.js";
import { namehash } from "ethers";
import DataUrlHookModule from "../ignition/modules/DataUrlHook.js";
import { ENSRegistryABI, PublicResolverABI } from "./deploy.js";
import { Signer } from "ethers";

export async function deployFixture(ignition: EthersIgnitionHelper) {
    return await ignition.deploy(DataUrlHookModule);
}
export const getResolver = async (ensname: string, ethers: HardhatEthers): Promise<{ resolver: string; owner: string; }> => {
    const ensRegistry = new ethers.Contract("0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e", ENSRegistryABI, ethers.provider);
    const resolverAddress = await ensRegistry.resolver(namehash(ensname));
    const owner = await ensRegistry.owner(namehash(ensname));
    return { resolver: resolverAddress, owner };
};

export const overrideContentHash = async (signer: Signer,ensname: string, bytes: Uint8Array, ethers: HardhatEthers) => {
    const { resolver } = await getResolver(ensname, ethers);
    const resolverContract = new ethers.Contract(resolver, PublicResolverABI, signer);
    await resolverContract.setContentHash(namehash(ensname), bytes);
};
