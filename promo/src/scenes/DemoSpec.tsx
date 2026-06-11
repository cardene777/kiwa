import { SceneLayout } from "../components/SceneLayout";
import { SplitScreen } from "../components/SplitScreen";
import { Terminal, TerminalLine } from "../components/Terminal";
import { tokens, t } from "../tokens";

const contractLines: TerminalLine[] = [
  { prompt: "$", content: "claude", delayFrames: 0, typeSpeed: 2 },
  {
    content: "Welcome to Claude Code v2.1.155",
    delayFrames: 25,
    color: tokens.color.textMuted,
    typeSpeed: 3,
  },
  {
    content: "Skills: kiwa-design, kiwa-forge, kiwa-hardhat",
    delayFrames: 50,
    color: tokens.color.textMuted,
    typeSpeed: 3,
  },
  { content: "", delayFrames: 80, typeSpeed: 3 },
  {
    prompt: ">",
    content: "/kiwa-design contract token-gating",
    delayFrames: 90,
    typeSpeed: 1.4,
  },
  {
    content: "Step 1 — read contracts/GateNFT.sol",
    delayFrames: 170,
    color: tokens.color.accent,
    typeSpeed: 3,
  },
  {
    content: "Step 2 — score 5 risk axes",
    delayFrames: 195,
    color: tokens.color.accent,
    typeSpeed: 3,
  },
  {
    content: "Step 3 — pick from 11 viewpoints",
    delayFrames: 220,
    color: tokens.color.accent,
    typeSpeed: 3,
  },
  {
    content: "Step 4 — generate 26 contract test cases",
    delayFrames: 245,
    color: tokens.color.accent,
    typeSpeed: 3,
  },
  {
    content: "wrote tests/spec/contract/test-spec-token-gating.md",
    delayFrames: 255,
    color: tokens.color.primary,
    bold: true,
    typeSpeed: 2,
  },
];

const e2eLines: TerminalLine[] = [
  { prompt: "$", content: "claude", delayFrames: 0, typeSpeed: 2 },
  {
    content: "Welcome to Claude Code v2.1.155",
    delayFrames: 25,
    color: tokens.color.textMuted,
    typeSpeed: 3,
  },
  {
    content: "Skills: kiwa-design, kiwa-play",
    delayFrames: 50,
    color: tokens.color.textMuted,
    typeSpeed: 3,
  },
  { content: "", delayFrames: 80, typeSpeed: 3 },
  {
    prompt: ">",
    content: "/kiwa-design e2e token-gating",
    delayFrames: 90,
    typeSpeed: 1.4,
  },
  {
    content: "Step 1 — read app/page.tsx + viem hooks",
    delayFrames: 170,
    color: tokens.color.accent,
    typeSpeed: 3,
  },
  {
    content: "Step 2 — score 5 UX risk axes",
    delayFrames: 195,
    color: tokens.color.accent,
    typeSpeed: 3,
  },
  {
    content: "Step 3 — pick from 11 viewpoints",
    delayFrames: 220,
    color: tokens.color.accent,
    typeSpeed: 3,
  },
  {
    content: "Step 4 — generate 14 e2e test cases",
    delayFrames: 245,
    color: tokens.color.accent,
    typeSpeed: 3,
  },
  {
    content: "wrote tests/spec/e2e/test-spec-token-gating.md",
    delayFrames: 255,
    color: tokens.color.primary,
    bold: true,
    typeSpeed: 2,
  },
];

export const DemoSpec: React.FC = () => {
  return (
    <SceneLayout
      eyebrow={t().eyebrowDemoSpec}
      headline={t().headlineDemoSpec}
    >
      <SplitScreen
        gap={32}
        panels={[
            {
              label: "Contract test spec",
              badge: "forge / hardhat",
              accent: "#FF8A65",
              content: (
                <Terminal
                  title="~/kiwa — claude"
                  lines={contractLines}
                  width="100%"
                  height="100%"
                  fontSize={22}
                />
              ),
            },
            {
              label: "dApp e2e test spec",
              badge: "playwright",
              accent: "#42A5F5",
              content: (
                <Terminal
                  title="~/kiwa — claude"
                  lines={e2eLines}
                  width="100%"
                  height="100%"
                  fontSize={22}
                />
              ),
            },
        ]}
      />
    </SceneLayout>
  );
};
