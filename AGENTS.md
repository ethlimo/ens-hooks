# Agent Instructions

## Project Overview

TypeScript library implementing EIP-8121 hooks for cross-chain function calls via ENS contenthash resolution. Uses Hardhat 3, ethers v6, and Mocha/Chai for testing.

## Hardhat 3 (Not Hardhat 2)

**This project uses Hardhat 3.** Do not reference Hardhat 2 APIs or patterns from older training data. Key differences:

- **Package:** `hardhat` (Hardhat 3)
- **Test command:** `npx hardhat test` uses `@nomicfoundation/hardhat-mocha`
- **Network connection:** Use `hre.network.connect()` to get provider/signers:
  ```typescript
  const { provider } = await hre.network.connect();
  const [signer] = await provider.getSigner();
  ```
- **Ignition deployments:** Use `@nomicfoundation/hardhat-ignition/modules` with `buildModule()`
- **Ethers integration:** `@nomicfoundation/hardhat-ethers` v4.x for Hardhat 3

Verify any Hardhat-related code against current Hardhat 3 documentation, not cached training data.

## Code Style

### Comments

- **Omit useless comments** that simply describe what the next line does when it's already obvious from the code
- **Remove redundant comments** during refactoring
- Use **JSDoc (`/** ... */`)** for public TypeScript APIs
- Use **NatSpec (`///`, `@notice`, `@dev`)** for Solidity contracts and functions
- Comments should explain *why*, not *what*, unless the code is non-obvious

### TypeScript

- ESM with `.js` extension on relative imports
- Strict mode enabled
- Named exports (no default exports in library code)
- Discriminated unions with `_tag` property for result types
- Explicit `async/await` patterns

### Solidity

- Pragma `^0.8.28`
- SPDX-License-Identifier header required
- Inherit from OpenZeppelin contracts where appropriate
- Events for state changes

## Security Requirements

**All user input must be validated.** This project handles cross-chain function calls where malformed input can cause security issues.

- **Addresses:** Validate strict hex format (40 characters, `0x` prefix)
- **Integers:** Range check against type bounds (int8-int256, uint8-uint256)
- **Strings:** Maximum 512 characters, only `\'` and `\\` escape sequences
- **Function signatures:** Validate parameter count matches signature

Use the `suppressErrorDetails` flag in production to avoid leaking validation internals.

## Testing Requirements

**All code must have associated tests.** No untested code should be merged.

- Test files live in `test/` directory
- Use Mocha/Chai with `@nomicfoundation/hardhat-ethers-chai-matchers`
- Contract tests should use fixtures for deployment
- Run tests with `npm test` before committing

## Documentation

Refer to `notes/` for specifications and implementation details:

- **`notes/spec/`** — Reference material for upstream specifications (EIP-8121, ERC-7930). Do not modify.
- **`notes/LIMITATIONS.md`** — Documents deviations from spec and implementation constraints. Only update with explicit user confirmation.
