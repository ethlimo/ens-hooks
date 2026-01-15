import { ethers } from "ethers";

// EIP-8121: Hook function signature with 4 parameters
export const HookAbi = [
    "function hook(bytes4 functionSelector, string calldata functionCall, string calldata returnType, bytes calldata target)"
];

// EIP-8121: Hook selector constant
export const HOOK_SELECTOR = "0x396b32a0";

//ENSIP-24
export const IDataResolverAbi = [
    "function data(bytes32 node) external view returns (bytes memory)",
    "event DataChanged(bytes32 indexed node, bytes32 indexed dataHash)"
]

// Protocol codes for contenthash (kept for plain URI support)
export const PROTOCODE_ETH_CALLDATA = ethers.getBytes("0x30009b")
export const PROTOCODE_CONTENTHASH_URI = ethers.getBytes("0x3000f2")