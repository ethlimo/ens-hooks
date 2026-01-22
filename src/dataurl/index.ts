import { Contract, Provider, AbiCoder } from "ethers";
import { 
    DecodedEIP8121Hook, 
    computeSelector,
    parseFunctionCall,
    parseFunctionSignature,
    isEIP8121Hook,
    isEIP8121HookString,
    decodeHook,
    decodeHookString
} from "./encoding.js";
import { TrustedTargets, verifyTrustedTarget } from "./trust.js";

// ============================================================================
// EIP-8121 Types
// ============================================================================

/**
 * Map of chain IDs to Ethereum providers.
 * Callers must provide this to enable cross-chain hook execution.
 */
export type ProviderMap = Map<number | bigint, Provider>;

/**
 * Result of successful hook execution.
 */
export interface HookExecutionResult {
    _tag: "HookExecutionResult";
    data: any;
}

/**
 * Error during hook execution.
 */
export interface HookExecutionError {
    _tag: "HookExecutionError";
    error: true;
    message: string;
    cause?: unknown;
}

export type ExecutionResult = HookExecutionResult | HookExecutionError;

/**
 * Result of hook validation.
 */
export interface HookValidationResult {
    isValid: boolean;
    error?: string;
}

// ============================================================================
// EIP-8121 Hook Execution
// ============================================================================

/**
 * Validates an EIP-8121 hook by verifying the selector matches the function signature
 * and ensuring parameters meet requirements:
 * - 1 or 2 parameters allowed
 * - All parameters must be bytes32 type
 * @param hook - The decoded hook to validate
 * @returns Validation result with isValid flag and optional error message
 */
