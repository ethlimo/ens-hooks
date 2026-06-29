# Guide: Encoding an Artifact as a Data URL

## Overview

This guide explains how to encode a local artifact into a data URL and produce the ENS contenthash bytes for hook publishing.

The full flow is:

1. Artifact bytes -> base64 data URL string
2. Hook metadata -> EIP-8121 hook bytes (`encodeHook`)
3. Hook bytes -> ENS contenthash bytes (`encodeEIP8121HookForContenthash`)

On-chain storage is expensive. Keep artifacts small (about 5KB or less is a practical target).

**Note:** This guide is only valid for ENS v1. ENS v2 changes the semantics of raw contract writes and it is necessary to manually encode contenthashes to follow this guide.

## Prerequisites

A working installation of [dweb-proxy-api](https://github.com/ethlimo/dweb-proxy-api) is required to follow this guide. Set up the [local gateway](https://github.com/ethlimo/dweb-proxy-api/tree/main/local_gateway) beginning with Ethereum Mainnet as the RPC according to the directions. Verify that `vitalik.eth.localhost` resolves and serves content. Then bring your setup down with `docker compose down`/`podman-compose down` and set the `ETH_RPC_ENDPOINT` environment variable to your Sepolia testnet RPC endpoint (e.g. Infura), and set `ETH_CHAIN_ID=11155111` and `DATAURL_ENDPOINT="http://dweb-proxy-api:12500"`. Once you restart dweb-proxy-api, you will be able to visit the test content at `https://singleparam.multiparam-weaken-home-truth-plan-9.eth.localhost/`.

## Required Inputs

Clone this repository and run:

```bash
npm install
npx hardhat compile
```

For Sepolia examples below, we will be using the following:

- ENS name: `example-dataurl-123456789.eth`
- Target chain ID: `11155111`
- DataResolver contract: deployed instance of [DataResolver.sol](../contracts/DataResolver.sol)

The DataResolver contract can be deployed by configuring [Hardhat Deploy](https://hardhat.org/docs/tutorial/deploying). You will need to delete the [ignition/deployments/chain-11155111](../ignition/deployments/chain-11155111) directory.

## Encoding an Artifact as a Data URL

### One-shot (recommended)

Use `encode-full` to generate everything in one command:

```bash
npm run encode-full -- \
	--file docs/example.html \
	--node example-dataurl-123456789.eth \
	--chain-id 11155111 \
	--target 0xYourDataResolverAddress
```

This prints JSON containing:

- `dataUrl`
- `hookData`
- `contenthash`

Then search your contract address on Etherscan (ensure you run npx hardhat verify 0xYourDataResolverAddress) and select the contract tab. Connect your wallet and under `Write Contract` run the setData function with the parameters node from the "node" output and value from the "dataUrl" output. Finally, find the Sepolia public resolver address at the [deployments page](https://docs.ens.domains/learn/deployments/), search it in Etherscan, and prepare a `Write Contract` transaction for the function `setContenthash` where the value of node is the same as before, and the value of hash is the "contenthash" return value.

### Step-by-step helpers

#### 1) Encode artifact as data URL

```bash
npm run encode-artifact -- \
	--file docs/example.html \
	--out /tmp/example.dataurl.txt
```

Optional:

- `--mime text/html` to override detected MIME

#### 2) Encode hook bytes

Compute ENS nodehash first (example with ethers in Node):

```bash
node -e "const { namehash } = require('ethers'); console.log(namehash('example-dataurl-123456789.eth'));"
```

Then encode the EIP-8121 hook:

```bash
npm run encode-hook -- \
	--chain-id 11155111 \
	--target 0xYourDataResolverAddress \
	--function-signature 'data(bytes32)' \
	--function-call 'data(0xYourNodeHash)' \
	--return-type '(bytes)'
```

#### 3) Wrap hook bytes as contenthash

```bash
npm run encode-contenthash -- --hook-data 0xYourHookData
```

## Options

### encode-artifact

- `--file` — artifact file path (required)
- `--mime` — override MIME type (inferred from extension by default)
- `--out` — write data URL to a file

### encode-hook

- `--chain-id` — EIP-155 target chain ID (required)
- `--target` — hook target contract address (required)
- `--function-signature` — Solidity signature, e.g. `data(bytes32)` (required)
- `--function-call` — call with values, e.g. `data(0x...)` (required)
- `--return-type` — return type, defaults to `(bytes)`

### full-encode

- `--file` — artifact file path (required)
- `--node` — ENS name or bytes32 nodehash (required)
- `--chain-id` — hook target chain ID (required)
- `--target` — DataResolver contract address (required)
- `--mime` — override MIME type (inferred from extension by default)

## Error Handling

Common failures:

- Invalid address or chain ID in `encode-hook`
- Function call/signature mismatch in `encode-hook`
- Invalid node input in `encode-full`
- Artifact too large for practical gas limits

Use `decode-contenthash` for debugging published contenthash values.

## Examples

### Decode existing contenthash

```bash
npm run decode-contenthash -- --contenthash 0x30009b...
```

### Encode artifact (base64)

```bash
npm run encode-artifact -- \
	--file docs/example.html
```

## API Reference

- [src/dataurl/encoding.ts](../src/dataurl/encoding.ts)
- [src/index.ts](../src/index.ts)
- [contracts/DataResolver.sol](../contracts/DataResolver.sol)

## See Also

- [README.md](../README.md)
- [scripts/README.md](../scripts/README.md)
