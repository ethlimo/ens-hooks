import { BytesLike, ethers, getBytes, toUtf8Bytes, toUtf8String } from "ethers";
import { HookAbi, PROTOCODE_ETH_CALLDATA, PROTOCODE_CONTENTHASH_URI, HOOK_SELECTOR } from "./constants.js";
import { buildFromPayload, getAddress, getChainId } from "@wonderland/interop-addresses";

export const HookInterface = new ethers.Interface(HookAbi);

// ============================================================================
// Contenthash Encoding/Decoding
// ============================================================================

/**
 * Encodes a plain URI string for use in contenthash records.
 * @param uri - The URI string to encode (e.g., "https://example.com" or "data:text/html,...")
 * @returns The encoded contenthash with the URI protocol code prefix
 */
export function encodeDataUri(uri: string): string {
    const uriBytes = toUtf8Bytes(uri);
    return ethers.concat([PROTOCODE_CONTENTHASH_URI, uriBytes]);
}

/**
 * Decodes a plain URI from contenthash data.
 * @param data - The contenthash data (with or without protocol code prefix)
 * @returns The decoded URI string, or null if decoding fails
 */
export function tryDecodeDataUri(data: BytesLike): string | null {
    try {
        const bytes = getBytes(data);
        const protocode = PROTOCODE_CONTENTHASH_URI;
        
        if (bytes.length < protocode.length) {
            return null;
        }
        
        for (let i = 0; i < protocode.length; i++) {
            if (bytes[i] !== protocode[i]) {
                return null;
            }
        }
        
        const uriBytes = bytes.slice(protocode.length);
        return toUtf8String(uriBytes);
    } catch (e) {
        return null;
    }
}

/**
 * Wraps an EIP-8121 hook for storage in contenthash records.
 * @param hookData - The encoded EIP-8121 hook (from encodeHook)
 * @returns The hook with ETH_CALLDATA protocol code prefix for contenthash storage
 */
export function encodeEIP8121HookForContenthash(hookData: string): string {
    return ethers.concat([PROTOCODE_ETH_CALLDATA, hookData]);
}

/**
 * Decodes an EIP-8121 hook from contenthash data.
 * @param data - The contenthash data (with protocol code prefix)
 * @returns The decoded hook data (without protocol code), or null if invalid
 */
export function tryDecodeEIP8121HookFromContenthash(data: BytesLike): string | null {
    try {
        const bytes = getBytes(data);
        const protocode = PROTOCODE_ETH_CALLDATA;
        
        if (bytes.length < protocode.length) {
            return null;
        }
        
        for (let i = 0; i < protocode.length; i++) {
            if (bytes[i] !== protocode[i]) {
                return null;
            }
        }
        
        return ethers.hexlify(bytes.slice(protocode.length));
    } catch (e) {
        return null;
    }
}

// ============================================================================
// EIP-8121 Hook Implementation
// ============================================================================

/**
 * EIP-8121 hook target with chain ID and address.
 */
export interface EIP8121Target {
    chainId: number;
    address: string;
}

/**
 * EIP-8121 decoded hook data.
 */
export interface DecodedEIP8121Hook {
    functionSelector: string;
    functionCall: string;
    returnType: string;
    target: EIP8121Target;
}

/**
 * Encodes an ERC-7930 interoperable address (EIP-155 only).
 * Uses @wonderland/interop-addresses for proper spec compliance.
 * @param chainId - The EIP-155 chain ID (e.g., 1 for Ethereum mainnet)
 * @param address - The contract address
 * @returns The encoded target as a hex string
 */
export async function encodeERC7930Target(chainId: number, address: string): Promise<string> {
    const binaryAddress = await buildFromPayload({
        version: 1,
        chainType: "eip155",
        chainReference: chainId.toString(),
        address: address,
    });
    return binaryAddress;
}

/**
 * Decodes an ERC-7930 interoperable address (EIP-155 only).
 * Uses @wonderland/interop-addresses for proper spec compliance.
 * @param target - The encoded target bytes
 * @returns The decoded chain ID and address, or null if invalid
 */
export async function decodeERC7930Target(target: string): Promise<EIP8121Target | null> {
    try {
        const chainId = await getChainId(target);
        const address = await getAddress(target);
        
        if (typeof chainId !== 'number') {
            return null;
        }
        
        return { chainId, address };
    } catch {
        return null;
    }
}

