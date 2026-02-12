// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import '@openzeppelin/contracts/access/Ownable.sol';

/**
 * Test contract with all permutations of 0-2 fixed-size primitive parameters.
 * For local node testing only - not deployed to testnets.
 */
contract AllParameterPermutationsHookTarget is Ownable {
    // Storage for each permutation
    bytes private data0;
    mapping(bytes32 => bytes) private data1Bytes32;
    mapping(address => bytes) private data1Address;
    mapping(uint256 => bytes) private data1Uint256;
    mapping(bool => bytes) private data1Bool;
    mapping(bytes32 => mapping(bytes32 => bytes)) private data2Bytes32Bytes32;
    mapping(bytes32 => mapping(uint256 => bytes)) private data2Bytes32Uint256;
    mapping(bytes32 => mapping(address => bytes)) private data2Bytes32Address;
    mapping(address => mapping(uint256 => bytes)) private data2AddressUint256;
    mapping(uint256 => mapping(uint256 => bytes)) private data2Uint256Uint256;
    mapping(bool => mapping(bytes32 => bytes)) private data2BoolBytes32;

    // ========================================================================
    // 0 Parameters
    // ========================================================================
    
    function get0() external view returns (bytes memory) {
        return data0;
    }
    
    function set0(bytes calldata value) external onlyOwner {
        data0 = value;
    }

    // ========================================================================
    // 1 Parameter - bytes32
    // ========================================================================
    
    function get1Bytes32(bytes32 key) external view returns (bytes memory) {
        return data1Bytes32[key];
    }
    
    function set1Bytes32(bytes32 key, bytes calldata value) external onlyOwner {
        data1Bytes32[key] = value;
    }

    // ========================================================================
    // 1 Parameter - address
    // ========================================================================
    
    function get1Address(address key) external view returns (bytes memory) {
        return data1Address[key];
    }
    
    function set1Address(address key, bytes calldata value) external onlyOwner {
        data1Address[key] = value;
    }

    // ========================================================================
    // 1 Parameter - uint256
    // ========================================================================
    
    function get1Uint256(uint256 key) external view returns (bytes memory) {
        return data1Uint256[key];
    }
    
    function set1Uint256(uint256 key, bytes calldata value) external onlyOwner {
        data1Uint256[key] = value;
    }

    // ========================================================================
    // 1 Parameter - bool
    // ========================================================================
    
    function get1Bool(bool key) external view returns (bytes memory) {
        return data1Bool[key];
    }
    
    function set1Bool(bool key, bytes calldata value) external onlyOwner {
        data1Bool[key] = value;
    }

    // ========================================================================
    // 2 Parameters - bytes32, bytes32
    // ========================================================================
    
    function get2Bytes32Bytes32(bytes32 key1, bytes32 key2) external view returns (bytes memory) {
        return data2Bytes32Bytes32[key1][key2];
    }
    
    function set2Bytes32Bytes32(bytes32 key1, bytes32 key2, bytes calldata value) external onlyOwner {
        data2Bytes32Bytes32[key1][key2] = value;
    }

    // ========================================================================
    // 2 Parameters - bytes32, uint256
    // ========================================================================
    
    function get2Bytes32Uint256(bytes32 key1, uint256 key2) external view returns (bytes memory) {
        return data2Bytes32Uint256[key1][key2];
    }
    
    function set2Bytes32Uint256(bytes32 key1, uint256 key2, bytes calldata value) external onlyOwner {
        data2Bytes32Uint256[key1][key2] = value;
    }

    // ========================================================================
    // 2 Parameters - bytes32, address
    // ========================================================================
    
    function get2Bytes32Address(bytes32 key1, address key2) external view returns (bytes memory) {
        return data2Bytes32Address[key1][key2];
    }
    
    function set2Bytes32Address(bytes32 key1, address key2, bytes calldata value) external onlyOwner {
        data2Bytes32Address[key1][key2] = value;
    }

    // ========================================================================
    // 2 Parameters - address, uint256
    // ========================================================================
    
    function get2AddressUint256(address key1, uint256 key2) external view returns (bytes memory) {
        return data2AddressUint256[key1][key2];
    }
    
    function set2AddressUint256(address key1, uint256 key2, bytes calldata value) external onlyOwner {
        data2AddressUint256[key1][key2] = value;
    }

    // ========================================================================
    // 2 Parameters - uint256, uint256
    // ========================================================================
    
    function get2Uint256Uint256(uint256 key1, uint256 key2) external view returns (bytes memory) {
        return data2Uint256Uint256[key1][key2];
    }
    
    function set2Uint256Uint256(uint256 key1, uint256 key2, bytes calldata value) external onlyOwner {
        data2Uint256Uint256[key1][key2] = value;
    }

    // ========================================================================
    // 2 Parameters - bool, bytes32
    // ========================================================================
    
    function get2BoolBytes32(bool key1, bytes32 key2) external view returns (bytes memory) {
        return data2BoolBytes32[key1][key2];
    }
    
    function set2BoolBytes32(bool key1, bytes32 key2, bytes calldata value) external onlyOwner {
        data2BoolBytes32[key1][key2] = value;
    }
}
