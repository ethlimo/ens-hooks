// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title MultiParamResolver
 * @dev Test contract for validating EIP-8121 hooks with multiple parameters.
 * Supports both single-parameter and two-parameter function calls.
 */
contract MultiParamResolver {
    mapping(bytes32 node => bytes data) private dataStore;
    
    event DataChanged(bytes32 indexed node, bytes32 hash);
    
    /**
     * @dev Single-parameter version for backward compatibility testing.
     * @param node The node hash to query
     * @return The stored data for the node
     */
    function data(bytes32 node) external view returns (bytes memory) {
        return dataStore[node];
    }
    
    /**
     * @dev Two-parameter version with cacheNonce parameter.
     * The cacheNonce parameter is semantically ignored but changes the function signature,
     * which affects the contenthash hash for external readers.
     * @param node The node hash to query
     * @param cacheNonce Cache-busting nonce (ignored in execution)
     * @return The stored data for the node
     */
    function dataWithOptions(bytes32 node, bytes32 cacheNonce) external view returns (bytes memory) {
        // cacheNonce is intentionally unused - it only serves to change the function signature
        return dataStore[node];
    }
    
    /**
     * @dev Set data for a node (for testing purposes).
     * @param node The node hash to set
     * @param value The data to store
     */
    function setData(bytes32 node, bytes calldata value) external {
        dataStore[node] = value;
        emit DataChanged(node, keccak256(value));
    }
}
