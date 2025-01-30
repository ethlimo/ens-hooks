export const DataHookAbi = [
    "function hook(bytes32 node, string calldata key, address resolver, uint256 coinType) public returns (string memory)"
];

//temporary values
//export const DATA_URI_PREFIX = ethers.getBytes("0x3000f2");
export const DATA_URI_PREFIX = new Uint8Array([48, 0, 242]);
//export const DATA_URL_PREFIX = ethers.getBytes("0x30009b");
export const DATA_URL_PREFIX = new Uint8Array([48, 0, 155]);
