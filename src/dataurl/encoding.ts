import { BytesLike, ethers, getBytes, toUtf8Bytes, toUtf8String } from "ethers";
import { HookAbi, PROTOCODE_ETH_CALLDATA, PROTOCODE_CONTENTHASH_URI, HOOK_SELECTOR } from "./constants.js";
import { buildFromPayload, getAddress, getChainId } from "@wonderland/interop-addresses";

export const HookInterface = new ethers.Interface(HookAbi);

export function encodeDataUri(uri: string): string {
    const uriBytes = toUtf8Bytes(uri);
    return ethers.concat([PROTOCODE_CONTENTHASH_URI, uriBytes]);
}

export function tryDecodeDataUri(data: BytesLike): string | null {
    try {
        const bytes = getBytes(data);
        const protocode = PROTOCODE_CONTENTHASH_URI;
        
        if (bytes.length < protocode.length) {
            return null;
        }
        
        for (let i = 0; i < protocode.length; i++) {
            if (bytes[i] !== protocode[i]) {
                return null;
            }
        }
        
        const uriBytes = bytes.slice(protocode.length);
        return toUtf8String(uriBytes);
    } catch (e) {
        return null;
    }
}

export function encodeEIP8121HookForContenthash(hookData: string): string {
    return ethers.concat([PROTOCODE_ETH_CALLDATA, hookData]);
}

export function tryDecodeEIP8121HookFromContenthash(data: BytesLike): string | null {
    try {
        const bytes = getBytes(data);
        const protocode = PROTOCODE_ETH_CALLDATA;
        
        if (bytes.length < protocode.length) {
            return null;
        }
        
        for (let i = 0; i < protocode.length; i++) {
            if (bytes[i] !== protocode[i]) {
                return null;
            }
        }
        
        return ethers.hexlify(bytes.slice(protocode.length));
    } catch (e) {
        return null;
    }
}

export interface EIP8121Target {
    chainId: number;
    address: string;
}

export interface HookParameter {
    type: string;
    value: any;
}

export interface DecodedEIP8121Hook {
    functionSignature: string;
    functionCall: string;
    returnType: string;
    target: EIP8121Target;
}

export async function encodeERC7930Target(chainId: number, address: string): Promise<string> {
    const binaryAddress = await buildFromPayload({
        version: 1,
        chainType: "eip155",
        chainReference: chainId.toString(),
        address: address,
    });
    return binaryAddress;
}

export async function decodeERC7930Target(target: string): Promise<EIP8121Target | null> {
    try {
        const chainId = await getChainId(target);
        const address = await getAddress(target);
        
        if (typeof chainId !== 'number') {
            return null;
        }
        
        return { chainId, address };
    } catch {
        return null;
    }
}

export function computeSelector(functionSignature: string): string {
    const hash = ethers.id(functionSignature);
    return ethers.dataSlice(hash, 0, 4);
}

/**
 * Validates that a parameter type is allowed in this implementation.
 * Allowed types: bool, address, uint8-256, int8-256, bytes1-32, string (max 512 chars)
 * Rejects: bytes (dynamic), arrays, structs, tuples
 */
export function isAllowedParameterType(type: string): boolean {
    const trimmedType = type.trim();
    
    // Check for exact matches
    if (trimmedType === 'bool' || trimmedType === 'address' || trimmedType === 'string') {
        return true;
    }
    
    // Check for uintN (uint8, uint16, ..., uint256)
    const uintMatch = trimmedType.match(/^uint(\d+)$/);
    if (uintMatch) {
        const bits = parseInt(uintMatch[1], 10);
        return bits >= 8 && bits <= 256 && bits % 8 === 0;
    }
    
    // Check for intN (int8, int16, ..., int256)
    const intMatch = trimmedType.match(/^int(\d+)$/);
    if (intMatch) {
        const bits = parseInt(intMatch[1], 10);
        return bits >= 8 && bits <= 256 && bits % 8 === 0;
    }
    
    // Check for bytesN (bytes1, bytes2, ..., bytes32)
    const bytesMatch = trimmedType.match(/^bytes(\d+)$/);
    if (bytesMatch) {
        const n = parseInt(bytesMatch[1], 10);
        return n >= 1 && n <= 32;
    }
    
    return false;
}

