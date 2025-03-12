This library implements the DataURL and DataURI specification found in (https://github.com/nxt3d/ENSIP-ideas/blob/main/ENSIPS/ensip-TBD-2.md)

# purpose

The DataURL specification allows ENS contracts to programmatically determine their own content without deferring to a third party back-end. Such contracts encode a web2 URL to redirect to (DataURL) or a proxy contract (DataURI), potentially on a different chain, that serves as a second stage to determine the content of an ENS name. DataURI contracts return raw datauri encoded data directly to the ENS gateway and implement custom cache control logic. This allows for the backend contract to be its own content storage provider.