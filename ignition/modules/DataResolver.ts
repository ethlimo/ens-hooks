import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("TestResolvers", (m) => {
  const dataResolver = m.contract("DataResolver");
  const multiParamResolver = m.contract("MultiParamResolver");
  
  return { dataResolver, multiParamResolver };
});