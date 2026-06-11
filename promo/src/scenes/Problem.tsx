import { Sequence } from "remotion";
import { Background } from "../components/Background";
import { SectionTitle } from "../components/SectionTitle";
import { SplitScreen } from "../components/SplitScreen";
import { CodeBlock } from "../components/CodeBlock";
import { tokens } from "../tokens";

const foundryLines = [
  { text: "// Foundry Solidity test" },
  { text: "contract TokenGatingTest is Test {" },
  { text: "  function setUp() public {", indent: 0 },
  { text: "    nft = new GateNFT();", indent: 1 },
  { text: "  }", indent: 0 },
  { text: "  function test_Mint_HappyPath() public {", indent: 0 },
  { text: "    vm.prank(alice);", indent: 1 },
  { text: "    uint256 id = nft.mint();", indent: 1 },
  { text: "    assertEq(id, 1);", indent: 1 },
  { text: "  }", indent: 0 },
  { text: "}" },
];

const hardhatLines = [
  { text: "// Hardhat TypeScript test" },
  { text: "describe('GateNFT', () => {" },
  { text: "  beforeEach(async () => {", indent: 0 },
  { text: "    nft = await deploy();", indent: 1 },
  { text: "  });", indent: 0 },
  { text: "  it('mints to alice', async () => {", indent: 0 },
  { text: "    const tx = await nft.mint();", indent: 1 },
  { text: "    const id = await tx.wait();", indent: 1 },
  { text: "    expect(id).to.equal(1);", indent: 1 },
  { text: "  });", indent: 0 },
  { text: "});" },
];

const playwrightLines = [
  { text: "// Playwright e2e test" },
  { text: "test('mint happy path', async ({ page }) => {" },
  { text: "  await page.goto('/');", indent: 0 },
  { text: "  await connect(page, alice);", indent: 0 },
  { text: "  await page.getByTestId(", indent: 0 },
  { text: "    'mint-button'", indent: 1 },
  { text: "  ).click();", indent: 0 },
  { text: "  await expect(", indent: 0 },
  { text: "    page.getByTestId('balance')", indent: 1 },
  { text: "  ).toHaveText('1');", indent: 0 },
  { text: "});" },
];

export const Problem: React.FC = () => {
  return (
    <Background>
      <div
        style={{
          width: "100%",
          height: "100%",
          padding: tokens.spacing.lg,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: tokens.spacing.md,
        }}
      >
        <Sequence from={0}>
          <SectionTitle
            eyebrow="The Problem"
            headline="Three frameworks, three rewrites of the same spec."
          />
        </Sequence>
        <Sequence from={30}>
          <div style={{ flex: 1, display: "flex" }}>
            <SplitScreen
              panels={[
                {
                  label: "Foundry",
                  badge: "*.t.sol",
                  accent: "#FF8A65",
                  content: (
                    <CodeBlock
                      title="test/TokenGating.t.sol"
                      language="solidity"
                      lines={foundryLines}
                      width="100%"
                      height="100%"
                      fontSize={20}
                      lineRevealSpeed={3}
                    />
                  ),
                },
                {
                  label: "Hardhat",
                  badge: "*.test.ts",
                  accent: "#FFCA28",
                  content: (
                    <CodeBlock
                      title="test/GateNFT.test.ts"
                      language="typescript"
                      lines={hardhatLines}
                      width="100%"
                      height="100%"
                      fontSize={20}
                      lineRevealSpeed={3}
                    />
                  ),
                },
                {
                  label: "Playwright",
                  badge: "*.spec.ts",
                  accent: "#42A5F5",
                  content: (
                    <CodeBlock
                      title="tests/mint.spec.ts"
                      language="typescript"
                      lines={playwrightLines}
                      width="100%"
                      height="100%"
                      fontSize={20}
                      lineRevealSpeed={3}
                    />
                  ),
                },
              ]}
            />
          </div>
        </Sequence>
      </div>
    </Background>
  );
};
