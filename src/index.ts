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
    type ExecuteHookOptions,
} from "./dataurl/index.js";

export {
    encodeHook,
    decodeHook,
    computeSelector,
    extractFunctionName,
    parseParameterTypes,
    encodeERC7930Target,
    decodeERC7930Target,
    isEIP8121Hook,
    isFixedSizePrimitive,
    validateFunctionCallMatchesSignature,
    type DecodedEIP8121Hook,
    type EIP8121Target,
    type HookParameter
} from "./dataurl/encoding.js";

export {
    HOOK_SELECTOR
} from "./dataurl/constants.js";

export {
    verifyTrustedTarget,
    createTrustedTargets,
    createTargetKey,
    type TrustedTarget,
    type TrustedTargets
} from "./dataurl/trust.js";

export {
    encodeDataUri,
    tryDecodeDataUri,
    encodeEIP8121HookForContenthash,
    tryDecodeEIP8121HookFromContenthash
} from "./dataurl/encoding.js";
