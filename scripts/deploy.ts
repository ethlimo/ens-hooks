import hre from "hardhat";
import { encodeDataUriContentHash, encodeDataUrlContentHash } from "../src/dataurl/encoding.js";
import { namehash, Provider } from "ethers";
import { DataUrlHook__factory } from "../types/ethers-contracts/index.js";
import { deployFixture, getResolver, overrideContentHash } from "./deployFixture.js";
import { getBase64Payload } from "./getBase64Payload.js";
async function main() {
    const connection = await hre.network.connect();
    const ethers = connection.ethers;
    const { dataUrlHook } = await deployFixture(connection.ignition);
    const signer = (await ethers.getSigners())[0];
    const contract = DataUrlHook__factory.connect(await dataUrlHook.getAddress(), signer)
    const address = await dataUrlHook.getAddress();
    const dataUrlHookAbi = encodeDataUrlContentHash("vitalik.eth", "eth.vitalik:dataURL", address, BigInt(60));
    const { owner: vitalikOwner, resolver: vitalikResolver } = await getResolver("vitalik.eth", signer.provider as Provider);
    const impersonatedSignerVitalik = await ethers.getImpersonatedSigner(vitalikOwner);
    await overrideContentHash(impersonatedSignerVitalik, vitalikResolver, "vitalik.eth", dataUrlHookAbi);
    await contract.setDataURL(namehash("vitalik.eth"), true, await getBase64Payload())

    const { owner: nickOwner, resolver: nickResolver } = await getResolver("nick.eth", signer.provider as Provider);
    const impersonatedSignerNick = await ethers.getImpersonatedSigner(nickOwner);
    const dataUriHookAbi = encodeDataUriContentHash("https://www.google.com");
    await overrideContentHash(impersonatedSignerNick, nickResolver, "nick.eth", dataUriHookAbi);
}

main().catch(console.error)
