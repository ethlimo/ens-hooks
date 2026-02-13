import { configVariable, type HardhatUserConfig } from "hardhat/config";

import util from "node:util";
import HardhatMochaTestRunner from "@nomicfoundation/hardhat-mocha";
import hardhatNetworkHelpersPlugin from "@nomicfoundation/hardhat-network-helpers";
import hardhatEthersPlugin from "@nomicfoundation/hardhat-ethers";
import hardhatChaiMatchersPlugin from "@nomicfoundation/hardhat-ethers-chai-matchers";
import hardhatTypechain from "@nomicfoundation/hardhat-typechain";
import ignitionEthersPlugin from "@nomicfoundation/hardhat-ignition-ethers";
import { ConfigurationVariable } from "hardhat/types/config";
import hardhatKeystore from "@nomicfoundation/hardhat-keystore";
util.inspect.defaultOptions.depth = null;

const config: HardhatUserConfig & { verify: { etherscan: { apiKey: ConfigurationVariable } } } = {
  networks: {
    hardhat: {
      type: "edr-simulated",
      chainType: "l1",
      chainId: 1,
      forking: {
        url: configVariable("ETH_RPC_URL"),
        blockNumber: 23989360,
      },
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      //hardhat keystore location is ~/.config/hardhat-nodejs/keystore.json
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("SEPOLIA_PRIVATE_KEY")],
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
    ignitionEthersPlugin,
    hardhatKeystore
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

  },
  test: {
    solidity: {

    }
  },
  typechain: {
    tsNocheck: false,
  },
  verify: {
    etherscan: {
      apiKey: configVariable("ETHERSCAN_API_KEY"),
    },
  },
};

export default config;
