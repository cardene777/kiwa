import { Sequence } from "remotion";
import { Background } from "../components/Background";
import { SectionTitle } from "../components/SectionTitle";
import { Terminal, TerminalLine } from "../components/Terminal";
import { CodeBlock } from "../components/CodeBlock";
import { tokens } from "../tokens";

const claudeLines: TerminalLine[] = [
  { prompt: "$", content: "claude", delayFrames: 0, typeSpeed: 2 },
  { content: "Welcome to Claude Code v2.1.155", delayFrames: 28, color: tokens.color.textMuted, typeSpeed: 3 },
  { content: "Skills loaded: kiwa-design, kiwa-forge, kiwa-hardhat, ...", delayFrames: 50, color: tokens.color.textMuted, typeSpeed: 3 },
  { content: "", delayFrames: 80, typeSpeed: 3 },
  { prompt: ">", content: "/kiwa-design --layer contract --module token-gating", delayFrames: 90, typeSpeed: 1.5 },
  { content: "[Step 1] Reading contracts/GateNFT.sol ...", delayFrames: 150, color: tokens.color.accent, typeSpeed: 3 },
  { content: "[Step 2] Scoring 5 risk axes ...", delayFrames: 170, color: tokens.color.accent, typeSpeed: 3 },
  { content: "[Step 3] Selecting 11 viewpoints ...", delayFrames: 190, color: tokens.color.accent, typeSpeed: 3 },
  { content: "[Step 4] Generating 26 test cases ...", delayFrames: 210, color: tokens.color.accent, typeSpeed: 3 },
  { content: "✓ tests/spec/contract/test-spec-token-gating.md", delayFrames: 240, color: tokens.color.primary, bold: true, typeSpeed: 2 },
];

const specLines = [
  { text: "# test-spec-token-gating.md" },
  { text: "" },
  { text: "## Target feature" },
  { text: "GateNFT (ERC721 minimal) + GatedContent" },
  { text: "" },
  { text: "## Test cases (26 / 11 axes)" },
  { text: "### TC-001 mint happy path (high)" },
  { text: "| level | input | expected |" },
  { text: "| unit  | (n/a) | ownerOf[1]==alice |" },
  { text: "" },
  { text: "### TC-013 expiry boundary (high)" },
  { text: "| level | input | expected |" },
  { text: "| unit  | ttl=1, warp(+2) | hasAccess==false |" },
];

export const DemoSpec: React.FC = () => {
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
            eyebrow="Demo · Layer 1"
            headline="Run /kiwa-design — and a spec is born."
          />
        </Sequence>
        <Sequence from={30}>
          <div
            style={{
              flex: 1,
              display: "flex",
              gap: tokens.spacing.lg,
              alignItems: "stretch",
            }}
          >
            <div style={{ flex: 1, display: "flex" }}>
              <Terminal
                title="~/dapps/token-gating — claude"
                lines={claudeLines}
                width="100%"
                height="100%"
                fontSize={22}
              />
            </div>
            <Sequence from={250}>
              <div style={{ flex: 1, display: "flex" }}>
                <CodeBlock
                  title="tests/spec/contract/test-spec-token-gating.md"
                  language="markdown"
                  lines={specLines}
                  width="100%"
                  height="100%"
                  fontSize={20}
                  lineRevealSpeed={4}
                />
              </div>
            </Sequence>
          </div>
        </Sequence>
      </div>
    </Background>
  );
};
