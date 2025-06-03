import { BigNumberish, BytesLike, ethers, getBytes, namehash } from "ethers";
import { DATA_URI_PREFIX, DATA_URL_PREFIX, DataHookAbi } from "./constants.js";

export const encodeDataUrlAbi = (name: string, key: string, address: string, coinType: BigNumberish): Uint8Array => {
    return getBytes(HookContractInterface.encodeFunctionData("hook", [namehash(name), key, address, coinType]));
};

export const encodeDataUrlContentHash = (name: string, key: string, address: string, coinType: BigNumberish): Uint8Array => {
    return new Uint8Array([
        ...DATA_URL_PREFIX,
        ...encodeDataUrlAbi(name, key, address, coinType),
    ]);
}

export const HookContractInterface = new ethers.Interface(DataHookAbi);

export const encodeDataUriAbi = (uri: string): Uint8Array => {
    return new TextEncoder().encode(uri)
}

export const encodeDataUriContentHash = (uri: string): Uint8Array => {
    return new Uint8Array([
        ...DATA_URI_PREFIX,
        ...encodeDataUriAbi(uri),
    ]);
}

export const tryDecodeDataUri = (data: Uint8Array): string | null => {
    if (data.length < DATA_URI_PREFIX.length) {
        return null;
    }

    for (let i = 0; i < DATA_URI_PREFIX.length; i++) {
        if (data[i] !== DATA_URI_PREFIX[i]) {
            return null;
        }
    }
    
    return new TextDecoder().decode(data.slice(DATA_URI_PREFIX.length));
}

export const tryDecodeDataUrl = (data: Uint8Array): Uint8Array | null => {
    if (data.length < DATA_URL_PREFIX.length) {
        return null;
    }

    for (let i = 0; i < DATA_URL_PREFIX.length; i++) {
        if (data[i] !== DATA_URL_PREFIX[i]) {
            return null;
        }
    }
    
    const encodedAbi = data.slice(DATA_URL_PREFIX.length);
    return encodedAbi;
}

export const decodeResolveBytesToString = (data: BytesLike): string => {
    return new TextDecoder().decode(Uint8Array.from(getBytes(data)));
}