import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("ZeroParameterHookTargetModule", (m) => {
    const zeroParameterHookTarget = m.contract("ZeroParameterHookTarget");
    
    return { zeroParameterHookTarget };
});
