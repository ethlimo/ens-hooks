// ============================================================================
// EIP-8121 Hook API
// ============================================================================

export { 
    executeHook,
    validateHook,
    decodeResult,
    detectAndDecodeHook,
    type ProviderMap,
    type HookExecutionResult,
    type HookExecutionError,
    type ExecutionResult,
    type HookValidationResult,
    type ExecuteHookOptions
} from "./dataurl/index.js";

export {
    encodeHook,
    decodeHook,
    encodeHookString,
    decodeHookString,
    computeSelector,
    parseFunctionCall,
    encodeERC7930Target,
    decodeERC7930Target,
    isEIP8121Hook,
    isEIP8121HookString,
    type DecodedEIP8121Hook,
    type EIP8121Target
} from "./dataurl/encoding.js";

export {
    HOOK_SELECTOR
} from "./dataurl/constants.js";

// ============================================================================
// Trust Verification
// ============================================================================

export {
    verifyTrustedTarget,
    createTrustedTargets,
    createTargetKey,
    type TrustedTarget,
    type TrustedTargets
} from "./dataurl/trust.js";

// ============================================================================
// Contenthash Support
// ============================================================================

export {
    encodeDataUri,
    tryDecodeDataUri,
    encodeEIP8121HookForContenthash,
    tryDecodeEIP8121HookFromContenthash
} from "./dataurl/encoding.js";
