pragma solidity ^0.8.28;
import '@openzeppelin/contracts/access/Ownable.sol';
import '@ensdomains/ens-contracts/contracts/resolvers/profiles/ExtendedResolver.sol';
import './IDataResolver.sol';

contract DataResolver is Ownable, ExtendedResolver, IDataResolver {    
    mapping(bytes32 node => bytes data) private dataStore;
    
    function data(bytes32 node) external view returns (bytes memory) {
        return dataStore[node];
    }

    function setData(bytes32 node, bytes calldata value) external onlyOwner {
        dataStore[node] = value;
        emit DataChanged(node, keccak256(value));
    }
}