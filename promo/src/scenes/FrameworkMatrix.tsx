import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { SceneLayout } from "../components/SceneLayout";
import { tokens, t } from "../tokens";

type Framework = {
  name: string;
  short: string;
  color: string;
  delay: number;
};

const frameworks: Framework[] = [
  { name: "React", short: "RE", color: "#61DAFB", delay: 0 },
  { name: "Vue 3", short: "VU", color: "#42B883", delay: 5 },
  { name: "Svelte", short: "SV", color: "#FF3E00", delay: 10 },
  { name: "SolidJS", short: "SO", color: "#2C4F7C", delay: 15 },
  { name: "Lit", short: "LI", color: "#324FFF", delay: 20 },
  { name: "Qwik", short: "QW", color: "#AC7EF4", delay: 25 },
  { name: "Angular", short: "NG", color: "#DD0031", delay: 30 },
  { name: "Chromium", short: "CR", color: "#FFCD46", delay: 35 },
];

const TILE_W = 280;
const TILE_H = 220;
const GAP = 32;
const COLS = 4;
const ROWS = 2;

const GRID_W = COLS * TILE_W + (COLS - 1) * GAP;
const GRID_H = ROWS * TILE_H + (ROWS - 1) * GAP;

const FrameworkTile: React.FC<{ framework: Framework; index: number }> = ({
  framework,
  index,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame: frame - 25 - framework.delay,
    fps,
    from: 0,
    to: 1,
    config: { damping: 14, mass: 0.7, stiffness: 110 },
  });

  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const translateY = interpolate(enter, [0, 1], [40, 0]);
  const scale = interpolate(enter, [0, 1], [0.85, 1]);

  const col = index % COLS;
  const row = Math.floor(index / COLS);
  const left = col * (TILE_W + GAP);
  const top = row * (TILE_H + GAP);

  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: TILE_W,
        height: TILE_H,
        background: `linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)`,
        border: `2px solid ${framework.color}`,
        borderRadius: 16,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: tokens.spacing.sm,
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
        boxShadow: `0 0 24px ${framework.color}40`,
      }}
    >
      <div
        style={{
          width: 92,
          height: 92,
          borderRadius: 18,
          background: framework.color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: tokens.font.mono,
          fontWeight: 800,
          fontSize: 42,
          color: tokens.color.bg,
          letterSpacing: -1,
          boxShadow: `0 0 30px ${framework.color}90`,
        }}
      >
        {framework.short}
      </div>
      <div
        style={{
          fontFamily: tokens.font.sans,
          fontSize: 32,
          fontWeight: 700,
          color: tokens.color.white,
          letterSpacing: -0.5,
        }}
      >
        {framework.name}
      </div>
    </div>
  );
};

export const FrameworkMatrix: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const captionEnter = spring({
    frame: frame - 90,
    fps,
    from: 0,
    to: 1,
    config: { damping: 16, mass: 1, stiffness: 95 },
  });
  const captionOpacity = interpolate(captionEnter, [0, 1], [0, 1]);
  const captionTranslateY = interpolate(captionEnter, [0, 1], [20, 0]);

  return (
    <SceneLayout
      eyebrow={t().eyebrowFrameworks}
      headline={t().headlineFrameworks}
    >
      <div
        style={{
          position: "relative",
          width: GRID_W,
          height: GRID_H + 120,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            width: GRID_W,
            height: GRID_H,
          }}
        >
          {frameworks.map((fw, i) => (
            <FrameworkTile key={fw.name} framework={fw} index={i} />
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: tokens.font.mono,
            fontSize: 26,
            fontWeight: 500,
            color: tokens.color.primary,
            letterSpacing: 2,
            opacity: captionOpacity,
            transform: `translateY(${captionTranslateY}px)`,
          }}
        >
          @kiwa-test/ui · one package, 8 adapters
        </div>
      </div>
    </SceneLayout>
  );
};