/**
 * Computes the function selector from a function signature.
 * @param functionSignature - The function signature (e.g., "data(bytes32)")
 * @returns The 4-byte function selector as a hex string
 */
export function computeSelector(functionSignature: string): string {
    const hash = ethers.id(functionSignature);
    return ethers.dataSlice(hash, 0, 4);
}

/**
 * Parses a function call string to extract the function name.
 * For EIP-8121 with single nodehash parameter, we only need the function name.
 * @param functionCall - The function call string (e.g., "data(bytes32)")
 * @returns The function name
 */
export function parseFunctionCall(functionCall: string): string {
    const match = functionCall.match(/^(\w+)\(/);
    if (!match) {
        throw new Error("Invalid function call format");
    }
    return match[1];
}

/**
 * Encodes an EIP-8121 hook in bytes format (ABI-encoded).
 * @param functionSelector - The 4-byte function selector
 * @param functionCall - The function call string (e.g., "data(bytes32)")
 * @param returnType - The return type in Solidity tuple notation (e.g., "(string)")
 * @param target - The target with chainId and address
 * @returns The ABI-encoded hook data
 */
export async function encodeHook(
    functionSelector: string,
    functionCall: string,
    returnType: string,
    target: EIP8121Target
): Promise<string> {
    const targetBytes = await encodeERC7930Target(target.chainId, target.address);
    return HookInterface.encodeFunctionData("hook", [
        functionSelector,
        functionCall,
        returnType,
        targetBytes
    ]);
}

/**
 * Decodes an EIP-8121 hook from bytes format (ABI-encoded).
 * @param data - The ABI-encoded hook data
 * @returns The decoded hook, or null if decoding fails
 */
export async function decodeHook(data: string): Promise<DecodedEIP8121Hook | null> {
    try {
        const decoded = HookInterface.decodeFunctionData("hook", data);
        const target = await decodeERC7930Target(decoded[3]);
        
        if (!target) {
            return null;
        }
        
        return {
            functionSelector: decoded[0],
            functionCall: decoded[1],
            returnType: decoded[2],
            target
        };
    } catch {
        return null;
    }
}

/**
 * Encodes an EIP-8121 hook in string format.
 * Format: hook(0xSelector, "functionCall()", "(returnType)", 0xTarget)
 * @param functionSelector - The 4-byte function selector
 * @param functionCall - The function call string
 * @param returnType - The return type in Solidity tuple notation
 * @param target - The target with chainId and address
 * @returns The string-formatted hook
 */
export async function encodeHookString(
    functionSelector: string,
    functionCall: string,
    returnType: string,
    target: EIP8121Target
): Promise<string> {
    const targetBytes = await encodeERC7930Target(target.chainId, target.address);
    return `hook(${functionSelector}, "${functionCall}", "${returnType}", ${targetBytes})`;
}

/**
 * Decodes an EIP-8121 hook from string format.
 * @param hookStr - The string-formatted hook
 * @returns The decoded hook, or null if decoding fails
 */
export async function decodeHookString(hookStr: string): Promise<DecodedEIP8121Hook | null> {
    try {
        const regex = /^hook\((0x[0-9a-fA-F]{8}),\s*"([^"]+)",\s*"([^"]+)",\s*(0x[0-9a-fA-F]+)\)$/;
        const match = hookStr.match(regex);
        
        if (!match) {
            return null;
        }
        
        const target = await decodeERC7930Target(match[4]);
        if (!target) {
            return null;
        }
        
        return {
            functionSelector: match[1],
            functionCall: match[2],
            returnType: match[3],
            target
        };
    } catch {
        return null;
    }
}

/**
 * Detects if data is an EIP-8121 hook by checking for the hook selector.
 * @param data - The data to check
 * @returns True if the data starts with the EIP-8121 hook selector
 */
export function isEIP8121Hook(data: string): boolean {
    try {
        return data.toLowerCase().startsWith(HOOK_SELECTOR.toLowerCase());
    } catch {
        return false;
    }
}

/**
 * Detects if a string is an EIP-8121 hook in string format.
 * @param str - The string to check
 * @returns True if the string starts with "hook("
 */
export function isEIP8121HookString(str: string): boolean {
    return str.trim().startsWith("hook(");
}
