import { SceneLayout } from "../components/SceneLayout";
import { SplitScreen } from "../components/SplitScreen";
import { Terminal, TerminalLine } from "../components/Terminal";
import { CodeBlock, CodeLine } from "../components/CodeBlock";
import { tokens, t } from "../tokens";

const installRun: TerminalLine[] = [
  { prompt: "$", content: "pnpm dlx @kiwa-test/cli init", delayFrames: 0, typeSpeed: 1.6 },
  { content: "", delayFrames: 38, typeSpeed: 1 },
  {
    content: "-> detected: pnpm workspace, Foundry, Hardhat",
    delayFrames: 48,
    color: tokens.color.textMuted,
    typeSpeed: 3,
  },
  {
    content: "-> add tests/prepare-env.ts",
    delayFrames: 72,
    color: tokens.color.textMuted,
    typeSpeed: 3,
  },
  {
    content: "-> add tests/global-setup.ts",
    delayFrames: 88,
    color: tokens.color.textMuted,
    typeSpeed: 3,
  },
  {
    content: "-> add tests/fixture.ts",
    delayFrames: 104,
    color: tokens.color.textMuted,
    typeSpeed: 3,
  },
  {
    content: "-> add playwright.config.ts",
    delayFrames: 120,
    color: tokens.color.textMuted,
    typeSpeed: 3,
  },
  {
    content: "kiwa scaffold complete.",
    delayFrames: 144,
    color: tokens.color.primary,
    bold: true,
    typeSpeed: 2,
  },
  { content: "", delayFrames: 170, typeSpeed: 1 },
  { prompt: "$", content: "claude", delayFrames: 178, typeSpeed: 1.6 },
  {
    prompt: ">",
    content: "/kiwa-test --example token-gating",
    delayFrames: 210,
    color: tokens.color.accent,
    typeSpeed: 1.4,
  },
  {
    content: "spec + tests generated. PASS.",
    delayFrames: 275,
    color: tokens.color.primary,
    bold: true,
    typeSpeed: 2,
  },
];

const manualLines: CodeLine[] = [
  { text: "// tests/MyMint.spec.ts" },
  { text: 'import { test, expect } from "@playwright/test";' },
  { text: 'import { mintFixture, connect } from "@kiwa-test/core";' },
  { text: "" },
  { text: "const it = test.extend(mintFixture);" },
  { text: "" },
  { text: 'it("mint -> balance == 1", async ({ page, alice }) => {' },
  { text: '  await page.goto("/");' },
  { text: "  await connect(page, alice);" },
  { text: '  await page.getByTestId("mint-button").click();' },
  { text: '  await expect(page.getByTestId("balance")).toHaveText("1");' },
  { text: "});" },
  { text: "// test/MyToken.t.sol" },
  { text: 'import { kiwaHelpers } from "@kiwa-test/forge";' },
  { text: "contract MyTokenTest is Test, kiwaHelpers {" },
  { text: "  function test_Mint_HappyPath() public {" },
  { text: "    vm.prank(alice);" },
  { text: "    nft.mint();" },
  { text: "    assertEq(nft.balanceOf(alice), 1);" },
  { text: "  }" },
  { text: "}" },
];

export const Install: React.FC = () => {
  return (
    <SceneLayout
      eyebrow={t().eyebrowInstall}
      headline={t().headlineInstall}
    >
      <SplitScreen
          gap={32}
          panels={[
            {
              label: t().installLineClaude,
              accent: tokens.color.primary,
              content: (
                <Terminal
                  title="~/your-dapp"
                  lines={installRun}
                  width="100%"
                  height="100%"
                  fontSize={20}
                />
              ),
            },
            {
              label: t().installLineManual,
              accent: tokens.color.accentManual,
              content: (
                <CodeBlock
                  title="tests/MyMint.spec.ts  +  test/MyToken.t.sol"
                  language="ts + sol"
                  lines={manualLines}
                  width="100%"
                  height="100%"
                  fontSize={18}
                  startFrame={40}
                  lineRevealSpeed={6}
                />
              ),
            },
        ]}
      />
    </SceneLayout>
  );
};
