pragma solidity ^0.8.28;
/// @dev Interface selector: `0xecbfada3`
interface IDataResolver {
    /// @notice Get data for node.
    function data(bytes32 node) external view returns (bytes memory);

    /// @notice Data changed for node.
    event DataChanged(bytes32 indexed node, bytes32 indexed dataHash);
}
