pragma solidity ^0.8.28;
import '@openzeppelin/contracts/access/Ownable.sol';
import '@ensdomains/ens-contracts/contracts/resolvers/profiles/ExtendedResolver.sol';
import './IDataResolver.sol';

contract DataResolver is Ownable, ExtendedResolver, IDataResolver {    
    mapping(bytes32 node => mapping(string key => bytes data)) private dataStore;
    
    function data(bytes32 node, string calldata key) external view returns (bytes memory) {
        return dataStore[node][key];
    }

    function setData(bytes32 node, string calldata key, bytes calldata value) external onlyOwner {
        dataStore[node][key] = value;
        emit DataChanged(node, key, key, value);
    }
}