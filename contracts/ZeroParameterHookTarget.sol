// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import '@openzeppelin/contracts/access/Ownable.sol';

contract ZeroParameterHookTarget is Ownable {
    bytes private globalData;
    
    event GlobalDataChanged(bytes32 hash);
    
    function getData() external view returns (bytes memory) {
        return globalData;
    }
    
    function setData(bytes calldata value) external onlyOwner {
        globalData = value;
        emit GlobalDataChanged(keccak256(value));
    }
}
