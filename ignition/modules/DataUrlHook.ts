import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("DataUrlHook", (m) => {  
  const dataUrlHook = m.contract("DataUrlHook");
  return { dataUrlHook };
});