/**
 * Parses parameter types from a function signature.
 * Returns array of parameter types, or throws if signature is invalid.
 */
export function parseParameterTypes(functionSignature: string): string[] {
    const match = functionSignature.match(/^\w+\(([^)]*)\)$/);
    if (!match) {
        throw new Error('Invalid function signature format');
    }
    
    const paramsString = match[1].trim();
    if (!paramsString) {
        return [];
    }
    
    // Split by comma
    const params = paramsString.split(',').map(p => p.trim()).filter(p => p.length > 0);
    
    // Validate parameter count (0-2 only)
    if (params.length > 2) {
        throw new Error(`Too many parameters: ${params.length}. Maximum 2 parameters allowed.`);
    }
    
    // Validate each parameter type
    for (const param of params) {
        if (!isAllowedParameterType(param)) {
            throw new Error(`Unsupported parameter type: ${param}. Only fixed-size primitives and strings (max 512 chars) allowed (bool, address, uintN, intN, bytesN, string).`);
        }
    }
    
    return params;
}

/**
 * Extracts function name from function signature or function call.
 */
export function extractFunctionName(functionString: string): string {
    const match = functionString.match(/^(\w+)\(/);
    if (!match) {
        throw new Error('Invalid function format');
    }
    return match[1];
}

/**
 * Maximum allowed length for string parameters (512 characters)
 */
export const MAX_STRING_LENGTH = 512;

/**
 * Validates that an integer value is within the valid range for its type.
 * Uses BigInt for arbitrary precision to handle uint256/int256 correctly.
 */
function validateIntegerRange(value: string, paramType: string, paramIndex: number, detailedErrors: boolean): void {
    const isUnsigned = paramType.startsWith('uint');
    const bitsStr = paramType.replace(/^u?int/, '');
    const bits = bitsStr ? parseInt(bitsStr, 10) : 256;
    
    // Reject excessively long numeric strings before BigInt parsing to prevent DoS
    // Max for uint256: 78 decimal digits or 64 hex digits (+ 2 for '0x')
    // Max for int256: 78 digits + 1 for sign = 79 decimal, or 64 hex + 2 = 66 with '0x'
    const isHex = value.startsWith('0x') || value.startsWith('0X');
    const maxLength = isHex ? 66 : 79; // Max length including prefix/sign
    
    if (value.length > maxLength) {
        throw new Error(detailedErrors
            ? `Parameter ${paramIndex + 1} (type ${paramType}): numeric string too long (max ${maxLength} characters)`
            : 'Failed to parse function call parameters');
    }
    
    // Parse value as BigInt (handles both decimal and hex)
    let numValue: bigint;
    try {
        numValue = BigInt(value);
    } catch {
        throw new Error(detailedErrors 
            ? `Parameter ${paramIndex + 1} (type ${paramType}): invalid number format`
            : 'Failed to parse function call parameters');
    }
    
    if (isUnsigned) {
        // uint: 0 to 2^bits - 1
        const maxValue = (BigInt(1) << BigInt(bits)) - BigInt(1);
        if (numValue < BigInt(0) || numValue > maxValue) {
            throw new Error(detailedErrors
                ? `Parameter ${paramIndex + 1} (type ${paramType}): value ${value} out of range (0 to ${maxValue})`
                : 'Failed to parse function call parameters');
        }
    } else {
        // int: -2^(bits-1) to 2^(bits-1) - 1
        const minValue = -(BigInt(1) << BigInt(bits - 1));
        const maxValue = (BigInt(1) << BigInt(bits - 1)) - BigInt(1);
        if (numValue < minValue || numValue > maxValue) {
            throw new Error(detailedErrors
                ? `Parameter ${paramIndex + 1} (type ${paramType}): value ${value} out of range (${minValue} to ${maxValue})`
                : 'Failed to parse function call parameters');
        }
    }
}

/**
 * Parses a single quoted string value, handling escape sequences \' and \\
 * Returns the unescaped string value and the position after the closing quote.
 */
function parseQuotedString(input: string, startPos: number): { value: string; endPos: number } {
    let result = '';
    let pos = startPos;
    let escaped = false;
    
    while (pos < input.length) {
        const char = input[pos];
        
        if (escaped) {
            // Only support \' and \\ escape sequences
            if (char === "'" || char === '\\') {
                result += char;
            } else {
                throw new Error(`Invalid escape sequence: \\${char}. Only \\' and \\\\ are supported.`);
            }
            escaped = false;
            pos++;
        } else if (char === '\\') {
            escaped = true;
            pos++;
        } else if (char === "'") {
            // End of string
            return { value: result, endPos: pos + 1 };
        } else {
            result += char;
            pos++;
        }
    }
    
    throw new Error('Unterminated string: missing closing quote');
}

/**
 * Parses parameter values from a functionCall string according to functionSignature types.
 * Supports: hex (0x...), booleans (true/false), quoted strings with \' and \\ escapes, decimal numbers.
 * Validates string length limits (512 chars) and proper formatting.
 * Returns array of parsed values ready for ABI encoding.
 */
export function parseFunctionCallValues(
    functionCall: string,
    functionSignature: string,
    detailedErrors: boolean = true
): any[] {
    try {
        // Extract function name and validate it matches
        const callName = extractFunctionName(functionCall);
        const sigName = extractFunctionName(functionSignature);
        
        if (callName !== sigName) {
            throw new Error(`Function name mismatch: signature has '${sigName}' but call has '${callName}'`);
        }
        
        // Get parameter types from signature
        const paramTypes = parseParameterTypes(functionSignature);
        
        // Extract the parameters string from functionCall by locating outer parentheses
        const trimmedCall = functionCall.trim();
        const openParenIndex = trimmedCall.indexOf('(');
        const closeParenIndex = trimmedCall.lastIndexOf(')');
        if (openParenIndex === -1 || closeParenIndex === -1 || closeParenIndex < openParenIndex) {
            throw new Error('Invalid function call format');
        }
        // Ensure there is no trailing non-parenthesis content after the closing ')'
        if (closeParenIndex !== trimmedCall.length - 1) {
            throw new Error('Invalid function call format');
        }
        
        const paramsString = trimmedCall.slice(openParenIndex + 1, closeParenIndex).trim();
        
        // Handle zero parameters
        if (paramTypes.length === 0) {
            if (paramsString.length > 0) {
                throw new Error('Function expects 0 parameters but call has parameters');
            }
            return [];
        }
        
        // Parse parameter values
        const values: any[] = [];
        let pos = 0;
        let paramIndex = 0;
        
        while (pos < paramsString.length && paramIndex < paramTypes.length) {
            // Skip whitespace
            while (pos < paramsString.length && /\s/.test(paramsString[pos])) {
                pos++;
            }
            
            if (pos >= paramsString.length) break;
            
            const paramType = paramTypes[paramIndex].trim();
            
            // Parse based on type
            if (paramType === 'string') {
                // Expect a quoted string
                if (paramsString[pos] !== "'") {
                    throw new Error(`Parameter ${paramIndex + 1} (type ${paramType}): expected quoted string starting with '`);
                }
                
                const { value, endPos } = parseQuotedString(paramsString, pos + 1);
                
                // Validate string length
                if (value.length > MAX_STRING_LENGTH) {
                    throw new Error(`Parameter ${paramIndex + 1} (type ${paramType}): string too long (${value.length} chars, max ${MAX_STRING_LENGTH})`);
                }
                
                values.push(value);
                pos = endPos;
            } else if (paramType === 'bool') {
                // Expect true or false
                if (paramsString.startsWith('true', pos)) {
                    values.push(true);
                    pos += 4;
                } else if (paramsString.startsWith('false', pos)) {
                    values.push(false);
                    pos += 5;
                } else {
                    throw new Error(`Parameter ${paramIndex + 1} (type ${paramType}): expected 'true' or 'false'`);
                }
            } else if (paramType === 'address' || paramType.startsWith('bytes') || paramType.startsWith('uint') || paramType.startsWith('int')) {
                // Parse until comma or end
                let valueEnd = pos;
                let parenDepth = 0;
                
                while (valueEnd < paramsString.length) {
                    const char = paramsString[valueEnd];
                    if (char === '(' ) parenDepth++;
                    if (char === ')' ) parenDepth--;
                    if (char === ',' && parenDepth === 0) break;
                    valueEnd++;
                }
                
                const valueStr = paramsString.substring(pos, valueEnd).trim();
                
                if (paramType === 'address') {
                    // Validate hex address format
                    if (!/^0x[0-9a-fA-F]{40}$/.test(valueStr)) {
                        throw new Error(`Parameter ${paramIndex + 1} (type ${paramType}): invalid address format, expected 0x followed by 40 hex characters`);
                    }
                    values.push(valueStr);
                } else if (paramType.startsWith('bytes')) {
                    // Validate hex bytes format
                    const bytesMatch = paramType.match(/^bytes(\d+)$/);
                    if (bytesMatch) {
                        const expectedBytes = parseInt(bytesMatch[1], 10);
                        const expectedHexLength = expectedBytes * 2;
                        
                        if (!/^0x[0-9a-fA-F]+$/.test(valueStr)) {
                            throw new Error(`Parameter ${paramIndex + 1} (type ${paramType}): invalid hex format, expected 0x followed by hex characters`);
                        }
                        
                        const hexPart = valueStr.substring(2);
                        if (hexPart.length !== expectedHexLength) {
                            throw new Error(`Parameter ${paramIndex + 1} (type ${paramType}): expected ${expectedHexLength} hex characters (${expectedBytes} bytes), got ${hexPart.length}`);
                        }
                        
                        values.push(valueStr);
                    }
                } else if (paramType.startsWith('uint') || paramType.startsWith('int')) {
                    // Parse as hex or decimal number
                    if (valueStr.startsWith('0x') || valueStr.startsWith('0X')) {
                        // Hex number (normalize to lowercase for validation)
                        if (!/^0[xX][0-9a-fA-F]+$/.test(valueStr)) {
                            throw new Error(`Parameter ${paramIndex + 1} (type ${paramType}): invalid hex number format`);
                        }
                    } else {
                        // Decimal number
                        if (!/^-?\d+$/.test(valueStr)) {
                            throw new Error(`Parameter ${paramIndex + 1} (type ${paramType}): invalid decimal number format`);
                        }
                        
                        // Check if negative number is valid for the type
                        if (paramType.startsWith('uint') && valueStr.startsWith('-')) {
                            throw new Error(`Parameter ${paramIndex + 1} (type ${paramType}): unsigned integer cannot be negative`);
                        }
                    }
                    
                    // Validate integer is within range for its type
                    validateIntegerRange(valueStr, paramType, paramIndex, detailedErrors);
                    values.push(valueStr);
                }
                
                pos = valueEnd;
            } else {
                throw new Error(`Unsupported parameter type: ${paramType}`);
            }
            
            // Skip whitespace after value
            while (pos < paramsString.length && /\s/.test(paramsString[pos])) {
                pos++;
            }
            
            // Check for comma separator (unless this is the last parameter)
            if (paramIndex < paramTypes.length - 1) {
                if (pos >= paramsString.length || paramsString[pos] !== ',') {
                    throw new Error(`Expected comma after parameter ${paramIndex + 1}`);
                }
                pos++; // Skip comma
            }
            
            paramIndex++;
        }
        
        // Verify we parsed all parameters
        if (paramIndex !== paramTypes.length) {
            throw new Error(`Parameter count mismatch: signature has ${paramTypes.length} parameters but call has ${paramIndex}`);
        }
        
        // Verify no trailing content
        while (pos < paramsString.length) {
            if (!/\s/.test(paramsString[pos])) {
                throw new Error('Unexpected content after parameters');
            }
            pos++;
        }
        
        return values;
    } catch (error: any) {
        if (detailedErrors) {
            throw error;
        } else {
            // Generic error message for security
            throw new Error('Failed to parse function call parameters');
        }
    }
}

/**
 * Strictly validates that functionCall matches functionSignature structure.
 * Validates function name matches and parameter count matches.
 */
export function validateFunctionCallMatchesSignature(
    functionSignature: string,
    functionCall: string
): void {
    const sigName = extractFunctionName(functionSignature);
    const callName = extractFunctionName(functionCall);
    
    if (sigName !== callName) {
        throw new Error(`Function name mismatch: signature has '${sigName}' but call has '${callName}'`);
    }
    
    const paramTypes = parseParameterTypes(functionSignature);
    
    // Parse parameter values from function call
    const callMatch = functionCall.match(/^\w+\(([^)]*)\)$/);
    if (!callMatch) {
        throw new Error('Invalid function call format');
    }
    
    const callParamsString = callMatch[1].trim();
    
    // Count parameters in call (simple comma split - ethers will validate actual values)
    let callParamCount = 0;
    if (callParamsString) {
        // Simple approach: count commas + 1, accounting for empty string
        callParamCount = callParamsString.split(',').filter(p => p.trim().length > 0).length;
    }
    
    if (callParamCount !== paramTypes.length) {
        throw new Error(`Parameter count mismatch: signature has ${paramTypes.length} parameters but call has ${callParamCount}`);
    }
}

