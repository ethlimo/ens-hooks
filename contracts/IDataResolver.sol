pragma solidity ^0.8.28;
/// @dev Interface selector: `0xecbfada3`
interface IDataResolver {
    /// @notice For a specific `node`, get the data.
    /// @param node The node (namehash) for which data is being fetched.
    /// @return The associated arbitrary `bytes` data.
    function data(bytes32 node) external view returns (bytes memory);

    /// @notice For a specific `node`, the data has changed.
    event DataChanged(bytes32 indexed node, bytes32 indexed dataHash);
}
