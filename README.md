# ENS Hooks - EIP-8121 Implementation

TypeScript library for encoding, decoding, and executing [EIP-8121](./notes/EIP-8121.md) hooks with ERC-7930 interoperable addresses. Enables cross-chain function calls for ENS contenthash resolution with optional trust verification.

## Overview

This library implements [EIP-8121](./notes/EIP-8121.md) hooks, a specification for cross-chain function calls. A hook fully specifies what function to call, with what parameters, on which contract, on which chain using [ERC-7930](https://eips.ethereum.org/EIPS/eip-7930) interoperable addresses.

**Key Features:**
- EIP-8121 hook encoding (selector `0x6113bfa3`)
- ERC-7930 interoperable addresses
- Multi-chain execution (EIP-155)
- 0-2 fixed-size primitive parameters
- Optional trust verification
- Contenthash encoding/decoding

## Scope

This is a **focused implementation** for contenthash resolution. See [LIMITATIONS.md](./notes/LIMITATIONS.md) for scope restrictions:
- 0-2 parameters of fixed-size primitives and strings (bool, address, uintN, intN, bytesN, string)
- String parameters limited to 512 characters
- EIP-155 chains only (EVM)
- Bytes return type only
- No recursive resolution
- No struct or dynamic type support (dynamic bytes, arrays)
- Requires ERC-3668 (CCIP-Read) enabled provider

## Installation

```bash
npm install @ethlimo/ens-hooks
```

## Usage

### Encoding a Hook

```typescript
import { encodeHook, EIP8121Target } from '@ethlimo/ens-hooks';

const target: EIP8121Target = {
    chainId: 1,  // Ethereum mainnet
    address: "0x1234567890123456789012345678901234567890"
};

const hookData = await encodeHook(
    "data(bytes32)",                    // function signature
    "data(0x1234...)",                  // function call with values
    "(bytes)",                          // return type
    target
);
```

### Decoding and Executing a Hook

```typescript
import { decodeHook, executeHook, ProviderMap } from '@ethlimo/ens-hooks';
import { ethers, namehash } from 'ethers';

// Decode the hook
const hook = await decodeHook(hookData);

// Set up provider map for cross-chain calls
const providerMap: ProviderMap = new Map([
    [1, new ethers.JsonRpcProvider("https://eth-mainnet.g.alchemy.com/v2/...")]
]);

// Execute the hook
const result = await executeHook(hook!, {
    params: [namehash("example.eth")],
    providerMap
});

if (result._tag === "HookExecutionResult") {
    console.log("Result:", result.data);
} else {
    console.error("Error:", result.message);
}
```

### Parameter Support

Hooks support functions with 0-2 parameters of fixed-size Solidity primitives:
- **0 parameters**: `getData()` - Global data
- **1 parameter**: `data(bytes32)` - Node-specific data
- **2 parameters**: `data(bytes32,bytes32)` - Node with additional context

**Recommended Parameter Patterns:**
- `()` - Zero parameters for global data
- `(nodehash: bytes32)` - Single nodehash parameter for node-specific data
- `(nodehash: bytes32, hashOfContent: bytes32)` - Two parameters for cache-busting
  - `hashOfContent` should be either:
    - A hash of the expected content (for integrity verification)
    - An autoincrement value (for cache invalidation in web gateways)

**Supported Types:** `bool`, `address`, `uint8-256`, `int8-256`, `bytes1-32`, `string` (max 512 chars)

```typescript
import { executeHook } from '@ethlimo/ens-hooks';
import { namehash } from 'ethers';

// 0-parameter hook
const globalHook = await encodeHook(
    "getData()",
    "getData()",
    "(bytes)",
    { chainId: 1, address: "0x..." }
);

const globalResult = await executeHook(await decodeHook(globalHook)!, {
    providerMap  // No params
});

// 1-parameter hook (node-specific data)
const node = namehash("example.eth");
const nodeHook = await encodeHook(
    "data(bytes32)",
    `data(${node})`,
    "(bytes)",
    { chainId: 1, address: "0x..." }
);

const nodeResult = await executeHook(await decodeHook(nodeHook)!, {
    params: [node],  // Single parameter array
    providerMap
});

// 2-parameter hook (with cache-busting)
const hashOfContent = "0xabcd..."; // Hash or autoincrement
const twoParamHook = await encodeHook(
    "data(bytes32,bytes32)",
    `data(${node},${hashOfContent})`,
    "(bytes)",
    { chainId: 1, address: "0x..." }
);

const twoParamResult = await executeHook(await decodeHook(twoParamHook)!, {
    params: [node, hashOfContent],  // Two parameter array
    providerMap
});
```

### Trust Verification

Optionally verify hook targets against a trusted list:

```typescript
import { executeHook, createTrustedTargets } from '@ethlimo/ens-hooks';

// Create trusted targets set
const trustedTargets = createTrustedTargets([
    { 
        chainId: 1, 
        address: "0x1234567890123456789012345678901234567890",
        description: "ENS Public Resolver"
    }
]);

// Execute with trust verification
const result = await executeHook(hook!, {
    params: [namehash("example.eth")],
    providerMap,
    trustedTargets
});
```

Three verification modes supported:
1. **Array**: `TrustedTarget[]` - Verified via array iteration
2. **Set**: `Set<string>` - Fast lookup with "chainId:address" keys
3. **Function**: `(target: EIP8121Target) => boolean` - Custom logic

## API Reference

### Hook Encoding/Decoding
- `encodeHook()` - Encode EIP-8121 hook (bytes format, 5 parameters)
- `decodeHook()` - Decode EIP-8121 hook (bytes format)
- `computeSelector()` - Compute 4-byte function selector from signature
- `parseParameterTypes()` - Parse and validate parameter types (0-2 fixed-size primitives)
- `validateFunctionCallMatchesSignature()` - Strict validation of call vs signature

### Hook Execution
- `executeHook(hook, options)` - Execute hook on target chain with type-safe options:
  - For 0-parameter hooks: `{ providerMap, trustedTargets?, throwOnUntrusted? }`
  - For 1-parameter hooks: `{ params: [string], providerMap, trustedTargets?, throwOnUntrusted? }`
  - For 2-parameter hooks: `{ params: [string, string], providerMap, trustedTargets?, throwOnUntrusted? }`
- `validateHook()` - Validate parameter count (0-2) and types (fixed-size primitives)
- `detectAndDecodeHook()` - Detect and decode hooks from bytes format

### Contenthash Support
- `encodeEIP8121HookForContenthash()` - Wrap hook for contenthash storage
- `tryDecodeEIP8121HookFromContenthash()` - Extract hook from contenthash
- `encodeDataUri()` - Encode plain URI for contenthash
- `tryDecodeDataUri()` - Decode plain URI from contenthash

### Trust Verification
- `verifyTrustedTarget()` - Check if target is trusted
- `createTrustedTargets()` - Create fast-lookup Set from array
- `createTargetKey()` - Generate "chainId:address" key

## Testing

```bash
npm test
```

69 tests covering encoding, decoding, execution, and trust verification.

## Specification

See [notes/EIP-8121.md](./notes/EIP-8121.md) for the full EIP-8121 specification and [notes/LIMITATIONS.md](./notes/LIMITATIONS.md) for implementation scope.

## License

MIT