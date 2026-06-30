# Scripts

Scripts for deploying and testing EIP-8121 resolver contracts.

## Local Testing

Start a Hardhat node:
```bash
npm run node
```

Deploy contracts:
```bash
npm run deploy-localnode
```

Test all parameter permutations:
```bash
npm run test-localnode
```

## Testnet

Configure credentials in `hardhat.config.ts`, then:

Deploy and set contenthash:
```bash
npm run deploy-testnet
```

Test by querying ENS contenthash and following hooks:
```bash
npm run test-deployed
```

## Contracts

- **DataResolver**: Single-parameter `data(bytes32)`
- **ZeroParameterHookTarget**: Zero-parameter `getData()`
- **AllParameterPermutationsHookTarget**: All 0-2 param permutations (local testing only)

## Encoding Helpers

These scripts support full artifact -> hook -> contenthash encoding (artifact encoding is base64-only):

They are pure encoding utilities and do not use Hardhat runtime features or broadcast transactions.
The `dataUrl` output is UTF-8 bytes hex (`0x...`) suitable for bytes inputs.

- `npm run encode-artifact -- --file docs/example.html`
- `npm run encode-hook -- --chain-id 11155111 --target 0x... --function-signature 'data(bytes32)' --function-call 'data(0x...)'`
- `npm run encode-contenthash -- --hook-data 0x...`
- `npm run encode-full -- --file docs/example.html --node example.eth --chain-id 11155111 --target 0x...`
- `npm run decode-contenthash -- --contenthash 0x...`

## On-chain Helper

Set a contenthash on a resolver using the Hardhat task (Sepolia by default):

- `npm run set-contenthash -- 0xResolverAddress 0xYourContenthashBytes --node example.eth`
- Uses Hardhat `configVariable("SEPOLIA_RPC_URL")` and `configVariable("SEPOLIA_PRIVATE_KEY")` from the configured environment or Hardhat keystore.
