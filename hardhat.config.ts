import { configVariable, task, type HardhatUserConfig } from "hardhat/config";
import { ArgumentType } from "hardhat/types/arguments";
import { ethers, namehash } from "ethers";

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

const setContenthashTask = task("set-contenthash", "Set contenthash on a resolver")
  .addPositionalArgument({
    name: "address",
    description: "Resolver contract address",
  })
  .addPositionalArgument({
    name: "contenthash",
    description: "0x-prefixed contenthash bytes",
  })
  .addOption({
    name: "node",
    description: "ENS name or bytes32 nodehash",
    type: ArgumentType.STRING_WITHOUT_DEFAULT,
    defaultValue: undefined,
  })
  .setInlineAction(async (args, hre) => {
    if (args.node === undefined) {
      throw new Error("Missing required --node option.");
    }

    if (!ethers.isAddress(args.address)) {
      throw new Error(`Invalid resolver address: ${args.address}`);
    }

    if (!ethers.isHexString(args.contenthash)) {
      throw new Error("Invalid contenthash. Expected 0x-prefixed hex bytes.");
    }

    const node = ethers.isHexString(args.node, 32) ? args.node : namehash(args.node);

    const connection = await hre.network.connect();
    const hreEthers = (connection as any).ethers;
    const [signer] = await hreEthers.getSigners();
    const network = await hreEthers.provider.getNetwork();

    const resolver = new ethers.Contract(
      args.address,
      ["function setContenthash(bytes32 node, bytes hash) external"],
      signer,
    );

    const tx = await resolver.setContenthash(node, args.contenthash);
    const receipt = await tx.wait();

    console.log("setContenthash transaction sent");
    console.log("Chain ID:", Number(network.chainId));
    console.log("Signer:", signer.address);
    console.log("Resolver:", args.address);
    console.log("Node input:", args.node);
    console.log("Node:", node);
    console.log("Contenthash bytes:", ethers.getBytes(args.contenthash).length);
    console.log("Tx hash:", tx.hash);
    console.log("Block:", receipt?.blockNumber ?? "pending");
  })
  .build();

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
    setContenthashTask,
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
