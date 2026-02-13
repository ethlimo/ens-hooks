// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title FunctionCallParserTest
 * @notice Test contract for ERC-8121 functionCall parameter parsing
 * @dev Tests string parameters, mixed types, edge cases, and gas limits
 */
contract FunctionCallParserTest {
    // String parameter tests
    function getString() public pure returns (bytes memory) {
        return abi.encode("Hello, World!");
    }
    
    function getStringParam(string memory input) public pure returns (bytes memory) {
        return abi.encode(input);
    }
    
    function getEmptyString(string memory input) public pure returns (bytes memory) {
        require(bytes(input).length == 0, "Expected empty string");
        return abi.encode("Empty string received");
    }
    
    function getMaxString(string memory input) public pure returns (bytes memory) {
        require(bytes(input).length == 512, "Expected 512 character string");
        return abi.encode("Max length string received");
    }
    
    function getStringWithEscapes(string memory input) public pure returns (bytes memory) {
        // Test strings with escaped quotes and backslashes
        return abi.encode(input);
    }
    
    function getStringWithNewline(string memory input) public pure returns (bytes memory) {
        // Test strings with actual UTF newline characters
        return abi.encode(input);
    }
    
    function getStringWithUnicode(string memory input) public pure returns (bytes memory) {
        // Test strings with Unicode characters
        return abi.encode(input);
    }
    
    // Boolean parameter tests
    function getBoolTrue(bool value) public pure returns (bytes memory) {
        require(value == true, "Expected true");
        return abi.encode("Boolean true received");
    }
    
    function getBoolFalse(bool value) public pure returns (bytes memory) {
        require(value == false, "Expected false");
        return abi.encode("Boolean false received");
    }
    
    // Address parameter tests
    function getAddress(address addr) public pure returns (bytes memory) {
        return abi.encode(addr);
    }
    
    function getZeroAddress(address addr) public pure returns (bytes memory) {
        require(addr == address(0), "Expected zero address");
        return abi.encode("Zero address received");
    }
    
    // Unsigned integer tests
    function getUint256(uint256 value) public pure returns (bytes memory) {
        return abi.encode(value);
    }
    
    function getUint256Zero(uint256 value) public pure returns (bytes memory) {
        require(value == 0, "Expected zero");
        return abi.encode("Zero received");
    }
    
    function getUint256Max(uint256 value) public pure returns (bytes memory) {
        require(value == type(uint256).max, "Expected max uint256");
        return abi.encode("Max uint256 received");
    }
    
    function getUint8(uint8 value) public pure returns (bytes memory) {
        return abi.encode(value);
    }
    
    function getUint128(uint128 value) public pure returns (bytes memory) {
        return abi.encode(value);
    }
    
    // Signed integer tests
    function getInt256(int256 value) public pure returns (bytes memory) {
        return abi.encode(value);
    }
    
    function getInt256Negative(int256 value) public pure returns (bytes memory) {
        require(value < 0, "Expected negative value");
        return abi.encode(value);
    }
    
    function getInt256Max(int256 value) public pure returns (bytes memory) {
        require(value == type(int256).max, "Expected max int256");
        return abi.encode("Max int256 received");
    }
    
    function getInt256Min(int256 value) public pure returns (bytes memory) {
        require(value == type(int256).min, "Expected min int256");
        return abi.encode("Min int256 received");
    }
    
    // BytesN tests
    function getBytes32(bytes32 value) public pure returns (bytes memory) {
        return abi.encode(value);
    }
    
    function getBytes32Zero(bytes32 value) public pure returns (bytes memory) {
        require(value == bytes32(0), "Expected zero bytes32");
        return abi.encode("Zero bytes32 received");
    }
    
    function getBytes1(bytes1 value) public pure returns (bytes memory) {
        return abi.encode(value);
    }
    
    function getBytes16(bytes16 value) public pure returns (bytes memory) {
        return abi.encode(value);
    }
    
    // Mixed parameter tests (2 parameters)
    function getStringAndUint(string memory str, uint256 num) public pure returns (bytes memory) {
        return abi.encode(str, num);
    }
    
    function getAddressAndBool(address addr, bool flag) public pure returns (bytes memory) {
        return abi.encode(addr, flag);
    }
    
    function getBytes32AndString(bytes32 hash, string memory str) public pure returns (bytes memory) {
        return abi.encode(hash, str);
    }
    
    function getUintAndInt(uint256 uvalue, int256 ivalue) public pure returns (bytes memory) {
        return abi.encode(uvalue, ivalue);
    }
    
    function getBoolAndAddress(bool flag, address addr) public pure returns (bytes memory) {
        return abi.encode(flag, addr);
    }
    
    function getTwoStrings(string memory str1, string memory str2) public pure returns (bytes memory) {
        return abi.encode(str1, str2);
    }
    
    // Gas limit tests - these functions measure gas consumption with large strings
    function gasTestString256(string memory input) public pure returns (bytes memory) {
        require(bytes(input).length == 256, "Expected 256 character string");
        return abi.encode(input, "256 chars processed");
    }
    
    function gasTestString512(string memory input) public pure returns (bytes memory) {
        require(bytes(input).length == 512, "Expected 512 character string");
        return abi.encode(input, "512 chars processed");
    }
    
    function gasTestTwoStrings256(string memory input1, string memory input2) public pure returns (bytes memory) {
        require(bytes(input1).length == 256, "Expected 256 character string for input1");
        require(bytes(input2).length == 256, "Expected 256 character string for input2");
        return abi.encode(input1, input2, "Two 256 char strings processed");
    }
    
    function gasTestStringAndBytes32(string memory str, bytes32 hash) public pure returns (bytes memory) {
        require(bytes(str).length == 512, "Expected 512 character string");
        return abi.encode(str, hash, "String and bytes32 processed");
    }
    
    // Edge case tests
    function getStringWithQuotes(string memory input) public pure returns (bytes memory) {
        // Expects: "It's working" -> It's working (with escaped quote)
        return abi.encode(input);
    }
    
    function getStringWithBackslash(string memory input) public pure returns (bytes memory) {
        // Expects: "path\\to\\file" -> path\to\file (with escaped backslashes)
        return abi.encode(input);
    }
    
    function getStringWithBoth(string memory input) public pure returns (bytes memory) {
        // Expects mixed escapes
        return abi.encode(input);
    }
    
    function getHexUint(uint256 value) public pure returns (bytes memory) {
        // Test hex number parsing (0x...)
        return abi.encode(value);
    }
    
    function getDecimalUint(uint256 value) public pure returns (bytes memory) {
        // Test decimal number parsing
        return abi.encode(value);
    }
    
    function getMixedCaseAddress(address addr) public pure returns (bytes memory) {
        // Test mixed case address parsing
        return abi.encode(addr);
    }
}
