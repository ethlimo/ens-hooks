# Implementation Scope

Focused implementation of EIP-8121 for contenthash resolution with intentional scope restrictions.

## Scope Restrictions

### Up to Two bytes32 Parameters
Target functions accept 1-2 `bytes32` parameters:
- **nodehash** (required): Primary node identifier
- **cacheNonce** (optional): Cache-busting parameter

Designed for contenthash resolution with optional cache control. Not general-purpose metadata queries requiring complex multi-parameter signatures or non-bytes32 types.

### EIP-155 Chains Only
ERC-7930 addresses limited to EVM chains via `@wonderland/interop-addresses` (v0.2.0). Non-EVM chains (Solana, Bitcoin, etc.) not supported.

### CCIP-Read Provider Dependency
Assumes caller's provider has ERC-3668 (CCIP-Read) enabled. This library handles encoding/decoding only.

### No Recursive Resolution
Hooks cannot point to other hooks. No depth limits or circular reference detection implemented.

### Bytes Return Type Only
Only `bytes` return type supported. No complex tuples, nested arrays, or multi-value returns. Contenthash use case requires only bytes.

## Supported Features

- EIP-8121 4-parameter hook encoding (selector `0x396b32a0`)
- ERC-7930 interoperable addresses (EIP-155 only)
- Bytes and string encoding formats
- Multi-chain execution
- 1-2 bytes32 parameter functions with validation
- Optional trust verification (array/set/function-based)

## Not Supported

Functions with 3+ parameters, non-bytes32 parameter types, recursive hooks, complex return types, non-EVM chains.