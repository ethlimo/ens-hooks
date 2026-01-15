# Implementation Scope

Focused implementation of EIP-8121 for contenthash resolution with intentional scope restrictions.

## Scope Restrictions

### Single-Parameter Functions Only
Target functions accept only `bytes32 node` parameter. Designed for contenthash resolution, not general-purpose metadata queries requiring multi-parameter signatures.

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
- Optional trust verification (array/set/function-based)

## Not Supported

Multi-parameter function calls, recursive hooks, complex return types, non-EVM chains.