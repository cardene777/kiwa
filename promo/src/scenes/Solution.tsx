import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { SceneLayout } from "../components/SceneLayout";
import { KiwaLogo } from "../components/KiwaLogo";
import { tokens, t } from "../tokens";

const CANVAS_W = 1760;
const CANVAS_H = 760;

const centerX = CANVAS_W / 2;
const centerY = CANVAS_H / 2;
const LOGO_SIZE = 200;
const LOGO_TOP = centerY - 140;
const LOGO_CENTER_Y = LOGO_TOP + LOGO_SIZE / 2;
const LOGO_BOTTOM = LOGO_TOP + LOGO_SIZE;

type Branch = {
  delay: number;
  side: "left" | "right" | "top";
  dotX: number;
  dotY: number;
  label: string;
  sublabel: string;
  accent: string;
};

const branches: Branch[] = [
  {
    delay: 0,
    side: "left",
    dotX: centerX - 380,
    dotY: centerY + 60,
    label: "Contract test",
    sublabel: "forge / hardhat",
    accent: tokens.color.accentContract,
  },
  {
    delay: 10,
    side: "right",
    dotX: centerX + 380,
    dotY: centerY + 60,
    label: "dApp e2e test",
    sublabel: "playwright",
    accent: tokens.color.accentE2e,
  },
  {
    delay: 20,
    side: "top",
    dotX: centerX,
    dotY: LOGO_TOP - 110,
    label: "Manual write",
    sublabel: "@kiwa-test/core",
    accent: tokens.color.accentManual,
  },
];

const ARROW_START_FRAME = 60;

const startPointFor = (side: Branch["side"]) => {
  if (side === "left") return { x: centerX - LOGO_SIZE / 2 - 10, y: LOGO_CENTER_Y };
  if (side === "right") return { x: centerX + LOGO_SIZE / 2 + 10, y: LOGO_CENTER_Y };
  return { x: centerX, y: LOGO_TOP - 10 };
};

const BranchSvg: React.FC<{ branch: Branch }> = ({ branch }) => {
  const frame = useCurrentFrame() - ARROW_START_FRAME - branch.delay;
  const progress = interpolate(frame, [0, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const labelOpacity = interpolate(frame, [18, 34], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const start = startPointFor(branch.side);
  const currentX = start.x + (branch.dotX - start.x) * progress;
  const currentY = start.y + (branch.dotY - start.y) * progress;

  const labelAlign: "start" | "end" | "middle" =
    branch.side === "left" ? "end" : branch.side === "right" ? "start" : "middle";
  const labelOffsetX =
    branch.side === "left" ? -28 : branch.side === "right" ? 28 : 0;
  // top branch: stack labels ABOVE the dot so the line doesn't cross the text
  const labelOffsetY = branch.side === "top" ? -78 : 0;

  return (
    <g>
      <line
        x1={start.x}
        y1={start.y}
        x2={currentX}
        y2={currentY}
        stroke={branch.accent}
        strokeWidth={4}
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 8px ${branch.accent})` }}
      />
      <circle
        cx={currentX}
        cy={currentY}
        r={11}
        fill={branch.accent}
        style={{ filter: `drop-shadow(0 0 12px ${branch.accent})` }}
      />
      <text
        x={branch.dotX + labelOffsetX}
        y={branch.dotY - 6 + labelOffsetY}
        fill={branch.accent}
        fontFamily={tokens.font.sans}
        fontSize={44}
        fontWeight={700}
        textAnchor={labelAlign}
        opacity={labelOpacity}
      >
        {branch.label}
      </text>
      <text
        x={branch.dotX + labelOffsetX}
        y={branch.dotY + 34 + labelOffsetY}
        fill={branch.accent}
        fontFamily={tokens.font.mono}
        fontSize={24}
        textAnchor={labelAlign}
        opacity={labelOpacity * 0.9}
      >
        {branch.sublabel}
      </text>
    </g>
  );
};

export const Solution: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const textScale = spring({
    frame: frame - 15,
    fps,
    from: 0.8,
    to: 1,
    config: { damping: 12, mass: 0.8, stiffness: 100 },
  });

  const textOpacity = interpolate(frame, [15, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneLayout
      eyebrow={t().eyebrowSolution}
      headline={t().headlineSolution}
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
            left: centerX - 200,
            top: centerY - 140,
            width: 400,
            opacity: logoOpacity,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: tokens.spacing.xs,
          }}
        >
          <KiwaLogo size={LOGO_SIZE} fadeInDuration={18} scaleFrom={0.6} />
          <div
            style={{
              fontFamily: tokens.font.sans,
              fontSize: 72,
              fontWeight: 700,
              color: tokens.color.white,
              letterSpacing: -2,
              opacity: textOpacity,
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
          {branches.map((branch, idx) => (
            <BranchSvg key={idx} branch={branch} />
          ))}
        </svg>
      </div>
    </SceneLayout>
  );
};
