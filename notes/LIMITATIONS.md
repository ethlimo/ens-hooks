# Implementation Scope

Focused implementation of EIP-8121 for contenthash resolution with intentional scope restrictions.

## Scope Restrictions

### 0-2 Fixed-Size Primitive Parameters
Target functions accept 0-2 parameters of fixed-size Solidity primitives:
- **No parameters**: For global/singleton data
- **1 parameter** (typically `nodehash: bytes32`): Node-specific data
- **2 parameters** (typically `nodehash: bytes32, hashOfContent: bytes32`): Node data with cache-busting
  - `hashOfContent` can be either a hash of expected content or an autoincrement for web gateway caching

**Supported Types:** `bool`, `address`, `uint8-256`, `int8-256`, `bytes1-32`

**Not Supported:** Dynamic types (`string`, `bytes`, arrays), structs, tuples, or functions with 3+ parameters.

Designed for contenthash resolution with support for global, node-specific, and cache-aware data retrieval.

### EIP-155 Chains Only
ERC-7930 addresses limited to EVM chains via `@wonderland/interop-addresses` (v0.2.0). Non-EVM chains (Solana, Bitcoin, etc.) not supported.

### CCIP-Read Provider Dependency
Assumes caller's provider has ERC-3668 (CCIP-Read) enabled. This library handles encoding/decoding only.

### No Recursive Resolution
Hooks cannot point to other hooks. No depth limits or circular reference detection implemented.

### Bytes Return Type Only
Only `bytes` return type supported. No complex tuples, nested arrays, or multi-value returns. Contenthash use case requires only bytes.

## Supported Features

- EIP-8121 hook encoding (selector `0x6113bfa3`)
- ERC-7930 interoperable addresses (EIP-155 only)
- Bytes-only encoding for contenthash
- Multi-chain execution
- 0-2 fixed-size primitive parameters with strict validation
- Type-safe API with parameter arrays
- Optional trust verification (array/set/function-based)
- Strict function call syntax validation

## Not Supported

Functions with 3+ parameters, dynamic types (string, bytes, arrays), structs, tuples, recursive hooks, complex return types, non-EVM chains, string-encoded hooks.