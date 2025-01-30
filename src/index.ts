import { BigNumberish, BytesLike, ethers, getBytes, namehash } from "ethers";
import { DataHookAbi, DATA_URI_PREFIX, DATA_URL_PREFIX } from "./constants";

export const HookContractInterface = new ethers.Interface(DataHookAbi);

export const encodeDataUrlAbi = (name: string, address: string, coinType: BigNumberish): string => {
    const reversedName = name.split(".").reverse().join(".");
    return HookContractInterface.encodeFunctionData("hook", [namehash(name), reversedName+":dataURL", address, coinType]);
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

export const decodeDataHookContentHash = (data: Uint8Array): DecodedDataHook | null => {
    const dataUri = tryDecodeDataUri(data);
    if (dataUri) {
        return {
            type: "DataUriHook",
            data: dataUri,
        }
    }

    const dataUrl = tryDecodeDataUrl(data);
    if (dataUrl) {
        const decoded = HookContractInterface.decodeFunctionData("hook", dataUrl);
        return {
            type: "DataUrlHook",
            data: {
                node: decoded[0],
                key: decoded[1],
                resolver: decoded[2],
                coinType: decoded[3],
            },
        }
    }

    return null;
}
export type DecodedDataHook = {
    type: "DataUriHook";
    data: string;
} | {
    type: "DataUrlHook";
    data: {
        node: string;
        key: string;
        resolver: string;
        coinType: BigNumberish;
    };
};
