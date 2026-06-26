import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { SceneLayout } from "../components/SceneLayout";
import { ChapterIndicator } from "../components/ChapterIndicator";
import { tokens, t } from "../tokens";

type Tool = {
  label: string;
  sub: string;
  color: string;
};

// Grid order: 3 rows × 3 cols. Reading order = stagger animation order.
const tools: Tool[] = [
  { label: "forge", sub: "contract", color: tokens.color.accentContract },
  { label: "hardhat", sub: "contract", color: tokens.color.accentContract },
  { label: "vitest", sub: "unit / API", color: tokens.color.accentApi },
  { label: "msw", sub: "API", color: tokens.color.accentApi },
  { label: "@testing-library", sub: "component", color: tokens.color.accentComponent },
  { label: "playwright", sub: "e2e", color: tokens.color.accentE2e },
  { label: "axe-core", sub: "a11y", color: tokens.color.accentA11y },
  { label: "pixelmatch", sub: "visual", color: tokens.color.accentA11y },
  { label: "pytest", sub: "Python", color: tokens.color.accentPy },
];

const COLS = 3;
const ROWS = 3;
const TILE_W = 340;
const TILE_H = 130;
const GAP_X = 36;
const GAP_Y = 26;
const GRID_W = COLS * TILE_W + (COLS - 1) * GAP_X;
const GRID_H = ROWS * TILE_H + (ROWS - 1) * GAP_Y;

const ToolChip: React.FC<{ tool: Tool; index: number }> = ({ tool, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame: frame - 8 - index * 3,
    fps,
    from: 0,
    to: 1,
    config: { damping: 13, mass: 0.6, stiffness: 115 },
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const translateY = interpolate(enter, [0, 1], [18, 0]);
  const scale = interpolate(enter, [0, 1], [0.92, 1]);

  const col = index % COLS;
  const row = Math.floor(index / COLS);
  const left = col * (TILE_W + GAP_X);
  const top = row * (TILE_H + GAP_Y);

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: TILE_W,
        height: TILE_H,
        background: `linear-gradient(135deg, ${tool.color}22 0%, ${tool.color}05 100%)`,
        border: `2px solid ${tool.color}`,
        borderRadius: 14,
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
        boxShadow: `0 4px 18px ${tool.color}40`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}
    >
      <div
        style={{
          fontFamily: tokens.font.mono,
          fontSize: 36,
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
          fontSize: 20,
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
    <>
      <SceneLayout
        eyebrow={t().eyebrowProblem}
        headline={t().headlineProblem}
      >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 36,
        }}
      >
        <div
          style={{
            position: "relative",
            width: GRID_W,
            height: GRID_H,
          }}
        >
          {tools.map((tool, i) => (
            <ToolChip key={tool.label} tool={tool} index={i} />
          ))}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
            opacity: sublineOpacity,
            transform: `translateY(${sublineY}px)`,
          }}
        >
          <div
            style={{
              fontFamily: tokens.font.sans,
              fontSize: 28,
              fontWeight: 500,
              color: tokens.color.white,
              letterSpacing: 0.3,
            }}
          >
            {t().problemSublineA}
          </div>
          <div
            style={{
              fontFamily: tokens.font.sans,
              fontSize: 26,
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
      <ChapterIndicator chapter={1} name="Hook" />
    </>
  );
};
