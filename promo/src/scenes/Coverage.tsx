import { Sequence } from "remotion";
import { Background } from "../components/Background";
import { SectionTitle } from "../components/SectionTitle";
import { CoverageBar } from "../components/CoverageBar";
import { Terminal, TerminalLine } from "../components/Terminal";
import { tokens } from "../tokens";

const coverageRun: TerminalLine[] = [
  { prompt: "$", content: "forge coverage --report summary", delayFrames: 0, typeSpeed: 1.5 },
  { content: "", delayFrames: 40, typeSpeed: 1 },
  { content: "| File              | % Lines  | % Stmts  | % Branches | % Funcs |", delayFrames: 50, color: tokens.color.textMuted, typeSpeed: 4 },
  { content: "| GateNFT.sol       | 100%     | 100%     | 100%       | 100%    |", delayFrames: 75, color: "#4ADE80", typeSpeed: 4, bold: true },
  { content: "| GatedContent.sol  | 100%     | 100%     | 100%       | 100%    |", delayFrames: 100, color: "#4ADE80", typeSpeed: 4, bold: true },
];

export const Coverage: React.FC = () => {
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
            eyebrow="Coverage Gate"
            headline="4 metrics, 100% — auto-enforced."
          />
        </Sequence>
        <Sequence from={20}>
          <div
            style={{
              flex: 1,
              display: "flex",
              gap: tokens.spacing.lg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 880, display: "flex" }}>
              <Terminal
                title="forge coverage"
                lines={coverageRun}
                width="100%"
                height={400}
                fontSize={18}
              />
            </div>
            <Sequence from={40}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch",
                }}
              >
                <CoverageBar
                  width={680}
                  duration={32}
                  fontSize={28}
                  metrics={[
                    { label: "Lines", target: 100, delayFrames: 0 },
                    { label: "Statements", target: 100, delayFrames: 8 },
                    { label: "Branches", target: 100, delayFrames: 16 },
                    { label: "Functions", target: 100, delayFrames: 24 },
                  ]}
                />
              </div>
            </Sequence>
          </div>
        </Sequence>
      </div>
    </Background>
  );
};
