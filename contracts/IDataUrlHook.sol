pragma solidity ^0.8.28;
interface IDataUrlHook {
    function hook(bytes32 node, string calldata key, address resolver, uint256 coinType) external returns (string memory);
}