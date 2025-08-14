import { encodeDataUrlContentHash } from "../src/dataurl/encoding.js";
import * as PublicResolver from "@ensdomains/ens-contracts/artifacts/contracts/resolvers/PublicResolver.sol/PublicResolver.json" with { type: "json" };
export const PublicResolverABI = PublicResolver.default.abi;
import * as ENSRegistry from "@ensdomains/ens-contracts/artifacts/contracts/registry/ENSRegistry.sol/ENSRegistry.json" with { type: "json" };
export const ENSRegistryABI = ENSRegistry.default.abi;
import { hexlify, namehash } from "ethers";
import deployedAddresses from "../ignition/deployments/chain-11155111/deployed_addresses.json" with { type: "json" };
import { getBase64Payload } from "./getBase64Payload.js";
async function main() {
    console.log("running execute-on-sepolia.ts");
    const ensname = "0x55559E7da7AeC04B3156e16a60Cf57A348843dFB.eth";
    const address = deployedAddresses["DataUrlHook#DataUrlHook"];
    const dataUrlHookAbi = encodeDataUrlContentHash(ensname, ensname.split(".").reverse().join(".") + ":dataURL", address, 11155111);
    console.log(["setContentHash", namehash(ensname), hexlify(dataUrlHookAbi)].join(", "));
    console.log([address, "setDataURL", namehash(ensname), true, await getBase64Payload()].join(", "));
}

main().catch(console.error)