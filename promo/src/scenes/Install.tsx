import { Sequence } from "remotion";
import { SceneLayout } from "../components/SceneLayout";
import { Terminal, TerminalLine } from "../components/Terminal";
import { tokens } from "../tokens";

const installRun: TerminalLine[] = [
  { prompt: "$", content: "pnpm dlx @kiwa-test/cli init", delayFrames: 0, typeSpeed: 1.6 },
  { content: "", delayFrames: 40, typeSpeed: 1 },
  { content: "-> detected: pnpm workspace, Foundry, Hardhat", delayFrames: 50, color: tokens.color.textMuted, typeSpeed: 3 },
  { content: "-> add tests/prepare-env.ts", delayFrames: 75, color: tokens.color.textMuted, typeSpeed: 3 },
  { content: "-> add tests/global-setup.ts", delayFrames: 92, color: tokens.color.textMuted, typeSpeed: 3 },
  { content: "-> add tests/fixture.ts", delayFrames: 109, color: tokens.color.textMuted, typeSpeed: 3 },
  { content: "-> add playwright.config.ts", delayFrames: 126, color: tokens.color.textMuted, typeSpeed: 3 },
  { content: "kiwa scaffold complete.", delayFrames: 150, color: tokens.color.primary, bold: true, typeSpeed: 2 },
  { content: "", delayFrames: 180, typeSpeed: 1 },
  { prompt: "$", content: "claude", delayFrames: 190, typeSpeed: 1.6 },
  { content: "> /kiwa-test --example token-gating", delayFrames: 220, color: tokens.color.accent, typeSpeed: 1.5 },
];

export const Install: React.FC = () => {
  return (
    <SceneLayout
      eyebrow="Get Started"
      headline="One command. Then let Claude do the rest."
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Terminal
          title="~/your-dapp"
          lines={installRun}
          width="100%"
          height="100%"
          fontSize={26}
        />
      </div>
    </SceneLayout>
  );
};
