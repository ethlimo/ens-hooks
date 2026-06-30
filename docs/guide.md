# Guide: Encoding an Artifact as a Data URL

## Overview

This guide explains how to encode a local artifact into a data URL and produce the ENS contenthash bytes for hook publishing.

The full flow is:

1. Artifact bytes -> base64 data URL string
2. Hook metadata -> EIP-8121 hook bytes (`encodeHook`)
3. Hook bytes -> ENS contenthash bytes (`encodeEIP8121HookForContenthash`)

On-chain storage is expensive. Keep artifacts small (about 5KB or less is a practical target).

## Prerequisites

A working installation of [dweb-proxy-api](https://github.com/ethlimo/dweb-proxy-api) is required to follow this guide. Set up the [local gateway](https://github.com/ethlimo/dweb-proxy-api/tree/main/local_gateway) beginning with Ethereum Mainnet as the RPC according to the directions. Verify that `vitalik.eth.localhost` resolves and serves content. Then bring your setup down with `docker compose down`/`podman-compose down` and set the `ETH_RPC_ENDPOINT` environment variable to your Sepolia testnet RPC endpoint (e.g. Infura), and set `ETH_CHAIN_ID=11155111` and `DATAURL_ENDPOINT="http://dweb-proxy-api:12500"`. Once you restart dweb-proxy-api, you will be able to visit the test content at `https://example-dataurl-123456789.eth.localhost/`.

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

After creating your ENSv2 name, you can look up its resolver address on the [ENS Explorer](explorer.ens.dev). You will need some way of calling `setContenthash(node, contenthash)` to proceed, where node and contenthash are the outputs of encode-full. This repository includes a Hardhat task `set-contenthash` that can be used for that by setting up your Sepolia private key and RPC in the Hardhat keystore, see [the scripts README](../scripts/README.md).

After setting the contenthash, you will need to call setData(node, dataUrl) on your DataResolver contract to actually store the data on chain, where node and dataUrl are the outputs of encode-full.

Setting the contenthash tells compatible clients to retrieve the data by calling DataResolver.data(node). The choice of which function to call on what contract is arbitrary, more advanced encoding can be managed with the encode-hook script.

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
