# Changelog

## [3.0.2](https://github.com/ethlimo/ens-hooks/compare/v3.0.5...v3.0.2) (2026-02-13)


### ⚠ BREAKING CHANGES

* New 4-field hook format (0x6113bfa3), bytes-only encoding, params array API, 0-2 fixed-size primitive parameters.
* implement EIP-8121 hooks with ERC-7930 addresses and single-parameter data()
* encoding and decoding, implement new standard for hooks

### Features

* add ability to override merged commit message ([bfe707c](https://github.com/ethlimo/ens-hooks/commit/bfe707c8649bf586544a69c870188eb62244e9a5))
* add ability to override merged commit message ([f5921fa](https://github.com/ethlimo/ens-hooks/commit/f5921fa5bc7bc09687611a7744769b9c1b115fc8))
* add ability to override merged commit message ([65d23c6](https://github.com/ethlimo/ens-hooks/commit/65d23c6031beb0f9b05809e31936b6cabf855693))
* add ability to override merged commit message ([5c96339](https://github.com/ethlimo/ens-hooks/commit/5c96339bb077332465e10e572f9645db33bd655b))
* add ability to override merged commit message ([14781e7](https://github.com/ethlimo/ens-hooks/commit/14781e7fe7d19e70182a9fe56af020bfc2664034))
* add multi-parameter hook support with optional cacheNonce ([b30f2ab](https://github.com/ethlimo/ens-hooks/commit/b30f2ab025205fa65aa029a23340481dc0e032ba))
* add optional second parameter support for dataurl hooks ([ec44d2e](https://github.com/ethlimo/ens-hooks/commit/ec44d2e4c6323c657a6efbc9aaed567dbec85c0b))
* Add Semgrep workflow ([32b99d1](https://github.com/ethlimo/ens-hooks/commit/32b99d15b1992bd0ca6531e589bce8fce8f3d327))
* automatically set content hash in testnet script, split ignition modules, deploy to sepolia ([453f32c](https://github.com/ethlimo/ens-hooks/commit/453f32caeca15d43a6d511a25c28b5bb6d5aeed3))
* enable publishing workflows ([2247402](https://github.com/ethlimo/ens-hooks/commit/224740296425f91bf332c0b49af5ec46fdd5e964))
* enable publishing workflows ([bb4b95a](https://github.com/ethlimo/ens-hooks/commit/bb4b95ab79b56a3a8777987bd20b92a08bf4bc03))
* implement EIP-8121 hooks with ERC-7930 addresses and single-parameter data() ([6d64902](https://github.com/ethlimo/ens-hooks/commit/6d64902da6c5e682d4bf15d92e6022858eb9009e))
* update to latest hooks iteration, support cache key again ([#23](https://github.com/ethlimo/ens-hooks/issues/23)) ([5abca1b](https://github.com/ethlimo/ens-hooks/commit/5abca1b28e3548ebb9145da8e1169773e2110181))


### Bug Fixes

* add npm provenance ([5f62b12](https://github.com/ethlimo/ens-hooks/commit/5f62b12b746283f5cfec4586024af33b924d8a14))
* add npm provenance ([4a1d4d3](https://github.com/ethlimo/ens-hooks/commit/4a1d4d3e261274729fccf3331b90ad299b908c9e))
* add npm provenance ([b3336d3](https://github.com/ethlimo/ens-hooks/commit/b3336d39d494d907c5fad80686b0e8660939244a))
* add npm provenance ([3f005a1](https://github.com/ethlimo/ens-hooks/commit/3f005a1d74b4a4fc71eb52ca0371a7547b8f1f8d))
* adjust rulesets and pins ([b7c3ba2](https://github.com/ethlimo/ens-hooks/commit/b7c3ba2c592d7dee87e0d6ea44c5a45dc421eb77))
* correct package name ([806d196](https://github.com/ethlimo/ens-hooks/commit/806d196c46fc01a5977c7117a3a6f0827347d92a))
* correct package name ([1607b9c](https://github.com/ethlimo/ens-hooks/commit/1607b9c08e8635a9a205bc63dae0fc0efa5020da))
* correctly handle protocode prepended to hook ([#48](https://github.com/ethlimo/ens-hooks/issues/48)) ([31d2df9](https://github.com/ethlimo/ens-hooks/commit/31d2df96c6e1ef20d58e1938618a86e45fa1a074))
* enable whitelisting of allowed endpoints ([e5e3ae3](https://github.com/ethlimo/ens-hooks/commit/e5e3ae3a0a5fa0160eefce9faf03e42f683bcdd9))
* enable whitelisting of allowed endpoints ([f26232b](https://github.com/ethlimo/ens-hooks/commit/f26232b122f50e2d003e9d22e90b687f840e8155))
* Enforce (bytes) return type requirement and replace any with string in HookExecutionResult ([3c7f225](https://github.com/ethlimo/ens-hooks/commit/3c7f2254b5d63b61cf6713a34156d6670c9b4833))
* fix param parsing to be closer to spec, deploy v3 testnet ([#45](https://github.com/ethlimo/ens-hooks/issues/45)) ([2936ca4](https://github.com/ethlimo/ens-hooks/commit/2936ca4710680650e599a34ef169ba88b4623490))
* remove old exports ([#32](https://github.com/ethlimo/ens-hooks/issues/32)) ([64637cb](https://github.com/ethlimo/ens-hooks/commit/64637cbec117f196a8921ab8a8c4f82c1a576159))
* remove redundant semgrep workflow ([680bdb3](https://github.com/ethlimo/ens-hooks/commit/680bdb38caf322e165d72d9add42aecac2204e79))
* simplify params type ([#25](https://github.com/ethlimo/ens-hooks/issues/25)) ([2435cee](https://github.com/ethlimo/ens-hooks/commit/2435cee71649615092d95e74dbd9a1adf83416de))


### Miscellaneous Chores

* release 3.0.2 ([#27](https://github.com/ethlimo/ens-hooks/issues/27)) ([2d10d4f](https://github.com/ethlimo/ens-hooks/commit/2d10d4fb42db77909bb9afb521ee29262f7ea428))


### Code Refactoring

* encoding and decoding, implement new standard for hooks ([6da434c](https://github.com/ethlimo/ens-hooks/commit/6da434cb96e76a58c4936e44d35fd6e825cf8575))

## [3.0.5](https://github.com/ethlimo/ens-hooks/compare/v3.0.4...v3.0.5) (2026-02-13)


### Bug Fixes

* correctly handle protocode prepended to hook ([#48](https://github.com/ethlimo/ens-hooks/issues/48)) ([31d2df9](https://github.com/ethlimo/ens-hooks/commit/31d2df96c6e1ef20d58e1938618a86e45fa1a074))

## [3.0.4](https://github.com/ethlimo/ens-hooks/compare/v3.0.3...v3.0.4) (2026-02-13)


### Bug Fixes

* fix param parsing to be closer to spec, deploy v3 testnet ([#45](https://github.com/ethlimo/ens-hooks/issues/45)) ([2936ca4](https://github.com/ethlimo/ens-hooks/commit/2936ca4710680650e599a34ef169ba88b4623490))

## [3.0.3](https://github.com/ethlimo/ens-hooks/compare/v3.0.2...v3.0.3) (2026-02-12)


### Bug Fixes

* remove old exports ([#32](https://github.com/ethlimo/ens-hooks/issues/32)) ([64637cb](https://github.com/ethlimo/ens-hooks/commit/64637cbec117f196a8921ab8a8c4f82c1a576159))

## [3.0.2](https://github.com/ethlimo/ens-hooks/compare/v3.0.1...v3.0.2) (2026-02-12)


### Miscellaneous Chores

* release 3.0.2 ([#27](https://github.com/ethlimo/ens-hooks/issues/27)) ([2d10d4f](https://github.com/ethlimo/ens-hooks/commit/2d10d4fb42db77909bb9afb521ee29262f7ea428))

## [3.0.1](https://github.com/ethlimo/ens-hooks/compare/v3.0.0...v3.0.1) (2026-02-12)


### Bug Fixes

* simplify params type ([#25](https://github.com/ethlimo/ens-hooks/issues/25)) ([2435cee](https://github.com/ethlimo/ens-hooks/commit/2435cee71649615092d95e74dbd9a1adf83416de))

## [3.0.0](https://github.com/ethlimo/ens-hooks/compare/v2.1.0...v3.0.0) (2026-02-12)


### ⚠ BREAKING CHANGES

* New 4-field hook format (0x6113bfa3), bytes-only encoding, params array API, 0-2 fixed-size primitive parameters.

### Features

* update to latest hooks iteration, support cache key again ([#23](https://github.com/ethlimo/ens-hooks/issues/23)) ([5abca1b](https://github.com/ethlimo/ens-hooks/commit/5abca1b28e3548ebb9145da8e1169773e2110181))
