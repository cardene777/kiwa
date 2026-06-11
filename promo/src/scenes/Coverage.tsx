import { useCurrentFrame, interpolate } from "remotion";
import { SceneLayout } from "../components/SceneLayout";
import { CoverageBar } from "../components/CoverageBar";
import { Terminal, TerminalLine } from "../components/Terminal";
import { tokens, t } from "../tokens";

const coverageRun: TerminalLine[] = [
  { prompt: "$", content: "forge coverage --report summary", delayFrames: 0, typeSpeed: 1.5 },
  { content: "", delayFrames: 35, typeSpeed: 1 },
  { content: "| File              | % Lines | % Stmts | % Branches | % Funcs |", delayFrames: 45, color: tokens.color.textMuted, typeSpeed: 4 },
  { content: "| GateNFT.sol       | 100%    | 100%    | 100%       | 100%    |", delayFrames: 75, color: "#4ADE80", typeSpeed: 3, bold: true },
  { content: "| GatedContent.sol  | 100%    | 100%    | 100%       | 100%    |", delayFrames: 100, color: "#4ADE80", typeSpeed: 3, bold: true },
];

export const Coverage: React.FC = () => {
  const frame = useCurrentFrame();
  const barOpacity = interpolate(frame, [45, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const barTy = interpolate(frame, [45, 70], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneLayout
      eyebrow={t().eyebrowCoverage}
      headline={t().headlineCoverage}
    >
      <div
        style={{
          width: 1400,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 40,
          paddingTop: 20,
          paddingBottom: 20,
        }}
      >
        <Terminal
          title="forge coverage"
          lines={coverageRun}
          width="100%"
          height={260}
          fontSize={18}
        />
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            opacity: barOpacity,
            transform: `translateY(${barTy}px)`,
          }}
        >
          <CoverageBar
            width="100%"
            duration={36}
            fontSize={32}
            metrics={[
              { label: "Lines", target: 100, delayFrames: 45 },
              { label: "Statements", target: 100, delayFrames: 53 },
              { label: "Branches", target: 100, delayFrames: 61 },
              { label: "Functions", target: 100, delayFrames: 69 },
            ]}
          />
        </div>
      </div>
    </SceneLayout>
  );
};
