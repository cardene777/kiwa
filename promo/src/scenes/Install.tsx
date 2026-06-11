import { Sequence } from "remotion";
import { Background } from "../components/Background";
import { SectionTitle } from "../components/SectionTitle";
import { Terminal, TerminalLine } from "../components/Terminal";
import { tokens } from "../tokens";

const installRun: TerminalLine[] = [
  { prompt: "$", content: "pnpm dlx @kiwa-test/cli init", delayFrames: 0, typeSpeed: 1.6 },
  { content: "", delayFrames: 40, typeSpeed: 1 },
  { content: "→ Detected: pnpm workspace, Foundry, Hardhat", delayFrames: 50, color: tokens.color.textMuted, typeSpeed: 3 },
  { content: "→ Adding tests/prepare-env.ts", delayFrames: 75, color: tokens.color.textMuted, typeSpeed: 3 },
  { content: "→ Adding tests/global-setup.ts", delayFrames: 95, color: tokens.color.textMuted, typeSpeed: 3 },
  { content: "→ Adding tests/fixture.ts", delayFrames: 115, color: tokens.color.textMuted, typeSpeed: 3 },
  { content: "→ Adding playwright.config.ts", delayFrames: 135, color: tokens.color.textMuted, typeSpeed: 3 },
  { content: "✓ kiwa scaffold complete.", delayFrames: 160, color: tokens.color.primary, bold: true, typeSpeed: 2 },
  { content: "", delayFrames: 190, typeSpeed: 1 },
  { prompt: "$", content: "claude", delayFrames: 200, typeSpeed: 1.6 },
  { content: "> /kiwa-test --example token-gating", delayFrames: 230, color: tokens.color.accent, typeSpeed: 1.5 },
];

export const Install: React.FC = () => {
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
            eyebrow="Get Started"
            headline="One command. Then let Claude do the rest."
          />
        </Sequence>
        <Sequence from={20}>
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Terminal
              title="~/your-dapp — terminal"
              lines={installRun}
              width={1500}
              height={620}
              fontSize={26}
            />
          </div>
        </Sequence>
      </div>
    </Background>
  );
};
