import { getBytes } from "ethers";
import { DATA_URI_PREFIX, DATA_URL_PREFIX } from "./constants.js";
import { tryDecodeDataUri, tryDecodeDataUrl, HookContractInterface } from "./encoding.js";
import { DataUrlTypes, DataUrlHookRetval, DataUriT, DataUrlT, DataUrlValueT, DataUrlTags, DataUrlTagTypeMap, DataUrlTypeMap } from "./types.js";


export class DataUrlContentHashEncoder<T extends DataUrlTypes> {
    private constructor(private type: T, private data: DataUrlHookRetval<T>) {
    }

    public get Type() {
        return this.type;
    }
    public get Data() {
        return this.data;
    }

    static create(type: DataUrlTags, data: DataUrlHookRetval<DataUrlTypeMap[typeof type]>) {
        return new DataUrlContentHashEncoder(DataUrlTagTypeMap[type], data);
    }

    static createFromContentHash(data: Uint8Array) {
        const dataUri = tryDecodeDataUri(data);
        if (dataUri) {
            return DataUrlContentHashEncoder.create("DataUri", { _tag: "DataUri", value: dataUri });
        }

        const dataUrl = tryDecodeDataUrl(data);
        if (dataUrl) {
            const decoded = HookContractInterface.decodeFunctionData("hook", dataUrl);
            return DataUrlContentHashEncoder.create("DataUrl", {
                _tag: "DataUrl",
                value: {
                    node: decoded[0],
                    key: decoded[1],
                    resolver: decoded[2],
                    coinType: decoded[3],
                }
            });
        }
        return null;
    }

    toContentHash(): Uint8Array {

        if (this.type._tag === "DataUri") {
            const encoding = new TextEncoder().encode(this.data.value as string);
            return new Uint8Array([...DATA_URI_PREFIX, ...encoding]);

        } else if (this.type._tag === "DataUrl") {

            const value = this.data.value as DataUrlValueT;

            const encoding = getBytes(HookContractInterface.encodeFunctionData("hook", [value.node, value.key, value.resolver, value.coinType]));

            return new Uint8Array([...DATA_URL_PREFIX, ...encoding]);
        }

        const totalityCheck: never = this.type;
        return totalityCheck;
    }
}
