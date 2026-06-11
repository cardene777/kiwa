import { useCurrentFrame, interpolate } from "remotion";
import { SceneLayout } from "../components/SceneLayout";
import { CodeBlock } from "../components/CodeBlock";
import { tokens } from "../tokens";

const specLines = [
  { text: "# test-spec-token-gating.md" },
  { text: "" },
  { text: "## Test viewpoints (11 axes)" },
  { text: "- happy path" },
  { text: "- failure" },
  { text: "- boundary" },
  { text: "- state transition" },
  { text: "- permission / security" },
  { text: "" },
  { text: "## TC-001 mint happy path" },
  { text: "level: unit" },
  { text: "expected: owner == msg.sender" },
];

const CANVAS_W = 1760;
const CANVAS_H = 760;
const CODE_W = 680;
const CODE_H = 560;
const codeLeft = 60;
const codeTop = (CANVAS_H - CODE_H) / 2;
const arrowStartX = codeLeft + CODE_W + 60;
const arrowStartY = CANVAS_H / 2;

type Arrow = {
  delay: number;
  endX: number;
  endY: number;
  label: string;
  sublabel: string;
  accent: string;
};

const arrows: Arrow[] = [
  { delay: 0, endX: arrowStartX + 420, endY: arrowStartY - 200, label: "Foundry", sublabel: ".t.sol", accent: "#FF8A65" },
  { delay: 14, endX: arrowStartX + 460, endY: arrowStartY, label: "Hardhat", sublabel: ".test.ts", accent: "#FFCA28" },
  { delay: 28, endX: arrowStartX + 420, endY: arrowStartY + 200, label: "Playwright", sublabel: ".spec.ts", accent: "#42A5F5" },
];

const ARROW_START_FRAME = 70;

const ArrowSvg: React.FC<{ arrow: Arrow }> = ({ arrow }) => {
  const frame = useCurrentFrame() - ARROW_START_FRAME - arrow.delay;
  const progress = interpolate(frame, [0, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const labelOpacity = interpolate(frame, [16, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const currentX = arrowStartX + (arrow.endX - arrowStartX) * progress;
  const currentY = arrowStartY + (arrow.endY - arrowStartY) * progress;

  return (
    <g>
      <line
        x1={arrowStartX}
        y1={arrowStartY}
        x2={currentX}
        y2={currentY}
        stroke={arrow.accent}
        strokeWidth={4}
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 8px ${arrow.accent})` }}
      />
      <circle cx={currentX} cy={currentY} r={10} fill={arrow.accent} style={{ filter: `drop-shadow(0 0 12px ${arrow.accent})` }} />
      <text
        x={arrow.endX + 22}
        y={arrow.endY - 4}
        fill={arrow.accent}
        fontFamily={tokens.font.sans}
        fontSize={40}
        fontWeight={700}
        opacity={labelOpacity}
      >
        {arrow.label}
      </text>
      <text
        x={arrow.endX + 22}
        y={arrow.endY + 32}
        fill={arrow.accent}
        fontFamily={tokens.font.mono}
        fontSize={22}
        opacity={labelOpacity * 0.9}
      >
        {arrow.sublabel}
      </text>
    </g>
  );
};

export const Solution: React.FC = () => {
  return (
    <SceneLayout
      eyebrow="The Solution"
      headline="One spec, three layers — generated."
    >
      <div
        style={{
          position: "relative",
          width: CANVAS_W,
          height: CANVAS_H,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: codeLeft,
            top: codeTop,
          }}
        >
          <CodeBlock
            title="Layer 1 spec"
            language="markdown"
            lines={specLines}
            width={CODE_W}
            height={CODE_H}
            fontSize={22}
            startFrame={10}
            lineRevealSpeed={3}
          />
        </div>
        <svg
          width={CANVAS_W}
          height={CANVAS_H}
          viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
          style={{ position: "absolute", left: 0, top: 0 }}
        >
          {arrows.map((arrow, idx) => (
            <ArrowSvg key={idx} arrow={arrow} />
          ))}
        </svg>
      </div>
    </SceneLayout>
  );
};
