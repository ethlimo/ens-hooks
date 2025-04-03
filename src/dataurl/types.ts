
export interface DataUriT {
    _tag: "DataUri";
}

export type DataUriValueT = string;

export interface DataUrlT {
    _tag: "DataUrl";
}

export type DataUrlValueT = {
    node: string;
    key: string;
    resolver: string;
    coinType: number;
};

export type DataUrlTypes = DataUriT | DataUrlT;

export type DataUrlTags = (DataUrlTypes)["_tag"];
export type DataUrlTypeMap = {
    "DataUri": DataUriT;
    "DataUrl": DataUrlT;
};
export const DataUrlTagTypeMap:{[T in DataUrlTags]: DataUrlTypeMap[T]} = {
    DataUri: { _tag: "DataUri" },
    DataUrl: { _tag: "DataUrl" },
}

export type DataUrlHookRetval<T> = T & {
    value: T extends DataUriT ? DataUriValueT : T extends DataUrlT ? DataUrlValueT : never;
}

export type TaggedDataUrlHookRetval = DataUrlHookRetval<DataUriT> | DataUrlHookRetval<DataUrlT>;

