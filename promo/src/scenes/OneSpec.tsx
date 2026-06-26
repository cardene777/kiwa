import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { SceneLayout } from "../components/SceneLayout";
import { tokens, t } from "../tokens";

type Ray = {
  angle: number;
  label: string;
  color: string;
  delay: number;
};

const rays: Ray[] = [
  { angle: -90, label: "Contract", color: tokens.color.accentContract, delay: 0 },
  { angle: -50, label: "API", color: tokens.color.accentApi, delay: 4 },
  { angle: -10, label: "Component", color: tokens.color.accentComponent, delay: 8 },
  { angle: 30, label: "E2E", color: tokens.color.accentE2e, delay: 12 },
  { angle: 70, label: "A11y / Visual", color: tokens.color.accentA11y, delay: 16 },
  { angle: 110, label: "CLI / Data / Obs.", color: tokens.color.accentData, delay: 20 },
];

const HUB_RADIUS = 220;
const RAY_LENGTH = 320;
const LABEL_RADIUS = HUB_RADIUS + RAY_LENGTH + 40;

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
  const labelX = Math.cos(rad) * LABEL_RADIUS;
  const labelY = Math.sin(rad) * LABEL_RADIUS;

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
        fontSize={30}
        fontWeight={700}
        textAnchor={align}
        opacity={labelOpacity}
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
        style={{ filter: `drop-shadow(0 0 24px ${tokens.color.primary})` }}
      />
      <text
        x={0}
        y={-30}
        fill={tokens.color.white}
        fontFamily={tokens.font.mono}
        fontSize={26}
        fontWeight={600}
        textAnchor="middle"
        letterSpacing={2}
      >
        Layer 1
      </text>
      <text
        x={0}
        y={6}
        fill={tokens.color.primary}
        fontFamily={tokens.font.sans}
        fontSize={42}
        fontWeight={800}
        textAnchor="middle"
        letterSpacing={-1}
      >
        spec
      </text>
      <text
        x={0}
        y={42}
        fill={tokens.color.textMuted}
        fontFamily={tokens.font.mono}
        fontSize={18}
        fontWeight={500}
        textAnchor="middle"
        letterSpacing={1}
      >
        9 columns
      </text>
    </g>
  );
};

export const OneSpec: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const captionEnter = spring({
    frame: frame - 160,
    fps,
    from: 0,
    to: 1,
    config: { damping: 14, mass: 0.8, stiffness: 100 },
  });
  const captionOpacity = interpolate(captionEnter, [0, 1], [0, 1]);
  const captionY = interpolate(captionEnter, [0, 1], [16, 0]);

  return (
    <SceneLayout
      eyebrow={t().eyebrowOneSpec}
      headline={t().headlineOneSpec}
    >
      <div
        style={{
          position: "relative",
          width: 1400,
          height: 680,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width={1400}
          height={680}
          viewBox="-700 -340 1400 680"
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
            color: tokens.color.primary,
            letterSpacing: 2,
            opacity: captionOpacity,
            transform: `translateY(${captionY}px)`,
          }}
        >
          {t().oneSpecCaption}
        </div>
      </div>
    </SceneLayout>
  );
};
