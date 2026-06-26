import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { SceneLayout } from "../components/SceneLayout";
import { CoverageBar } from "../components/CoverageBar";
import { tokens, t } from "../tokens";

const coverageMetrics = [
  { label: "Lines", target: 96.2, delayFrames: 10 },
  { label: "Statements", target: 96.2, delayFrames: 18 },
  { label: "Branches", target: 86.4, delayFrames: 26 },
  { label: "Functions", target: 99.5, delayFrames: 34 },
];

type Row = {
  name: string;
  msi: number;
  threshold: number;
  delay: number;
};

const mutationRows: Row[] = [
  { name: "@kiwa-test/api", msi: 96.06, threshold: 90, delay: 18 },
  { name: "@kiwa-test/a11y", msi: 93.62, threshold: 90, delay: 22 },
  { name: "@kiwa-test/ui", msi: 91.76, threshold: 80, delay: 26 },
  { name: "@kiwa-test/cli-test", msi: 89.69, threshold: 80, delay: 30 },
  { name: "@kiwa-test/data", msi: 86.93, threshold: 80, delay: 34 },
  { name: "@kiwa-test/spec", msi: 85.51, threshold: 80, delay: 38 },
  { name: "@kiwa-test/core", msi: 85.09, threshold: 80, delay: 42 },
  { name: "@kiwa-test/cli", msi: 84.44, threshold: 80, delay: 46 },
  { name: "@kiwa-test/e2e", msi: 84.21, threshold: 80, delay: 50 },
  { name: "@kiwa-test/observability", msi: 84.12, threshold: 80, delay: 54 },
  { name: "@kiwa-test/visual", msi: 83.02, threshold: 80, delay: 58 },
];

const MutationRow: React.FC<{ row: Row }> = ({ row }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: frame - 20 - row.delay,
    fps,
    from: 0,
    to: 1,
    config: { damping: 14, mass: 0.6, stiffness: 115 },
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const translateX = interpolate(enter, [0, 1], [24, 0]);

  const highTier = row.threshold === 90;
  const accent = highTier ? tokens.color.primary : tokens.color.accent;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 16px",
        borderBottom: `1px solid ${tokens.color.bgGradientEnd}`,
        opacity,
        transform: `translateX(${translateX}px)`,
      }}
    >
      <div
        style={{
          fontFamily: tokens.font.mono,
          fontSize: 18,
          color: tokens.color.white,
          letterSpacing: 0.2,
        }}
      >
        {row.name}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            fontFamily: tokens.font.mono,
            fontSize: 20,
            fontWeight: 700,
            color: accent,
            letterSpacing: 0.5,
            minWidth: 76,
            textAlign: "right",
          }}
        >
          {row.msi.toFixed(2)}%
        </div>
        <div
          style={{
            fontFamily: tokens.font.mono,
            fontSize: 13,
            color: tokens.color.textSubtle,
            background: tokens.color.bgGradientEnd,
            padding: "2px 8px",
            borderRadius: 4,
            minWidth: 56,
            textAlign: "center",
          }}
        >
          ≥ {row.threshold}
        </div>
      </div>
    </div>
  );
};

export const QualityGates: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const captionEnter = spring({
    frame: frame - 240,
    fps,
    from: 0,
    to: 1,
    config: { damping: 14, mass: 0.8, stiffness: 100 },
  });
  const captionOpacity = interpolate(captionEnter, [0, 1], [0, 1]);
  const captionY = interpolate(captionEnter, [0, 1], [16, 0]);

  return (
    <SceneLayout
      eyebrow={t().eyebrowQualityGates}
      headline={t().headlineQualityGates}
    >
      <div
        style={{
          width: 1400,
          height: 600,
          display: "flex",
          gap: 32,
          alignItems: "stretch",
          position: "relative",
        }}
      >
        {/* Left — Coverage */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            padding: "0 8px",
          }}
        >
          <div
            style={{
              fontFamily: tokens.font.sans,
              fontSize: 28,
              fontWeight: 700,
              color: tokens.color.primary,
              letterSpacing: 0.4,
              marginBottom: 8,
            }}
          >
            Coverage gate
          </div>
          <CoverageBar metrics={coverageMetrics} width="100%" duration={28} fontSize={26} />
          <div
            style={{
              fontFamily: tokens.font.mono,
              fontSize: 17,
              color: tokens.color.textMuted,
              marginTop: 12,
              letterSpacing: 0.4,
            }}
          >
            {t().gateCoverageCaption}
          </div>
        </div>

        {/* Right — Mutation */}
        <div
          style={{
            flex: 1.2,
            display: "flex",
            flexDirection: "column",
            padding: "0 8px",
          }}
        >
          <div
            style={{
              fontFamily: tokens.font.sans,
              fontSize: 28,
              fontWeight: 700,
              color: tokens.color.accent,
              letterSpacing: 0.4,
              marginBottom: 8,
              display: "flex",
              alignItems: "baseline",
              gap: 12,
            }}
          >
            Mutation gate
            <span
              style={{
                fontFamily: tokens.font.mono,
                fontSize: 16,
                color: tokens.color.textMuted,
                letterSpacing: 0.5,
                fontWeight: 500,
              }}
            >
              MSI per package
            </span>
          </div>
          <div
            style={{
              background: tokens.color.bg,
              border: `1px solid ${tokens.color.bgGradientEnd}`,
              borderRadius: 12,
              padding: "10px 6px",
              flex: 1,
            }}
          >
            {mutationRows.map((row) => (
              <MutationRow key={row.name} row={row} />
            ))}
          </div>
          <div
            style={{
              fontFamily: tokens.font.mono,
              fontSize: 17,
              color: tokens.color.textMuted,
              marginTop: 12,
              letterSpacing: 0.4,
            }}
          >
            {t().gateMutationCaption}
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: -32,
            left: 0,
            right: 0,
            textAlign: "center",
            fontFamily: tokens.font.mono,
            fontSize: 22,
            color: tokens.color.primary,
            letterSpacing: 2,
            opacity: captionOpacity,
            transform: `translateY(${captionY}px)`,
          }}
        >
          enforced by .github/workflows/release.yml
        </div>
      </div>
    </SceneLayout>
  );
};
