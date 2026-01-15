# ENS Hooks - EIP-8121 Implementation

TypeScript library for encoding, decoding, and executing [EIP-8121](./notes/EIP-8121.md) hooks with ERC-7930 interoperable addresses. Enables cross-chain function calls for ENS contenthash resolution with optional trust verification.

## Overview

This library implements [EIP-8121](./notes/EIP-8121.md) hooks, a specification for cross-chain function calls. A hook fully specifies what function to call, with what parameters, on which contract, on which chain using [ERC-7930](https://eips.ethereum.org/EIPS/eip-7930) interoperable addresses.

**Key Features:**
- EIP-8121 4-parameter hook encoding (selector `0x396b32a0`)
- ERC-7930 interoperable addresses via `@wonderland/interop-addresses`
- Multi-chain execution support (EIP-155 chains)
- Optional trust verification (array/set/function-based)
- Contenthash encoding/decoding for both hooks and plain URIs

## Scope

This is a **focused implementation** for contenthash resolution. See [LIMITATIONS.md](./notes/LIMITATIONS.md) for scope restrictions:
- Single-parameter functions only (`bytes32 node`)
- EIP-155 chains only (EVM)
- Bytes return type only
- No recursive resolution
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
    "0x5cc4350a",              // function selector
    "getText(bytes32,string)", // function signature
    "(string)",               // return type
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
const result = await executeHook(
    hook!,
    namehash("example.eth"),
    providerMap
);

if (result._tag === "HookExecutionResult") {
    console.log("Result:", result.data);
} else {
    console.error("Error:", result.message);
}
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
const result = await executeHook(
    hook!,
    namehash("example.eth"),
    providerMap,
    { trustedTargets }
);
```

Three verification modes supported:
1. **Array**: `TrustedTarget[]` - Verified via array iteration
2. **Set**: `Set<string>` - Fast lookup with "chainId:address" keys
3. **Function**: `(target: EIP8121Target) => boolean` - Custom logic

## API Reference

### Hook Encoding/Decoding
- `encodeHook()` - Encode EIP-8121 hook (bytes format)
- `decodeHook()` - Decode EIP-8121 hook (bytes format)
- `encodeHookString()` - Encode hook (string format)
- `decodeHookString()` - Decode hook (string format)

### Hook Execution
- `executeHook()` - Execute hook on target chain
- `validateHook()` - Validate selector matches signature
- `detectAndDecodeHook()` - Auto-detect format and decode

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

56 tests covering encoding, decoding, execution, and trust verification.

## Specification

See [notes/EIP-8121.md](./notes/EIP-8121.md) for the full EIP-8121 specification and [notes/LIMITATIONS.md](./notes/LIMITATIONS.md) for implementation scope.

## License

MIT