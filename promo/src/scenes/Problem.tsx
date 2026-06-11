import { SceneLayout } from "../components/SceneLayout";
import { SplitScreen } from "../components/SplitScreen";
import { CodeBlock } from "../components/CodeBlock";
import { t } from "../tokens";

const foundryLines = [
  { text: "// Foundry test" },
  { text: "import { Test } from \"forge-std/Test.sol\";" },
  { text: "" },
  { text: "contract TokenGatingTest is Test {" },
  { text: "    function setUp() public {", indent: 0 },
  { text: "        nft = new GateNFT();", indent: 0 },
  { text: "    }" },
  { text: "    function test_Mint_HappyPath() public {", indent: 0 },
  { text: "        vm.prank(alice);", indent: 0 },
  { text: "        uint256 id = nft.mint();", indent: 0 },
  { text: "        assertEq(id, 1);", indent: 0 },
  { text: "    }" },
  { text: "}" },
];

const hardhatLines = [
  { text: "// Hardhat test" },
  { text: "import { expect } from \"chai\";" },
  { text: "import { ethers } from \"hardhat\";" },
  { text: "" },
  { text: "describe(\"GateNFT\", () => {" },
  { text: "  beforeEach(async () => {", indent: 0 },
  { text: "    nft = await deploy();", indent: 0 },
  { text: "  });" },
  { text: "  it(\"mints to alice\", async () => {", indent: 0 },
  { text: "    const tx = await nft.mint();", indent: 0 },
  { text: "    expect(tx).to.emit(\"Transfer\");", indent: 0 },
  { text: "  });" },
  { text: "});" },
];

const playwrightLines = [
  { text: "// Playwright e2e" },
  { text: "import { test, expect } from \"@playwright/test\";" },
  { text: "" },
  { text: "test(\"mint happy path\", async ({ page }) => {" },
  { text: "  await page.goto(\"/\");", indent: 0 },
  { text: "  await connect(page, alice);", indent: 0 },
  { text: "  await page.getByTestId(", indent: 0 },
  { text: "    \"mint-button\"", indent: 0 },
  { text: "  ).click();" },
  { text: "  await expect(", indent: 0 },
  { text: "    page.getByTestId(\"balance\")", indent: 0 },
  { text: "  ).toHaveText(\"1\");" },
  { text: "});" },
];

export const Problem: React.FC = () => {
  return (
    <SceneLayout
      eyebrow={t().eyebrowProblem}
      headline={t().headlineProblem}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
        }}
      >
        <SplitScreen
          gap={28}
          panels={[
            {
              label: "Foundry",
              badge: ".t.sol",
              accent: "#FF8A65",
              content: (
                <CodeBlock
                  title="test/TokenGating.t.sol"
                  language="solidity"
                  lines={foundryLines}
                  width="100%"
                  height="100%"
                  fontSize={20}
                  startFrame={15}
                  lineRevealSpeed={3}
                />
              ),
            },
            {
              label: "Hardhat",
              badge: ".test.ts",
              accent: "#FFCA28",
              content: (
                <CodeBlock
                  title="test/GateNFT.test.ts"
                  language="typescript"
                  lines={hardhatLines}
                  width="100%"
                  height="100%"
                  fontSize={20}
                  startFrame={15}
                  lineRevealSpeed={3}
                />
              ),
            },
            {
              label: "Playwright",
              badge: ".spec.ts",
              accent: "#42A5F5",
              content: (
                <CodeBlock
                  title="tests/mint.spec.ts"
                  language="typescript"
                  lines={playwrightLines}
                  width="100%"
                  height="100%"
                  fontSize={20}
                  startFrame={15}
                  lineRevealSpeed={3}
                />
              ),
            },
          ]}
        />
      </div>
    </SceneLayout>
  );
};
