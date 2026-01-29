import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("MultiParamResolverModule", (m) => {
  const multiParamResolver = m.contract("MultiParamResolver");
  return { multiParamResolver };
});
