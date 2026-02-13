import { BytesLike, ethers, getBytes, toUtf8Bytes, toUtf8String } from "ethers";
import { HookAbi, PROTOCODE_ETH_CALLDATA, PROTOCODE_CONTENTHASH_URI, HOOK_SELECTOR } from "./constants.js";
import { buildFromPayload, getAddress, getChainId } from "@wonderland/interop-addresses";

export const HookInterface = new ethers.Interface(HookAbi);

export function encodeDataUri(uri: string): string {
    const uriBytes = toUtf8Bytes(uri);
    return ethers.concat([PROTOCODE_CONTENTHASH_URI, uriBytes]);
}

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

export function encodeEIP8121HookForContenthash(hookData: string): string {
    return ethers.concat([PROTOCODE_ETH_CALLDATA, hookData]);
}

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

export interface EIP8121Target {
    chainId: number;
    address: string;
}

export interface HookParameter {
    type: string;
    value: any;
}

export interface DecodedEIP8121Hook {
    functionSignature: string;
    functionCall: string;
    returnType: string;
    target: EIP8121Target;
}

export async function encodeERC7930Target(chainId: number, address: string): Promise<string> {
    const binaryAddress = await buildFromPayload({
        version: 1,
        chainType: "eip155",
        chainReference: chainId.toString(),
        address: address,
    });
    return binaryAddress;
}

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

export function computeSelector(functionSignature: string): string {
    const hash = ethers.id(functionSignature);
    return ethers.dataSlice(hash, 0, 4);
}

/**
 * Validates that a parameter type is a fixed-size Solidity primitive.
 * Allowed types: bool, address, uint8-256, int8-256, bytes1-32
 * Rejects: string, bytes (dynamic), arrays, structs, tuples
 */
export function isFixedSizePrimitive(type: string): boolean {
    const trimmedType = type.trim();
    
    // Check for exact matches
    if (trimmedType === 'bool' || trimmedType === 'address') {
        return true;
    }
    
    // Check for uintN (uint8, uint16, ..., uint256)
    const uintMatch = trimmedType.match(/^uint(\d+)$/);
    if (uintMatch) {
        const bits = parseInt(uintMatch[1], 10);
        return bits >= 8 && bits <= 256 && bits % 8 === 0;
    }
    
    // Check for intN (int8, int16, ..., int256)
    const intMatch = trimmedType.match(/^int(\d+)$/);
    if (intMatch) {
        const bits = parseInt(intMatch[1], 10);
        return bits >= 8 && bits <= 256 && bits % 8 === 0;
    }
    
    // Check for bytesN (bytes1, bytes2, ..., bytes32)
    const bytesMatch = trimmedType.match(/^bytes(\d+)$/);
    if (bytesMatch) {
        const n = parseInt(bytesMatch[1], 10);
        return n >= 1 && n <= 32;
    }
    
    return false;
}

/**
 * Parses parameter types from a function signature.
 * Returns array of parameter types, or throws if signature is invalid.
 */
export function parseParameterTypes(functionSignature: string): string[] {
    const match = functionSignature.match(/^\w+\(([^)]*)\)$/);
    if (!match) {
        throw new Error('Invalid function signature format');
    }
    
    const paramsString = match[1].trim();
    if (!paramsString) {
        return [];
    }
    
    // Split by comma
    const params = paramsString.split(',').map(p => p.trim()).filter(p => p.length > 0);
    
    // Validate parameter count (0-2 only)
    if (params.length > 2) {
        throw new Error(`Too many parameters: ${params.length}. Maximum 2 parameters allowed.`);
    }
    
    // Validate each parameter type
    for (const param of params) {
        if (!isFixedSizePrimitive(param)) {
            throw new Error(`Unsupported parameter type: ${param}. Only fixed-size primitives allowed (bool, address, uintN, intN, bytesN).`);
        }
    }
    
    return params;
}

/**
 * Extracts function name from function signature or function call.
 */
export function extractFunctionName(functionString: string): string {
    const match = functionString.match(/^(\w+)\(/);
    if (!match) {
        throw new Error('Invalid function format');
    }
    return match[1];
}

/**
 * Strictly validates that functionCall matches functionSignature structure.
 * Validates function name matches and parameter count matches.
 */
export function validateFunctionCallMatchesSignature(
    functionSignature: string,
    functionCall: string
): void {
    const sigName = extractFunctionName(functionSignature);
    const callName = extractFunctionName(functionCall);
    
    if (sigName !== callName) {
        throw new Error(`Function name mismatch: signature has '${sigName}' but call has '${callName}'`);
    }
    
    const paramTypes = parseParameterTypes(functionSignature);
    
    // Parse parameter values from function call
    const callMatch = functionCall.match(/^\w+\(([^)]*)\)$/);
    if (!callMatch) {
        throw new Error('Invalid function call format');
    }
    
    const callParamsString = callMatch[1].trim();
    
    // Count parameters in call (simple comma split - ethers will validate actual values)
    let callParamCount = 0;
    if (callParamsString) {
        // Simple approach: count commas + 1, accounting for empty string
        callParamCount = callParamsString.split(',').filter(p => p.trim().length > 0).length;
    }
    
    if (callParamCount !== paramTypes.length) {
        throw new Error(`Parameter count mismatch: signature has ${paramTypes.length} parameters but call has ${callParamCount}`);
    }
}

/**
 * Encodes a hook with the new 5-parameter format (functionSignature, functionCall, returnType, target).
 * Validates that functionCall matches functionSignature and parameters are fixed-size primitives.
 */
export async function encodeHook(
    functionSignature: string,
    functionCall: string,
    returnType: string,
    target: EIP8121Target
): Promise<string> {
    // Validate parameter types (0-2 fixed-size primitives only)
    parseParameterTypes(functionSignature);
    
    // Strict validation that functionCall matches functionSignature
    validateFunctionCallMatchesSignature(functionSignature, functionCall);
    
    // Validate return type is bytes
    if (returnType.trim() !== '(bytes)') {
        throw new Error(`Invalid return type: ${returnType}. Only (bytes) return type is supported.`);
    }
    
    const targetBytes = await encodeERC7930Target(target.chainId, target.address);
    return HookInterface.encodeFunctionData("hook", [
        functionSignature,
        functionCall,
        returnType,
        targetBytes
    ]);
}

export async function decodeHook(data: string): Promise<DecodedEIP8121Hook | null> {
    try {
        const decoded = HookInterface.decodeFunctionData("hook", data);
        const target = await decodeERC7930Target(decoded[3]);
        
        if (!target) {
            return null;
        }
        
        return {
            functionSignature: decoded[0],
            functionCall: decoded[1],
            returnType: decoded[2],
            target
        };
    } catch {
        return null;
    }
}

export function isEIP8121Hook(data: string): boolean {
    try {
        return data.toLowerCase().startsWith(HOOK_SELECTOR.toLowerCase());
    } catch {
        return false;
    }
}
