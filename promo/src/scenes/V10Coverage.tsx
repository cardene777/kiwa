import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { SceneLayout } from "../components/SceneLayout";
import { tokens, t } from "../tokens";

export const V10Coverage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const surfaces = t().v10CoverageSurfaces;

  const footerEnter = spring({
    frame: frame - 130,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 24,
    config: { damping: 16, mass: 1, stiffness: 95 },
  });
  const footerOpacity = interpolate(footerEnter, [0, 1], [0, 1]);
  const footerY = interpolate(footerEnter, [0, 1], [14, 0]);

  return (
    <SceneLayout
      eyebrow={t().v10CoverageEyebrow}
      headline={t().v10CoverageHeadline}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 40,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 28,
            width: 1400,
          }}
        >
          {surfaces.map((surface, idx) => {
            const enter = spring({
              frame: frame - 30 - idx * 12,
              fps,
              from: 0,
              to: 1,
              durationInFrames: 22,
              config: { damping: 14, mass: 0.7, stiffness: 110 },
            });
            const opacity = interpolate(enter, [0, 1], [0, 1]);
            const ty = interpolate(enter, [0, 1], [18, 0]);
            const scale = interpolate(enter, [0, 1], [0.9, 1]);
            return (
              <div
                key={surface}
                style={{
                  fontFamily: tokens.font.mono,
                  fontSize: 64,
                  fontWeight: 700,
                  color: tokens.color.primary,
                  letterSpacing: -1,
                  opacity,
                  transform: `translateY(${ty}px) scale(${scale})`,
                  textAlign: "center",
                  padding: "32px 24px",
                  border: `2px solid ${tokens.color.primary}50`,
                  borderRadius: 14,
                  background: `${tokens.color.primary}08`,
                }}
              >
                {surface}
              </div>
            );
          })}
        </div>
        <div
          style={{
            fontFamily: tokens.font.mono,
            fontSize: 26,
            fontWeight: 500,
            color: tokens.color.textMuted,
            letterSpacing: 2,
            opacity: footerOpacity,
            transform: `translateY(${footerY}px)`,
          }}
        >
          {t().v10CoverageFooter}
        </div>
      </div>
    </SceneLayout>
  );
};
