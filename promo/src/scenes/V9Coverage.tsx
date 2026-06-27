import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { MaskRevealText } from "../components/MaskRevealText";
import { tokens, t } from "../tokens";

export const V9Coverage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const surfaces = t().v9CoverageSurfaces;

  const footerEnter = spring({
    frame: frame - 220,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 26,
    config: { damping: 16, mass: 1, stiffness: 95 },
  });
  const footerOpacity = interpolate(footerEnter, [0, 1], [0, 1]);
  const footerY = interpolate(footerEnter, [0, 1], [16, 0]);

  return (
    <AbsoluteFill
      style={{
        background: tokens.color.bg,
        fontFamily: tokens.font.sans,
        color: tokens.color.white,
      }}
    >
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          paddingLeft: 100,
          paddingRight: 100,
          gap: 48,
        }}
      >
        <MaskRevealText
          text={t().v9CoverageHeadline}
          startFrame={8}
          fontSize={tokens.locale === "ja" ? 72 : 64}
          fontWeight={700}
          color={tokens.color.white}
          letterSpacing={-1.5}
          align="center"
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 32,
            width: 1400,
          }}
        >
          {surfaces.map((surface, idx) => {
            const enter = spring({
              frame: frame - 60 - idx * 14,
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
                  fontSize: 60,
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
            textAlign: "center",
          }}
        >
          {t().v9CoverageFooter}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
