import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("DataResolverModule", (m) => {
  const dataResolver = m.contract("DataResolver");
  return { dataResolver };
});