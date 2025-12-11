pragma solidity ^0.8.28;
/// @dev Interface selector: `0xecbfada3`
interface IDataResolver {
    /// @notice For a specific `node`, get the data associated with the key, `key`.
    /// @param node The node (namehash) for which data is being fetched.
    /// @param key The key.
    /// @return The associated arbitrary `bytes` data.
    function data(
        bytes32 node,
        string calldata key
    ) external view returns (bytes memory);

    /// @notice For a specific `node`, the data associated with a `key` has changed.
    event DataChanged(
        bytes32 indexed node,
        string indexed indexedKey,
        string key,
        bytes indexed indexedData
    );
}
