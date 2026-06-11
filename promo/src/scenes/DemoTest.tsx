import { Sequence } from "remotion";
import { Background } from "../components/Background";
import { SectionTitle } from "../components/SectionTitle";
import { SplitScreen } from "../components/SplitScreen";
import { Terminal, TerminalLine } from "../components/Terminal";
import { tokens } from "../tokens";

const passColor = "#4ADE80";

const foundryRun: TerminalLine[] = [
  { prompt: "$", content: "forge test", delayFrames: 0, typeSpeed: 2 },
  { content: "Compiling 2 files with Solc 0.8.24", delayFrames: 25, color: tokens.color.textMuted, typeSpeed: 3 },
  { content: "Ran 27 tests for test/TokenGating.t.sol", delayFrames: 60, typeSpeed: 3 },
  { content: "✓ test_Mint_HappyPath (gas: 89886)", delayFrames: 80, color: passColor, typeSpeed: 2 },
  { content: "✓ test_Mint_SequentialIds (gas: 232703)", delayFrames: 95, color: passColor, typeSpeed: 2 },
  { content: "✓ test_TransferFrom_HappyPath", delayFrames: 110, color: passColor, typeSpeed: 2 },
  { content: "✓ test_HasAccess_TtlOne_StillValid", delayFrames: 125, color: passColor, typeSpeed: 2 },
  { content: "✓ test_Security_GrantorEscape_Blocked", delayFrames: 140, color: passColor, typeSpeed: 2 },
  { content: "...", delayFrames: 155, color: tokens.color.textMuted, typeSpeed: 3 },
  { content: "27 passed, 0 failed", delayFrames: 175, color: passColor, bold: true, typeSpeed: 2 },
];

const hardhatRun: TerminalLine[] = [
  { prompt: "$", content: "npx hardhat test", delayFrames: 0, typeSpeed: 2 },
  { content: "TokenGating", delayFrames: 35, typeSpeed: 3 },
  { content: "  observation 1: happy path", delayFrames: 55, color: tokens.color.textMuted, typeSpeed: 3 },
  { content: "    ✓ TC-001 mint emits Transfer", delayFrames: 75, color: passColor, typeSpeed: 2 },
  { content: "    ✓ TC-002 transferFrom updates owner", delayFrames: 90, color: passColor, typeSpeed: 2 },
  { content: "  observation 3: boundary", delayFrames: 105, color: tokens.color.textMuted, typeSpeed: 3 },
  { content: "    ✓ TC-010 ttl 0 reverts InvalidTtl", delayFrames: 125, color: passColor, typeSpeed: 2 },
  { content: "    ✓ TC-013 expiry +1 returns false", delayFrames: 140, color: passColor, typeSpeed: 2 },
  { content: "...", delayFrames: 155, color: tokens.color.textMuted, typeSpeed: 3 },
  { content: "27 passing (160ms)", delayFrames: 175, color: passColor, bold: true, typeSpeed: 2 },
];

const playwrightRun: TerminalLine[] = [
  { prompt: "$", content: "pnpm test", delayFrames: 0, typeSpeed: 2 },
  { content: "Running 14 tests on chromium", delayFrames: 30, typeSpeed: 3 },
  { content: "  ✓ TC-001 initial state", delayFrames: 60, color: passColor, typeSpeed: 2 },
  { content: "  ✓ TC-002 mint then balance==1", delayFrames: 75, color: passColor, typeSpeed: 2 },
  { content: "  ✓ TC-009 5-state transition", delayFrames: 90, color: passColor, typeSpeed: 2 },
  { content: "  ✓ TC-015 DOM tampering blocked", delayFrames: 105, color: passColor, typeSpeed: 2 },
  { content: "  ✓ TC-016 NotGated via RPC", delayFrames: 120, color: passColor, typeSpeed: 2 },
  { content: "...", delayFrames: 135, color: tokens.color.textMuted, typeSpeed: 3 },
  { content: "14 passed (24.5s)", delayFrames: 155, color: passColor, bold: true, typeSpeed: 2 },
  { content: "round 4/4 → flaky: 0", delayFrames: 175, color: passColor, bold: true, typeSpeed: 2 },
];

export const DemoTest: React.FC = () => {
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
            eyebrow="Demo · Layer 2"
            headline="Three runners, all green."
          />
        </Sequence>
        <Sequence from={30}>
          <div style={{ flex: 1, display: "flex" }}>
            <SplitScreen
              gap={24}
              panels={[
                {
                  label: "Foundry",
                  badge: "27/27",
                  accent: "#FF8A65",
                  content: (
                    <Terminal
                      title="forge test"
                      lines={foundryRun}
                      width="100%"
                      height="100%"
                      fontSize={16}
                    />
                  ),
                },
                {
                  label: "Hardhat",
                  badge: "27/27",
                  accent: "#FFCA28",
                  content: (
                    <Terminal
                      title="npx hardhat test"
                      lines={hardhatRun}
                      width="100%"
                      height="100%"
                      fontSize={16}
                    />
                  ),
                },
                {
                  label: "Playwright",
                  badge: "14/14 × 4r",
                  accent: "#42A5F5",
                  content: (
                    <Terminal
                      title="pnpm test"
                      lines={playwrightRun}
                      width="100%"
                      height="100%"
                      fontSize={16}
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
