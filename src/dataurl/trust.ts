import { EIP8121Target } from "./encoding.js";

export interface TrustedTarget {
    chainId: number;
    address: string;
    description?: string;
}

export type TrustedTargets = 
    | TrustedTarget[] 
    | Set<string> 
    | ((target: EIP8121Target) => boolean);

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

export function createTargetKey(chainId: number, address: string): string {
    return `${chainId}:${address.toLowerCase()}`;
}

export function createTrustedTargets(targets: TrustedTarget[]): Set<string> {
    return new Set(targets.map(t => createTargetKey(t.chainId, t.address)));
}
