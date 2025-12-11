import { BytesLike, ethers, getBytes, namehash, toUtf8Bytes } from "ethers";
import { HookAbi, IDataResolverAbi, PROTOCODE_ETH_CALLDATA } from "./constants.js";

export const HookInterface = new ethers.Interface(HookAbi);
export const IDataResolverInterface = new ethers.Interface(IDataResolverAbi);

/**
 * Encodes the ABI for the virtual hook function, which encodes a contract call to IExtendedResolver at resolverAddress.
 * @param calldata - The encoded calldata for the IExtendedResolver contract call.
 * @param resolverAddress - The address of the resolver contract.
 * @returns The encoded ABI as a Uint8Array.
 */
export function encodeHookAbi(calldata: string, resolverAddress: string): string {
    const ret = HookInterface.encodeFunctionData("hook", [
        calldata,
        resolverAddress,
    ]);
    return ret
}
export type EnsHookReturnValue = {
    calldata: string;
    resolverAddress: string;
};

/**
 * Decodes the ABI for the virtual hook function, which encodes a contract call to IExtendedResolver at resolverAddress.
 * @param data - The encoded ABI data to decode.
 * @param throwOnError - If true, throws an error on failure; otherwise returns null.
 * @returns An object containing the decoded calldata and resolver address, or null if decoding fails.
 */
export function decodeHookAbi(data: string, throwOnError?: boolean): EnsHookReturnValue | null {
    try {
        const decoded = HookInterface.decodeFunctionData("hook", data);
        return {
            calldata: decoded[0],
            resolverAddress: decoded[1],
        };
    } catch (e) {
        if (throwOnError) {
            throw e;
        }
        return null;
    }
}


/**
 * Encodes the ABI for the `data` function of the IDataResolver contract.
 * @param node - The namehash of the ENS name.
 * @param key - The key to query (e.g., "data-url:example.eth").
 * @returns The encoded ABI as a Uint8Array.
 */
function encodeDataAbi(node: string, key: string): string {
    return IDataResolverInterface.encodeFunctionData(
        "data",
        [node, key]
    )
}


/**
    @param ensname - The ENS name to encode the DataUrl for
    @param resolverAddress - The address of the resolver to encode the DataUrl for
    @param node - Optional. The namehash of the ENS name. If not provided, it will be computed from the ENS name.
    @returns The encoded DataUrl hook as a Uint8Array
*/
export function encodeDataUrlHook(ensname: string, resolverAddress: string, node?: string) {
    if (!node) {
        node = namehash(ensname);
    }
    const calldata = encodeDataAbi(node, "data-url:" + ensname);
    return encodeHookAbi(calldata, resolverAddress);
}

/**
    Encodes a DataUrl hook with correct proto-code for use in contenthash records.
    @see {@link encodeDataUrlHook}
*/
export function encodeDataUrlHookForContenthash(ensname: string, resolverAddress: string, node?: string): string {
    if (!node) {
        node = namehash(ensname);
    }
    const calldata = encodeDataUrlHook(ensname, resolverAddress, node);
    return ethers.concat([PROTOCODE_ETH_CALLDATA, calldata]);
}
