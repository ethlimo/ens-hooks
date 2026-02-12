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
