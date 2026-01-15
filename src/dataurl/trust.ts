import { EIP8121Target } from "./encoding.js";

/**
 * A single trusted target configuration
 */
export interface TrustedTarget {
    chainId: number;
    address: string;
    description?: string;
}

/**
 * Trust verification options - can be:
 * - Array of trusted targets
 * - Set of "chainId:address" strings
 * - Custom verification function
 */
export type TrustedTargets = 
    | TrustedTarget[] 
    | Set<string> 
    | ((target: EIP8121Target) => boolean);

/**
 * Verifies if a target is in the trusted set.
 * @param target - The target to verify
 * @param trustedTargets - The trusted targets configuration
 * @returns true if the target is trusted, false otherwise
 */
export function verifyTrustedTarget(
    target: EIP8121Target,
    trustedTargets: TrustedTargets
): boolean {
    if (typeof trustedTargets === 'function') {
        return trustedTargets(target);
    }
    
    if (trustedTargets instanceof Set) {
        const key = createTargetKey(target.chainId, target.address);
        return trustedTargets.has(key);
    }
    
    return trustedTargets.some(trusted => 
        trusted.chainId === target.chainId && 
        trusted.address.toLowerCase() === target.address.toLowerCase()
    );
}

/**
 * Creates a standardized key for a target (chainId:address).
 * @param chainId - The chain ID
 * @param address - The contract address
 * @returns A string key in the format "chainId:address"
 */
export function createTargetKey(chainId: number, address: string): string {
    return `${chainId}:${address.toLowerCase()}`;
}

/**
 * Helper to create a Set of trusted targets from an array.
 * @param targets - Array of trusted target configurations
 * @returns A Set of "chainId:address" strings for fast lookup
 */
export function createTrustedTargets(targets: TrustedTarget[]): Set<string> {
    return new Set(targets.map(t => createTargetKey(t.chainId, t.address)));
}
