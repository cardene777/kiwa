import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { SceneLayout } from "../components/SceneLayout";
import { ChapterIndicator } from "../components/ChapterIndicator";
import { tokens, t } from "../tokens";

type Ray = {
  angle: number;
  label: string;
  color: string;
  delay: number;
};

// 6 rays distributed on a 360° sweep BUT all label endpoints stay clear of the
// SceneLayout header (top 200px). North pole is allowed but only as an arrow
// (no label), south side gets 3 labels evenly.
//   -160° upper-left  ........ Contract       (label sits to the LEFT of hub)
//   -100° upper-left  ........ API            (label slightly left + up)
//    -40° upper-right ......... Component     (label right + up but below header)
//     30° lower-right ......... E2E
//     90° south (straight down) A11y / Visual
//    150° lower-left   ........ Data / CLI
// 6 rays only on the horizontal axis (-30°〜+30° band) so the SceneLayout
// header (top 180px) and Polyglot caption (bottom 60px) are kept clear of
// any ray label.
const rays: Ray[] = [
  { angle: 180, label: "Contract", color: tokens.color.accentContract, delay: 0 },
  { angle: -150, label: "API", color: tokens.color.accentApi, delay: 4 },
  { angle: -30, label: "Component", color: tokens.color.accentComponent, delay: 8 },
  { angle: 0, label: "E2E", color: tokens.color.accentE2e, delay: 12 },
  { angle: 30, label: "A11y / Visual", color: tokens.color.accentA11y, delay: 16 },
  { angle: 150, label: "Data / CLI", color: tokens.color.accentData, delay: 20 },
];

const HUB_RADIUS = 155;
const RAY_LENGTH = 220;
const LABEL_OFFSET = 18;

const RaySvg: React.FC<{ ray: Ray }> = ({ ray }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame: frame - 40 - ray.delay,
    fps,
    from: 0,
    to: 1,
    config: { damping: 14, mass: 0.7, stiffness: 100 },
  });
  const lineProgress = interpolate(enter, [0, 1], [0, 1]);
  const labelOpacity = interpolate(enter, [0.4, 1], [0, 1]);

  const rad = (ray.angle * Math.PI) / 180;
  const startX = Math.cos(rad) * HUB_RADIUS;
  const startY = Math.sin(rad) * HUB_RADIUS;
  const endX = Math.cos(rad) * (HUB_RADIUS + RAY_LENGTH * lineProgress);
  const endY = Math.sin(rad) * (HUB_RADIUS + RAY_LENGTH * lineProgress);
  const labelX = Math.cos(rad) * (HUB_RADIUS + RAY_LENGTH + LABEL_OFFSET);
  const labelY = Math.sin(rad) * (HUB_RADIUS + RAY_LENGTH + LABEL_OFFSET);

  const align = Math.cos(rad) > 0.3 ? "start" : Math.cos(rad) < -0.3 ? "end" : "middle";

  return (
    <g>
      <line
        x1={startX}
        y1={startY}
        x2={endX}
        y2={endY}
        stroke={ray.color}
        strokeWidth={3}
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 6px ${ray.color}80)` }}
      />
      <circle
        cx={endX}
        cy={endY}
        r={9}
        fill={ray.color}
        style={{ filter: `drop-shadow(0 0 10px ${ray.color})` }}
      />
      <text
        x={labelX}
        y={labelY + 8}
        fill={ray.color}
        fontFamily={tokens.font.sans}
        fontSize={32}
        fontWeight={800}
        textAnchor={align}
        opacity={labelOpacity}
        style={{ filter: `drop-shadow(0 0 8px ${ray.color}90)` }}
      >
        {ray.label}
      </text>
    </g>
  );
};

const SpecHub: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    config: { damping: 16, mass: 1, stiffness: 90 },
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const scale = interpolate(enter, [0, 1], [0.6, 1]);

  return (
    <g style={{ opacity, transform: `scale(${scale})`, transformOrigin: "center" }}>
      <circle
        r={HUB_RADIUS - 10}
        fill={`url(#hub-gradient)`}
        stroke={tokens.color.primary}
        strokeWidth={3}
        style={{ filter: `drop-shadow(0 0 28px ${tokens.color.primary})` }}
      />
      <text
        x={0}
        y={-46}
        fill={tokens.color.textMuted}
        fontFamily={tokens.font.mono}
        fontSize={18}
        fontWeight={600}
        textAnchor="middle"
        letterSpacing={3}
        style={{ textTransform: "uppercase" }}
      >
        Layer 1
      </text>
      <text
        x={0}
        y={20}
        fill={tokens.color.primary}
        fontFamily={tokens.font.sans}
        fontSize={72}
        fontWeight={800}
        textAnchor="middle"
        letterSpacing={-2}
        style={{ filter: `drop-shadow(0 0 18px ${tokens.color.primary}aa)` }}
      >
        spec
      </text>
      <g transform="translate(0, 80)">
        <rect
          x={-110}
          y={-22}
          width={220}
          height={36}
          rx={18}
          fill={tokens.color.bg}
          stroke={tokens.color.primary}
          strokeWidth={2}
        />
        <text
          x={0}
          y={4}
          fill={tokens.color.primary}
          fontFamily={tokens.font.mono}
          fontSize={17}
          fontWeight={700}
          textAnchor="middle"
          letterSpacing={1.5}
        >
          9 columns · 8 skills
        </text>
      </g>
    </g>
  );
};

export const OneSpec: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const captionEnter = spring({
    frame: frame - 200,
    fps,
    from: 0,
    to: 1,
    config: { damping: 14, mass: 0.8, stiffness: 100 },
  });
  const captionOpacity = interpolate(captionEnter, [0, 1], [0, 1]);
  const captionY = interpolate(captionEnter, [0, 1], [16, 0]);

  // viewBox sized so even the longest label ("A11y / Visual") clears the edge.
  // viewBox を 1700 × 600 にして hub を画面中央に配置。
  // ray を horizontal band に限定したので縦高はコンパクトでよい (caption 領域確保)。
  const VBW = 1700;
  const VBH = 600;

  return (
    <>
      <SceneLayout
        eyebrow={t().eyebrowOneSpec}
        headline={t().headlineOneSpec}
      >
      <div
        style={{
          position: "relative",
          width: VBW,
          height: VBH + 60,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <svg
          width={VBW}
          height={VBH}
          viewBox={`-${VBW / 2} -${VBH / 2} ${VBW} ${VBH}`}
        >
          <defs>
            <radialGradient id="hub-gradient" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor={`${tokens.color.primary}40`} />
              <stop offset="100%" stopColor={`${tokens.color.bg}00`} />
            </radialGradient>
          </defs>
          {rays.map((ray) => (
            <RaySvg key={ray.label} ray={ray} />
          ))}
          <SpecHub />
        </svg>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: tokens.font.mono,
            fontSize: 26,
            fontWeight: 600,
            color: tokens.color.primary,
            letterSpacing: 1.6,
            opacity: captionOpacity,
            transform: `translateY(${captionY}px)`,
            textShadow: `0 0 18px ${tokens.color.primary}80`,
          }}
        >
          {t().oneSpecCaption}
        </div>
      </div>
      </SceneLayout>
      <ChapterIndicator chapter={2} name="Concept" />
    </>
  );
};
