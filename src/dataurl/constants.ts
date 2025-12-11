import { ethers } from "ethers";

export const HookAbi = [
    "function hook(string calldata ensresolverfunction, bytes resolveraddress)"
];

//ENSIP-24
export const IDataResolverAbi = [
    "function data(bytes32 node, string calldata key) external view returns (bytes memory)",
    "event DataChanged(bytes32 node, string key, bytes32 indexed keyHash, bytes32 indexed dataHash)"
]

//temporary values
export const PROTOCODE_ETH_CALLDATA = ethers.getBytes("0x30009b")
export const PROTOCODE_CONTENTHASH_URI = ethers.getBytes("0x3000f2")