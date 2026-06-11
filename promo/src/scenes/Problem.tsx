import { useCurrentFrame, interpolate } from "remotion";
import { SceneLayout } from "../components/SceneLayout";
import { CodeBlock } from "../components/CodeBlock";
import { tokens, t } from "../tokens";

const codeLines = [
  { text: "// test/TokenGating.t.sol" },
  { text: "contract TokenGatingTest is Test {" },
  { text: "    function setUp() public {", indent: 0 },
  { text: "        nft = new GateNFT();", indent: 0 },
  { text: "        gated = new GatedContent(nft);", indent: 0 },
  { text: "    }" },
  { text: "    function test_Mint_HappyPath() public { ... }", indent: 0 },
  { text: "    function test_Mint_OnlyOwner() public { ... }", indent: 0 },
  { text: "    function test_TransferFrom() public { ... }", indent: 0 },
  { text: "    function test_HasAccess_TtlOne() public { ... }", indent: 0 },
  { text: "    function test_HasAccess_Expired() public { ... }", indent: 0 },
  { text: "    function test_GetSecret_Revert() public { ... }", indent: 0 },
  { text: "    function test_Security_GrantorEscape() public { ... }", indent: 0 },
  { text: "}" },
  { text: "" },
  { text: "// tests/mint.spec.ts" },
  { text: "test(\"mint happy path\", async ({ page }) => {" },
  { text: "  await page.goto(\"/\");" },
  { text: "  await connect(page, alice);" },
  { text: "  await page.getByTestId(\"mint-button\").click();" },
  { text: "  await expect(page.getByTestId(\"balance\")).toHaveText(\"1\");" },
  { text: "});" },
  { text: "test(\"gated access\", async ({ page }) => { ... });" },
  { text: "test(\"transfer flow\", async ({ page }) => { ... });" },
  { text: "test(\"expired access\", async ({ page }) => { ... });" },
  { text: "test(\"security boundary\", async ({ page }) => { ... });" },
];

export const Problem: React.FC = () => {
  const frame = useCurrentFrame();
  // 大量のコードがスクロールしながら表示される演出
  const scrollOffset = interpolate(frame, [60, 200], [0, -300], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneLayout
      eyebrow={t().eyebrowProblem}
      headline={t().headlineProblem}
    >
      <div
        style={{
          width: 1280,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: tokens.spacing.md,
        }}
      >
        <div style={{ width: "100%", height: "100%", overflow: "hidden", position: "relative" }}>
          <div
            style={{
              transform: `translateY(${scrollOffset}px)`,
              transition: "none",
            }}
          >
            <CodeBlock
              title="test/*.t.sol  +  tests/*.spec.ts"
              language="contract + e2e"
              lines={codeLines}
              width="100%"
              height={1200}
              fontSize={22}
              startFrame={15}
              lineRevealSpeed={3}
            />
          </div>
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 160,
              background: `linear-gradient(180deg, transparent 0%, ${tokens.color.bg} 100%)`,
              pointerEvents: "none",
            }}
          />
        </div>
      </div>
    </SceneLayout>
  );
};
