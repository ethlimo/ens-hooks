import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { namehash } from "ethers";


export default buildModule("DataUrlHook", (m) => {  
  const dataUrlHook = m.contract("DataUrlHook");
  const node = namehash("vitalik.eth");
  return { dataUrlHook };
});