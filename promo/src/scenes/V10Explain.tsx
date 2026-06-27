import { useCurrentFrame, interpolate, spring, useVideoConfig, AbsoluteFill } from "remotion";
import { tokens, t } from "../tokens";

export const V10Explain: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headlineEnter = spring({
    frame: frame - 8,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 26,
    config: { damping: 16, mass: 1, stiffness: 100 },
  });
  const headlineOpacity = interpolate(headlineEnter, [0, 1], [0, 1]);
  const headlineY = interpolate(headlineEnter, [0, 1], [18, 0]);

  const subEnter = spring({
    frame: frame - 50,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 24,
    config: { damping: 16, mass: 1, stiffness: 100 },
  });
  const subOpacity = interpolate(subEnter, [0, 1], [0, 1]);
  const subY = interpolate(subEnter, [0, 1], [12, 0]);

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
          gap: 28,
          paddingLeft: 100,
          paddingRight: 100,
        }}
      >
        <div
          style={{
            fontFamily: tokens.font.sans,
            fontSize: tokens.locale === "ja" ? 68 : 64,
            fontWeight: 700,
            color: tokens.color.white,
            letterSpacing: -1.5,
            opacity: headlineOpacity,
            transform: `translateY(${headlineY}px)`,
            textAlign: "center",
            lineHeight: 1.2,
          }}
        >
          {t().v10ExplainHeadline}
        </div>
        <div
          style={{
            fontFamily: tokens.font.mono,
            fontSize: 32,
            fontWeight: 500,
            color: tokens.color.primary,
            letterSpacing: 2,
            opacity: subOpacity,
            transform: `translateY(${subY}px)`,
            textAlign: "center",
          }}
        >
          {t().v10ExplainSub}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
