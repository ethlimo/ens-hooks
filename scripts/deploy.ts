import hre from "hardhat";
import DataUrlHookModule from "../ignition/modules/DataUrlHook.js";
import { encodeDataUrlAbi } from "../src/dataurl/encoding.js";

import * as PublicResolver from "@ensdomains/ens-contracts/artifacts/contracts/resolvers/PublicResolver.sol/PublicResolver.json" with { type: "json" };
const PublicResolverABI = PublicResolver.default.abi;
import { getBytes, hexlify, namehash } from "ethers";
import { JsonRpcProvider } from "ethers";
import { DATA_URL_PREFIX } from "../src/dataurl/constants.js";

const VITALIK_ADDRESS = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"


async function main() {
    const { ignition, ethers } = await hre.network.connect();
    const { dataUrlHook } = await ignition.deploy(DataUrlHookModule);
    const address = await dataUrlHook.getAddress();
    const impersonated_signer = await ethers.getImpersonatedSigner(VITALIK_ADDRESS);
    //TODO: cointype?
    const _dataUrlHookAbi = encodeDataUrlAbi("vitalik.eth", "vitalik.eth:dataURL", address, 0);
    const dataUrlHookAbi = new Uint8Array([...DATA_URL_PREFIX, ...getBytes(_dataUrlHookAbi)])
    const publicResolver = new ethers.Contract("0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63", PublicResolverABI, impersonated_signer)
    await publicResolver.setContenthash(namehash("vitalik.eth"), dataUrlHookAbi)

    const resolver = await ethers.EnsResolver.fromName(new JsonRpcProvider("http://localhost:8545"), "vitalik.eth")
    if (!resolver) {
        throw new Error("Resolver not found")
    }
    var contenthash;
    try {
        contenthash = await resolver.getContentHash()
    } catch (e: any) {
        contenthash = e.info.data;
    }
    if (contenthash !== hexlify(dataUrlHookAbi)) {
        throw new Error("Contenthash not right")
    }
}

main().catch(console.error)