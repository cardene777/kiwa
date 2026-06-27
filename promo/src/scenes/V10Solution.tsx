import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { SceneLayout } from "../components/SceneLayout";
import { KiwaLogo } from "../components/KiwaLogo";
import { tokens, t } from "../tokens";

const CANVAS_W = 1760;
const CANVAS_H = 820;
const centerX = CANVAS_W / 2;
const centerY = CANVAS_H / 2 - 20;
const LOGO_SIZE = 180;
const HUB_RADIUS = LOGO_SIZE / 2;
const RAY_LENGTH = 320;

type Ray = {
  angle: number;
  label: string;
  sublabel: string;
  accent: string;
  delay: number;
};

const rays: Ray[] = [
  { angle: 200, label: "contract", sublabel: "forge / hardhat", accent: tokens.color.accentContract, delay: 0 },
  { angle: 180, label: "api", sublabel: "msw / supertest", accent: tokens.color.accentApi, delay: 6 },
  { angle: 160, label: "ui", sublabel: "testing-library", accent: tokens.color.accentComponent, delay: 12 },
  { angle: -20, label: "e2e", sublabel: "playwright", accent: tokens.color.accentE2e, delay: 18 },
  { angle: 0, label: "a11y", sublabel: "axe-core", accent: tokens.color.accentA11y, delay: 24 },
  { angle: 20, label: "visual", sublabel: "pixelmatch", accent: tokens.color.accentData, delay: 30 },
];

const ARROW_START_FRAME = 60;

const RaySvg: React.FC<{ ray: Ray }> = ({ ray }) => {
  const frame = useCurrentFrame() - ARROW_START_FRAME - ray.delay;
  const progress = interpolate(frame, [0, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const labelOpacity = interpolate(frame, [18, 36], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const rad = (ray.angle * Math.PI) / 180;
  const cosA = Math.cos(rad);
  const sinA = Math.sin(rad);
  const startX = centerX + cosA * HUB_RADIUS;
  const startY = centerY + sinA * HUB_RADIUS;
  const fullEndX = centerX + cosA * (HUB_RADIUS + RAY_LENGTH);
  const fullEndY = centerY + sinA * (HUB_RADIUS + RAY_LENGTH);
  const curEndX = startX + (fullEndX - startX) * progress;
  const curEndY = startY + (fullEndY - startY) * progress;

  const labelX = centerX + cosA * (HUB_RADIUS + RAY_LENGTH + 20);
  const labelY = centerY + sinA * (HUB_RADIUS + RAY_LENGTH + 20);
  const align: "start" | "end" | "middle" =
    cosA > 0.3 ? "start" : cosA < -0.3 ? "end" : "middle";

  return (
    <g>
      <line
        x1={startX}
        y1={startY}
        x2={curEndX}
        y2={curEndY}
        stroke={ray.accent}
        strokeWidth={3.5}
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 6px ${ray.accent}90)` }}
      />
      <circle
        cx={curEndX}
        cy={curEndY}
        r={9}
        fill={ray.accent}
        style={{ filter: `drop-shadow(0 0 10px ${ray.accent})` }}
      />
      <text
        x={labelX}
        y={labelY + 4}
        fill={ray.accent}
        fontFamily={tokens.font.sans}
        fontSize={36}
        fontWeight={700}
        textAnchor={align}
        opacity={labelOpacity}
      >
        {ray.label}
      </text>
      <text
        x={labelX}
        y={labelY + 36}
        fill={ray.accent}
        fontFamily={tokens.font.mono}
        fontSize={20}
        fontWeight={500}
        textAnchor={align}
        opacity={labelOpacity * 0.85}
      >
        {ray.sublabel}
      </text>
    </g>
  );
};

export const V10Solution: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const textEnter = spring({
    frame: frame - 20,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 22,
    config: { damping: 14, mass: 0.8, stiffness: 100 },
  });
  const textOpacity = interpolate(textEnter, [0, 1], [0, 1]);
  const textScale = interpolate(textEnter, [0, 1], [0.85, 1]);

  return (
    <SceneLayout
      eyebrow={t().v10SolutionEyebrow}
      headline={t().v10SolutionHeadline}
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
            left: centerX - LOGO_SIZE / 2,
            top: centerY - LOGO_SIZE / 2,
            width: LOGO_SIZE,
            height: LOGO_SIZE,
            opacity: logoOpacity,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <KiwaLogo size={LOGO_SIZE} fadeInDuration={18} scaleFrom={0.6} />
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: centerY + HUB_RADIUS + 24,
            width: CANVAS_W,
            display: "flex",
            justifyContent: "center",
            opacity: textOpacity,
          }}
        >
          <div
            style={{
              fontFamily: tokens.font.sans,
              fontSize: 92,
              fontWeight: 800,
              color: tokens.color.white,
              letterSpacing: -3,
              transform: `scale(${textScale})`,
              transformOrigin: "center",
              lineHeight: 1,
            }}
          >
            {t().productName}
          </div>
        </div>
        <svg
          width={CANVAS_W}
          height={CANVAS_H}
          viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
          style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}
        >
          {rays.map((ray) => (
            <RaySvg key={ray.label} ray={ray} />
          ))}
        </svg>
      </div>
    </SceneLayout>
  );
};