/**
 * Encodes a hook with the ERC-8121 format (functionSignature, functionCall, returnType, target).
 * Validates that functionCall matches functionSignature and parameter values are properly formatted.
 * Validates string parameters are within 512 character limit.
 */
export async function encodeHook(
    functionSignature: string,
    functionCall: string,
    returnType: string,
    target: EIP8121Target
): Promise<string> {
    // Validate parameter types (0-2 parameters, including strings)
    parseParameterTypes(functionSignature);
    
    // Parse and validate functionCall values with detailed error messages
    // This ensures parameter values are properly formatted and within limits
    parseFunctionCallValues(functionCall, functionSignature, true);
    
    // Validate return type is bytes
    if (returnType.trim() !== '(bytes)') {
        throw new Error(`Invalid return type: ${returnType}. Only (bytes) return type is supported.`);
    }
    
    const targetBytes = await encodeERC7930Target(target.chainId, target.address);
    return HookInterface.encodeFunctionData("hook", [
        functionSignature,
        functionCall,
        returnType,
        targetBytes
    ]);
}

export async function decodeHook(data: string): Promise<DecodedEIP8121Hook | null> {
    try {
        const decoded = HookInterface.decodeFunctionData("hook", data);
        const target = await decodeERC7930Target(decoded[3]);
        
        if (!target) {
            return null;
        }
        
        return {
            functionSignature: decoded[0],
            functionCall: decoded[1],
            returnType: decoded[2],
            target
        };
    } catch {
        return null;
    }
}

export function isEIP8121Hook(data: string): boolean {
    try {
        const lower = data.toLowerCase();
        if (lower.startsWith(HOOK_SELECTOR.toLowerCase())) {
            return true;
        }
        const bytes = getBytes(data);
        if (bytes.length >= PROTOCODE_ETH_CALLDATA.length + 4) {
            let hasProtocodePrefix = true;
            for (let i = 0; i < PROTOCODE_ETH_CALLDATA.length; i++) {
                if (bytes[i] !== PROTOCODE_ETH_CALLDATA[i]) {
                    hasProtocodePrefix = false;
                    break;
                }
            }
            if (hasProtocodePrefix) {
                const afterProtocol = ethers.hexlify(bytes.slice(PROTOCODE_ETH_CALLDATA.length));
                return afterProtocol.toLowerCase().startsWith(HOOK_SELECTOR.toLowerCase());
            }
        }
        return false;
    } catch {
        return false;
    }
}
