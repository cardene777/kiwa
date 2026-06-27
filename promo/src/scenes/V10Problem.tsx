import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { SceneLayout } from "../components/SceneLayout";
import { CodeBlock } from "../components/CodeBlock";
import { tokens, t } from "../tokens";

const problemCode = [
  { text: "// test/TokenGate.t.sol" },
  { text: "contract TokenGateTest is Test {" },
  { text: "  function testMintHappyPath() public {" },
  { text: "    vm.prank(alice);" },
  { text: "    nft.mint();" },
  { text: "    assertEq(nft.balanceOf(alice), 1);" },
  { text: "  }" },
  { text: "" },
  { text: "  // ↑ 正常系だけ書いて 境界値 / 権限 / 並行 を忘れる" },
  { text: "  // ↓ どこから手をつければ?" },
  { text: "" },
  { text: "  function testBoundaryValueMax() public {" },
  { text: "    // ???" },
  { text: "  }" },
  { text: "  function testRevertOnReentrancy() public {" },
  { text: "    // ???" },
  { text: "  }" },
  { text: "  function testAccessControl() public {" },
  { text: "    // ???" },
  { text: "  }" },
  { text: "}" },
];

export const V10Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const subAEnter = spring({
    frame: frame - 110,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 22,
    config: { damping: 16, mass: 1, stiffness: 100 },
  });
  const subAOpacity = interpolate(subAEnter, [0, 1], [0, 1]);
  const subAY = interpolate(subAEnter, [0, 1], [14, 0]);

  const subBEnter = spring({
    frame: frame - 140,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 22,
    config: { damping: 16, mass: 1, stiffness: 100 },
  });
  const subBOpacity = interpolate(subBEnter, [0, 1], [0, 1]);
  const subBY = interpolate(subBEnter, [0, 1], [14, 0]);

  return (
    <SceneLayout
      eyebrow={t().v10ProblemEyebrow}
      headline={t().v10ProblemHeadline}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          gap: 40,
          alignItems: "stretch",
        }}
      >
        <div style={{ flex: 1.4, display: "flex", minHeight: 0 }}>
          <CodeBlock
            title="test/TokenGate.t.sol"
            language="sol"
            lines={problemCode}
            width="100%"
            height="100%"
            fontSize={20}
            startFrame={10}
            lineRevealSpeed={5}
          />
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 28,
            paddingLeft: 12,
          }}
        >
          <div
            style={{
              fontFamily: tokens.font.sans,
              fontSize: 36,
              fontWeight: 600,
              color: tokens.color.white,
              letterSpacing: -0.5,
              opacity: subAOpacity,
              transform: `translateY(${subAY}px)`,
              lineHeight: 1.4,
            }}
          >
            {t().v10ProblemSubA}
          </div>
          <div
            style={{
              fontFamily: tokens.font.sans,
              fontSize: 36,
              fontWeight: 600,
              color: tokens.color.accentContract,
              letterSpacing: -0.5,
              opacity: subBOpacity,
              transform: `translateY(${subBY}px)`,
              lineHeight: 1.4,
            }}
          >
            {t().v10ProblemSubB}
          </div>
        </div>
      </div>
    </SceneLayout>
  );
};
