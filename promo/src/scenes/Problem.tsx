import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { SceneLayout } from "../components/SceneLayout";
import { tokens, t } from "../tokens";

type Tool = {
  label: string;
  sub: string;
  color: string;
  delay: number;
  x: number;
  y: number;
  rot: number;
};

const tools: Tool[] = [
  { label: "forge", sub: "contract", color: tokens.color.accentContract, delay: 0, x: -440, y: -160, rot: -8 },
  { label: "hardhat", sub: "contract", color: tokens.color.accentContract, delay: 4, x: -120, y: -210, rot: 5 },
  { label: "vitest", sub: "unit / API", color: tokens.color.accentApi, delay: 8, x: 220, y: -180, rot: -3 },
  { label: "msw", sub: "API", color: tokens.color.accentApi, delay: 12, x: 470, y: -120, rot: 7 },
  { label: "@testing-library", sub: "component", color: tokens.color.accentComponent, delay: 16, x: -420, y: 40, rot: 3 },
  { label: "playwright", sub: "e2e", color: tokens.color.accentE2e, delay: 20, x: 80, y: 80, rot: -6 },
  { label: "axe-core", sub: "a11y", color: tokens.color.accentA11y, delay: 24, x: -180, y: 200, rot: 4 },
  { label: "pixelmatch", sub: "visual", color: tokens.color.accentA11y, delay: 28, x: 320, y: 220, rot: -5 },
  { label: "pytest", sub: "Python", color: tokens.color.accentPy, delay: 32, x: -360, y: 240, rot: 8 },
];

const ToolChip: React.FC<{ tool: Tool }> = ({ tool }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame: frame - 10 - tool.delay,
    fps,
    from: 0,
    to: 1,
    config: { damping: 12, mass: 0.6, stiffness: 110 },
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const translateY = interpolate(enter, [0, 1], [20, 0]);
  const scale = interpolate(enter, [0, 1], [0.9, 1]);

  return (
    <div
      style={{
        position: "absolute",
        left: `calc(50% + ${tool.x}px)`,
        top: `calc(50% + ${tool.y}px)`,
        transform: `translate(-50%, -50%) translateY(${translateY}px) scale(${scale}) rotate(${tool.rot}deg)`,
        opacity,
        background: `linear-gradient(135deg, ${tool.color}25 0%, ${tool.color}08 100%)`,
        border: `2px solid ${tool.color}`,
        borderRadius: 14,
        padding: "16px 26px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        boxShadow: `0 4px 18px ${tool.color}40`,
      }}
    >
      <div
        style={{
          fontFamily: tokens.font.mono,
          fontSize: 32,
          fontWeight: 700,
          color: tool.color,
          letterSpacing: -0.5,
        }}
      >
        {tool.label}
      </div>
      <div
        style={{
          fontFamily: tokens.font.sans,
          fontSize: 18,
          color: tokens.color.textMuted,
          letterSpacing: 0.5,
        }}
      >
        {tool.sub}
      </div>
    </div>
  );
};

export const Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sublineEnter = spring({
    frame: frame - 70,
    fps,
    from: 0,
    to: 1,
    config: { damping: 14, mass: 0.8, stiffness: 100 },
  });
  const sublineOpacity = interpolate(sublineEnter, [0, 1], [0, 1]);
  const sublineY = interpolate(sublineEnter, [0, 1], [16, 0]);

  return (
    <SceneLayout
      eyebrow={t().eyebrowProblem}
      headline={t().headlineProblem}
    >
      <div
        style={{
          position: "relative",
          width: 1280,
          height: 560,
        }}
      >
        {tools.map((tool) => (
          <ToolChip key={tool.label} tool={tool} />
        ))}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: -40,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            opacity: sublineOpacity,
            transform: `translateY(${sublineY}px)`,
          }}
        >
          <div
            style={{
              fontFamily: tokens.font.sans,
              fontSize: 28,
              fontWeight: 500,
              color: tokens.color.textMuted,
              letterSpacing: 0.3,
            }}
          >
            {t().problemSublineA}
          </div>
          <div
            style={{
              fontFamily: tokens.font.sans,
              fontSize: 28,
              fontWeight: 500,
              color: tokens.color.textMuted,
              letterSpacing: 0.3,
            }}
          >
            {t().problemSublineB}
          </div>
        </div>
      </div>
    </SceneLayout>
  );
};
