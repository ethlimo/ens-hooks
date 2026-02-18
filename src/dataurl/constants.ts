import { ethers } from "ethers";

// EIP-8121: Hook function signature (without optional selector)
export const HookAbi = [
    "function hook(string calldata functionSignature, string calldata functionCall, string calldata returnType, bytes calldata target)"
];

// EIP-8121: Hook selector (no optional function selector variant)
export const HOOK_SELECTOR = "0x6113bfa3";

// ENSIP-24
export const IDataResolverAbi = [
    "function data(bytes32 node) external view returns (bytes memory)",
    "event DataChanged(bytes32 indexed node, bytes32 indexed dataHash)"
];

// Contenthash protocol codes
export const PROTOCODE_ETH_CALLDATA = ethers.getBytes("0x30009b");
export const PROTOCODE_CONTENTHASH_URI = ethers.getBytes("0x3000f2");