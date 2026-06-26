import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { SceneLayout } from "../components/SceneLayout";
import { ChapterIndicator } from "../components/ChapterIndicator";
import { tokens, t } from "../tokens";

type Pkg = {
  name: string;
  short: string;
  registry: "npm" | "pypi";
  color: string;
};

const packages: Pkg[] = [
  { name: "@kiwa-test/core", short: "core", registry: "npm", color: tokens.color.primary },
  { name: "@kiwa-test/spec", short: "spec", registry: "npm", color: tokens.color.primary },
  { name: "@kiwa-test/cli", short: "cli", registry: "npm", color: tokens.color.primary },
  { name: "@kiwa-test/api", short: "api", registry: "npm", color: tokens.color.accentApi },
  { name: "@kiwa-test/ui", short: "ui", registry: "npm", color: tokens.color.accentComponent },
  { name: "@kiwa-test/e2e", short: "e2e", registry: "npm", color: tokens.color.accentE2e },
  { name: "@kiwa-test/data", short: "data", registry: "npm", color: tokens.color.accentData },
  { name: "@kiwa-test/cli-test", short: "cli-test", registry: "npm", color: tokens.color.accentData },
  { name: "@kiwa-test/a11y", short: "a11y", registry: "npm", color: tokens.color.accentA11y },
  { name: "@kiwa-test/visual", short: "visual", registry: "npm", color: tokens.color.accentA11y },
  { name: "@kiwa-test/observability", short: "obs.", registry: "npm", color: tokens.color.accentManual },
  { name: "kiwa-test-py", short: "py", registry: "pypi", color: tokens.color.accentPy },
];

const TILE_W = 260;
const TILE_H = 130;
const GAP = 18;
const COLS = 4;
const ROWS = 3;
const GRID_W = COLS * TILE_W + (COLS - 1) * GAP;
const GRID_H = ROWS * TILE_H + (ROWS - 1) * GAP;

const PackageTile: React.FC<{ pkg: Pkg; index: number }> = ({ pkg, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame: frame - 12 - index * 2.5,
    fps,
    from: 0,
    to: 1,
    config: { damping: 14, mass: 0.7, stiffness: 115 },
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const translateY = interpolate(enter, [0, 1], [16, 0]);
  const scale = interpolate(enter, [0, 1], [0.94, 1]);

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
        background: `linear-gradient(135deg, ${pkg.color}1F 0%, ${pkg.color}04 100%)`,
        border: `2px solid ${pkg.color}`,
        borderRadius: 14,
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
        boxShadow: `0 0 22px ${pkg.color}30`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: "10px 14px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          fontFamily: tokens.font.mono,
          fontSize: 22,
          fontWeight: 700,
          color: pkg.color,
          letterSpacing: -0.3,
          whiteSpace: "nowrap",
        }}
      >
        {pkg.name}
      </div>
      <div
        style={{
          fontFamily: tokens.font.mono,
          fontSize: 12,
          fontWeight: 600,
          color: tokens.color.bg,
          background: pkg.color,
          padding: "2px 10px",
          borderRadius: 999,
          letterSpacing: 0.5,
          textTransform: "uppercase",
        }}
      >
        {pkg.registry}
      </div>
    </div>
  );
};

export const PackagesGrid: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const captionEnter = spring({
    frame: frame - 140,
    fps,
    from: 0,
    to: 1,
    config: { damping: 14, mass: 0.9, stiffness: 95 },
  });
  const captionOpacity = interpolate(captionEnter, [0, 1], [0, 1]);
  const captionY = interpolate(captionEnter, [0, 1], [16, 0]);

  return (
    <>
      <SceneLayout
        eyebrow={t().eyebrowPackages}
        headline={t().headlinePackages}
      >
        <div
          style={{
            position: "relative",
            width: GRID_W,
            height: GRID_H + 70,
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
            {packages.map((pkg, i) => (
              <PackageTile key={pkg.name} pkg={pkg} index={i} />
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
              fontSize: 24,
              fontWeight: 600,
              color: tokens.color.primary,
              letterSpacing: 2,
              opacity: captionOpacity,
              transform: `translateY(${captionY}px)`,
              textShadow: `0 0 16px ${tokens.color.primary}70`,
            }}
          >
            {t().packagesCaption}
          </div>
        </div>
      </SceneLayout>
      <ChapterIndicator chapter={5} name="CTA" />
    </>
  );
};
