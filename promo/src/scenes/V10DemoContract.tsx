import { V10DemoCategory } from "./V10DemoCategory";
import { t } from "../tokens";

const codeLines = [
  { text: "// test/TokenGate.t.sol" },
  { text: 'import { Test } from "forge-std/Test.sol";' },
  { text: 'import { kiwaHelpers } from "@kiwa-test/forge";' },
  { text: "" },
  { text: "contract TokenGateTest is Test, kiwaHelpers {" },
  { text: "  function testMintHappyPath() public {" },
  { text: "    vm.prank(alice);" },
  { text: "    nft.mint();" },
  { text: "    assertEq(nft.balanceOf(alice), 1);" },
  { text: "  }" },
  { text: "  function testRevertWhenPaused() public {" },
  { text: "    nft.pause();" },
  { text: "    vm.prank(alice);" },
  { text: "    vm.expectRevert(Paused.selector);" },
  { text: "    nft.mint();" },
  { text: "  }" },
  { text: "  function testBoundaryValueMax() public {" },
  { text: "    nft.setMax(1);" },
  { text: "    vm.prank(alice);" },
  { text: "    nft.mint();" },
  { text: "  }" },
  { text: "}" },
];

export const V10DemoContract: React.FC = () => (
  <V10DemoCategory
    eyebrow={t().v10DemoContractEyebrow}
    headline={t().v10DemoContractHeadline}
    designCmd={t().v10DemoContractDesignCmd}
    designLog={t().v10DemoContractDesignLog}
    genCmd={t().v10DemoContractGenCmd}
    genLog={t().v10DemoContractGenLog}
    runCmd={t().v10DemoContractRunCmd}
    runOk1={t().v10DemoContractRunOk1}
    runOk2={t().v10DemoContractRunOk2}
    runOk3={t().v10DemoContractRunOk3}
    runPass={t().v10DemoContractRunPass}
    reviewCmd={t().v10DemoContractReviewCmd}
    reviewMid={t().v10DemoContractReviewMid}
    patchCmd={t().v10DemoContractPatchCmd}
    patchLog={t().v10DemoContractPatchLog}
    coverageCmd={t().v10DemoContractCoverageCmd}
    coverageLog={t().v10DemoContractCoverageLog}
    reviewFinal={t().v10DemoContractReviewFinal}
    codeTitle="test/TokenGate.t.sol"
    codeLanguage="sol"
    codeLines={codeLines}
  />
);
