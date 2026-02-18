import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("AllParameterPermutationsHookTargetModule", (m) => {
    const allParameterPermutationsHookTarget = m.contract("AllParameterPermutationsHookTarget");
    return { allParameterPermutationsHookTarget };
});
