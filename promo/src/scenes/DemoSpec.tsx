import { useCurrentFrame, interpolate } from "remotion";
import { SceneLayout } from "../components/SceneLayout";
import { Terminal, TerminalLine } from "../components/Terminal";
import { CodeBlock } from "../components/CodeBlock";
import { tokens, t } from "../tokens";

const claudeLines: TerminalLine[] = [
  { prompt: "$", content: "claude", delayFrames: 0, typeSpeed: 2 },
  {
    content: "Welcome to Claude Code v2.1.155",
    delayFrames: 25,
    color: tokens.color.textMuted,
    typeSpeed: 3,
  },
  {
    content: "Skills: kiwa-design, kiwa-forge, kiwa-hardhat, kiwa-play",
    delayFrames: 45,
    color: tokens.color.textMuted,
    typeSpeed: 3,
  },
  { content: "", delayFrames: 75, typeSpeed: 3 },
  {
    prompt: ">",
    content: "/kiwa-design --layer contract --module token-gating",
    delayFrames: 85,
    typeSpeed: 1.4,
  },
  {
    content: "Step 1 — read contracts/GateNFT.sol",
    delayFrames: 165,
    color: tokens.color.accent,
    typeSpeed: 3,
  },
  {
    content: "Step 2 — score 5 risk axes",
    delayFrames: 190,
    color: tokens.color.accent,
    typeSpeed: 3,
  },
  {
    content: "Step 3 — pick from 11 viewpoints",
    delayFrames: 215,
    color: tokens.color.accent,
    typeSpeed: 3,
  },
  {
    content: "Step 4 — generate 26 test cases",
    delayFrames: 240,
    color: tokens.color.accent,
    typeSpeed: 3,
  },
  {
    content: "wrote tests/spec/contract/test-spec-token-gating.md",
    delayFrames: 270,
    color: tokens.color.primary,
    bold: true,
    typeSpeed: 2,
  },
];

const specLines = [
  { text: "# test-spec-token-gating.md" },
  { text: "" },
  { text: "## Target feature" },
  { text: "GateNFT (ERC721 minimal) + GatedContent" },
  { text: "" },
  { text: "## Test cases (26 cases, 11 axes)" },
  { text: "" },
  { text: "### TC-001  mint happy path  (high)" },
  { text: "level    : unit" },
  { text: "input    : (none)" },
  { text: "expected : owner == msg.sender" },
  { text: "" },
  { text: "### TC-013  expiry boundary  (high)" },
  { text: "level    : unit" },
  { text: "input    : ttl = 1, warp +2" },
  { text: "expected : hasAccess == false" },
];

export const DemoSpec: React.FC = () => {
  const frame = useCurrentFrame();
  const specOpacity = interpolate(frame, [280, 305], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const specX = interpolate(frame, [280, 305], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneLayout
      eyebrow={t().eyebrowDemoSpec}
      headline={t().headlineDemoSpec}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          gap: 32,
          alignItems: "stretch",
        }}
      >
        <div style={{ flex: 1, display: "flex", minWidth: 0 }}>
          <Terminal
            title="~/dapps/token-gating — claude"
            lines={claudeLines}
            width="100%"
            height="100%"
            fontSize={20}
          />
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            minWidth: 0,
            opacity: specOpacity,
            transform: `translateX(${specX}px)`,
          }}
        >
          <CodeBlock
            title="tests/spec/contract/test-spec-token-gating.md"
            language="markdown"
            lines={specLines}
            width="100%"
            height="100%"
            fontSize={20}
            startFrame={280}
            lineRevealSpeed={4}
          />
        </div>
      </div>
    </SceneLayout>
  );
};
