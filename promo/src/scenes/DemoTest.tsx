import { SceneLayout } from "../components/SceneLayout";
import { SplitScreen } from "../components/SplitScreen";
import { Terminal, TerminalLine } from "../components/Terminal";
import { tokens, t } from "../tokens";

const passColor = "#4ADE80";

const contractRun: TerminalLine[] = [
  { prompt: "$", content: "forge test", delayFrames: 0, typeSpeed: 2 },
  { content: "Compiling 2 files with Solc 0.8.24", delayFrames: 25, color: tokens.color.textMuted, typeSpeed: 3 },
  { content: "Ran 27 tests for test/TokenGating.t.sol", delayFrames: 55, typeSpeed: 3 },
  { content: "OK test_Mint_HappyPath (gas: 89886)", delayFrames: 80, color: passColor, typeSpeed: 2 },
  { content: "OK test_Mint_SequentialIds (gas: 232703)", delayFrames: 95, color: passColor, typeSpeed: 2 },
  { content: "OK test_TransferFrom_HappyPath", delayFrames: 110, color: passColor, typeSpeed: 2 },
  { content: "OK test_HasAccess_TtlOne_StillValid", delayFrames: 125, color: passColor, typeSpeed: 2 },
  { content: "OK test_Security_GrantorEscape_Blocked", delayFrames: 140, color: passColor, typeSpeed: 2 },
  { content: "...", delayFrames: 155, color: tokens.color.textMuted, typeSpeed: 3 },
  { content: "27 passed, 0 failed", delayFrames: 175, color: passColor, bold: true, typeSpeed: 2 },
];

const e2eRun: TerminalLine[] = [
  { prompt: "$", content: "pnpm test", delayFrames: 0, typeSpeed: 2 },
  { content: "Running 14 tests on chromium", delayFrames: 30, typeSpeed: 3 },
  { content: "  OK TC-001 initial state", delayFrames: 60, color: passColor, typeSpeed: 2 },
  { content: "  OK TC-002 mint then balance == 1", delayFrames: 75, color: passColor, typeSpeed: 2 },
  { content: "  OK TC-009 5-state transition", delayFrames: 90, color: passColor, typeSpeed: 2 },
  { content: "  OK TC-015 DOM tampering blocked", delayFrames: 105, color: passColor, typeSpeed: 2 },
  { content: "  OK TC-016 NotGated via RPC", delayFrames: 120, color: passColor, typeSpeed: 2 },
  { content: "...", delayFrames: 135, color: tokens.color.textMuted, typeSpeed: 3 },
  { content: "14 passed (24.5s)", delayFrames: 155, color: passColor, bold: true, typeSpeed: 2 },
  { content: "round 4/4 -> flaky: 0", delayFrames: 175, color: passColor, bold: true, typeSpeed: 2 },
];

export const DemoTest: React.FC = () => {
  return (
    <SceneLayout
      eyebrow={t().eyebrowDemoTest}
      headline={t().headlineDemoTest}
    >
      <div style={{ width: "100%", height: "100%", display: "flex" }}>
        <SplitScreen
          gap={32}
          panels={[
            {
              label: "Contract test",
              badge: "forge / hardhat",
              accent: "#FF8A65",
              content: (
                <Terminal
                  title="forge test"
                  lines={contractRun}
                  width="100%"
                  height="100%"
                  fontSize={20}
                />
              ),
            },
            {
              label: "e2e test",
              badge: "playwright",
              accent: "#42A5F5",
              content: (
                <Terminal
                  title="pnpm test"
                  lines={e2eRun}
                  width="100%"
                  height="100%"
                  fontSize={20}
                />
              ),
            },
          ]}
        />
      </div>
    </SceneLayout>
  );
};
