import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { SceneLayout } from "../components/SceneLayout";
import { tokens, t } from "../tokens";

type Column = {
  language: string;
  short: string;
  color: string;
  packages: string[];
  count: string;
  delay: number;
  planned?: boolean;
};

const columns: Column[] = [
  {
    language: "TypeScript",
    short: "TS",
    color: tokens.color.accentTs,
    packages: [
      "@kiwa-test/core",
      "@kiwa-test/spec",
      "@kiwa-test/api",
      "@kiwa-test/ui",
      "@kiwa-test/data",
      "@kiwa-test/cli-test",
      "@kiwa-test/e2e",
      "@kiwa-test/a11y",
      "@kiwa-test/visual",
      "@kiwa-test/observability",
      "@kiwa-test/cli",
    ],
    count: "11 npm packages",
    delay: 0,
  },
  {
    language: "Python",
    short: "PY",
    color: tokens.color.accentPy,
    packages: ["kiwa-test-py", "requests", "httpx", "FastAPI"],
    count: "1 PyPI package",
    delay: 6,
  },
  {
    language: "Solidity",
    short: "SOL",
    color: tokens.color.accentSol,
    packages: ["Foundry / forge", "Hardhat", "chai-matchers", "fast-check"],
    count: "via bridges",
    delay: 12,
  },
  {
    language: "Rust / Go",
    short: "—",
    color: tokens.color.textSubtle,
    packages: ["cargo test", "go test", "httptest"],
    count: "(planned)",
    delay: 18,
    planned: true,
  },
];

const COL_W = 360;
const COL_H = 540;
const GAP = 30;
const GRID_W = columns.length * COL_W + (columns.length - 1) * GAP;

const LanguageColumn: React.FC<{ column: Column; index: number }> = ({ column, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame: frame - 18 - column.delay,
    fps,
    from: 0,
    to: 1,
    config: { damping: 14, mass: 0.7, stiffness: 110 },
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const translateY = interpolate(enter, [0, 1], [28, 0]);
  const scale = interpolate(enter, [0, 1], [0.94, 1]);

  const left = index * (COL_W + GAP);

  const accent = column.planned ? `${column.color}` : column.color;
  const baseAlpha = column.planned ? 0.5 : 1;

  return (
    <div
      style={{
        position: "absolute",
        left,
        top: 0,
        width: COL_W,
        height: COL_H,
        background: `linear-gradient(180deg, ${accent}15 0%, ${accent}03 100%)`,
        border: column.planned
          ? `2px dashed ${accent}`
          : `2px solid ${accent}`,
        borderRadius: 18,
        opacity: opacity * baseAlpha,
        transform: `translateY(${translateY}px) scale(${scale})`,
        boxShadow: column.planned ? "none" : `0 0 30px ${accent}30`,
        padding: 28,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacing.sm,
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: 24,
          background: column.planned ? "transparent" : accent,
          border: column.planned ? `2px solid ${accent}` : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: tokens.font.mono,
          fontWeight: 800,
          fontSize: 36,
          color: column.planned ? accent : tokens.color.bg,
          letterSpacing: -1,
          boxShadow: column.planned ? "none" : `0 0 24px ${accent}90`,
        }}
      >
        {column.short}
      </div>
      <div
        style={{
          fontFamily: tokens.font.sans,
          fontSize: 30,
          fontWeight: 700,
          color: tokens.color.white,
          letterSpacing: -0.5,
        }}
      >
        {column.language}
      </div>
      <div
        style={{
          fontFamily: tokens.font.mono,
          fontSize: 18,
          fontWeight: 600,
          color: accent,
          letterSpacing: 0.5,
        }}
      >
        {column.count}
      </div>
      <div
        style={{
          width: "100%",
          marginTop: 6,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          alignItems: "stretch",
        }}
      >
        {column.packages.slice(0, 5).map((pkg) => (
          <div
            key={pkg}
            style={{
              fontFamily: tokens.font.mono,
              fontSize: 17,
              color: column.planned ? tokens.color.textSubtle : tokens.color.textMuted,
              padding: "5px 10px",
              background: column.planned ? "transparent" : `${accent}1A`,
              borderRadius: 5,
              textAlign: "center",
              letterSpacing: 0.2,
            }}
          >
            {pkg}
          </div>
        ))}
        {column.packages.length > 5 && (
          <div
            style={{
              fontFamily: tokens.font.mono,
              fontSize: 16,
              color: tokens.color.textSubtle,
              textAlign: "center",
              marginTop: 2,
            }}
          >
            + {column.packages.length - 5} more
          </div>
        )}
      </div>
    </div>
  );
};

export const Polyglot: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const captionEnter = spring({
    frame: frame - 130,
    fps,
    from: 0,
    to: 1,
    config: { damping: 14, mass: 0.8, stiffness: 100 },
  });
  const captionOpacity = interpolate(captionEnter, [0, 1], [0, 1]);
  const captionY = interpolate(captionEnter, [0, 1], [16, 0]);

  return (
    <SceneLayout
      eyebrow={t().eyebrowPolyglot}
      headline={t().headlinePolyglot}
    >
      <div
        style={{
          position: "relative",
          width: GRID_W,
          height: COL_H + 80,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative", width: GRID_W, height: COL_H }}>
          {columns.map((column, i) => (
            <LanguageColumn key={column.language} column={column} index={i} />
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
            color: tokens.color.primary,
            letterSpacing: 2,
            opacity: captionOpacity,
            transform: `translateY(${captionY}px)`,
          }}
        >
          {t().polyglotCaption}
        </div>
      </div>
    </SceneLayout>
  );
};
