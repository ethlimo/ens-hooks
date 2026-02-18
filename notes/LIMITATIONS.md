# Implementation Scope

Focused implementation of EIP-8121 for contenthash resolution with intentional scope restrictions.

## Scope Restrictions

### 0-2 Parameters with Fixed-Size Primitives and Strings
Target functions accept 0-2 parameters of fixed-size Solidity primitives or strings:
- **No parameters**: For global/singleton data
- **1 parameter** (typically `nodehash: bytes32`): Node-specific data
- **2 parameters** (typically `nodehash: bytes32, hashOfContent: bytes32`): Node data with cache-busting
  - `hashOfContent` can be either a hash of expected content or an autoincrement for web gateway caching

**Supported Types:** `bool`, `address`, `uint8-256`, `int8-256`, `bytes1-32`, `string` (max 512 chars)

**Not Supported:** Dynamic types (`bytes`, arrays), structs, tuples, or functions with 3+ parameters.

### String Parameter Limitations

String parameters are limited to 512 characters maximum. Only `\'` and `\\` escape sequences are supported for simplicity and security. Other escapes (`\n`, `\t`, `\x`, `\u`) are intentionally unsupported—users can include literal newlines, tabs, or Unicode directly in strings if needed, reducing parsing complexity and attack surface.

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
- 0-2 parameters with fixed-size primitives and strings (max 512 chars)
- Integer range validation for all uint/int types
- Type-safe API deriving parameters from function call (no explicit parameter arrays)
- Optional trust verification (array/set/function-based)
- Strict function call syntax validation

## Not Supported

Functions with 3+ parameters, dynamic `bytes`, arrays, structs, tuples, recursive hooks, complex return types, non-EVM chains.