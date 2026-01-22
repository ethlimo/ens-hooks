# Deployment Scripts

Scripts for deploying and testing EIP-8121 resolver contracts on local and testnet networks.

## Prerequisites

### For Localhost Testing
Start a Hardhat node (if not already running):
```bash
npm run node
```

This will start a local Hardhat node with mainnet forking enabled.

### For Testnet Deployment
Configure your network credentials in `hardhat.config.ts`:
```typescript
sepolia: {
  type: "http",
  url: configVariable("SEPOLIA_RPC_URL"),
  // Use hardhat keystore or configure accounts
}
```

## Scripts

### `npm run deploy`

Deploys test resolver contracts to the local Hardhat network:
- **DataResolver**: Single-parameter resolver (`data(bytes32)`)
- **MultiParamResolver**: Multi-parameter resolver with `data(bytes32)` and `dataWithOptions(bytes32, bytes32)`

Both contracts are deployed with initial test data for `test.eth` node.

**Output:**
```
✅ Deployment successful!

Contract Addresses:
  DataResolver:        0x5FbDB2315678afecb367f032d93F642f64180aa3
  MultiParamResolver:  0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

### `npm run deploy-testnet`

Deploys contracts to a testnet (default: Sepolia) and outputs:
- Deployed contract addresses
- Encoded hooks for both contracts
- Contenthash values ready to set on ENS
- Detailed instructions for ENS setup

**Example output:**
```
📦 Generating Hooks and Contenthash Values:

=== DataResolver (Single Parameter) ===
Function Signature: data(bytes32)
Hook Data: 0x396b32a0...
Contenthash: 0xe5010001...

📖 INSTRUCTIONS FOR ENS SETUP
1️⃣  SET DATA ON CONTRACTS
2️⃣  SET CONTENTHASH ON ENS RESOLVER
3️⃣  VERIFY SETUP
```

### `npm run test-deployed`

Runs comprehensive tests against deployed contracts on forked localhost:
1. Impersonates vitalik.eth owner to set contenthash
2. Encodes hooks pointing to deployed contracts
3. Sets contenthash on vitalik.eth (single-parameter) and nick.eth (two-parameter)
4. Executes hooks using library functions
5. Verifies different cacheNonce values work

**Features:**
- Tests real ENS resolver integration on forked mainnet
- Demonstrates complete contenthash → hook → execution flow
- Validates both single and two-parameter hooks

## File Overview

### Core Files

- **`deploy.ts`**: Local deployment with test data setup
- **`deploy-testnet.ts`**: Testnet deployment with instructions
- **`test-deployed.ts`**: Integration tests with ENS resolver on forked network

### Ignition Modules

- **`ignition/modules/DataResolver.ts`**: Hardhat Ignition module for both contracts

## Development Workflow

### Local Testing

1. **Start node:**
   ```bash
   npm run node
   ```

2. **Deploy contracts** (in another terminal):
   ```bash
   npm run deploy
   ```

3. **Test with ENS integration:**
   ```bash
   npm run test-deployed
   ```

4. **Run unit tests:**
   ```bash
   npm test
   ```

### Testnet Deployment

1. **Configure network** in `hardhat.config.ts`

2. **Deploy to testnet:**
   ```bash
   npm run deploy-testnet
   ```

3. **Follow printed instructions** to set up ENS contenthash

4. **Verify** using library functions or ENS apps

## Hardhat 3 Notes

This project uses Hardhat 3 with:
- **Hardhat Ignition**: Declarative deployment system
- **EDR (Ethereum Development Runtime)**: Faster execution
- **Network connection API**: `hre.network.connect()` pattern
- **Forking**: Mainnet fork for realistic testing

Key patterns:
```typescript
// Get connection and ethers
const connection = await hre.network.connect();
const ethers = (connection as any).ethers;

// Deploy with Ignition
const contracts = await connection.ignition.deploy(Module);

// Impersonate accounts on fork
const signer = await ethers.getImpersonatedSigner(address);
```

## Deployment Addresses

### Localhost (Deterministic)
- **DataResolver**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- **MultiParamResolver**: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`

### Testnet
Check deployment artifacts in:
```
ignition/deployments/chain-<chainId>/deployed_addresses.json
```

## Troubleshooting

**"No provider available"** error:
- Ensure Hardhat node is running (`npm run node`)
- Check network configuration in hardhat.config.ts

**Deployment fails on testnet:**
- Check account balance (need gas for deployment)
- Verify RPC URL is configured correctly
- Ensure hardhat keystore is set up

**Impersonation fails:**
- Only works on forked networks
- Requires `hardhat-network-helpers` plugin
- Check that ENS name exists on forked chain

**Test failures:**
- Verify contracts are deployed
- Check contract addresses match
- Ensure test data is set up correctly
- For testnet: verify ENS resolver is configured

## ENS Setup Example

After deploying to testnet, set contenthash on your ENS name:

```javascript
import { ethers } from 'ethers';
import { namehash } from 'ethers';

// Connect to resolver
const resolver = await ethers.getContractAt(
  'PublicResolver', 
  resolverAddress
);

// Set contenthash (use value from deploy-testnet output)
await resolver.setContenthash(
  namehash('yourname.eth'),
  '0xe5010001...' // Contenthash from script
);
```

Then test with the library:

```javascript
import { 
  tryDecodeEIP8121HookFromContenthash,
  decodeHook,
  executeHook 
} from '@ethlimo/ens-hooks';

const contenthash = await resolver.contenthash(namehash('yourname.eth'));
const hookData = tryDecodeEIP8121HookFromContenthash(contenthash);
const hook = await decodeHook(hookData);

const result = await executeHook(hook, {
  nodehash: namehash('yourname.eth'),
  providerMap: new Map([[chainId, provider]])
});

console.log(result.data);
```
