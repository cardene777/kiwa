import { useCurrentFrame, interpolate, Sequence } from "remotion";
import { Background } from "../components/Background";
import { SectionTitle } from "../components/SectionTitle";
import { CodeBlock } from "../components/CodeBlock";
import { tokens } from "../tokens";

const specLines = [
  { text: "# test-spec-token-gating.md" },
  { text: "" },
  { text: "## Test viewpoints (11 axes)" },
  { text: "- happy path / failure / boundary" },
  { text: "- state transition / permission" },
  { text: "- input validation / idempotency" },
  { text: "- concurrency / security / regression" },
  { text: "" },
  { text: "## TC-001 mint happy path" },
  { text: "| level | input | expected |" },
  { text: "| unit  | (none) | owner==msg.sender |" },
];

const ArrowLine: React.FC<{
  startFrame: number;
  delay: number;
  rotate: number;
  label: string;
  accent: string;
}> = ({ startFrame, delay, rotate, label, accent }) => {
  const frame = useCurrentFrame() - startFrame - delay;
  const opacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lineWidth = interpolate(frame, [0, 18], [0, 280], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const labelOpacity = interpolate(frame, [12, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 920,
        top: 540,
        transformOrigin: "left center",
        transform: `rotate(${rotate}deg)`,
        opacity,
      }}
    >
      <div
        style={{
          width: lineWidth,
          height: 3,
          background: `linear-gradient(90deg, ${accent} 0%, ${accent} 70%, transparent 100%)`,
          boxShadow: `0 0 12px ${accent}`,
          position: "relative",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 280,
          top: -28,
          fontFamily: tokens.font.mono,
          fontSize: 24,
          fontWeight: 600,
          color: accent,
          opacity: labelOpacity,
          transform: `rotate(${-rotate}deg)`,
        }}
      >
        {label}
      </div>
    </div>
  );
};

export const Solution: React.FC = () => {
  return (
    <Background>
      <div
        style={{
          width: "100%",
          height: "100%",
          padding: tokens.spacing.lg,
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        <Sequence from={0}>
          <SectionTitle
            eyebrow="The Solution"
            headline="One spec, three layers, generated for you."
          />
        </Sequence>
        <Sequence from={30}>
          <div
            style={{
              position: "absolute",
              left: tokens.spacing.lg,
              top: 280,
            }}
          >
            <CodeBlock
              title="Layer 1 spec (input)"
              language="markdown"
              lines={specLines}
              width={700}
              height={520}
              fontSize={22}
              lineRevealSpeed={3}
            />
          </div>
        </Sequence>
        <Sequence from={90}>
          <ArrowLine
            startFrame={0}
            delay={0}
            rotate={-25}
            label="Foundry .t.sol"
            accent="#FF8A65"
          />
          <ArrowLine
            startFrame={0}
            delay={12}
            rotate={0}
            label="Hardhat .test.ts"
            accent="#FFCA28"
          />
          <ArrowLine
            startFrame={0}
            delay={24}
            rotate={25}
            label="Playwright .spec.ts"
            accent="#42A5F5"
          />
        </Sequence>
      </div>
    </Background>
  );
};
