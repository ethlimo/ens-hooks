pragma solidity ^0.8.28;
import '@openzeppelin/contracts/access/Ownable.sol';
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@ensdomains/ens-contracts/contracts/resolvers/profiles/IExtendedResolver.sol";
import "@ensdomains/ens-contracts/contracts/resolvers/profiles/ITextResolver.sol";
import "@ensdomains/ens-contracts/contracts/utils/BytesUtils.sol";
import "./IDataUrlHook.sol";

contract DataUrlHook is Ownable, ERC165, IExtendedResolver {
    using BytesUtils for bytes;
    mapping(bytes32 => string) dataUrls;

    //a cache control nonce is a unique ID that can be used to invalidate a cache serving this data as static content
    //when the nonce has not changed, it is considered safe to not invalidate the cache of the service serving this data
    //no change: content may be refetched at any time, but is assumed unchanged
    //change: content must be considered invalid, but may be subject to service's minimum cache time
    //programmatic change (i.e. nonce = block.timestamp): cache will always be considered stale, subject to service's minimum caching time
    mapping(bytes32 => uint256) cacheControlNonce;

    function resolve(
        bytes memory _name,
        bytes calldata data
    ) external view returns (bytes memory) {
        require(bytes4(data[0:4]) == IDataUrlHook.hook.selector,
            "Method not supported"
        );
        (bytes32 node, string memory key, address resolver, uint256 coinType) = abi.decode(data[4:], (bytes32, string, address, uint256));
        require(resolver == address(this), "Wrong resolver");
        //TODO: cointype check? do we care?
        bytes memory keyBytes = bytes(key);
        uint256 suffixLength = bytes(":dataURL").length;
        require(keyBytes.length >= suffixLength, "Invalid key");
        require(keyBytes.equals(keyBytes.length - suffixLength, bytes(":dataURL")), "Invalid key");

        return bytes(dataUrls[node]);
    }

    function setDataURL(bytes32 node, bool updateNonce, string calldata dataUrl) public onlyOwner {
        dataUrls[node] = dataUrl;
        if(updateNonce) {
            cacheControlNonce[node] = block.timestamp;
        }
    }

    function setCacheControlNonce(bytes32 node, uint256 nonce) public onlyOwner {
        cacheControlNonce[node] = nonce;
    }

    function getCacheControlNonce(bytes32 node) public view returns (uint256) {
        return cacheControlNonce[node];
    }


    function supportsInterface(
        bytes4 interfaceID
    ) public view virtual override returns (bool) {
        return interfaceID == 0x9061b923 || super.supportsInterface(interfaceID);
    }
}