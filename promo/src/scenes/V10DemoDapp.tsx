import { V10DemoCategory } from "./V10DemoCategory";
import { t } from "../tokens";

const codeLines = [
  { text: "// tests/e2e/mint-flow.spec.ts" },
  { text: 'import { test, expect } from "@playwright/test";' },
  { text: 'import { kiwaDapp } from "@kiwa-test/play";' },
  { text: "" },
  { text: 'test.describe("MintFlow", () => {' },
  { text: "  const it = test.extend(kiwaDapp);" },
  { text: "" },
  { text: '  it("shows connected address", async ({ page, alice }) => {' },
  { text: '    await page.goto("/");' },
  { text: "    await alice.connect();" },
  { text: '    await expect(page.getByTestId("addr")).toHaveText(alice.short);' },
  { text: "  });" },
  { text: '  it("balance becomes 1 after mint", async ({ page, alice }) => {' },
  { text: '    await page.getByTestId("mint").click();' },
  { text: '    await expect(page.getByTestId("balance")).toHaveText("1");' },
  { text: "  });" },
  { text: '  it("reverts when paused", async ({ page, alice, contract }) => {' },
  { text: "    await contract.pause();" },
  { text: '    await page.getByTestId("mint").click();' },
  { text: '    await expect(page.getByText(/paused/i)).toBeVisible();' },
  { text: "  });" },
  { text: "});" },
];

export const V10DemoDapp: React.FC = () => (
  <V10DemoCategory
    eyebrow={t().v10DemoDappEyebrow}
    headline={t().v10DemoDappHeadline}
    designCmd={t().v10DemoDappDesignCmd}
    designLog={t().v10DemoDappDesignLog}
    genCmd={t().v10DemoDappGenCmd}
    genLog={t().v10DemoDappGenLog}
    runCmd={t().v10DemoDappRunCmd}
    runOk1={t().v10DemoDappRunOk1}
    runOk2={t().v10DemoDappRunOk2}
    runOk3={t().v10DemoDappRunOk3}
    runPass={t().v10DemoDappRunPass}
    reviewCmd={t().v10DemoDappReviewCmd}
    reviewMid={t().v10DemoDappReviewMid}
    patchCmd={t().v10DemoDappPatchCmd}
    patchLog={t().v10DemoDappPatchLog}
    coverageCmd={t().v10DemoDappCoverageCmd}
    coverageLog={t().v10DemoDappCoverageLog}
    reviewFinal={t().v10DemoDappReviewFinal}
    codeTitle="tests/e2e/mint-flow.spec.ts"
    codeLanguage="ts"
    codeLines={codeLines}
  />
);
