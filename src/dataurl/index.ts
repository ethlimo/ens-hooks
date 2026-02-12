import { Contract, Provider, AbiCoder } from "ethers";
import { 
    DecodedEIP8121Hook, 
    computeSelector,
    extractFunctionName,
    parseParameterTypes,
    isEIP8121Hook,
    decodeHook
} from "./encoding.js";
import { TrustedTargets, verifyTrustedTarget } from "./trust.js";

export type ProviderMap = Map<number | bigint, Provider>;

export interface HookExecutionResult {
    _tag: "HookExecutionResult";
    data: string;
}

export interface HookExecutionError {
    _tag: "HookExecutionError";
    error: true;
    message: string;
    cause?: unknown;
}

export type ExecutionResult = HookExecutionResult | HookExecutionError;

export interface HookValidationResult {
    isValid: boolean;
    error?: string;
}

/**
 * Validates an EIP-8121 hook.
 * Checks: 0-2 fixed-size primitive parameters, (bytes) return type.
 */
export function validateHook(hook: DecodedEIP8121Hook): HookValidationResult {
    try {
        // Validate function signature and parameters
        const params = parseParameterTypes(hook.functionSignature);
        
        // Compute expected selector from signature
        const expectedSelector = computeSelector(hook.functionSignature);
        
        // Validate return type
        if (hook.returnType !== '(bytes)') {
            return {
                isValid: false,
                error: `Invalid return type: expected (bytes), got ${hook.returnType}`
            };
        }
        
        return { isValid: true };
    } catch (error) {
        return {
            isValid: false,
            error: `Validation failed: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

export function decodeResult(resultBytes: string, returnType: string): string {
    if (returnType !== '(bytes)') {
        throw new Error(`Invalid return type: expected (bytes), got ${returnType}`);
    }
    
    const decoded = AbiCoder.defaultAbiCoder().decode(["bytes"], resultBytes);
    return decoded[0];
}

export interface ExecuteHookOptionsBase {
    providerMap: ProviderMap;
    trustedTargets?: TrustedTargets;
    throwOnUntrusted?: boolean;
}

export interface ExecuteHookOptionsNoParams extends ExecuteHookOptionsBase {}

export interface ExecuteHookOptionsOneParam extends ExecuteHookOptionsBase {
    params: [string]; // single parameter value
}

export interface ExecuteHookOptionsTwoParams extends ExecuteHookOptionsBase {
    params: [string, string]; // two parameter values
}

export type ExecuteHookOptions = ExecuteHookOptionsNoParams | ExecuteHookOptionsOneParam | ExecuteHookOptionsTwoParams;

export async function executeHook(
    hook: DecodedEIP8121Hook,
    options: ExecuteHookOptionsNoParams
): Promise<ExecutionResult>;

export async function executeHook(
    hook: DecodedEIP8121Hook,
    options: ExecuteHookOptionsOneParam
): Promise<ExecutionResult>;

export async function executeHook(
    hook: DecodedEIP8121Hook,
    options: ExecuteHookOptionsTwoParams
): Promise<ExecutionResult>;

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
        
        const functionName = extractFunctionName(hook.functionSignature);
        const params = parseParameterTypes(hook.functionSignature);
        
        const providedParams = 'params' in options ? options.params.length : 0;
        
        if (params.length !== providedParams) {
            return {
                _tag: "HookExecutionError",
                error: true,
                message: `Parameter count mismatch: function requires ${params.length} parameters but ${providedParams} were provided`
            };
        }
        
        const abi = [`function ${hook.functionSignature} view returns (bytes)`];
        
        const contract = new Contract(
            hook.target.address,
            abi,
            provider
        );
        
        const callParams: string[] = 'params' in options ? options.params : [];
        
        const resultBytes = await contract[functionName](...callParams);
        const result = decodeResult(resultBytes, hook.returnType);
        
        return {
            _tag: "HookExecutionResult",
            data: result
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

export async function detectAndDecodeHook(data: string): Promise<DecodedEIP8121Hook | null> {
    if (isEIP8121Hook(data)) {
        return await decodeHook(data);
    }
    
    return null;
}
