import type { HardhatUserConfig } from "hardhat/config";

import util from "node:util";
import { configVariable } from "hardhat/config";
import HardhatMochaTestRunner from "@nomicfoundation/hardhat-mocha";
import hardhatNetworkHelpersPlugin from "@nomicfoundation/hardhat-network-helpers";
import hardhatEthersPlugin from "@nomicfoundation/hardhat-ethers";
import hardhatChaiMatchersPlugin from "@nomicfoundation/hardhat-ethers-chai-matchers";
import hardhatTypechain from "@nomicfoundation/hardhat-typechain";
import ignitionEthersPlugin from "@nomicfoundation/hardhat-ignition-ethers";
import { SensitiveString } from "hardhat/types/config";
import { ethers } from "ethers";
util.inspect.defaultOptions.depth = null;

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      type: "edr",
      chainType: "l1",
      chainId: 1,
      forking: {
        url: process.env.ETH_RPC_ENDPOINT as SensitiveString,
        blockNumber: 22038075
      },
      blockGasLimit: 100000000000,
      initialBaseFeePerGas: 0,
      gasPrice: 0,
    },
    
  },
  tasks: [
  ],
  plugins: [
    hardhatEthersPlugin,
    HardhatMochaTestRunner,
    hardhatNetworkHelpersPlugin,
    hardhatChaiMatchersPlugin,
    hardhatTypechain,
    ignitionEthersPlugin
  ],
  paths: {
    tests: {
      mocha: "test",
    },
  },
  solidity: {
    profiles: {
      default: {
        compilers: [
          {
            version: "0.8.28",
          },
        ],
      },
      test: {
        version: "0.8.2",
      },
      coverage: {
        version: "0.8.2",
      },
    },
    dependenciesToCompile: [
      "@openzeppelin/contracts/token/ERC20/ERC20.sol",
    ],
    remappings: [
    ],
  },
  solidityTest: {
    testFail: true,
  },
  typechain: {
    tsNocheck: false,
  },
};

export default config;