export function validateHook(hook: DecodedEIP8121Hook): HookValidationResult {
    try {
        const match = hook.functionCall.match(/^(\w+\([^)]*\))/);
        
        if (!match) {
            return {
                isValid: false,
                error: "Invalid function call format"
            };
        }
        
        const functionSignature = match[1];
        const expectedSelector = computeSelector(functionSignature);
        
        if (hook.functionSelector.toLowerCase() !== expectedSelector.toLowerCase()) {
            return {
                isValid: false,
                error: `Selector mismatch: expected ${expectedSelector}, got ${hook.functionSelector}`
            };
        }
        
        // Parse and validate parameters
        const params = parseFunctionSignature(functionSignature);
        if (params === null) {
            return {
                isValid: false,
                error: "Failed to parse function signature"
            };
        }
        
        // Enforce parameter count: 1 or 2 parameters allowed
        if (params.length < 1 || params.length > 2) {
            return {
                isValid: false,
                error: `Invalid parameter count: expected 1 or 2 parameters, got ${params.length}`
            };
        }
        
        // Enforce bytes32 type for all parameters
        for (let i = 0; i < params.length; i++) {
            if (params[i] !== 'bytes32') {
                return {
                    isValid: false,
                    error: `Invalid parameter type at position ${i}: expected bytes32, got ${params[i]}`
                };
            }
        }
        
        return { isValid: true };
    } catch (error) {
        return {
            isValid: false,
            error: `Validation failed: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

/**
 * Decodes a result using the specified return type.
 * @param resultBytes - The ABI-encoded result bytes
 * @param returnType - The return type in Solidity tuple notation (e.g., "(string)")
 * @returns The decoded result
 */
export function decodeResult(resultBytes: string, returnType: string): any {
    try {
        const typeMatch = returnType.match(/^\((.+)\)$/);
        
        if (!typeMatch) {
            throw new Error(`Invalid return type format: ${returnType}`);
        }
        
        const innerType = typeMatch[1];
        
        const types = [];
        let depth = 0;
        let current = '';
        
        for (const char of innerType) {
            if (char === '(' || char === '[') {
                depth++;
                current += char;
            } else if (char === ')' || char === ']') {
                depth--;
                current += char;
            } else if (char === ',' && depth === 0) {
                types.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        if (current) {
            types.push(current.trim());
        }
        
        const decoded = AbiCoder.defaultAbiCoder().decode(types, resultBytes);
        
        if (decoded.length === 1) {
            return decoded[0];
        }
        
        return decoded;
    } catch (error) {
        throw new Error(`Failed to decode result: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Options for hook execution
 */
export interface ExecuteHookOptions {
    /**
     * The bytes32 nodehash parameter to pass to the function (required)
     */
    nodehash: string;
    
    /**
     * Optional bytes32 cacheNonce parameter for cache-busting.
     * Only has semantic functionality - changes the contenthash hash for external readers.
     */
    cacheNonce?: string;
    
    /**
     * Map of chain IDs to providers for cross-chain calls (required)
     */
    providerMap: ProviderMap;
    
    /**
     * Optional trusted targets configuration.
     * If provided, the hook target will be verified against this list.
     */
    trustedTargets?: TrustedTargets;
    
    /**
     * If true, throws an error when target is not trusted.
     * If false, returns an error result instead.
     * Default: false
     */
    throwOnUntrusted?: boolean;
}

/**
 * Executes an EIP-8121 hook by calling the target function directly.
 * This implementation supports functions with up to 2 bytes32 parameters:
 * - nodehash (required): The primary bytes32 parameter
 * - cacheNonce (optional): A bytes32 cache-busting parameter
 * 
 * @param hook - The decoded EIP-8121 hook
 * @param options - Execution options including nodehash, optional cacheNonce, providerMap, and trust verification
 * @returns The decoded result or an error
 */
export async function executeHook(
    hook: DecodedEIP8121Hook,
    options: ExecuteHookOptions
): Promise<ExecutionResult> {
    try {
        const validation = validateHook(hook);
        if (!validation.isValid) {
            return {
                _tag: "HookExecutionError",
                error: true,
                message: `Hook validation failed: ${validation.error}`
            };
        }
        
        if (options.trustedTargets) {
            const isTrusted = verifyTrustedTarget(hook.target, options.trustedTargets);
            if (!isTrusted) {
                const errorMsg = `Untrusted target: ${hook.target.address} on chain ${hook.target.chainId}`;
                if (options.throwOnUntrusted) {
                    throw new Error(errorMsg);
                }
                return {
                    _tag: "HookExecutionError",
                    error: true,
                    message: errorMsg
                };
            }
        }
        
        const provider = options.providerMap.get(hook.target.chainId);
        if (!provider) {
            return {
                _tag: "HookExecutionError",
                error: true,
                message: `No provider available for chain ID ${hook.target.chainId}`
            };
        }
        
        const functionName = parseFunctionCall(hook.functionCall);
        
        const signatureMatch = hook.functionCall.match(/^(\w+\([^)]*\))/);
        if (!signatureMatch) {
            return {
                _tag: "HookExecutionError",
                error: true,
                message: "Invalid function call format"
            };
        }
        
        const functionSignature = signatureMatch[1];
        
        const abi = [`function ${functionSignature} view returns (bytes)`];
        
        const contract = new Contract(
            hook.target.address,
            abi,
            provider
        );
        
        // Build parameters array: nodehash is required, cacheNonce is optional
        const params = [options.nodehash];
        if (options.cacheNonce !== undefined) {
            params.push(options.cacheNonce);
        }
        
        const resultBytes = await contract[functionName](...params);
        
        const decodedResult = decodeResult(resultBytes, hook.returnType);
        
        return {
            _tag: "HookExecutionResult",
            data: decodedResult
        };
    } catch (error) {
        return {
            _tag: "HookExecutionError",
            error: true,
            message: `Hook execution failed: ${error instanceof Error ? error.message : String(error)}`,
            cause: error
        };
    }
}

/**
 * Detects and decodes a hook from either bytes or string format.
 * @param data - The data that may contain a hook
 * @returns The decoded hook, or null if not a valid hook
 */
export async function detectAndDecodeHook(data: string): Promise<DecodedEIP8121Hook | null> {
    if (isEIP8121Hook(data)) {
        return await decodeHook(data);
    }
    
    if (isEIP8121HookString(data)) {
        return await decodeHookString(data);
    }
    
    return null;
}
