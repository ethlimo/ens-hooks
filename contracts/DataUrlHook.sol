pragma solidity ^0.8.28;
import '@openzeppelin/contracts/access/Ownable.sol';
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@ensdomains/ens-contracts/contracts/resolvers/profiles/IExtendedResolver.sol";
import "@ensdomains/ens-contracts/contracts/resolvers/profiles/ITextResolver.sol";
import "@ensdomains/ens-contracts/contracts/utils/BytesUtils.sol";
import "./IDataUrlHook.sol";

contract DataUrlHook is Ownable, ERC165, IExtendedResolver {
    using BytesUtils for bytes;
    mapping(bytes32 => string) public dataUrls;

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

    function setDataURL(bytes32 node, string calldata dataUrl) public onlyOwner {
        dataUrls[node] = dataUrl;
    }

    function supportsInterface(
        bytes4 interfaceID
    ) public view virtual override returns (bool) {
        return interfaceID == 0x9061b923 || super.supportsInterface(interfaceID);
    }
}