// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @notice Hook target that answers through ERC-3668 (CCIP-read).
/// @dev Test contract. The callback returns the gateway response without
/// checking it, a real target would verify it first.
contract OffchainHookTarget {
    error OffchainLookup(
        address sender,
        string[] urls,
        bytes callData,
        bytes4 callbackFunction,
        bytes extraData
    );

    string[] private gatewayUrls;

    constructor(string[] memory urls) {
        gatewayUrls = urls;
    }

    function data(bytes32 node) external view returns (bytes memory) {
        revert OffchainLookup(
            address(this),
            gatewayUrls,
            abi.encode(node),
            this.dataCallback.selector,
            ""
        );
    }

    function dataCallback(bytes calldata response, bytes calldata) external pure returns (bytes memory) {
        return response;
    }
}
